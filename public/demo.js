$(function(){
    function log(text){
        if(console){ console.log(text); }
        var dom = $("#console");
        dom.html( dom.html() + text + "\n");
    }
    log('start');

    var socket = io.connect('http://localhost/?app=' + app.id);
    socket.emit("subscribe", "demo");
    socket.on("news",function(channel, data){
        log("news:" + channel + ":" + data)
    });

    $("form#demo").bind("submit",function(event){
        return false;
    });
});