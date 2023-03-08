import { io } from 'https://cdn.socket.io/4.4.1/socket.io.esm.min.js';


const selectRoom = document.getElementById('select-room');
const chatRoom = document.getElementById('chat-room');
const roomInput = document.getElementById('room');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

let room;
let localStream;
let remoteStream;
let rtcPeerConnection;
const rtcConfig = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],

        }, {
            urls: "turn:turn.octopus-latam.com:3478",
            username: "octopus",
            credential: "octopus",
        }
    ],
};
let isCreator;

const socket = io('http://localhost:3000');

selectRoom.addEventListener('submit', e => {
    e.preventDefault();

    room = roomInput.value;
    socket.emit('start', room);
    selectRoom.style.display = 'none';
    chatRoom.style.display = 'grid';
});

// you are the creator of the room
socket.on('created', async room => {
    console.log(`Room: ${room} created`);
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    localVideo.srcObject = localStream;
    isCreator = true;
});

// you are joining already created room
socket.on('joined', async room => {
    console.log(`Joined to Room: ${room}`);
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    localVideo.srcObject = localStream;
    socket.emit('ready', room);
});

// recieved by the room creator
socket.on('ready', async () => {
    console.log('ready');
    if (isCreator) {
        rtcPeerConnection = new RTCPeerConnection(rtcConfig);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onTrack;
        localStream.getTracks().forEach(track => {
            rtcPeerConnection.addTrack(track, localStream);
        });
        const sessionDescription = await rtcPeerConnection.createOffer(); // { type: 'offer', sdp: 'v=0\r\no=- 848535473343...'}

        await rtcPeerConnection.setLocalDescription(sessionDescription); // this will also start generating ice candidates
        socket.emit('offer', {
            sdp: sessionDescription,
            room: room,
        });
    }
});

// recieved by the room joiner
socket.on('offer', async remoteSessionDescription => {
    console.log('offer', remoteSessionDescription);
    if (!isCreator) {
        rtcPeerConnection = new RTCPeerConnection(rtcConfig);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onTrack;
        localStream.getTracks().forEach(track => {
            rtcPeerConnection.addTrack(track, localStream);
        });
        await rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(remoteSessionDescription)
        );
        const sessionDescription = await rtcPeerConnection.createAnswer();
        await rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('answer', {
            sdp: sessionDescription,
            room: room,
        });
    }
});

// recieved by the room joiner and creator
socket.on('candidate', candidate => {
    console.log('candidate', candidate);
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// recieved by the room creator
socket.on('answer', async remoteSessionDescription => {
    console.log('answer', remoteSessionDescription);
    rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(remoteSessionDescription)
    );
});

socket.on('full', room => {
    alert(`Room: ${room} is full`);
    selectRoom.style.display = 'block';
    chatRoom.style.display = 'none';
});

function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            candidate: event.candidate,
            room: room,
        });
    }
}

function onTrack(event) {
    console.log('ontrack');
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}