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

//schemas and models
const loginSchema = new Schema({
    email: String,
    username: String,
    img: Buffer,
    owned: [{type: Schema.ObjectId, ref: "login"}],
    member: [{type: Schema.ObjectId, ref: "login"}]
});
const login = model("login", loginSchema);

const groupSchema = new Schema({
    name: String,
    owner: {type: Schema.ObjectId, ref: "login"},
    members: [{type: Schema.ObjectId, ref: "login"}],
    messages: [{message: String, time: Date, user: String}],
    files: [{file: Buffer, time: Date, user: String}]
});

const group = model("groups", groupSchema);

//-------------------------------------------------- Profile Functionality -------------------------------------------------//

//user registration
app.post("/register", async (req, res) => {
    //Error handling
    try {
        let val = await validate(req, login);
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
        username: req.body.username
    });  
    
    newUser.save();
    res.status(200).send({message: "Account registered"});
})

async function loginCheck(username) {
    if(await login.findOne({username: username})) {
        return true;
    }
    else {
        return false;
    }
}

//User login functionaliy
app.post("/login", async (req, res) => {
    //validate for input errors
    try {
        if(await loginCheck(req.body.username)) {
            let user = await login.findOne({username: req.body.username});
            res.status(200).send({message: "Confirmed Login", userdata: user});
            return
        };
        res.status(401).send({error: "Invalid username"});
        return
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

//change profile picture
app.put("/uploadPicture", async (req, res) => {
    try {
        if(await loginCheck(req.body.username)) {
            await login.findOneAndUpdate({username: req.body.username}, {img: req.body.img});
        }
        else {
            res.status(404).send({error: "something went wrong, no username found"});
        }
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
    res.status(200).send({message: "Updated User Picture"});
})


//Remove user, wont be used on the website but exists for admin purposes
app.delete("/removeUser", async (req, res) => {
    try {
        if(await loginCheck(req.body.username)) {
            let val = await login.findOneAndDelete({username: req.body.username});
            res.status(200).send({message: "Removed User", user: val});
        }
        else {
            res.status(401).send({error: "invalid username"});
        }
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

//-------------------------------------------------- Group Functionality -------------------------------------------------//

app.post("/createGroup", async (req, res) => {
    //Error handling
    try {
        if(!await loginCheck(req.body.username)) { 
        let user = await login.findOne({username: req.body.username});
        if(group.findOne({name: req.body.name})) {
            res.status(400).send({error: "group name already in use"});
        }
        let newGroup = new group({
            name: req.body.name,
            owner: user
        });
        
        newGroup.save();
        res.status(200).send({message: "Account registered"});
    }
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})