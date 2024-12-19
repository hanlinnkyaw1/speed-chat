
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

    socket.join(user.room);

    // Emit the user's socket ID to the client
    socket.emit("socketId", user.id);

    // Handle text messages
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    // Handle image uploads
    socket.on("imageUpload", (data) => {
      try {
        io.to(user.room).emit("receivedImage", {
          sender: data.sender,
          image: data.img,
        });
      } catch (error) {
        console.error("Error handling image:", error);
      }
    });

    // Handle audio uploads
    socket.on("audioFile", (data) => {
      const user = getCurrentUser(socket.id);
      if (user) {
        const buffer = data.audioBlob; // Assume audioBlob is serialized properly from the client
        io.to(user.room).emit("receivedAudio", { audioBlob: buffer, sender: data.sender });
      }
    });
    

    // Notify when a user joins the room
    socket.broadcast
      .to(user.room)
      .emit(
        "sysMessage",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send room and user info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUser(user.room),
    });
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "sysMessage",
        formatMessage(botName, `${user.username} has left the room`)
      );

      // Update room users
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUser(user.room),
      });
    }
  });
});


server.listen(port, () => {
   console.log(`Sever is running on port ${port}`);
});
