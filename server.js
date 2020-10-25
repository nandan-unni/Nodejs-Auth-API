const express = require("express"); // for Server
const mongoose = require("mongoose"); // MongoDB connections
const passport = require("passport"); // Authentication purpose
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser"); // Parsing data
const expressSession = require("express-session"); // server sessions
require('dotenv').config() // Obtaining env variables

// User Model
const User = require('./models/user.model')

// Importing routes
const userRoutes = require('./routes/user.route')

// Creating server
const server = express();

//Connecting to the database
mongoose.connect("mongodb://localhost/authapi").then(() => {
        console.log("Connected to DataBase");    
    }).catch(err => {
        console.log("DataBase connection failure. Stopping server.");
        process.exit();
    }
);

// Server settings
server.use(bodyParser.urlencoded({ extended: false })); // Parse req.body
server.use(bodyParser.json()); // Use JSON
server.use(passport.initialize()); // Auth
server.use(passport.session()); // Auth
server.use(
    expressSession({
        secret: "NodeAuthAPI",
        resave: false,
        saveUninitialized: false,
    })
); // Create a session middleware

// Passport(Auth) settings
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connecting routes to server
server.use("/api/user", userRoutes);

// Setting port
const port = process.env.PORT || 8000;

// Connecting to port
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
