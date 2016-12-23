var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var express = require('express');
var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(process.cwd() + '/public'));

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

mongoose.connect('mongodb://localhost/mongoCheerio');

var db = mongoose.connection;
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

db.once('open', function() {
  console.log('Mongoose connection successful.');
});

var routes = require('./controllers/controller.js');
app.use('/', routes);



var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Running on port: ' + port);
});