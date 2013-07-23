const config     = require('./config');
const mubsub     = require('mubsub');
const client     = mubsub(config.mubsub);
const mbsbCh     = client.channel('keima')
const model = require('./model');

function channel(app, name) {
    return app + "/"  + name;
}

exports.run = function(app, io) {
    app.post('/publish/:app', function(req, res){
        mbsbCh.publish(
            channel(req.params.app, req.body.channel),
            JSON.stringify({
                name : req.body.name,
                data : req.body.data
            })
        );
        res.send('published');
    });

    io.sockets.on('connection', function (socket) {
        socket.emit('connected', {});

        const app = socket.handshake.query.app;
        var subscription;

        socket.on("subscribe", function(name){
            const ch = channel(app, name);
            subscription = mbsbCh.subscribe(ch, function(data){
                const obj = JSON.parse(data);
                socket.emit(obj.name, ch, obj.data);
            });
        });

        socket.on('disconnect', function() {
            socket.emit('disconnected', {});
            subscription.unsubscribe();
        });
    });
}