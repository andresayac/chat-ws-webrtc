'use strict';

//buttons
let callBtn = $('#callBtn');
let callBox = $('#callBox');
let answerBtn = $('#answerBtn');
let declineBtn = $('#declineBtn');
let alertBox = $('#alertBox');


let pc;
let sendTo = callBtn.data('user')
let localStream;

//video elements
const localVideo = document.querySelector("#localVideo");
const remoteVideo = document.querySelector("#remoteVideo");

//media Info
const mediaConst = {
    video: true,
    audio: true
};

// //Info about stun Servers
// const config = {
//     'iceServers': [
//         // { 'urls': 'stun:stun.l.google.com:19302' },
//         { 'urls': 'stun:stun.octopus-latam.com:3478' },
//         {
//             "urls": "turn:turn.octopus-latam.com:3478",
//             "username": "octopus",
//             "credential": "octopus",
//         }
//     ],
// }

// // ,
// //      


//Info about stun Servers

const config = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };
const preferences = { optional: [{ googCpuOveruseDetection: true }, { RtpDataChannels: false }] }


//What to receive from other client
const options = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1
}

function getConn() {
    if (!pc) {
        pc = new RTCPeerConnection(config, preferences);
    }
}

//ask for media input
async function getCam() {
    let mediaStream;
    try {
        if (!pc) {
            await getConn();
        }
        mediaStream = await navigator.mediaDevices.getUserMedia(mediaConst);

        localStream = mediaStream;

        if (mediaStream.getVideoTracks().length > 0) {
            localVideo.srcObject = mediaStream;
        }

        pc.addStream(localStream);

    } catch (error) {
        console.log(error);
    }
}

async function createOffer(sendTo) {
    await sendIceCandidate(sendTo);
    await pc.createOffer(options);
    await pc.setLocalDescription(pc.localDescription);
    send('client-offer', pc.localDescription, sendTo);
}

async function createAnswer(sendTo, data) {
    if (!pc) {
        await getConn();
    }
    if (!localStream) {
        await getCam();
    }

    await sendIceCandidate(sendTo);
    await pc.setRemoteDescription(data);
    await pc.createAnswer();
    await pc.setLocalDescription(pc.localDescription);
    send('client-answer', pc.localDescription, sendTo);
}

function sendIceCandidate(sendTo) {
    pc.onicecandidate = e => {
        if (e.candidate !== null) {
            //send Ice Candidate to other client
            send('client-candidate', e.candidate, sendTo);
        }
    }

    pc.onaddstream = e => {
        $('#modal').css('display', 'block');
        $('#profile').addClass('hidden');
        remoteVideo.srcObject = e.streams;
    }
}

function hangup() {
    send('client-hangup', null, sendTo);
    pc.close();
    pc = null
}

$('#callBtn').on('click', () => {
    getCam();
    send('is-client-ready', null, sendTo);
    $('#modal').css('display', 'block');
});


$('#hangupBtn').on('click', () => {
    $('#modal').css('display', 'none');
    hangup();
    location.reload(true);
});

conn.onopen = e => {
    console.log('connected to websocket');
}

conn.onmessage = async e => {
    let message = JSON.parse(e.data);
    let by = message.by;
    let to = message.sendTo;
    let data = message.data;
    let type = message.type;
    let profileImage = message.profileImage;
    let username = message.username;
    let ts = message.ts;
    $('#username').text(username);
    $('#profileImage').attr('src', profileImage);

    switch (type) {
        case 'client-candidate':
            if (pc.localDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data));
            }
            break;
        case 'is-client-ready':
            if (!pc) {
                await getConn();
            }

            if (pc.iceConnectionState === "connected") {
                send('client-already-oncall', null, by);
            } else {
                //display popup
                displayCall();
                if (window.location.href.indexOf(username) > -1) {
                    answerBtn.on('click', () => {
                        callBox.addClass('hidden');
                        $('.wrapper').removeClass('glass');
                        send('client-is-ready', null, sendTo);

                    });
                } else {
                    answerBtn.on('click', () => {
                        callBox.addClass('hidden');
                        redirectToCall(username, by);
                    });
                }

                declineBtn.on('click', () => {
                    send('client-rejected', null, sendTo);
                    location.reload(true);
                })
            }
            break;
        case 'client-answer':
            if (pc.localDescription) {
                let sessionDescription = new RTCSessionDescription(data);
                await pc.setRemoteDescription(sessionDescription);
                $('#callTimer').timer({ format: '%m:%S' });
            }
            break;
        case 'client-offer':
            let sessionDescription = new RTCSessionDescription(data);
            createAnswer(sendTo, sessionDescription);
            $('#callTimer').timer({ format: '%m:%S' });
            break;
        case 'client-is-ready':
            createOffer(sendTo);
            break;
        case 'client-already-oncall':
            //display popup
            displayAlert(username, profileImage, 'is on another call');
            setTimeout('window.location.reload(true)', 2000);
            break;

        case 'client-rejected':
            displayAlert(username, profileImage, 'is busy');
            setTimeout('window.location.reload(true)', 2000);
            break;

        case 'client-hangup':
            //display popup
            displayAlert(username, profileImage, 'Disconnected the call');
            setTimeout('window.location.reload(true)', 2000);
            break;

        case 'text':
            add_messages({ me: false, content: data, ts: ts, avatar_url: profileImage });
            changeChatMessage(by, data);
            break;
    }
}

function send(type, data, sendTo) {
    conn.send(JSON.stringify({
        sendTo: sendTo,
        type: type,
        data: data,
        ts: Date.now()
    }));
}

function displayCall() {
    callBox.removeClass('hidden');
    $('.wrapper').addClass('glass');
}

function displayAlert(username, profileImage, message) {
    alertBox.find('#alertName').text(username);
    alertBox.find('#alertImage').attr('src', profileImage);
    alertBox.find('#alertMessage').text(message);

    alertBox.removeClass('hidden');
    $('.wrapper').addClass('glass');
    $('#modal').css('display', 'block');
    $('#profile').removeClass('hidden');
}

function redirectToCall(username, sendTo) {
    if (window.location.href.indexOf(username) == -1) {
        sessionStorage.setItem('redirect', true);
        sessionStorage.setItem('sendTo', sendTo);
        window.location.href = '/' + username;
    }
}

if (sessionStorage.getItem('redirect')) {
    sendTo = sessionStorage.getItem('sendTo');
    let waitForWs = setInterval(() => {
        if (conn.readyState === 1) {
            send('client-is-ready', null, sendTo);
            clearInterval(waitForWs);
        }
    }, 500);
    sessionStorage.removeItem('redirect');
    sessionStorage.removeItem('sendTo');
}



const simplebar = new SimpleBar(document.querySelector('.messages-content'), {
    autoHide: true,
    forceVisible: false,
    classNames: {
        resizeWrapper: 'simplebar-resize-wrapper',
        content: 'simplebar-content',
        offset: 'simplebar-offset',
        mask: 'simplebar-mask',
        wrapper: 'simplebar-wrapper',
        placeholder: 'simplebar-placeholder',
        scrollbar: 'simplebar-scrollbar',
        track: 'simplebar-track',
        heightAutoObserverWrapperEl: 'simplebar-height-auto-observer-wrapper',
        heightAutoObserverEl: 'simplebar-height-auto-observer',
        visible: 'simplebar-visible',
        horizontal: 'simplebar-horizontal',
        vertical: 'simplebar-vertical',
        hover: 'simplebar-hover',
        dragging: 'simplebar-dragging'
    },
    scrollbarMinSize: 25,
    scrollbarMaxSize: 0,
    direction: 'ltr',
    timeout: 1000
});

const chatWindow = $('.messages-content');
chatWindow.scrollTop(chatWindow[0].scrollHeight);


// Selecciona el botón de emojis
const emojiButton = $('#emoji-button');
const component_emoji = $('#emoji_mart');
const button_send_message = $('#button_send_message');

// Crea una instancia del selector de emoji
const picker = new EmojiMart.Picker({
    onEmojiSelect: addEmoji
});

function addEmoji(emoji) {
    $('#message').val($('#message').val() + emoji.native);
}

// Muestra el selector de emoji en la pantalla
component_emoji.append(picker);

// Crea una función para mostrar u ocultar el selector de emoji
function toggleEmojiPicker() {
    // Si el contenedor del selector de emoji está oculto, muéstralo
    if (component_emoji.is(':hidden')) {
        component_emoji.show();
    } else {
        // Si el contenedor del selector de emoji está visible, ocúltalo
        component_emoji.hide();
    }
}

// Agrega un controlador de eventos al botón de emojis para mostrar el selector de emoji
emojiButton.on('click', toggleEmojiPicker);

button_send_message.on('click', () => sendMessage());


function sendMessage() {
    let message = $('#message').val();
    if (message !== '') {
        send('text', message, sendTo);
        $('#message').val('');
        add_messages({ me: true, content: message, ts: Date.now(), avatar_url: 'assets/images/defaultImage.png' })
        changeChatMessage(sendTo, message)
    }
}

$('#message').on('keyup', function (e) {
    if (e.key === 'Enter') sendMessage();

});


function changeChatMessage(user, message) {
    $('#chat-user-' + user).text(message.substring(0, 15) + '...');
}


function add_messages(message) {
    const messageContainer = document.querySelector('.messages-content')

    let class_align = message.me ? 'items-end' : 'l';
    let class_margin = message.me ? 'mr-10' : 'ml-10'
    let class_text = message.me ? 'text-right' : 'text-left'
    let class_text_color = message.me ? 'text-white' : 'text-gray-700'
    let class_bg = message.me ? 'bg-green-500' : 'bg-gray-200'


    const messageElement = document.createElement('div');
    messageElement.classList.add('flex', 'flex-col', 'mb-4', class_align);
    const innerElement = document.createElement('div');
    innerElement.classList.add('flex', 'items-center');
    const messageText = document.createElement('p');
    messageText.classList.add(class_bg, 'rounded-lg', 'px-3', 'py-2', 'max-w-md', 'break-words', class_text_color, class_align);
    messageText.innerText = message.content;
    innerElement.appendChild(messageText);

    if (!message.me) {
        const otherUserAvatar = document.createElement('img');
        otherUserAvatar.classList.add('w-8', 'h-8', 'rounded-full', 'mr-2');
        otherUserAvatar.src = message.avatar_url;
        otherUserAvatar.alt = 'Avatar';
        innerElement.insertBefore(otherUserAvatar, messageText);
    } else {
        const currentUserAvatar = document.createElement('img');
        currentUserAvatar.classList.add('w-8', 'h-8', 'rounded-full', 'ml-2');
        currentUserAvatar.src = message.avatar_url;
        currentUserAvatar.alt = 'Current User Avatar';
        innerElement.appendChild(currentUserAvatar);
    }
    messageElement.appendChild(innerElement);
    const timestampText = document.createElement('p');
    timestampText.classList.add('text-xs', 'text-gray-500', 'ml-10', class_margin, class_text);
    timestampText.innerText = epochTimeMessage(message.ts);
    messageElement.appendChild(timestampText);

    // Agregar el nuevo mensaje al contenedor
    messageContainer.appendChild(messageElement);

    // Hacer scroll hacia abajo del contenedor
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function epochTimeMessage(ts) {
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });


}

function init() {
    messages.forEach(message => {
        add_messages(message)
    });
}


$('#hangupBtn').click(function () {
    $('#modal').css('display', 'none');
});


$(document).ready(function () {
    const toggleBtn = $('#toggleBtn');
    const nav = $('#left-side');
    const leftSide = $('#right-side');

    toggleBtn.on('click', function () {
        console.log("Cliked")
        nav.toggleClass('hidden');
        leftSide.toggleClass('hidden');
    });
});