const config   = require('./config');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(config.mongodb);
mongoose.model('App', new Schema({
    title: String,
    date: Date
}));
mongoose.model('User', new Schema({
    twitter_id : String,
    name : String
}));

function eq(x, k) {
    return function(_, y) {
        k(x == y);
    }
}

function neq(x, k) {
    return function(_, y) {
        k(x != y);
    }
}

function success(k) {
    return function(error, x) {
        if(!error){ return k(x); }
        else      { throw error; }
    }
}

const App = mongoose.model('App');
exports.App = {
    create : function(title, k) {
        App.count({ title : title },
                  eq(0,
                     function(b) {
                         if(b){
                             const app = new App();
                             app.title = title;
                             app.date  = new Date();
                             app.save(k);
                         } else {
                             k("dup error")
                         }
                     }));
    },
    all : function(k) {
        App.find({}).asc('title').exec(success(k));
    },
    get : function(id, k) {
        App.findById(id, success(k));
    },
    update : function(id, obj, k) {
        obj.date = new Date();
        App.update({ _id : id }, obj, success(k));
    },
    remove : function(id, k) {
        App.remove({ _id : id }, success(k));
    }
};

const User = mongoose.model('User');
exports.User = {
    create : function(tid, name, k) {
        User.count({ twitter_id : tid },
                   eq(0, function(b) {
                       if(b){
                           const user = new User();
                           user.twitter_id = tid;
                           user.name = name;
                           user.save(function(result, obj){
                               k(obj);
                           });
                       } else {
                           console.log('update');
                           User.find({ twitter_id : tid }, function(result, obj){
                               obj[0].name = name;
                               obj[0].save(function(result, obj){
                                   k(obj)
                               });
                           });
                       }
                   }));
    },
    get : function(id, k) {
        User.findById(id, success(k));
    }
}