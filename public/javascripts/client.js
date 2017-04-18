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
    canvas.onmousedown = function(e){
        mouse.click = true;
        mouse.pos_prev.x = e.clientX / width;
        mouse.pos_prev.y = e.clientY / height;
    };
    canvas.onmouseup = function(e){
        mouse.click = false;
        completeShape();
    };

    canvas.onmousemove = function(e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / height;
        mouse.move = true;
    };

    // draw shape received from server
    socket.on('draw_shape', function (shape) {
        switch (shape.type) {
            case 'circle': drawCircle(shape); break;
            case 'line': drawLine(shape); break;
            case 'rectangle': drawRectangle(shape); break;
            default: console.log('Unknown shape to draw: ' + shape.type);
        }
    });

    function drawLine(line) {
        context.beginPath();
        context.moveTo(line.startPosition.x * width, line.startPosition.y * height);
        context.lineTo(line.endPosition.x * width, line.endPosition.y * height);
        context.lineWidth = line.width;
        context.strokeStyle = line.color;
        context.stroke();
    }

    function drawCircle(circle) {
        // save state
        context.save();

        // translate context
        context.translate(canvas.width / 2, canvas.height / 2);

        // scale context horizontally
        context.scale(2, 1);

        // draw circle which will be stretched into an oval
        context.beginPath();
        var x = circle.startPosition.x * width;
        var y = circle.startPosition.y * height;
        var b = circle.endPosition.x * width;
        var c = circle.endPosition.y * height;
        var centerX = b- x;
        var centerY = c - y;
        var radius = centerY + 2;
        if ( radius <=0){radius * -1}
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

        // restore to original state
        context.restore();

        // apply styling
        context.fillStyle = '#8ED6FF';
        context.fill();
        context.lineWidth = 5;
        context.strokeStyle = 'black';
        context.stroke();

       // context.beginPath();
  //      var x = circle.startPosition.x * width;
    //    var y = circle.startPosition.y * height;
      //  var b = circle.endPosition.x * width;
        //var c = circle.endPosition.y * height;

 //       context.arc(x,y,50,0,2*Math.PI);
   //     context.lineWidth = circle.width;
     //   context.strokeStyle = circle.color;
       // context.stroke();
    }
    function drawRectangle(rectangle){
        context.beginPath();
        var x =rectangle.startPosition.x * width;
        var y = rectangle.startPosition.y * height;
        var b = rectangle.endPosition.x * width;
        var c = rectangle.endPosition.y * height;

        var xdiff = b - x;
        var ydiff = c - y;
        var lengthRec = xdiff;
        var heightRec = ydiff;
        context.rect(x,y,lengthRec,heightRec);
        context.lineWidth = rectangle.width;
        context.strokeStyle = rectangle.color;
        context.stroke();
    }

    //gets back from server to clear canvas
    socket.on('clear', function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
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
    //click event handler for clear button
    var clear = document.getElementById("clearButton");
    clear.addEventListener("click", clearFunction);
    //sends to server clear
    function clearFunction(){
        socket.emit('clear');

    }
    function getShapeType(){
        var shapeInput = document.querySelector('input[name="shape"]:checked');
        var shapeType = 'line';
        if (shapeInput) {
            shapeType = shapeInput.value;
        }
        return shapeType;
    }
    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        var shapeType = getShapeType();
        if (shapeType == "line") {
            if (mouse.click && mouse.move && mouse.pos_prev) {
                // send line to to the server

                var shape = {
                    startPosition: mouse.pos_prev,
                    endPosition: mouse.pos,
                    width: getLineWidth(),
                    color: getColor(),
                    type: shapeType
                };
                socket.emit('draw_shape', shape);

                mouse.move = false;
            }
            mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};

        }
        setTimeout(mainLoop, 25);
    }

    function completeShape() {
        var shapeType = getShapeType();
        if (shapeType == "rectangle" || shapeType == "circle") {

            // send line to to the server

            var shape = {
                startPosition: mouse.pos_prev,
                endPosition: mouse.pos,
                width: getLineWidth(),
                color: getColor(),
                type: shapeType
            };
            socket.emit('draw_shape', shape);
        }
    }
    mainLoop();
});
