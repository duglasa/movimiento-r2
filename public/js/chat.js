const videoGrid = document.getElementById("video-grid");
let isAlreadyCalling = false;
var peerConnections = {};
const { RTCPeerConnection, RTCSessionDescription } = window;
const localpeer = new RTCPeerConnection();

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then(mediaStream => {
    const video = document.createElement("video");
    video.srcObject = mediaStream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    videoGrid.append(video);
    mediaStream
      .getTracks()
      .forEach(track => localpeer.addTrack(track, mediaStream));
  })
  .catch(err => {
    console.log(err);
  });

socket.on("update-user-list", ({ users }) => {
  console.log(users);
  users.forEach(user => {
    if (user !== socket.id) {
      const yaExiste = document.getElementById(user);
      if (!yaExiste) {
        $("#conectados").append(
          '<li class="usuario" id="' + user + '">' + user + "</li>"
        );
      }
    }
  });
});

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);
  $("#" + socketId).remove();

  if (elToRemove) {
    elToRemove.remove();
  }
});

$("#conectados").on("click", ".usuario", e => {
  callUser(e.currentTarget.id);
});

async function callUser(socketId) {
  const offer = await localpeer.createOffer();
  await localpeer.setLocalDescription(new RTCSessionDescription(offer));
  socket.emit("call-user", {
    offer: offer,
    to: socketId,
    sala: sala
  });
}

socket.on("call-made", async data => {
  await localpeer.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await localpeer.createAnswer();
  await localpeer.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer: answer,
    to: data.socket,
    sala: sala
  });
});

socket.on("answer-made", async data => {
  console.log(data.answer);
  await localpeer.setRemoteDescription(new RTCSessionDescription(data.answer));
  localpeer.ontrack = function({ streams: [stream] }) {
    console.log("que");
    const video = document.createElement("video");
    addVideoStream(video, stream, data.socket);
  };

  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});

socket.on("sala_llena", () => {
  $("#game").html("Sala llena ingresa otra sala");
});

function addVideoStream(video, stream, socketId) {
  console.log("video");
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  video.id = socketId;
  videoGrid.append(video);
}
