const redis      = require('redis');
const subscriber = redis.createClient(6379, 'localhost');

exports.run = function(io) {
    io.sockets.on('connection', function (socket) {
        const app = socket.handshake.query.app;

        socket.on("subscribe", function(channel){
            const name = app + "/" + channel;
            console.log("subscribe:" + name);
            subscriber.subscribe(name);
        });

        subscriber.on("message", function(channel, data){
            const obj = JSON.parse(data);
            socket.emit(obj.name, channel, obj.data);
        });
    });
}