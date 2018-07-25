// Setup basic express server

const TelegramBot = require ('node-telegram-bot-api');

const telegramToken = "531715110:AAGW7DlE9680PQNRowaG9mzVKJsga_8C6zU";

const bot = new TelegramBot(telegramToken, {polling: true});

var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Go to http://localhost:3000');
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket, response) => {
  var addedUser = false;

  bot.on('message', (msg) => {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: msg.text,      
    });
    console.log('seharusnya mengirimkan ke client: ', msg.text);
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {  
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });    
    bot.sendMessage(610864892, data);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      //tes
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
