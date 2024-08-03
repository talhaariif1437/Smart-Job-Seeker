const env = require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/exampledb"

//DB connection
mongoose.connect(process.env.DB_URL ).then((val) =>{
    console.log("Database connected");

}).catch((err)=>{
    console.log("Connection not successful",err)
})
mongoose.Promise = global.Promise;

app.get('/', (req, res) =>{
  res.json("Hello")
})

// Middlewares
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
  
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
    }
    next();
  });
  
  app.use(morgan("dev"));
  app.use("/Uploads", express.static("Uploads"));
  app.use("/Assets", express.static("Assets"));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());



//Required Routes
const auth = require("./src/auth/auth.controller");
const user = require("./src/user/user.controller");
const job = require("./src/job/job.controller")
const organization = require("./src/organization/organization.controller");


  //Routes which should handle requests
  app.use("/api/auth",auth);
  app.use("/api/user",user);
  app.use("/api/organization",organization);
  app.use("/api/job",job);
  // app.use("/",applyJob);



// Default Route When nothing matches
app.use((req, res, next) => {
    const error = new Error("Not found :o 1:o:1 ");
    error.status = 404;
    next(error);
  });
  
  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message,
      },
    });
  });
  
  module.exports = app;
  