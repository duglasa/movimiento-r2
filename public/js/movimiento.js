var socket = io();
var lineMetersTotal;
let sala, nombre, body, turno;
var anteriorx = 0, anteriory = 0;

var primera = false;

$("#crear").on("click", () => {
  sala = $("#sala").val();
  nombre = $("#nombre").val();
  socket.emit("join", {
    sala: sala,
    nombre: nombre
  });
  $("#lab").removeClass("hidden");
  $("#crear-sala").addClass("hidden");
  $("#llena").addClass("hidden");
  $("#nombre-sala").html("Sala: " + sala);
});

$("#generar").on("click", () => {
  let x = Math.floor(Math.random() * 13) - 6;
  let y = Math.floor(Math.random() * 13) - 6;
  $("#rand").html(x + "," + y);
});

var xPoint = [];
var yPoint = [];
var x;
var y;
var context, toggle;
var canvas = new fabric.Canvas("c", { selection: false });

let main = {
  alumno: {
    turno: "mueve",
    x: 0,
    y: 0,
    eje: "x",
    img: "☻",
    movimientos: 3,
    color: "orange",
    anteriorx: 0,
    anteriory: 0
  },

  methods: {
    iniciar: function() {
      $(".gamecell").attr("chess", "null");
      $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
      $("#" + main.alumno.x + "_" + main.alumno.y).html("●");
      $("#" + main.alumno.x + "_" + main.alumno.y).attr("chess", "alumno");
      $("#turno").html(main.alumno.turno);
      if (main.alumno.turno === "mueve") {
        $("#quien").html("Te estas moviendo en: ");
        $("#eje").removeClass("hidden");
      } else if (main.alumno.turno === "mide") {
        $("#quien").html("Estas midiendo");
        $("#eje").addClass("hidden");
      } else if (main.alumno.turno === "apunta") {
        $("#quien").html("Recuerda apuntar los datos");
        $("#eje").addClass("hidden");
      }
    },
    mover: function(dir) {
      if (dir === "Enter") {
        if (main.alumno.eje === "x") {
          main.alumno.eje = "y";
          $("#eje").html("Y");
        } else {
          main.alumno.eje = "x";
          main.alumno.movimientos--;
          main.alumno.color = "blue";
          $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("");
          main.alumno.anteriorx = main.alumno.x;
          main.alumno.anteriory = main.alumno.y;
          $("#eje").html("X");
        }
        if (!main.alumno.movimientos) {
          socket.emit("cambia_turno", {
            sala: sala,
            turno: main.alumno.turno
          });
          main.alumno.movimientos = 3;
        }
        xPoint.push(50 * main.alumno.x + 325);
        yPoint.push(-50 * main.alumno.y + 325);
      }
      if (main.alumno.eje === "x") {
        if (dir === "ArrowLeft" && main.alumno.x > -6) {
          $("#" + main.alumno.x + "_" + main.alumno.y).html("");
          main.alumno.x--;
        } else if (dir === "ArrowRight" && main.alumno.x < 6) {
          $("#" + main.alumno.x + "_" + main.alumno.y).html("");
          main.alumno.x++;
        }
      } else if (main.alumno.eje === "y") {
        if (dir === "ArrowDown" && main.alumno.y > -6) {
          $("#" + main.alumno.x + "_" + main.alumno.y).html("");
          main.alumno.y--;
        } else if (dir === "ArrowUp" && main.alumno.y < 6) {
          $("#" + main.alumno.x + "_" + main.alumno.y).html("");
          main.alumno.y++;
        }
      }
      $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
      if (main.alumno.x < 0) {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      } else {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      }
      console.log(main.alumno.anteriorx + " " + main.alumno.anteriory);
      $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("●");
      xPoint.pop();
      xPoint.push(50 * main.alumno.x + 325);
      yPoint.pop();
      yPoint.push(-50 * main.alumno.y + 325);
      socket.emit("movimiento", {
        x: main.alumno.x,
        y: main.alumno.y,
        anteriorx: main.alumno.anteriorx,
        anteriory: main.alumno.anteriory,
        sala: sala,
        nombre: nombre,
        alumno: main.alumno
      });
    },
    medir: function() {
      console.log("midiendo");
      var line, isDown;

      var line, isDown;
      var arr = new Array();
      var startx = new Array();
      var endx = new Array();
      var starty = new Array();
      var endy = new Array();
      var temp = 0;
      var graphtype;

      canvas.on("mouse:down", function(o) {
        if (main.alumno.turno === "mide") {
          isDown = true;
          var pointer = canvas.getPointer(o.e);

          var points = [pointer.x, pointer.y, pointer.x, pointer.y];
          startx[temp] = pointer.x;
          starty[temp] = pointer.y;
          line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: "red",
            stroke: "red",
            originX: "center",
            originY: "center"
          });
          canvas.add(line);
          console.log(line);
          socket.emit("nueva-linea", {
            linea: points,
            sala: sala
          });
        }
      });

      canvas.on("mouse:move", function(o) {
        if (main.alumno.turno === "mide") {
          if (!isDown) return;
          var pointer = canvas.getPointer(o.e);
          endx[temp] = pointer.x;
          endy[temp] = pointer.y;
          line.set({ x2: pointer.x, y2: pointer.y });
          calculate();
          canvas.renderAll();
          socket.emit("actualizar-linea", {
            linea: pointer,
            sala: sala,
            medicion: lineMetersTotal
          });
        }
      });

      canvas.on("mouse:up", function(o) {
        if (main.alumno.turno === "mide") {
          canvas.remove(line);
          socket.emit("borrar-linea", {
            linea: line,
            sala: sala
          });
          isDown = false;
        }
      });

      function calculate() {
        var linePixelsX = startx[temp] - endx[temp];
        var linePixelsY = starty[temp] - endy[temp];
        var gregVar = linePixelsX - linePixelsY;
        // horizontal/vertical components of line in pixels
        var horizontalMPP = 650 / 650;
        var verticalMPP = 650 / 650;
        // horizontal/vertical meters per pixel, p being according canvas measurement in pixels and m being the measurement (in meters) of the area it should represent

        var lineMetersX = linePixelsX * horizontalMPP;
        var lineMetersY = linePixelsY * verticalMPP;
        // calculate horizontal/vertical line components in meters

        lineMetersTotal = lineMetersX * lineMetersX + lineMetersY * lineMetersY;
        lineMetersTotal = (Math.sqrt(lineMetersTotal).toFixed(2) / 50).toFixed(
          2
        );
        $("#eje").html(lineMetersTotal + " cm");
        // Calculate total line length in meters with some Pythagoras
        canvas.renderAll();
      }
    },
    apuntar: function() {
      var puntos, lin;
      socket.on("crea-linea", data => {
        if (main.alumno.turno === "apunta") {
          puntos = data.linea;
          lin = new fabric.Line(puntos, {
            strokeWidth: 2,
            fill: "yellow",
            stroke: "yellow",
            originX: "center",
            originY: "center"
          });
          console.log(lin);
          canvas.add(lin);
        }
      });

      socket.on("act-linea", data => {
        if (main.alumno.turno === "apunta") {
          lin.set({ x2: data.linea.x, y2: data.linea.y });
          canvas.renderAll();
          $("#eje").html(data.medicion + " cm");
        }
      });

      socket.on("borra-linea", data => {
        if (main.alumno.turno === "apunta") {
          canvas.remove(lin);
        }
      });
    }
  }
};

$(document).ready(function() {
  body = document.querySelector("body");
  turno = document.querySelector("#turno");
  main.methods.iniciar();
  turno.addEventListener("DOMSubtreeModified", () => {
    switch (main.alumno.turno) {
      case "mueve":
        $("#quien").html("Te estas moviendo en: ");
        $("#pos").removeClass("hidden");
        $("#gen").addClass("hidden");
        break;
      case "mide":
        $("#quien").html("Estas midiendo ");
        $("#pos").addClass("hidden");
        $("#gen").addClass("hidden");
        main.methods.medir();
        break;
      case "apunta":
        $("#quien").html("Recuerda apuntar los datos ");
        $("#pos").addClass("hidden");
        $("#gen").removeClass("hidden");
        main.methods.apuntar();
      default:
        break;
    }
  });

  body.addEventListener("keydown", key => {
    if (main.alumno.turno === "mueve") {
      main.methods.mover(key.code);
    }
  });

  socket.on("mover", data => {
    $("#" + main.alumno.anteriorx + "_" + anteriory).html("");
    main.alumno.anteriorx = data.anteriorx;
    main.alumno.anteriory = data.anteriory;
    $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("●");
    $("#" + main.alumno.x + "_" + main.alumno.y).html("");
    main.alumno.x = data.x;
    main.alumno.y = data.y;
    $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
  });

  socket.on("nuevo_usuario", data => {
    console.log(data.turno);
    main.alumno.turno = data.turno;
    console.log(main.alumno.turno);
    $("#turno").html(main.alumno.turno);
  });

  socket.on("update-user-list", ({ users}) => {
    console.log(users);
      users.forEach(user => {
        if (user !== nombre) {
          const yaExiste = document.getElementById(user);
          if (!yaExiste) {
            $("#conectados").append(
              '<li class="usuario" id="' + user + '">' + user + "</li>"
            );
          }
        }
      });
  });

  socket.on("remove-user", ({ nombre }) => {
    const elToRemove = document.getElementById(nombre);
    $("#" + nombre).remove();

    if (elToRemove) {
      elToRemove.remove();
    }
  });

  socket.on("sala_llena", () => {
    $("#lab").addClass("hidden");
    $("#crear-sala").removeClass("hidden");
    $("#llena").removeClass("hidden");
  });

  socket.on("cambiar", () => {
    let actual = main.alumno.turno;
    console.log(main.alumno.turno);
    switch (main.alumno.turno) {
      case "mide":
        main.alumno.turno = "mueve";
        $(".canvas-container").addClass("hidden");
        $("#eje").html("X");
        break;
      case "apunta":
        main.alumno.turno = "mide";
        $(".canvas-container").removeClass("hidden");
        break;
      case "mueve":
        canvas.on("mouse:down", function(o) {});

        canvas.on("mouse:move", function(o) {});

        canvas.on("mouse:up", function(o) {});
        main.alumno.turno = "apunta";
        $(".canvas-container").removeClass("hidden");
        break;
      default:
        break;
    }
    $("#turno").html(main.alumno.turno);
    socket.emit("act_turno", {
      turno: main.alumno.turno,
      sala: sala,
      nombre: nombre, 
      anterior: actual
    })
  });
  
  socket.on("actualizar_pos", data => {
    socket.emit("act_pos", {
      to: data.to,
      x: main.alumno.x,
      y: main.alumno.y,
      anteriorx: main.alumno.anteriorx,
      anteriory: main.alumno.anteriory
    })
  })
  
  socket.on("posicion", data => {
    main.alumno.x = data.alumno.x
    main.alumno.y = data.alumno.y
    main.alumno.anteriorx = data.alumno.anteriorx
    main.alumno.anteriory = data.alumno.anteriory
    main.alumno.eje = data.alumno.eje
    $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
    $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("●");
    $("#0_0").html("");
    $("#turno").html(main.alumno.turno);
    if (main.alumno.x < 0) {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      } else {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      }
    $("#eje").html(main.alumno.eje.toUpperCase());
  })
  
  socket.on("posicion2", data => {
    main.alumno.x = data.x
    main.alumno.y = data.y
    main.alumno.anteriorx = data.anteriorx
    main.alumno.anteriory = data.anteriory
    main.methods.iniciar();
    $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
    $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("●");
    if (main.alumno.x < 0) {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: (" +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      } else {
        if (main.alumno.y < 0) {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              "," +
              main.alumno.y +
              ")"
          );
        } else {
          $("#pos").html(
            "Tu posición actual es: ( " +
              main.alumno.x +
              ", " +
              main.alumno.y +
              ")"
          );
        }
      }
  })
});
