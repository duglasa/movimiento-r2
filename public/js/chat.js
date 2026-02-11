navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then((mediaStream) => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
        localVideo.srcObject = mediaStream;
    }
})
.catch((err) => {
    console.log(err)
})

socket.on("update-user-list", ({users}) => {
    users.forEach(user => {
        const yaExiste = document.querySelector('#' + user)
        if (!yaExiste) {
            $('#conectados').append('<li class="usuario" id="' + user + '">' + user + '</li>');
        }
    });
})

socket.on("remove-user", ({ socketId }) => {
    const elToRemove = document.getElementById(socketId);
    
    if (elToRemove) {
        elToRemove.remove();
    }
});


const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

$('#conectados').on('click', '.usuario', (e) => {
    callUser(e.currentTarget.id)
})

async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    
    socket.emit("call-user", {
        offer,
        to: socketId
    });
}


socket.on("call-made", async data => {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    socket.emit("make-answer", {
        answer,
        to: data.socket
    });
});


socket.on("answer-made", async data => {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    );
    
});


navigator.getUserMedia(
    { video: true, audio: true },
    stream => {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
            localVideo.srcObject = stream;
        }
    
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    },
    error => {
        console.warn(error.message);
    }
);


peerConnection.ontrack = function({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
};