//-------------------------------------------------- IMPORTS AND SETUP --------------------------------------------------//
import validate from "./validator.js";

//express imports to facilitate the webbapp
import express, { json } from "express";
const app = express();
app.use(express.json({limit: '16mb'}));

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
    member: [String]
});
const login = model("login", loginSchema);

const groupSchema = new Schema({
    name: String,
    members: [String],
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
        if(!req.body.img) {
            res.status(404).send({error: "No image uploaded"});
            return;
        }
        if(await loginCheck(req.body.username)) {
            await login.findOneAndUpdate({username: req.body.username}, {img: req.body.img});
        }
        else {
            res.status(404).send({error: "Something went wrong, no username found"});
        }
    } catch (error) {
        res.status(400).send({error: "something broke please try again"});
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

app.post("/groupCreate", async (req, res) => {
    try {
        if(!await loginCheck(req.body.username)) { 
            res.status(400).send({message: "Invalid User"});
            return;
        }
        let user = await login.findOne({username: req.body.username});
        if(await group.findOne({name: req.body.groupname})) {
            res.status(400).send({error: "group name already in use"});
            return;
        }
        let newGroup = new group({
            name: req.body.groupname,
            members: user.username
        });
        user.member.push(newGroup.name);
        user.save();
        newGroup.save();
        res.status(200).send({message: "Group Created!"});
        return
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

app.delete("/groupDelete", async (req, res) => {
    try {
        if(!await loginCheck(req.body.username)) {
            res.status(401).send({error: "invalid user"});
            return;
        }
        if(!await group.findOne({name: req.body.groupname})) {
            res.status(400).send({error: "invalid group"});
            return;
        }
        let deleteGroup = await group.findOne({name: req.body.groupname, members: req.body.username});
        let user = await login.findOne({username: req.body.username});
        user.member.pull(deleteGroup.name);
        user.save();
        if(deleteGroup.members.length > 1) {
            deleteGroup.members.pull(user.username);
            deleteGroup.save();
        }
        else {
            await group.findOneAndDelete({name: deleteGroup.name});
        }
        res.status(200).send({message: "left/removed group"});
    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

app.put("/groupJoin", async (req, res) => {
    try {
        if(!await loginCheck(req.body.username)) {
            res.status(401).send({error: "invalid user"});
            return;
        }
        if(!await group.findOne({name: req.body.groupname})) {
            res.status(400).send({error: "invalid group"});
            return;
        }
        if(await group.findOne({name: req.body.groupname, members: req.body.username})) {
            res.status(400).send({error: "Already part of group"});
            return;
        }
        
        let user = await login.findOne({username: req.body.username})
        let groupJoin = await group.findOne({name: req.body.groupname});

        user.member.push(groupJoin.name);
        user.save();
        groupJoin.members.push(user.username);
        groupJoin.save();
        res.status(200).send({message: "joined group"});
    }

    catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

app.post("/groupMessage", async (req, res) => {
    try {
        if(!await loginCheck(req.body.username)) {
            res.status(401).send({error: "invalid user"});
            return;
        }
        if(!await group.findOne({name: req.body.groupname})) {
            res.status(400).send({error: "invalid group"});
            return;
        }

        let messageGroup = await group.findOne({name: req.body.groupname, members: req.body.username});
        if(!messageGroup) {
            res.status(401).send({error: "you are not a member of the group or it dosent exist"});
            return;
        };
        let message = {
            message: req.body.message, 
            time: new Date, 
            user: req.body.username
        }

        messageGroup.messages.push(message);
        messageGroup.save();
        res.status(200).send({message: "sent message in group"});
    }
    catch (error) {
        res.status(400).send({error: error});
        return;
    }
})

app.put("/groupUploadFile", async (req, res) => {
    try {
        if(!await loginCheck(req.body.username)) {
            res.status(401).send({error: "invalid user"});
            return;
        }
        if(!await group.findOne({name: req.body.groupname})) {
            res.status(400).send({error: "invalid group"});
            return;
        }

        let groupFile = await group.findOne({name: req.body.groupname, members: req.body.username});
        if(!groupFile) {
            res.status(401).send({error: "you are not a member of the group or it dosent exist"});
            return;
        };
        let file = {
            file: req.body.file, 
            time: new Date, 
            user: req.body.username
        }

        groupFile.file.push(file);
        groupFile.save();

    } catch (error) {
        res.status(400).send({error: error});
        return;
    }
    res.status(200).send({message: "Uploaded file"});
})

app.get("/groupFetch", async (req, res) => {
    if(!await loginCheck(req.body.username)) {
        res.status(401).send({error: "invalid user"});
        return;
    }
    if(!await group.findOne({name: req.body.groupname})) {
        res.status(400).send({error: "invalid group"});
        return;
    }

    let groupFile = await group.findOne({name: req.body.groupname, members: req.body.username});
    if(!groupFile) {
        res.status(401).send({error: "you are not a member of the group or it dosent exist"});
        return;
    };
    res.status(200).send({groupFile});
})