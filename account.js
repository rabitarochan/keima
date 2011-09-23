const OAuth = require('oauth').OAuth;
const model = require('./model');

function Account(server) {
    this.consumer = new OAuth(
        'http://api.twitter.com/oauth/request_token',
        'http://api.twitter.com/oauth/access_token',
        '98QWlHwFPYhE3NAbyufs9A',
        'CovBLwmZOE5wkZ53lgoE9QjrJxTIsn9WeiDJNDx0TS8',
        '1.0',
        'http://' + server.address().address + ':' + server.address().port + '/callback',
        'HMAC-SHA1');
    return this;
}
exports.Account = Account;

Account.prototype.login = function(req, res) {
    this.consumer.getOAuthRequestToken(function(error, token, token_secret, _) {
        if (error) {
            console.log( error );
        } else {
            req.session.oauth = {
                token:token,
                token_secret: token_secret,
            };
            console.log(req.session.oauth);
            res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + token);
        }
    });
}

Account.prototype.callback = function(req, res) {
    var self = this;
    console.log("callback");
    console.log(req.session.oauth);
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth = req.session.oauth;
        self.consumer.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier, function(error, access_token, access_token_secret, _){
            if (error){
                console.log(error);
                res.send("yeah something broke.");
            } else {
                req.session.oauth.access_token = access_token;
                req.session.oauth.access_token_secret = access_token_secret;
                self.consumer.get("http://twitter.com/account/verify_credentials.json", req.session.oauth.access_token, req.session.oauth.access_token_secret, function (error, data, _) {
                    if (error) {
                        res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
                    } else {
                        const obj = JSON.parse(data);
                        model.User.create(obj.id, obj.screen_name, function(user){
                            req.session.current_user = user;
                            res.redirect('/');
                        });
                    }
                });
            }
        });
    } else {
        res.send('not session')
    }
}

Account.prototype.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/');
    })
}

