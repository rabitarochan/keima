
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

//
const OAuth = require('oauth').OAuth;

function isLogin(req) {
    return req.session && req.session.user;
}

// Login
const oa = new OAuth(
    'http://api.twitter.com/oauth/request_token',
    'http://api.twitter.com/oauth/access_token',
    '98QWlHwFPYhE3NAbyufs9A',
    'CovBLwmZOE5wkZ53lgoE9QjrJxTIsn9WeiDJNDx0TS8',
    '1.0',
    'http://' + app.address().address + ':' + app.address().port + '/callback',
    'HMAC-SHA1');
app.get('/login', function(req, res){
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log( error );
        } else {
            req.session.oauth = {
                token: oauth_token,
                token_secret: oauth_token_secret,
            };
            console.log(req.session.oauth);
            res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token);
        }
    });
});
app.get('/callback', function(req, res) {
    console.log(req.session.oauth);
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth = req.session.oauth;
       oa.getOAuthAccessToken(oauth.token,
                              oauth.token_secret,
                              oauth.verifier, function(error, oauth_access_token, oauth_access_token_secret, results){
           if (error){
               console.log(error);
               res.send("yeah something broke.");
           } else {
               req.session.oauth.access_token = oauth_access_token;
               req.session.oauth.access_token_secret = oauth_access_token_secret;
               oa.get("http://twitter.com/account/verify_credentials.json",
                      req.session.oauth.access_token,
                      req.session.oauth.access_token_secret, function (error, data, response) {
                          if (error) {
                              res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
                          } else {
                              req.session.twitterScreenName = data["screen_name"];
                              res.send('You are signed in: ' + req.session.twitterScreenName)
                          }
                      });
           }
       });
    }
});

// Logout
app.get('/logout', function(req, res){
    req.session.destroy(function() {
        res.redirect('/');
    });
});

//



// socket.io
const io = require('socket.io').listen(app);
const connection = require('./connection');
connection.run(app, io);


console.log("Express server listening on port %d in %s mode",
            app.address().port,
            app.settings.env);
