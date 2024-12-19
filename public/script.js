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

const imgIcon = document.getElementById("imgIcon")
const audioIcon = document.getElementById("audioIcon")
const msgInput = document.getElementById("msg");

function updateIcon(){
  const msg = msgInput.value.trim();
  if (msg !== "") {
    audioIcon.style.display = 'none';
    imgIcon.style.display = 'none';
  }else{
    audioIcon.style.display = 'block';
    imgIcon.style.display = 'block';
  }
}

msgInput.addEventListener('input', () => {
 updateIcon()})
 

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msgInput = document.getElementById("msg");
  const msg = msgInput.value.trim();
  if (msg =="") {
    return
  }
  socket.emit("chatMessage", {
    text: msg,
    sender: mySocketId
  });
  msgInput.value = "";
  updateIcon()
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


//  Audio
let mediaRecorder;
let audioChunks = [];

const startAudioBtn = document.getElementById("startAudioBtn");
const stopAudioBtn = document.getElementById("stopAudioBtn");

startAudioBtn.addEventListener("click", startRecording);
stopAudioBtn.addEventListener("click", stopRecordingAndSend);

async function startRecording() {
  try {
    audioChunks = []; // Reset chunks
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (evt) => {
      audioChunks.push(evt.data);
    };

    mediaRecorder.start(100);
    console.log("Recording started...");
    startAudioBtn.style.display = "none";
    stopAudioBtn.style.display = "block";
  } catch (err) {
    console.error("Error starting recording:", err);
  }
}

function stopRecordingAndSend() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("Recording stopped...");
  } else {
    console.warn("MediaRecorder is not active!");
  }

  startAudioBtn.style.display = "block";
  stopAudioBtn.style.display = "none";

  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
  console.log(audioBlob)
  if (audioBlob.size > 0) {
    console.log("Audio Blob created successfully:", audioBlob);
    // Emit the audioBlob and sender info to the server
    socket.emit("audioFile", {
      audioBlob: audioBlob,
      sender: mySocketId,
    });
  } else {
    console.error("Audio Blob is empty. Recording might have failed.");
  }
}

// Receiving audio on another client
socket.on("receivedAudio", (data) => {
  console.log("Received audio data:", data);

  try {
    const audioBlob = new Blob([data.audioBlob], { type: "audio/wav" });
    console.log("Received Audio Blob size:", audioBlob.size);

    if (audioBlob.size > 0) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioContainer = document.createElement("div");
      const audioElement = document.createElement("audio");
      audioElement.src = audioUrl;
      audioElement.controls = true;

      // Apply different classes based on the sender
      if (data.sender === mySocketId) {
        audioContainer.classList.add("audio");
      } else {
        audioContainer.classList.add("other-audio");
      }

      audioContainer.appendChild(audioElement);
      chatMessages.appendChild(audioContainer);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      console.error("Received an empty audio blob.");
    }
  } catch (err) {
    console.error("Error reconstructing received audio blob:", err);
  }
});



