require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoute = require("./Routes/userRoute");
const chatRoute = require("./Routes/chatRoutes");
const messageRoute = require("./Routes/messageRoutes");   
const adminRoute = require("./Routes/adminRoute");           
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(cors({
    origin: "*"
}));

//mongodb connection
mongoose.set("strictQuery", false)
mongoose.connect(process.env.MONGO_URL, () => {console.log("MongoDB is connected")})

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use("/user", userRoute)
app.use("/chat", chatRoute)
app.use("/message", messageRoute)


app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
})

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register.html");
})

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin.html")
})

const server = app.listen(port, () => {
    console.log("Server is running on port" + " " + port);
})


const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
    pingTimeout: 60000,
});

io.on("connection", (socket) => {
    console.log("Socket.io connection established");

    socket.on("setup", (user) => {
        socket.join(user.data._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => socket.join(room));

    socket.on("new message", (newMessageStatus) => {
        var chat = newMessageStatus.chat;
        if(!chat.users) {
            return console.log("Chat.users not defined");
        }
        chat.users.forEach((user) => {
            if(user._id == newMessageStatus.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        });    
    });
});


