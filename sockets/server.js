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
    
    // Inicializar turnos disponibles si no existen
    if (!turnolibre[datos.sala]) {
      turnolibre[datos.sala] = ['apunta', 'mide', 'mueve'];
    }
    
    if (salas[datos.sala] === 3) {
      io.to(socket.id).emit("sala_llena");
      return;
    }

    // Inicializar contador de sala
    if (!salas[datos.sala]) {
      salas[datos.sala] = 1;
    } else {
      salas[datos.sala] = salas[datos.sala] + 1;
    }

    // Asignar turno y notificar
    let turnoAsignado = turnolibre[datos.sala].pop();
    turnos[datos.nombre] = turnoAsignado;
    io.to(socket.id).emit("nuevo_usuario", { turno: turnoAsignado });

    // Si hay alumnos previos, sincronizar estado
    if (alumnos[datos.sala]) {
      io.to(socket.id).emit("posicion", {
        alumno: alumnos[datos.sala]
      });
    }

    // Manejar lista de usuarios
    if (!Sockets[datos.sala]) {
      Sockets[datos.sala] = [];
    }

    if (!Sockets[datos.sala].includes(datos.nombre)) {
      Sockets[datos.sala].push(datos.nombre);
      io.to(datos.sala).emit("update-user-list", {
        users: Sockets[datos.sala]
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
      if (datos && datos.sala) {
        // Limpiar la lista de usuarios
        Sockets[datos.sala] = Sockets[datos.sala].filter(
          existingSocket => existingSocket !== datos.nombre
        );
        
        // Restaurar el turno a la lista de turnos disponibles
        if (turnos[datos.nombre]) {
          if (!turnolibre[datos.sala]) {
            turnolibre[datos.sala] = [];
          }
          turnolibre[datos.sala].push(turnos[datos.nombre]);
          delete turnos[datos.nombre];
        }

        // Actualizar contador de la sala
        if (salas[datos.sala] > 0) {
          salas[datos.sala]--;
        }

        // Si la sala queda vacía, limpiar su estado
        if (salas[datos.sala] === 0) {
          delete salas[datos.sala];
          delete turnolibre[datos.sala];
          delete alumnos[datos.sala];
        }

        // Notificar a los demás usuarios
        io.to(datos.sala).emit("remove-user", {
          nombre: datos.nombre
        });
      }
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
