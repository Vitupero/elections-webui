import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import axios from 'axios';
import {
  Col, Row,
  Form, FormGroup, FormControl, ControlLabel, Button
} from 'react-bootstrap';

export default class PeopleList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      people: [],
      filter: ""
    };
  }

  componentDidMount() {
    this.updateData();
  }
  componentWillUnmount(){
    this.setState({
      people: [],
    });
  }
  updateData(){
    axios.get('/api/peoplelist')
    .then(res => {
      this.setState({ people: res.data || [] });
      console.log("Loaded people list of " + res.data.length);
    })
    .catch(err => {
      this.setState({ people: [] });
      alert("Get people error:", err);
    });
  }

  filterNames(e){
    const filter = e.target.value;
    this.setState({ filter });
  }

  scroll() {
    ReactDOM.findDOMNode(this.searchBox).click();
  }

  render() {
    const scrollStyle = {
      height: "calc(100vh - 72px - 200px - 43px - 43px" + (this.props.hasTabs ? " - 65px" : "") + ")",
      overflowY: "scroll",
    };

    const peopleList = this.state.people
      .filter(this.props.filter)
      .filter((p) => PeopleList.filterPerson(this.state.filter, p))
      .map((p) => <this.props.control key={p.id} parent={this} data={p} />);

    $('.popover').remove();

    return (
      <div>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} xs={2}>
              Search:
            </Col>
            <Col xs={7}>
              <FormControl type="text" onChange={e => this.filterNames(e)} ref={e => this.searchBox = e} />
            </Col>
            <Col xs={3}>
              <Button bsStyle="success" onClick={() => this.updateData()}>Refresh Data</Button>
              {
                this.props.addCustom
                ? <Button bsStyle="primary" onClick={() => this.props.addCustom()}>Add Custom</Button>
                : ""
              }
            </Col>
          </FormGroup>
        </Form>
        <hr />

        <Row style={scrollStyle}>
          { peopleList }
        </Row> 
      </div>
    );
  }

  static filterPerson(filter, p){
    if(filter == "")
      return true;

    filter = filter.toLowerCase();

    const name = p.firstName + " " + p.lastName;
    if(name.toLowerCase().indexOf(filter) != -1)
      return true;

    if (p.Position) {
      const position = p.Position.miniName;
      if(position.toLowerCase().indexOf(filter) != -1)
        return true;
    } else {
      console.log("MISSING POSITION:", p);
    }

    if (p.elected) {
      if ("elect".indexOf(filter) != -1)
        return true;
    }

    return false;
  }
}
