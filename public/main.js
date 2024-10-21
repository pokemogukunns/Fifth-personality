const socket = io();
let playerId;
let players = {};
let scene, camera, renderer, player, ai;

function init() {
    // シーン、カメラ、レンダラーのセットアップ
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // プレイヤーオブジェクト
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(geometry, material);
    scene.add(player);

    // AIオブジェクト
    ai = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    ai.position.x = 5;
    scene.add(ai);

    camera.position.z = 5;

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // AIがプレイヤーを追いかける
    const distance = player.position.distanceTo(ai.position);
    if (distance < 10) {
        const direction = player.position.clone().sub(ai.position).normalize();
        ai.position.add(direction.multiplyScalar(0.05));
    }

    renderer.render(scene, camera);
}

// プレイヤーの移動
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':
            player.position.y += 0.1;
            break;
        case 'ArrowDown':
            player.position.y -= 0.1;
            break;
        case 'ArrowLeft':
            player.position.x -= 0.1;
            break;
        case 'ArrowRight':
            player.position.x += 0.1;
            break;
    }

    socket.emit('move', { position: player.position });
});

// 新しいプレイヤーの接続
socket.on('newPlayer', (data) => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const newPlayer = new THREE.Mesh(geometry, material);
    newPlayer.position.set(data.position.x, data.position.y, data.position.z);
    scene.add(newPlayer);
    players[data.id] = newPlayer;
});

// 他プレイヤーの移動
socket.on('move', (data) => {
    if (players[data.id]) {
        players[data.id].position.set(data.position.x, data.position.y, data.position.z);
    }
});

// プレイヤーが接続解除したとき
socket.on('playerDisconnected', (id) => {
    scene.remove(players[id]);
    delete players[id];
});

// チャット機能
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value;
    socket.emit('chat message', message);
    chatInput.value = '';
});

socket.on('chat message', (data) => {
    const msg = document.createElement('div');
    msg.textContent = data.id + ': ' + data.msg;
    chatBox.appendChild(msg);
});

init();
