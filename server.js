const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = {};

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // 新しいプレイヤーが接続
    players[socket.id] = {
        position: { x: 0, y: 0, z: 0 }
    };

    // 他のプレイヤーに新規プレイヤー情報を送信
    socket.broadcast.emit('newPlayer', { id: socket.id, position: players[socket.id].position });

    // プレイヤーの移動を受信して他のプレイヤーに通知
    socket.on('move', (data) => {
        players[socket.id].position = data.position;
        socket.broadcast.emit('move', { id: socket.id, position: data.position });
    });

    // プレイヤーが接続解除したとき
    socket.on('disconnect', () => {
        console.log('A user disconnected: ' + socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });

    // チャットメッセージを送信
    socket.on('chat message', (msg) => {
        io.emit('chat message', { id: socket.id, msg });
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// プレイヤーごとのキャラクター情報を追加
players[socket.id] = {
    position: { x: 0, y: 0, z: 0 },
    character: data.character // プレイヤーが選んだキャラクターを保存
};

// 新しいプレイヤーが接続された際に、キャラクター情報も送信
socket.broadcast.emit('newPlayer', {
    id: socket.id,
    position: players[socket.id].position,
    character: players[socket.id].character
});
