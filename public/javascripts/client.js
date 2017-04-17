document.addEventListener("DOMContentLoaded", function() {
    var mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    // get canvas element and create context
    var canvas  = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width   = window.innerWidth;
    var height  = window.innerHeight;
    console.log('io', io);
    var socket  = io.connect();

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    // register mouse event handlers
    canvas.onmousedown = function(e){ mouse.click = true; };
    canvas.onmouseup = function(e){ mouse.click = false; };

    canvas.onmousemove = function(e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / height;
        mouse.move = true;
    };

    // draw line received from server
    socket.on('draw_line', function (line) {
        context.beginPath();
        context.moveTo(line.startPosition.x * width, line.startPosition.y * height);
        context.lineTo(line.endPosition.x * width, line.endPosition.y * height);
        context.lineWidth = line.width;
        context.stroke();
        context.strokeStyle=line.color;
    });
    function getLineWidth(){
        var LineWidthInput = document.querySelector('input[name ="lineWidth"]');
        if (LineWidthInput){
            var lineWidth = LineWidthInput.value;
        }
        return (lineWidth);
    }
    function getColor(){
        var ColorChoice = document.querySelector('input[name="colorChoice"]');
        if (ColorChoice){
            var color = ColorChoice.value;
        }
        return (color);
    }
    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            var line = {
                startPosition: mouse.pos_prev,
                endPosition: mouse.pos,
                width: getLineWidth(),
                color: getColor()
            };
            socket.emit('draw_line', line);

            mouse.move = false;
        }
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 25);
    }
    mainLoop();
});