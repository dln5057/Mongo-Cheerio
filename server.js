
// Node Dependencies
var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');
var exphbs = require('express-handlebars');

//debugger
var logger = require('morgan'); 

var app = express();

// Initialize Express for debugging & body parsing
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

//static content
app.use(express.static(process.cwd() + '/public'));

//express handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//database configuration with MongoDB
mongoose.connect('mongodb://heroku_3k78dgc5:8gnei7rt86otr05rdvf40qjdag@ds143608.mlab.com:43608/heroku_3k78dgc5');
// mongoose.connect('mongodb://localhost/mongoCheerio');

//check mongoose for errors
var db = mongoose.connection;
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success connect message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

var routes = require('./controllers/controller.js');
app.use('/', routes);


//app connects at localhost 3000
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Running on port: ' + port);
});