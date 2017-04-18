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
            case 'straightLine': drawStraighLine(shape); break;
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
        //draws circle based on starting and end positions of curser
        context.beginPath();
        var x = circle.startPosition.x * width;
        var y = circle.startPosition.y * height;
        var b = circle.endPosition.x * width;
        var c = circle.endPosition.y * height;
        var centerX = (b + x) / 2;
        var centerY = (c + y) / 2;
        var radius = (c - y) / 2;
        if ( radius <=0){radius *= -1}
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

        // restore to original state
        context.restore();

        // apply styling
        if (circle.fillColor){
            context.fillStyle = circle.fillColor;
            context.fill();
        }
        context.lineWidth = circle.width;
        context.strokeStyle = circle.color;
        context.stroke();
    }
    //uses starting and ending positions to draw a straight line
    function drawStraighLine(straightLine){
        context.beginPath();
        var x = straightLine.startPosition.x * width;
        var y = straightLine.startPosition.y * height;
        var b = straightLine.endPosition.x * width;
        var c = straightLine.endPosition.y * height;
        context.moveTo(x ,y);
        context.lineTo(b ,c);

        context.lineWidth = straightLine.width;
        context.strokeStyle = straightLine.color;
        context.stroke();
    }
    function drawRectangle(rectangle){
        context.beginPath();
        var x =rectangle.startPosition.x * width;
        var y = rectangle.startPosition.y * height;
        var b = rectangle.endPosition.x * width;
        var c = rectangle.endPosition.y * height;
        //finds difference of mouse positions to get length and height of rectangle
        var xdiff = b - x;
        var ydiff = c - y;
        var lengthRec = xdiff;
        var heightRec = ydiff;
        context.rect(x,y,lengthRec,heightRec);
        if (rectangle.fillColor){
            context.fillStyle = rectangle.fillColor;
            context.fill();
        }
        context.lineWidth = rectangle.width;
        context.strokeStyle = rectangle.color;
        context.stroke();
    }

    //gets back from server to clear canvas
    socket.on('clear', function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
    });
    //uses user choices to set a line width and color
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
    function getFillColor(){
            var fillColorChoice = document.querySelector('input[name="fillColor"]');
            if (document.getElementById("fillColor").checked && fillColorChoice){
                var fillColor = fillColorChoice.value;
            }
            return (fillColor);
        }

    //click event handler for clear button
    var clear = document.getElementById("clearButton");
    clear.addEventListener("click", clearFunction);
    //sends to server clear
    function clearFunction(){
        socket.emit('clear');

    }
    //gets input from user about shape type they are drawing
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
    //since you don't want to continuously draw shapes here is a function for the shapes
    function completeShape() {
        var shapeType = getShapeType();
        if (shapeType == "rectangle" || shapeType == "circle" || shapeType == "straightLine") {

            // send line to to the server

            var shape = {
                startPosition: mouse.pos_prev,
                endPosition: mouse.pos,
                width: getLineWidth(),
                color: getColor(),
                fillColor: getFillColor(),
                type: shapeType
            };
            socket.emit('draw_shape', shape);
        }
    }
    mainLoop();
});
