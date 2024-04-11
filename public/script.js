const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const numOnlineUsers = document.getElementById("numOnline")
const imageUploade = document.getElementById("file-upload")




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
  onlineUserCount();
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
  if (msg ==" ") {
    return
  }
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

function onlineUserCount() {
  const numOfonlineUser = userList.getElementsByTagName('li').length;
  numOnlineUsers.textContent = numOfonlineUser;
}


// image 
imageUploade.addEventListener("change", () => {
  const file = imageUploade.files[0];
  
  // Check if the file size is greater than 1MB
  if (file && file.size > 1048576) {
    alert('The file is too large. Please upload a file smaller than 1MB.');
  } else if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      socket.emit("imageUpload", {
        img: event.target.result,
        sender: mySocketId
      });
    };
    reader.readAsDataURL(file);
  }
});


socket.on("receivedImage", image => {
  imgOutput(image);
  
})


 function imgOutput(data) {
   const imgContainer = document.createElement("div");
   imgContainer.classList.add("imgUpload");
   const receiveImg = document.createElement("img");  
   receiveImg.src = data.image;
   if (data.sender != mySocketId) {
     imgContainer.classList.add("other-imgUpload")
   }
   imgContainer.appendChild(receiveImg);
   chatMessages.appendChild(imgContainer);
   chatMessages.scrollTop = chatMessages.scrollHeight;
 }
