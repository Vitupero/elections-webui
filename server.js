"use strict";
const express = require('express');
const bodyParser = require('body-parser');

import { webui_port } from "./config"

import positionController from './controllers/position';
import peopleController from './controllers/person';

import Models from "./models"
const { Person, Position } = Models;

const app = express();

// Run server to listen on port 3000.
const server = app.listen(webui_port, () => {
  console.log(`listening on *:${webui_port}`);
});

const io = require('socket.io')(server);

app.use(bodyParser.urlencoded({ extended: false } ));
app.use(express.static('static'));

// Set socket.io listeners.
io.sockets.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  positionController(Models, socket);
  peopleController(Models, socket);

});

// Set Express routes.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/edit/people', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
