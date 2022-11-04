require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose=require("mongoose");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const ejs = require("ejs");
const app = express();
app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
  }));

app.use(session({
    secret: "This is a secret.",
    resave: false,
    saveUninitialized: false
  }));
  
app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
    
   
  });
  const momentSchema = new mongoose.Schema({
    title: String,
  
    moment: String,
    status: String,
    user: String,
    name: String
  },
  {
    timestamps: true
  }
  
  );
  
  
  userSchema.plugin(passportLocalMongoose);
  userSchema.plugin(findOrCreate);

  
  const User = new mongoose.model("User", userSchema);
  const Moment = new mongoose.model("Moment", momentSchema);


  
  passport.use(User.createStrategy()); 
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
    callbackURL: "http://localhost:3000/auth/google/moments",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"   
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({username: profile.displayName, googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
 passport.authenticate('google', { scope:
     [ 'email', 'profile' ] }
));
app.get("/auth/google/moments",
  passport.authenticate('google', { failureRedirect: "/home" }),
  function(req, res) {
    // Successful authentication, redirect to moments.
    res.redirect("/moments");
  });



  
app.get("/", function(req, res){
    res.render(__dirname+"/views/home.ejs");
  });


app.get("/moments",function(req,res){
    res.render('moments', {name: req.user.username});
});

app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    } else {
      res.redirect("/");
    }
  });


app.get("/publicmoments", function(req, res){
    Moment.find({status:"public"},function(err, foundMoments){
        if (err){
          console.log(err);
        } else {
          if (foundMoments) {
        
            res.render("publicmoments", {allFoundMoments: foundMoments});
          }
        }
      }).sort({ _id: -1 });
});
  
 app.get("/privatemoments",function(req,res){ 
    const user_id=req.user.id;
        Moment.find({user: user_id,status:"private"},function(err,foundMoments){
        if (err){
            console.log(err);
          } else {
            if (foundMoments) {
          
              res.render("privatemoments", {allFoundMoments: foundMoments});
            }
          } 
    });
 }) 
  
 
app.post("/submit",function(req,res){
    
    const momentTitle=req.body.title;
    const momentDetails=req.body.moment;
    const status=req.body.status;
    const user=req.user.id;
    const moment= new Moment({
        title: momentTitle,
        moment: momentDetails,
          status: status,

          user:user,
          name:req.user.username
    }
    
    );
    moment.save();
    
    res.render("sucesspage");
   
});

app.post("/fullmoment",function(req,res){
  

  const moment_id=req.body.momentId;
  
        Moment.findById(moment_id,function(err,foundMoment){
        if (err){
            console.log(err);
          } else {
            if (foundMoment) {
           
             
          res.render("fullmoment",{moment: foundMoment});
            }
          } 
    });
  
  });

app.listen(3000,function(){
    console.log("Working");
});