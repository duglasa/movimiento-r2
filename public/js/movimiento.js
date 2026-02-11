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
      this.actualizarInterfaz();
    },

    actualizarInterfaz: function() {
      // Limpiar estado del canvas
      if (canvas) {
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        canvas.clear();
        canvas.renderAll();
      }

      // Limpiar listeners de socket para medición
      socket.off("crea-linea");
      socket.off("act-linea");
      socket.off("borra-linea");

      // Actualizar interfaz según el turno
      switch (main.alumno.turno) {
        case "mueve":
          $("#quien").html("Te estas moviendo en: ");
          $("#eje").html("X");
          $("#eje").removeClass("hidden");
          $("#pos").removeClass("hidden");
          $("#gen").addClass("hidden");
          $(".canvas-container").addClass("hidden");
          break;
          
        case "mide":
          $("#quien").html("Estas midiendo");
          $("#eje").removeClass("hidden");
          $("#pos").addClass("hidden");
          $("#gen").addClass("hidden");
          $(".canvas-container").removeClass("hidden");
          // Usar setTimeout para asegurar que el canvas esté listo
          setTimeout(() => {
            canvas.clear();
            canvas.renderAll();
            this.medir();
          }, 100);
          break;
          
        case "apunta":
          $("#quien").html("Recuerda apuntar los datos");
          $("#eje").removeClass("hidden");
          $("#pos").addClass("hidden");
          $("#gen").removeClass("hidden");
          $(".canvas-container").removeClass("hidden");
          // Usar setTimeout para asegurar que el canvas esté listo
          setTimeout(() => {
            canvas.clear();
            canvas.renderAll();
            this.apuntar();
          }, 100);
          break;
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
      if (main.alumno.turno !== "mide") return;
      
      console.log("Iniciando modo medición");
      // Limpiar estado previo
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.clear();
      canvas.renderAll();
      
      let line = null;
      let isDown = false;
      let startx, starty;

      canvas.on("mouse:down", function(o) {
        if (main.alumno.turno !== "mide") return;
        
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        startx = pointer.x;
        starty = pointer.y;

        var points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
          strokeWidth: 3,
          fill: "red",
          stroke: "red",
          originX: "center",
          originY: "center"
        });
        canvas.add(line);
        canvas.renderAll();
        socket.emit("nueva-linea", {
          linea: points,
          sala: sala
        });
      });

      canvas.on("mouse:move", function(o) {
        if (!isDown || !line || main.alumno.turno !== "mide") return;
        
        var pointer = canvas.getPointer(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });

        // Calcular distancia
        var linePixelsX = startx - pointer.x;
        var linePixelsY = starty - pointer.y;
        var distance = Math.sqrt(linePixelsX * linePixelsX + linePixelsY * linePixelsY);
        lineMetersTotal = (distance / 50).toFixed(2);
        
        $("#eje").html(lineMetersTotal + " cm");
        canvas.renderAll();
        
        socket.emit("actualizar-linea", {
          linea: pointer,
          sala: sala,
          medicion: lineMetersTotal
        });
      });

      canvas.on("mouse:up", function(o) {
        if (!isDown || !line || main.alumno.turno !== "mide") return;
        
        isDown = false;
        socket.emit("borrar-linea", {
          linea: line,
          sala: sala
        });
        canvas.remove(line);
        canvas.renderAll();
        line = null;
      });
    },

    apuntar: function() {
      if (main.alumno.turno !== "apunta") return;
      
      console.log("Iniciando modo apuntar");
      // Limpiar estado previo
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.clear();
      canvas.renderAll();

      // Remover listeners anteriores
      socket.off("crea-linea");
      socket.off("act-linea");
      socket.off("borra-linea");

      let lin = null;
      
      socket.on("crea-linea", data => {
        if (main.alumno.turno !== "apunta") return;
        
        lin = new fabric.Line(data.linea, {
          strokeWidth: 2,
          fill: "yellow",
          stroke: "yellow",
          originX: "center",
          originY: "center"
        });
        canvas.add(lin);
        canvas.renderAll();
      });

      socket.on("act-linea", data => {
        if (main.alumno.turno !== "apunta" || !lin) return;
        
        lin.set({ x2: data.linea.x, y2: data.linea.y });
        canvas.renderAll();
        $("#eje").html(data.medicion + " cm");
      });

      socket.on("borra-linea", data => {
        if (main.alumno.turno !== "apunta" || !lin) return;
        
        canvas.remove(lin);
        canvas.renderAll();
        lin = null;
      });
    }
  }
};

$(document).ready(function() {
  body = document.querySelector("body");
  turno = document.querySelector("#turno");
  main.methods.iniciar();

  turno.addEventListener("DOMSubtreeModified", () => {
    main.methods.actualizarInterfaz();
  });

  socket.on("nuevo_usuario", data => {
    console.log("Nuevo usuario con turno:", data.turno);
    main.alumno.turno = data.turno;
    $("#turno").html(main.alumno.turno);
    
    // Inicializar correctamente según el turno
    if (data.turno === "mide") {
      $(".canvas-container").removeClass("hidden");
      main.methods.medir();
    } else if (data.turno === "apunta") {
      $(".canvas-container").removeClass("hidden");
      main.methods.apuntar();
    } else {
      $(".canvas-container").addClass("hidden");
    }
    main.methods.actualizarInterfaz();
  });

  socket.on("cambiar", () => {
    let actual = main.alumno.turno;
    // Limpiar estado actual
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    socket.off("crea-linea");
    socket.off("act-linea");
    socket.off("borra-linea");
    
    switch (main.alumno.turno) {
      case "mide":
        main.alumno.turno = "mueve";
        $(".canvas-container").addClass("hidden");
        break;
      case "apunta":
        main.alumno.turno = "mide";
        $(".canvas-container").removeClass("hidden");
        break;
      case "mueve":
        main.alumno.turno = "apunta";
        $(".canvas-container").removeClass("hidden");
        break;
    }
    
    $("#turno").html(main.alumno.turno);
    main.methods.actualizarInterfaz();
    
    socket.emit("act_turno", {
      turno: main.alumno.turno,
      sala: sala,
      nombre: nombre,
      anterior: actual
    });
  });

  body.addEventListener("keydown", key => {
    if (main.alumno.turno === "mueve") {
      main.methods.mover(key.code);
    }
  });

  socket.on("mover", data => {
    // Todos los usuarios deben ver las actualizaciones de posición, sin importar su turno
    $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("");
    main.alumno.anteriorx = data.anteriorx;
    main.alumno.anteriory = data.anteriory;
    $("#" + main.alumno.anteriorx + "_" + main.alumno.anteriory).html("●");
    $("#" + main.alumno.x + "_" + main.alumno.y).html("");
    main.alumno.x = data.x;
    main.alumno.y = data.y;
    $("#" + main.alumno.x + "_" + main.alumno.y).html(main.alumno.img);
    
    // Actualizar posición en texto solo si es relevante
    if (main.alumno.turno === "mueve") {
      actualizarTextoPos();
    }
  });

  function actualizarTextoPos() {
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
  }

  socket.on("nuevo_usuario", data => {
    console.log(data.turno);
    main.alumno.turno = data.turno;
    console.log(main.alumno.turno);
    $("#turno").html(main.alumno.turno);
    
    // Inicializar el canvas según el turno asignado
    if (data.turno === "mide") {
      $(".canvas-container").removeClass("hidden");
      main.methods.medir();
    } else if (data.turno === "apunta") {
      $(".canvas-container").removeClass("hidden");
      main.methods.apuntar();
    } else {
      $(".canvas-container").addClass("hidden");
    }
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
    switch (main.alumno.turno) {
      case "mide":
        main.alumno.turno = "mueve";
        $(".canvas-container").addClass("hidden");
        $("#eje").html("X");
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        break;
      case "apunta":
        main.alumno.turno = "mide";
        $(".canvas-container").removeClass("hidden");
        main.methods.medir();
        break;
      case "mueve":
        main.alumno.turno = "apunta";
        $(".canvas-container").removeClass("hidden");
        main.methods.apuntar();
        break;
      default:
        break;
    }
    $("#turno").html(main.alumno.turno);
    main.methods.actualizarInterfaz();
    socket.emit("act_turno", {
      turno: main.alumno.turno,
      sala: sala,
      nombre: nombre, 
      anterior: actual
    });
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
