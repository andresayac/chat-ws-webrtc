'use strict';

//buttons
let callBtn = $('#callBtn');
let callBox = $('#callBox');
let answerBtn = $('#answerBtn');
let declineBtn = $('#declineBtn');
let alertBox = $('#alertBox');

let rtcPeerConnection;
let sendTo = callBtn.data('user')
let localStream;
let remoteStream;

let isCreator;

//video elements
const localVideo = document.querySelector("#localVideo");
const remoteVideo = document.querySelector("#remoteVideo");

//media Info

const rtcConfig = {
    iceServers: [
        {
            urls: 'stun:stun1.l.google.com:19302',
        },
        {
            urls: "turn:turn.octopus-latam.com:3478",
            username: "octopus",
            credential: "octopus",
        }
    ],
};

$('#callBtn').on('click', async () => {
    isCreator = true;
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    localVideo.srcObject = localStream;
    socketEmit('call-request', null, sendTo);
    $('#modal').css('display', 'block');
});


async function getUserMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    localVideo.srcObject = localStream;
    $('#modal').css('display', 'block');
}


function socketEmit(type, data, sendTo) {
    chatWebSocket.send(JSON.stringify({
        sendTo: sendTo,
        type: type,
        data: data,
        ts: Date.now() / 1000
    }));
}

chatWebSocket.onopen = openChatWebSocket;
chatWebSocket.onmessage = messageChatWebSocket;
chatWebSocket.onerror = errorChatWebSocket;
chatWebSocket.onclose = closeChatWebSocket;


async function openChatWebSocket(e) {
    console.log('Chat WebSocket connected: ');
}

async function messageChatWebSocket(e) {
    console.log("Message:")

    let message = JSON.parse(e.data);

    switch (message.type) {
        case 'offer':
            if (!isCreator) {

                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });
                localVideo.srcObject = localStream;

                localStream.getTracks().forEach(track => {
                    rtcPeerConnection.addTrack(track, localStream);
                });
                await rtcPeerConnection.setRemoteDescription(
                    new RTCSessionDescription(message.data)
                );
                const sessionDescription = await rtcPeerConnection.createAnswer();
                await rtcPeerConnection.setLocalDescription(sessionDescription);
                socketEmit('answer', sessionDescription, sendTo)
            }
            break;
        case 'candidate':
            console.log('candidate');
            if (rtcPeerConnection.localDescription) {
                await rtcPeerConnection.addIceCandidate(new RTCIceCandidate(message.data));
            }
            break;
        case 'answer':
            console.log('answer');
            rtcPeerConnection.setRemoteDescription(
                new RTCSessionDescription(message.data)
            );
        case 'call-hangup':
            console.log('hangup');
            // rtcPeerConnection.close();
            // rtcPeerConnection = null
            // displayAlert(message.username, message.profileImage, 'Disconnected the call');
            //setTimeout('window.location.reload(true)', 2000);
            break;
        case 'oncall':
            console.log('oncall');
            displayAlert(message.username, message.profileImage, 'is on another call');
            // setTimeout('window.location.reload(true)', 2000);
            break;
        case 'ready':
            if (isCreator) {
                rtcPeerConnection = new RTCPeerConnection(rtcConfig);
                rtcPeerConnection.onicecandidate = onIceCandidate;
                rtcPeerConnection.ontrack = onTrack;
                localStream.getTracks().forEach(track => {
                    rtcPeerConnection.addTrack(track, localStream);
                });
                const sessionDescription = await rtcPeerConnection.createOffer();
                await rtcPeerConnection.setLocalDescription(sessionDescription);

                socketEmit('offer', sessionDescription, sendTo);
            }
            break;
        case 'call-request':
            console.log('call-request');
            displayCall(message.username, message.profileImage);
            if (window.location.href.indexOf(message.username) > -1) {
                answerBtn.on('click', () => {
                    getUserMedia();
                    rtcPeerConnection = new RTCPeerConnection(rtcConfig);
                    rtcPeerConnection.onicecandidate = onIceCandidate;
                    rtcPeerConnection.ontrack = onTrack;

                    callBox.addClass('hidden');
                    $('.wrapper').removeClass('glass');
                    socketEmit('ready', null, sendTo);
                });

            } else {
                answerBtn.on('click', () => {
                    callBox.addClass('hidden');
                });
            }

            declineBtn.on('click', () => {
                socketEmit('call-request-rejected', null, sendTo);
                hideCall();
            })
            break;

        case 'call-request-rejected':
            displayAlert(message.username, message.profileImage, 'is busy');
            hangup()
            // setTimeout('window.location.reload(true)', 2000);
            break;

        case 'call-request-oncall':
            displayAlert(message.username, message.profileImage, 'is on another call');
            hangup()
            // setTimeout('window.location.reload(true)', 2000);
            break;
        case 'text':
            add_messages({ me: false, content: message.data, ts: message.ts, avatar_url: message.profileImage });
            changeChatMessage(message.by, message.data, message.ts);
            if ($('#chat-user-' + by).length === 0) addChatMessage(message.ts, message.data);
            break;

    }

}

function errorChatWebSocket(e) {
    console.log("Error:")
}

function closeChatWebSocket(e) {
    console.log("Close:")
}

function onIceCandidate(event) {
    console.log(event)
    if (event.candidate) {
        console.log('sending ice candidate');
        socketEmit('candidate', event.candidate, sendTo);
    }
}

function onTrack(event) {
    console.log('ontrack');
    console.log(event)
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}


function hangup() {
    localStream.getTracks().forEach(track => track.stop());
}


function displayCall(username, profileImage) {
    callBox.find('#username').text(username);
    callBox.find('#profileImage').attr('src', profileImage);

    callBox.removeClass('hidden');
    $('.wrapper').addClass('glass');
}

function hideCall() {
    callBox.addClass('hidden');
    $('.wrapper').removeClass('glass');
    $('#modal').css('display', 'none');

}

function displayAlert(username, profileImage, message) {
    alertBox.find('#alertName').text(username);
    alertBox.find('#alertImage').attr('src', profileImage);
    alertBox.find('#alertMessage').text(message);

    alertBox.removeClass('hidden');
    $('.wrapper').addClass('glass');
    $('#modal').css('display', 'none');

    // Agrega un evento de click al botón de cerrar
    $('#closeBtn').on('click', () => {
        hideAlert();
    });

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        hideAlert();
    }, 5000);
}

function hideAlert() {
    alertBox.addClass('hidden');
    $('.wrapper').removeClass('glass');
    $('#modal').css('display', 'none');
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
        if (rtcPeerConnection.readyState === 1) {
            socketEmit('client-is-ready', null, sendTo);
            clearInterval(waitForWs);
        }
    }, 500);
    sessionStorage.removeItem('redirect');
    sessionStorage.removeItem('sendTo');
}

var simplebar;

if (document.querySelector('.messages-content')) {

    simplebar = new SimpleBar(document.querySelector('.messages-content'), {
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
        if (message !== '' && message.trim().length > 0) {
            socketEmit('text', message, sendTo);
            $('#message').val('');
            let message_ts = Date.now() / 1000;
            add_messages({ me: true, content: message, ts: message_ts, avatar_url: 'assets/images/defaultImage.png' });
            changeChatMessage(sendTo, message, message_ts);

            if ($('#chat-user-' + sendTo).length === 0) addChatMessage(message_ts, message);
        }
    }

    $('#message').on('keyup', function (e) {
        if (e.keyCode == 13 && e.shiftKey) {
            var text = $(this).val();
            $(this).val(text + "\n");
            e.preventDefault();
        } else if (e.keyCode == 13) {
            sendMessage();
            e.preventDefault();
        }

    });

}


function changeChatMessage(user, message, time) {
    $('#chat-user-' + user).text(message.substring(0, 15) + '...');
    $('#chat-user-ts-' + user).text(epochTimeMessage(time));

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
    messageText.classList.add(class_bg, 'rounded-lg', 'px-3', 'py-2', 'max-w-xs', 'break-words', class_text_color, class_align);
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
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: 'numeric', hour12: true });
}

function addChatMessage(ts, content) {
    // Crear el elemento li y agregar las clases
    const listItem = document.createElement("li");
    listItem.classList.add("select-none", "transition", "hover:bg-green-50", "p-2", "cursor-pointer", "select-none");

    // Crear el elemento a y agregar el enlace y las clases
    const linkItem = document.createElement("a");
    linkItem.href = user_info.usr_username;
    linkItem.classList.add("block", "w-full");

    // Crear el elemento div y agregar las clases
    const userBox = document.createElement("div");
    userBox.classList.add("user-box", "flex", "items-center", "flex-wrap");

    // Crear el elemento div para la imagen y agregar las clases
    const userImg = document.createElement("div");
    userImg.classList.add("flex-shrink-0", "user-img", "w-12", "h-12", "rounded-full", "border", "overflow-hidden");

    // Crear el elemento img y agregar la imagen
    const img = document.createElement("img");
    img.classList.add("w-full", "h-full");
    img.src = user_info.usr_profile_image;

    // Agregar la imagen al elemento de la imagen
    userImg.appendChild(img);

    // Crear el elemento div para el nombre y agregar las clases
    const userName = document.createElement("div");
    userName.classList.add("user-name", "ml-2");

    // Crear el elemento div para el nombre del usuario
    const userNameTitle = document.createElement("div");
    userNameTitle.innerHTML = `<span class="flex font-medium">${user_info.usr_name}</span>`;

    // Crear el elemento div para el nombre del usuario
    const userChat = document.createElement("div");
    userChat.innerHTML = `<span class="flex font-medium text-gray-500" id="chat-user-${user_info.usr_id}">${content.substring(0, 15) + '...'}</span>`;

    // Agregar el nombre del usuario al elemento de nombre
    userName.appendChild(userNameTitle);
    userName.appendChild(userChat);

    const chatTs = document.createElement("div");
    chatTs.classList.add("ml-auto");

    chatTs.innerHTML = `<span class="text-xs text-gray-500 ml-10 mr-10 text-right" id="chat-user-ts-${user_info.usr_id}">${epochTimeMessage(ts)}</span>`;

    // Agregar la imagen y el nombre del usuario al elemento de la caja de usuario
    userBox.appendChild(userImg);
    userBox.appendChild(userName);
    userBox.appendChild(chatTs);

    // Agregar la caja de usuario al enlace
    linkItem.appendChild(userBox);

    // Agregar el enlace a la lista de usuarios
    listItem.appendChild(linkItem);

    $('#chats-content').prepend(listItem);
}

function init() {
    messages.forEach(message => {
        add_messages(message)
    });
}


$('#hangupBtn').click(function () {
    $('#modal').css('display', 'none');
});



const toggleBtn = $('#toggleBtn');
const nav = $('#left-side');
const leftSide = $('#right-side');
const newChatside = $('#new-chat-side');
const toggleBtnNewChat = $('#toggleBtnNewChat');
const toggleBtnReturnChat = $('#toggleBtnReturnChat');

toggleBtn.on('click', function () {
    nav.toggleClass('hidden');
    leftSide.toggleClass('hidden');
});

toggleBtnNewChat.on('click', function () {
    nav.removeClass('md:block');
    nav.addClass('hidden');
    newChatside.toggleClass('hidden');

});

toggleBtnReturnChat.on('click', function () {
    nav.addClass('md:block');
    nav.removeClass('hidden');
    newChatside.toggleClass('hidden');

});

