var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express(); // creates a server instance 

app.set('views', __dirname + '/views'); // set up the middleware 
app.set('view engine', 'ejs'); // for any page that the client is going to request, i want to use ejs 
app.use(partials()); // enable you to use the 'include' keyword with express-partials 
// Parse JSON (uniform resource locators)
app.use(bodyParser.json()); // bodyParser middleware will help you chunk the data in post requests and put data into the request object for you 
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true })); // need to 
app.use(express.static(__dirname + '/public')); // middleware to serve up static files 

var authenticate = function(req, res, next) {
  var userLoggedIn = false;
  if (!userLoggedIn) {
    console.log('redirecting from ' + req.url);
    res.redirect('/login');
  } else {
    next();
  }
};

// set up the request handler for the possible routes 
app.get('/', authenticate,
function(req, res) {
  res.render('index'); // render the html on the client side (index.ejs) The server will convert the ejs into a html file and send it to the client. 
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  
});

app.get('/create', authenticate,
function(req, res) {
  res.render('index');
});

app.get('/links', authenticate,
function(req, res) {
  Links.reset().fetch().then(function(links) { // send links back to the database
    res.status(200).send(links.models); 
  });
});

app.post('/links', authenticate,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) { // check if the url is valid 
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) { // create a new model of Link, fetch to see if it's existing already 
    if (found) {
      res.status(200).send(found.attributes);
    } else { // if it isn't already existing in our Links collection, then 
      util.getUrlTitle(uri, function(err, title) { // use the util helper 
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({ // to add it to our links collection 
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// deny a

// set up login page 

// new account creation? 

// set up a system that keeps track of the user thats signed in
// and only returns the urls that the user made previously 

// only let users who are signed in
// create new urls 



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/


app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      authenticate(req, res, function() {
        res.redirect('/');
      });
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
