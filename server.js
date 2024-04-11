
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const formatMessage = require("./utilis/messages.js");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUser,
} = require("./utilis/users.js");

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static("public"))

const botName = "SpeedBot";

io.on("connect", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.emit("socketId", user.id);
    // image
    socket.on("imageUpload", (data) => {
      // data.image is a base64 url
      try {          
        io.to(user.room).emit('receivedImage', ({sender: data.sender,image: data.img}));    
      } catch (error) {
        console.error("Error image:", error);
       }
    });  
    
    

    socket.join(user.room);
    socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
    socket.broadcast
      .to(user.room)
      .emit(
        "sysMessage",
        formatMessage(botName, `${user.username} has joined the chat `)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUser(user.room)
      });
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "sysMessage",
        formatMessage(botName, `${user.username} has left room`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUser(user.room)
      });
    }
  });
});

server.listen(port, () => {
   console.log(`Sever is running on port ${port}`);
});
