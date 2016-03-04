var net = require('net');
var linq = require('linq');
var mapSeries = require('promise-map-series');

var lastState = {};
var pingInterval = null;

var client = new net.Socket();
client.setNoDelay(true);
client.setTimeout(500);

client.on('error', () => {
  console.log("lost connection to cviz");

  client.destroy();
  client.unref();
  client.connect(3456, "192.168.27.62", () => {
    console.log("reconnected");
  });
});

client.connect(3456, '192.168.27.62', function() {
  console.log('Connected to cviz');

  pingInterval = setInterval(() => {
    client.write("{}");
  }, 300)
});

client.on('data', (data) => {
  try {
    if(data == "{}")
      return;

    lastState = JSON.parse(data);
    console.log("Received", lastState);
  } catch (e){
  }
});

client.on('close', () => {
  console.log("Server has gone away!");
  if(pingInterval != null){
    clearInterval(pingInterval);
    pingInterval = null;
  }
});

export default function(Models, socket, config){
  let { Person, Position } = Models;

  socket.emit('templateState', lastState);
  
  client.on('data', (data) => {
    try {
      if(data == "{}")
        return;

      data = JSON.parse(data);

      socket.emit('templateState', data);
    } catch (e){
    }
  });

  socket.on('runTemplate', data => {
    console.log("runTemplate", data);

    // not pretty, but data needs to be passed as an object of strings
    var templateData = {};

    if(data.template.toLowerCase() == "lowerthird"){
      if(!data.data || !data.data.candidate)
        return;

      for(var key in data.data) {
        var person = data.data[key];
        var name = (person.firstName + " " + person.lastName).trim().toUpperCase();
        var role = person.position.fullName.trim().toUpperCase();
        if(person.position.type != "other"){
          role += (person.elected ? " elect" : " candidate").toUpperCase();;
        }

        templateData[key] =  "<templateData>"
        + "<componentData id=\"f0\"><data id=\"text\" value=\"" + name + "\" /></componentData>"
        + "<componentData id=\"f1\"><data id=\"text\" value=\"" + role + "\" /></componentData>"
        + "</templateData>";
      }

    } else if (data.template.toLowerCase() == "candidatesabbs" || data.template.toLowerCase() == "candidatenonsabbs") {
      var type = (data.template.toLowerCase() == "candidatesabbs") ? "candidateSabb" : "candidateNonSabb";
      Person.getJoin({position: true}).filter({ 
        position: {
          type: type
        }
      }).run().then(function(people){
        var grouped = linq.from(people)
          .orderBy((x) => x.position.order)
          .thenBy((x) => x.order)
          .thenBy((x) => x.lastName)
          .groupBy((x) => x.position.id)
          .toArray();

        var templateData = {};
        var index = 1;
        grouped.forEach((g) => {
          var compiledData = {
            candidates: g.toArray(),
            position: g.first().position
          };

          templateData["data" + (index++)] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData) + "]]></componentData></templateData>";
        });

        console.log("Found " + (index-1) + " groups of candidates");

        client.write(JSON.stringify({
          type: "LOAD",
          filename: data.template,
          templateData: templateData,
          templateDataId: data.dataId
        }));
      });

      return;
    } else if (data.template.toLowerCase() == "winnersall"){
      getWinnersOfType(Models, "candidateSabb").then(function(sabbs){
        getWinnersOfType(Models, "candidateNonSabb").then(function(people){
          var half_length = Math.ceil(people.length / 2);  
          var page1 = people.splice(0, half_length);


          var compiledSabbs = {
            candidates: sabbs
          };
          var compiledData = {
            candidates: page1
          };
          var compiledData2 = {
            candidates: people
          };

          templateData["nonsabbs1"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData) + "]]></componentData></templateData>";
          templateData["nonsabbs2"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData2) + "]]></componentData></templateData>";
          templateData["sabbs"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledSabbs) + "]]></componentData></templateData>";

          client.write(JSON.stringify({
            type: "LOAD",
            filename: data.template,
            templateData: templateData,
            templateDataId: data.dataId
          }));
        });
      });

      return;
    } else if (data.template.toLowerCase() == "winnersnonsabbs"){
      getWinnersOfType(Models, "candidateNonSabb").then(function(people){
        var half_length = Math.ceil(people.length / 2);  
        var page1 = people.splice(0, half_length);


        var compiledData = {
          candidates: page1
        };
        var compiledData2 = {
          candidates: people
        };

        templateData["data1"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData) + "]]></componentData></templateData>";
        templateData["data2"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData2) + "]]></componentData></templateData>";

        client.write(JSON.stringify({
          type: "LOAD",
          filename: data.template,
          templateData: templateData,
          templateDataId: data.dataId
        }));
      });

      return;
    } else if (data.template.toLowerCase() == "winnerssabbs"){
      getWinnersOfType(Models, "candidateSabb").then(function(people){
        var compiledData = {
          candidates: people
        };

        console.log(compiledData)

        templateData["data"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData) + "]]></componentData></templateData>";

        client.write(JSON.stringify({
          type: "LOAD",
          filename: data.template,
          templateData: templateData,
          templateDataId: data.dataId
        }));
      });

      return;
    } else if (data.template.toLowerCase() == "candidateboard") {
      var compiledData = {};
      Position.filter({id: data.data}).run().then(function(positions){
        if(positions.length == 0)
          return;

        compiledData.position = positions[0];

        Person.filter({positionId: data.data}).run().then(function(people){
          people = linq.from(people)
            .orderBy((x) => x.order)
            .thenBy((x) => x.lastName)
            .toArray();

          compiledData.candidates = people;

          templateData["data"] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(compiledData) + "]]></componentData></templateData>";

          client.write(JSON.stringify({
            type: "LOAD",
            filename: data.template,
            templateData: templateData,
            templateDataId: data.dataId
          }));
        });
      });
      return;
    }else {
      for(var key in data.data) {
        templateData[key] = "<templateData><componentData id=\"data\"><![CDATA[" + JSON.stringify(data.data[key]) + "]]></componentData></templateData>";
      }
    }

    client.write(JSON.stringify({
      type: "LOAD",
      filename: data.template,
      templateData: templateData,
      templateDataId: data.dataId
    }));
  });

  socket.on('templateGo', data => {
    console.log("templateGo");

    client.write(JSON.stringify({
      type: "CUE"
    }));
  });

  socket.on('templateKill', data => {
    console.log("templateKill");

    client.write(JSON.stringify({
      type: "KILL"
    }));
  });

  // TODO - send templateState at appropriate points
  // data format: 
  // {
  //   state: "STOP", // or WAIT or PLAYING
  //   dataId: "ado-ben",
  //   templateId: "lowerThird"
  // }
}

function getWinnersOfType(Models, type){
  let { Person, Position } = Models;

  return Position.filter({ type })
    .run().then((positions) => {
      positions = linq.from(positions)
        .orderBy((x) => x.order)
        .toArray();

      return mapSeries(positions, (pos) => {
        return Person.getJoin({position: true}).filter({
          positionId: pos.id,
          elected: true
        }).run().then((people) => {
          if(!people || people.length == 0)
            return generateRon(pos);

          return people[0];
        });
      });
  });
}

function generateRon(position){
  return {
    id: "ron-"+position.id,
    firstName: "RON",
    lastName: "",
    uid: "ron",
    positionId: position.id,
    position: position,
    elected: false,
    manifestoPoints: {
      one: "",
      two: "",
      three: ""
    },
    order: 999,
    photo: "data:image/png;base64,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"
  };
}