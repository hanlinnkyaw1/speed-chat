const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

const currentYear = new Date().getFullYear();
const date = document.getElementById('date');
date.textContent = currentYear;


const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});


function closeBtn() {
  document.getElementById("sidebar").style.display = "none";
  document.getElementById("nav-bars").style.display = "block";
  document.getElementsByClassName("chat-sidebar")[0].style.display = "none";
}

function openBtn() {
  document.getElementsByClassName("chat-sidebar")[0].style.display = "block";
  document.getElementById("nav-bars").style.display = "none";
  document.getElementById("sidebar").style.display = "block";
}

const socket = io();

socket.on("socketId",(id) =>{
  return mySocketId = id;
})



socket.emit("joinRoom", { username, room });

socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on("message", (msg) => {
  outputMessage(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("sysMessage", (msg) => {  
  sysMessage(msg);
})

function outputRoomName(room) {
  roomName.innerText = room;
}

function outputUsers(users) {
  userList.innerHTML = `
    ${users.map((user) => `<li>${user.username}</li>`).join("")}`;
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msgInput = document.getElementById("msg");
  const msg = msgInput.value;
  socket.emit("chatMessage", {
    text: msg,
    sender: mySocketId
  });
  msgInput.value = " ";
});

function outputMessage(message) {
  const div = document.createElement("div");
  div.innerHTML = ` <p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text.text}
  </p>`;

  if (message.text.sender === mySocketId) {
    div.classList.add("message");
  }else {
    div.classList.add("other-message");
  }

  chatMessages.appendChild(div);
 
}

function sysMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("sys-msg");
  div.innerHTML = `<p>${msg.text}</p>`;
  chatMessages.appendChild(div);
}
