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

let selectedCharacter = 'defaultCharacter'; // 選択されたキャラクターを保持

// キャラクター選択画面の実装
function createCharacterSelection() {
    const characters = ['defaultCharacter', 'fastCharacter', 'strongCharacter'];
    const selectionDiv = document.createElement('div');

    characters.forEach(character => {
        const button = document.createElement('button');
        button.innerText = character;
        button.addEventListener('click', () => {
            selectedCharacter = character;
            startGame();
        });
        selectionDiv.appendChild(button);
    });

    document.body.appendChild(selectionDiv);
}

// プレイヤーがキャラクターを選択した後にゲームを開始
function startGame() {
    document.body.innerHTML = ''; // キャラクター選択画面を削除
    init(); // ゲームの初期化を呼び出し

    socket.emit('newPlayer', { character: selectedCharacter });
}

// 他プレイヤーのキャラクターを表示する
socket.on('newPlayer', (data) => {
    const geometry = new THREE.BoxGeometry();
    let material;

    // キャラクターに応じた外観を設定
    if (data.character === 'fastCharacter') {
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    } else if (data.character === 'strongCharacter') {
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    } else {
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    }

    const newPlayer = new THREE.Mesh(geometry, material);
    newPlayer.position.set(data.position.x, data.position.y, data.position.z);
    scene.add(newPlayer);
    players[data.id] = newPlayer;
});

createCharacterSelection(); // ゲーム開始時にキャラクター選択画面を表示

function createMap() {
    const mapSize = 100;
    const obstacles = 10; // ランダムに生成される障害物の数

    for (let i = 0; i < obstacles; i++) {
        const obstacleGeometry = new THREE.BoxGeometry();
        const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);

        obstacle.position.x = Math.random() * mapSize - mapSize / 2;
        obstacle.position.z = Math.random() * mapSize - mapSize / 2;
        scene.add(obstacle);
    }
}

function updateAI() {
    // AIがトラップをランダムに設置
    if (Math.random() < 0.01) {
        const trap = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        trap.position.set(ai.position.x + Math.random() * 5, 0, ai.position.z + Math.random() * 5);
        scene.add(trap);
    }

    // AIがプレイヤーを追跡
    const distance = player.position.distanceTo(ai.position);
    if (distance < 10) {
        const direction = player.position.clone().sub(ai.position).normalize();
        ai.position.add(direction.multiplyScalar(0.05));
    }

    // パトロールロジック
    if (Math.random() < 0.02) {
        ai.position.x += (Math.random() - 0.5) * 0.1;
        ai.position.z += (Math.random() - 0.5) * 0.1;
    }
}

const hammertime = new Hammer(document.body);
hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

hammertime.on('swipeup', () => {
    player.position.y += 0.1;
    socket.emit('move', { position: player.position });
});

hammertime.on('swipedown', () => {
    player.position.y -= 0.1;
    socket.emit('move', { position: player.position });
});

hammertime.on('swipeleft', () => {
    player.position.x -= 0.1;
    socket.emit('move', { position: player.position });
});

hammertime.on('swiperight', () => {
    player.position.x += 0.1;
    socket.emit('move', { position: player.position });
});
