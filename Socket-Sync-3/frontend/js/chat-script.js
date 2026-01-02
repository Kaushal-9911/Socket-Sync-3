// ================= BACKEND BASE URL =================
//const BASE_URL = "http://127.0.0.1:5000";
// later change to Render URL:
 const BASE_URL = "https://socket-sync-3.onrender.com";
const socket = io(BASE_URL);


// ================= GLOBALS =================
let currentUser = null;
let currentChat = null;


// ================= AUTH CHECK =================
window.onload = function(){
    const userData = localStorage.getItem("currentUser");
    if(!userData){
        window.location.href = "login.html";
        return;
    }

    currentUser = JSON.parse(userData);
    me.innerText = currentUser.name;
    loadUsers();

    document.querySelector('.chat-header').classList.add('hidden');
    document.querySelector('.messages').classList.add('hidden');
    document.querySelector('.input-area').classList.add('hidden');
};


// ================= LOGOUT =================
function logout(){
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}


// ================= LOAD USERS =================
async function loadUsers(){
    const r = await fetch(`${BASE_URL}/users`);
    const users = await r.json();

    chatList.innerHTML = "";
    users.forEach(u=>{
        if(u.user_id === currentUser.user_id) return;

        chatList.innerHTML += `
        <div class="chat-item"
             onclick="openChat('${u.user_id}','${u.name}','${u.avatar}')">
            <img src="${u.avatar}">
            <div class="chat-name">${u.name}</div>
        </div>`;
    });
}


// ================= OPEN CHAT =================
async function openChat(id, name, avatar){
    const header = document.querySelector('.chat-header');
    const messagesBox = document.querySelector('.messages');
    const input = document.querySelector('.input-area');

    document.getElementById('emptyChat').classList.add('hidden');

    header.style.animation = 'none';
    input.style.animation = 'none';
    messagesBox.style.animation = 'none';
    header.offsetHeight;

    header.classList.remove('hidden');
    messagesBox.classList.remove('hidden');
    input.classList.remove('hidden');

    header.style.animation = 'slideDown 0.35s ease-out';
    input.style.animation = 'slideUp 0.35s ease-out';
    messagesBox.style.animation = 'fadeInSoft 0.25s ease-in';

    currentChat = id;
    chatHeader.innerText = name;
    document.getElementById("chatAvatar").src = avatar;

    messages.innerHTML = "";
    const room = [currentUser.user_id, currentChat].sort().join("-");
    socket.emit("join", { room });

    loadMessages();
}


// ================= LOAD MESSAGES =================
async function loadMessages(){
    const r = await fetch(
        `${BASE_URL}/messages?u1=${currentUser.user_id}&u2=${currentChat}`
    );
    const m = await r.json();
    m.forEach(showMsg);
}


// ================= TIME FORMAT =================
function formatTime12(time24){
    const [h, m] = time24.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
}


// ================= SHOW MESSAGE =================
function showMsg(m){
    messages.innerHTML += `
    <div class="msg ${m.from === currentUser.user_id ? 'sent' : 'recv'}"
         style="font-size:X-large">
        ${m.text}
        <div style="text-align:right;font-size:medium">
            <small>${formatTime12(m.time)}</small>
        </div>
    </div>`;

    messages.scrollTop = messages.scrollHeight;
}


// ================= SEND MESSAGE =================
function send(){
    if(!msg.value || !currentChat) return;

    socket.emit("send_message",{
        from: currentUser.user_id,
        to: currentChat,
        text: msg.value
    });

    msg.value = "";
}


// ================= SIDEBAR TOGGLE =================
function toggleSidebar(){
    const sidebar = document.getElementById('sidebar');
    const chat = document.getElementById('chatArea');

    const isHidden = sidebar.classList.contains('hide');

    if(isHidden){
        sidebar.classList.remove('hide');
        chat.classList.remove('col-12');
        chat.classList.add('col-8','col-lg-9');
        replayChatAnimations('in');
    } else {
        replayChatAnimations('out');
        setTimeout(()=>{
            sidebar.classList.add('hide');
            chat.classList.remove('col-8','col-lg-9');
            chat.classList.add('col-12');
        },200);
    }
}


// ================= CHAT ANIMATIONS =================
function replayChatAnimations(direction){
    const header = document.querySelector('.chat-header');
    const messagesBox = document.querySelector('.messages');
    const input = document.querySelector('.input-area');

    if(header.classList.contains('hidden')) return;

    header.className = header.className.replace(/animate-\S+/g,'');
    messagesBox.className = messagesBox.className.replace(/animate-\S+/g,'');
    input.className = input.className.replace(/animate-\S+/g,'');

    void header.offsetWidth;

    if(direction === 'in'){
        header.classList.add('animate-header');
        messagesBox.classList.add('animate-messages');
        input.classList.add('animate-input');
    }

    if(direction === 'out'){
        header.classList.add('animate-header-out');
        messagesBox.classList.add('animate-messages-out');
        input.classList.add('animate-input-out');
    }
}


// ================= ENTER KEY SEND =================
msg.addEventListener('keypress', function(e){
    if(e.key === 'Enter') send();
});


// ================= RECEIVE MESSAGE =================
socket.on("receive_message", m=>{
    if(
        (m.from === currentUser.user_id && m.to === currentChat) ||
        (m.from === currentChat && m.to === currentUser.user_id)
    ){
        showMsg(m);
    }
});

