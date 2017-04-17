var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// start webserver on port 8080
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);
// add directory with our static files
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

// array of all shapes drawn
var shapes = [];

// event-handler for new incoming connections
io.on('connection', function (socket) {

    // first send the history to the new client
    for (var i in shapes) {
        socket.emit('draw_shape', shapes[i] );
    }
    //gets new shape being drawn
    // add handler for message type "draw_shape".
    socket.on('draw_shape', function (shape) {
        // add received shape to history
        shapes.push(shape);
        // send shape to all clients
        io.emit('draw_shape', shape);
    });
    //clears
    socket.on('clear', function () {
        shapes=[];
        io.emit('clear');
    });




});


module.exports = app;