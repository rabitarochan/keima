
/**
 * Module dependencies.
 */

const express = require('express');
const Resource = require('express-resource');
const app = module.exports = express.createServer();

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret : 'test', cookie: { maxAge: 60000 } }));
    app.use(app.router);
    app.use(require('stylus').middleware({ src: __dirname + '/public' }));
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes
app.listen(app.settings.env == 'development' ? 3001 : 80);

app.get('/', function(req, res){
    res.redirect('/app');
});

app.get('/about', function(req, res) {
    res.render('about', {
        title : 'About'
    });
});

app.get('/help', function(req, res) {
    res.render('help', {
        title : 'Help'
    });
});

function resource(server, name, actions) {
    server.resource(name, actions);
    actions.extras(server, name);
}
resource(app, 'app', require('./app'));

function bind(self, f){
    return function(){
        return f.apply(self, arguments);
    }
}
const model = require('./model');
const Account = require('./account').Account;
const account = new Account(app);
app.get('/login'   , bind(account, account.login))
app.get('/logout'  , bind(account, account.logout));
app.get('/callback', bind(account, account.callback));
app.dynamicHelpers({
    current_user: function(req, res){
        return req.session.current_user;
    }
});

// socket.io
const io = require('socket.io').listen(app);
const connection = require('./connection');
connection.run(app, io);


console.log("Express server listening on port %d in %s mode",
            app.address().port,
            app.settings.env);
