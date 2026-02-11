var socket = io();

var xPoint = [];
var yPoint = [];
var x;
var y;
var canvas, context, toggle;

let main = {
    alumno : {
        turno: 'mueve',
        x: 0,
        y: 0,
        eje: 'x',
        img: '☻',
        movimientos: 3,
        color : "orange"
    },

    methods: {
        iniciar: function () {
            $('.gamecell').attr('chess', 'null');
            $('#' + main.alumno.x + '_' + main.alumno.y).html(main.alumno.img);
            $('#' + main.alumno.x + '_' + main.alumno.y).attr('chess', 'alumno');
            $('#turno').html(main.alumno.turno);
            if(main.alumno.turno === 'mueve') {
                $('#quien').html("Te estas")
            } else {
                $('#quien').html("Se esta")
            }
        },
        mover: function (dir) {
            if (dir === 'Enter') {
                if (main.alumno.eje === 'x') {
                    main.alumno.eje = 'y';
                    $('#eje').html('Y');
                } else {
                    main.alumno.eje = 'x';
                    main.alumno.movimientos--;
                    main.alumno.color = 'blue';
                    $('#eje').html('X');
                }
                if (!main.alumno.movimientos) {
                    main.alumno.turno = 'mide'
                    $('#turno').html(main.alumno.turno);
                    socket.emit(
                        'cambia_turno'
                    )
                    main.alumno.movimientos = 3;
                }
                xPoint.push(50 * main.alumno.x + 325);
                yPoint.push(-50 * main.alumno.y + 325);
            }
            if(main.alumno.eje === 'x') {
                if (dir === 'ArrowLeft') {
                    $('#' + (main.alumno.x) + '_' + main.alumno.y).html('');
                    main.alumno.x--;
                } else if (dir === 'ArrowRight') {
                    $('#' + (main.alumno.x) + '_' + main.alumno.y).html('');
                    main.alumno.x++;
                }
            } else if (main.alumno.eje === 'y') {
                if (dir === 'ArrowDown') {
                    $('#' + (main.alumno.x) + '_' + main.alumno.y).html('');
                    main.alumno.y--;
                } else if (dir === 'ArrowUp') {
                    $('#' + (main.alumno.x) + '_' + main.alumno.y).html('');
                    main.alumno.y++;
                }
            }
            $('#' + main.alumno.x + '_' + main.alumno.y).html(main.alumno.img);
            if (main.alumno.x < 0) {
                if (main.alumno.y < 0) {
                    $('#pos').html('Tu posición actual es: (' + main.alumno.x + ',' + main.alumno.y + ')');
                } else {
                    $('#pos').html('Tu posición actual es: (' + main.alumno.x + ', ' + main.alumno.y + ')');
                }
            } else {
                if (main.alumno.y < 0) {
                    $('#pos').html('Tu posición actual es: ( ' + main.alumno.x + ',' + main.alumno.y + ')');
                } else {
                    $('#pos').html('Tu posición actual es: ( ' + main.alumno.x + ', ' + main.alumno.y + ')');
                }
            }
            xPoint.pop();
            xPoint.push(50 * main.alumno.x + 325);
            yPoint.pop();
            yPoint.push(-50 * main.alumno.y + 325);
            socket.emit(
                'movimiento',
                {
                    x: main.alumno.x,
                    y: main.alumno.y
                }
            );
        }
    }
}

$(document).ready(function() {
    body = document.querySelector("body");
    turno = document.querySelector("#turno")
    main.methods.iniciar();
    turno.addEventListener('DOMSubtreeModified', () => {
        switch (main.alumno.turno) {
            case 'mueve':
                $('#quien').html("Te estas")
                $('#pos').removeClass('hidden')
                break;
            case 'mide':
                $('#quien').html("Se esta")
                $('#pos').addClass('hidden')
                break;
            case 'apunta':
                $('#quien').html("Se esta")
            default:
                break;
        }
    })

    body.addEventListener("keydown", key => {
        if (main.alumno.turno === 'mueve') {
            main.methods.mover(key.code)
        }
    });

    // requestAnim shim layer by Paul Irish
    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       || 
                window.webkitRequestAnimationFrame || 
                window.mozRequestAnimationFrame    || 
                window.oRequestAnimationFrame      || 
                window.msRequestAnimationFrame     || 
                function(/* function */ callback, /* DOMElement */ element){
                    window.setTimeout(callback, 1000 / 60);
                };
    })();
    
    init();
    initPoints();
    animate();
    
    function initPoints(){
        xPoint.push(325);
        yPoint.push(325);
        xPoint.push(325);
        yPoint.push(325);
    }
    
    function init() {
                
        canvas = document.createElement( 'canvas' );
        canvas.width = 650;
        canvas.height = 650;
        context = canvas.getContext( '2d' );
        document.querySelector('#game').appendChild( canvas );
    
    }
    
    function animate() {
        draw();
        requestAnimFrame( animate );
    }
    
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        for (let i = 1; i < xPoint.length; i++) {
            context.moveTo(xPoint[i-1], yPoint[i-1]);
            context.lineTo(xPoint[i], yPoint[i]);
            context.strokeStyle = main.alumno.color;
        }
        context.stroke();
    }

    socket.on('mover', (data) => {
        $('#' + (main.alumno.x) + '_' + main.alumno.y).html('');
        main.alumno.x = data.x;
        main.alumno.y = data.y;
        $('#' + (main.alumno.x) + '_' + main.alumno.y).html(main.alumno.img);
    })

    socket.on('nuevo_usuario', (data) => {
        console.log(data.turno);
        main.alumno.turno = data.turno;
        $('#turno').html(main.alumno.turno);
    })

});