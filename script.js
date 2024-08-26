//Variables
let cloudLink;
let token;
let currentChannel;
let server = "wss://server.meower.org";
let api = "https://api.meower.org/"

//Functions
function onMessage(event){
  const packet = JSON.parse(event.data);
  console.log(packet);
  if (packet.cmd=="direct" && packet.val.mode=='auth'){
    token = packet.val.payload.token;
    console.log(token);
  }
}

function connectToWebSocket(){
  cloudLink = new WebSocket(server);
  cloudLink.onmessage = onMessage;
  cloudLink.onopen = () => console.log("WebSocket connection opened.");
  cloudLink.onerror = (error) => console.error("WebSocket error:", error);
  return new Promise((resolve, reject) => {
    cloudLink.addEventListener("open", () => { resolve()
    })
  })
}

function login(username, password){
  return fetch(api+"auth/login", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body:JSON.stringify({
      username: username,
      password: password
    })
  }).then((response) => {
    if (!response.ok)  {
      console.error("Problem getting messages:", response.status);
    }
    return response.json();
  })
}

async function cloudLinkLogin(username, password){
  const tempToken = (await login(username, password))
  if(tempToken.error){
    const loginPageError = document.getElementById("login-box-error")
    loginPageError.style.display = "block";
    loginPageError.innerHTML = "Error logging in: " + tempToken.type;
    console.warn(tempToken.type);
    return false;
  }
  console.log("ha");
  token = tempToken.token;
  const authPacket = {
    cmd: "direct",
    val: {
      cmd: "authpswd",
      val: {username: username, pswd: token}
    }
  };
  if(!(cloudLink && cloudLink.readyState !== WebSocket.OPEN)){
    await connectToWebSocket();
  }
  cloudLink.send(JSON.stringify(authPacket));
  return new Promise((resolve, reject) => {
    cloudLink.addEventListener("message", (event) => {
      if (JSON.parse(event.data).val == "I:100 | OK") {resolve()}
    })
  })
}

async function doLogin(){
  console.log("meow");
  let username = document.getElementById("username-form-login-page").value;
  let password = document.getElementById("password-form-login-page").value;
  if ((await cloudLinkLogin(username, password)) === false){
    console.log("whar the");
    return    
  }
  document.body.style.backdropFilter = "none";
  document.getElementById("login-page").style.display = "none";
  document.getElementById("nyaer").style.display = "block";
  currentChannel = "home";
}

function sendMessage(message, channel){
  console.log(message, channel, token);
  fetch(api+channel, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: token
    },
    body: JSON.stringify({
      content: message
    })
  }).then(async response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Message sent successfully:', data);
  })
  .catch(error => {
    console.error('There was a problem sending the message:', error);
    console.log(error);
  });
}

//Events
document.addEventListener("DOMContentLoaded", function() {
  
  document.getElementById("login-button").addEventListener("click", function(event){
    event.preventDefault();
    doLogin();
  });

  document.getElementById("submit-button").addEventListener("click", function(event){
    event.preventDefault();
    let message = document.getElementById("main-input")
    sendMessage(message.value, currentChannel);
    message.value = "";
  })
});
