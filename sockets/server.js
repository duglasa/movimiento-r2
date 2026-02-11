const express = require('express');
const app = express();
const serverless = require('serverless-http');
const router = express.Router();
const io = require('socket.io');

// Serve static files
app.use(express.static('public'));

// Define routes
router.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use('/.netlify/functions/server', router);

// Socket.io setup
const http = require('http').Server(app);
const socketIo = io(http);
var turno = ['mueve', 'mide', 'apunta'];
var usuario = [];
var i = 0;
var activeSockets = [];

socketIo.on('connection', (socket) => {
  const existingSocket = activeSockets.find(
    (existingSocket) => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    socket.emit('update-user-list', {
      users: activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      ),
    });

    socket.broadcast.emit('update-user-list', {
      users: [socket.id],
    });
  }

  if (i > 2) {
    i = 2;
  }
  usuario[i] = { id: socket.id, turno: turno[i++] };
  console.log('nueva conexion id: ' + socket.id);
  usuario.forEach((usuario) => {
    console.log(usuario.id);
    io.to(usuario.id).emit('nuevo_usuario', { turno: usuario.turno });
  });

  socket.on('disconnect', () => {
    activeSockets = activeSockets.filter(
      (existingSocket) => existingSocket !== socket.id
    );
    socket.broadcast.emit('remove-user', {
      socketId: socket.id,
    });
  });

  socket.on('movimiento', (datos) => {
    io.emit('mover', {
      x: datos.x,
      y: datos.y,
    });
  });
  socket.on('cambia_turno', () => {
    i = 0;
    let us = turno.shift();
    turno.push(us);
    console.log(turno);
    usuario.forEach((usuario) => {
      io.to(usuario.id).emit('nuevo_usuario', { turno: turno[i] });
      console.log(usuario.id, turno[i++]);
    });
  });

  socket.on('call-user', (data) => {
    socket.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on('make-answer', (data) => {
    socket.to(data.to).emit('answer-made', {
      socket: socket.id,
      answer: data.answer,
    });
  });

  socket.emit('evento2', () => {});
});

module.exports = app;
module.exports.handler = serverless(app);
