const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
var turno = ["mueve", "mide", "apunta"];
var usuario = {};
var i = 0;
var Sockets = {};
var activeSockets = [];
var salas = {};
var turnos = {};
var turnolibre = [];
var alumnos = {};

app.use(express.static("public"));

io.on("connection", socket => {
  socket.on("join", datos => {
    socket.join(datos.sala);
    console.log(!turnolibre[datos.sala])
    if (!turnolibre[datos.sala]) {
      turnolibre[datos.sala] = new Array();
      turnolibre[datos.sala].push('apunta')
      turnolibre[datos.sala].push('mide')
      turnolibre[datos.sala].push('mueve')
    }
    
    if (salas[datos.sala] === 3) {
      io.to(socket.id).emit("sala_llena");
      return;
    } else {
      if (!salas[datos.sala]) {
        salas[datos.sala] = 1;
      } else {
        salas[datos.sala] = salas[datos.sala] + 1;
      }

      if (turnolibre[datos.sala].length == 0) {
        switch (salas[datos.sala]) {
          case 1:
            turnos[datos.nombre] = "mueve";
            io.to(socket.id).emit("nuevo_usuario", { turno: "mueve" });
            break;
          case 2:
            turnos[datos.nombre] = "mide";
            io.to(socket.id).emit("nuevo_usuario", { turno: "mide" });
            break;
          case 3:
            turnos[datos.nombre] = "apunta";
            io.to(socket.id).emit("nuevo_usuario", { turno: "apunta" });
            break;
          default:
            break;
        }
      } else {
        console.log(turnolibre[datos.sala])
        turnos[datos.nombre] = turnolibre[datos.sala].pop();
        console.log('Nuevo turno: ' + turnos[datos.nombre])
        io.to(socket.id).emit("nuevo_usuario", { turno: turnos[datos.nombre] });
        io.to(socket.id).emit("posicion", {
          alumno: alumnos[datos.sala]
        });
        io.to(datos.sala).emit("actualizar_pos", {
          to: socket.id
        });
      }
    }
    if (!Sockets[datos.sala]) {
      Sockets[datos.sala] = [];
    }

    const existingSocket = Sockets[datos.sala].find(
      existingSocket => existingSocket === datos.nombre
    );

    if (!existingSocket) {
      Sockets[datos.sala].push(datos.nombre);
      io.to(datos.sala).emit("update-user-list", {
        users: Sockets[datos.sala].filter(
          existingSocket => existingSocket !== datos.nombre
        )
      });

      io.to(datos.sala).emit("update-user-list", {
        users: [datos.nombre]
      });
    }

    socket.on("act_pos", data => {
      io.to(data.to).emit("posicion1", {
        x: data.x,
        y: data.y,
        anteriorx: data.anteriorx,
        anteriory: data.anteriory
      });
    });

    socket.on("disconnect", () => {
      Sockets[datos.sala] = Sockets[datos.sala].filter(
        existingSocket => existingSocket !== datos.nombre
      );
      turnolibre[datos.sala].push(turnos[datos.nombre]);
      salas[datos.sala] = salas[datos.sala] - 1;
      if(!salas[datos.sala]) {
        turnolibre[datos.sala] = ['apunta', 'mide', 'mueve'];
      }
      io.to(datos.sala).emit("remove-user", {
        nombre: datos.nombre
      });
    });

    socket.on("movimiento", data => {
      alumnos[datos.sala] = data.alumno;
      io.in(datos.sala).emit("mover", {
        x: data.x,
        y: data.y,
        anteriorx: data.anteriorx,
        anteriory: data.anteriory,
        nombre: data.nombre
      });
    });

    socket.on("cambia_turno", data => {
      io.to(data.sala).emit("cambiar");
    });

    socket.on("act_turno", data => {
      console.log(turnolibre[data.sala])
      let index = turnolibre[data.sala].indexOf(data.turno);
      console.log(index)
      console.log('anterior: ' + turnolibre[data.sala][index])
      switch (data.turno) {
          case 'mueve':  
            turnolibre[data.sala][index] = 'mide';
            break;
          case 'mide':
            turnolibre[data.sala][index] = 'apunta';
            break;
          case 'apunta':
            turnolibre[data.sala][index] = 'mueve';
            break;
          default:
            break;
        }
      console.log('nuevo: ' + turnolibre[data.sala][index])
      turnos[data.nombre] = data.turno;
    });

    socket.on("call-user", data => {
      io.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: socket.id
      });
    });

    socket.on("make-answer", data => {
      io.to(data.to).emit("answer-made", {
        socket: socket.id,
        answer: data.answer
      });
    });

    socket.on("nueva-linea", data => {
      io.to(data.sala).emit("crea-linea", {
        linea: data.linea
      });
    });

    socket.on("actualizar-linea", data => {
      io.to(data.sala).emit("act-linea", {
        linea: data.linea,
        medicion: data.medicion
      });
    });

    socket.on("borrar-linea", data => {
      io.to(data.sala).emit("borra-linea", {
        linea: data.linea
      });
    });
  });
});

http.listen(3000, () => {
  console.log(`listening on *np:3000`);
});
