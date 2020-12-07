const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require('passport-local-mongoose');
const mongoose = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
require('dotenv').config();
const fs = require('fs'); 
const path = require('path');

// App
const app = express();

// Static location
app.use(express.static( __dirname + "/public"));

// View-engine
app.set('view engine', 'ejs');

// bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'celebze secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/celebzeDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  googleId : String,
  facebookId : String
});

const celebritySchema = new mongoose.Schema({
  name : String,
  username : String,
  password : String,
  phoneNo : String,
  handle : String,
  followers : String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
celebritySchema.plugin(passportLocalMongoose);
celebritySchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
const Celebrity = new mongoose.model("Celebrity",celebritySchema);

passport.use(User.createStrategy());
passport.use(Celebrity.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/celebze",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/celebze"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", function (req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/celebze', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/celebze',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});
app.get('/signup',function(req,res){
  res.render('signup');
})
app.post("/signup", function(req, res) { 
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});
app.get('/login', function (req, res) {
  res.render('login');
});
app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  console.log(user);
  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});

app.get('/bookingsection', function (req, res) {
  res.render('bookingsec');
});

app.get('/your-bookings', function (req, res) {
  res.render('your_bookings');
});

app.get('/hiw', function (req, res) {
  res.render('howitworks');
});
app.get('/category',function(req,res){
  res.render('category');
});

app.get('/enroll-as-celebs',function(req,res){
  res.render('enroll-as-celeb');
});

app.post('/enroll-as-celebs',function(req,res){

  const newcelebrity = {
    name : req.body.name,
    username : req.body.username,
    handle : req.body.handle,
    followers : req.body.followers,
    phoneNo : req.body.phoneNo
  }

  Celebrity.register(newcelebrity, req.body.password, function(err, celebrity) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        console.log(celebrity);
        console.log(req.isAuthenticated());
        res.redirect("/celeb/" + celebrity.name + "/" +  celebrity._id);
      });
    }
  });
});

app.get("/celeb/:userName/:userId", function(req, res) {
  const reqUserId = req.params.userId;
  const reqUserName = req.params.userName;

  const userDetails = req.celebrity;


  if (req.isAuthenticated()) {
    if (reqUserId == req.celebrity._id && reqUserName == req.celebrity.name) {
      res.render("celeb-panel", {
        celeb: userDetails
      });
    }
  } else {
   
  }
});

// Port Listening of Server

let port = process.env.PORT;
if (port == null||port == ""){
  port=3000;
};

app.listen(port, function () {
  console.log("Server has started sucessfully");
});