//-------------------------------------------------- IMPORTS AND SETUP --------------------------------------------------//
import validate from "./validator.js";

//express imports to facilitate the webbapp
import express, { json } from "express";
const app = express();
app.use(json());

//mongo db and dotenv stuff
import dotenv from "dotenv";
dotenv.config({path: "values.env"});

//opens to cross origin
import cors from "cors";
app.use(cors());

//prefered port or 27017
const port = process.env.port | 27017;

//database connection
const url = process.env.DB_HOST + ":" + port + "/ProjectLedningsProjekt";

//listening check
let apiPort = 3000;
app.listen(apiPort, () => {console.log("listening")});

//-------------------------------------------------- MONGODB ---------------------------------------------------------------//

//mongoose for schema and stuff
import { connect, Schema, model } from "mongoose";
connect(url)
    .then(() => {console.log("connected!")})
    .catch((error) => console.log("ERROR: " + error));

//schemas
const loginSchema = new Schema({
    email: String,
    username: String,
    img: Buffer
});

//models
const login = model("login", loginSchema);

//-------------------------------------------------- Profile Functionality -------------------------------------------------//

//user registration
app.post("/register", async (req, res) => {
    //Error handling
    try {
        let val = await validate(req, 2, login);
        if(val != "") {
            res.status(400).send({error: val});
            return;
        } 
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }

    let newUser = new login({
        email: req.body.email,
        username: req.body.username,
        img: "default"
    });  
    
    newUser.save();
    res.status(200).send({message: "Account registered"});
})

//User login functionaliy
app.post("/login", async (req, res) => {
    //validate for input errors
    try {
        let val = await validate(req, 1, login);
        if (val != "") {
            res.status(400).send({error: val});
            return
        }
        let user = login.findOne({username: req.body.username});
        res.status(200).send({message: "Confirmed Login", content: user});
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

//change profile picture
app.post("/uploadPicture", async (req, res) => {
    try {
        if(!login.findOne({username: req.body.username})) {
            res.status(400).send({error: "Invalid username, something went wrong"});
            return;
        }
        await login.findOneAndUpdate({username: req.body.username}, {img: req.body.img});
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
    res.status(200).send({message: "Updated User Picture"});
})