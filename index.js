const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");


// App
const app = express();

// Static location
app.use(express.static(__dirname +"/public"));

// View-engine
app.set('view engine', 'ejs');

// bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get("/", function(req, res) {
    res.render("home");
});

app.get('/login',function(req,res){
    res.render('login');
})

app.get('/bookingsection',function(req,res){
  res.render('bookingsec');
})

// Port Listening of Server

// let port = process.env.PORT;
// if (port == null||port == ""){
//   port=3000;
// };

app.listen(3000, function() {
  console.log("Server has started sucessfully");
});