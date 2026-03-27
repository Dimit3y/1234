let ws;
let currentRoomId = null;

function connect() {
    ws = new WebSocket('wss://one234-0j7v.onrender.com');

    ws.onopen = () => {
        console.log('WS подключен');
        document.getElementById('connectionStatus').innerText = 'Онлайн';
        loadRooms();
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === 'rooms') {
            renderRooms(data.rooms);
        }

        if (data.type === 'roomCreated') {
            currentRoomId = data.room.id;
        }

        if (data.type === 'startGame') {
            startGame(data.game, data.playerIndex);
        }

        if (data.type === 'gameOver') {
            if (data.reason === 'opponent_left') {
                window.notifyGameOver?.('Соперник вышел. Победа!');
            }

            if (data.reason === 'surrender') {
                if (data.loser === data.playerIndex) {
                    window.notifyGameOver?.('Ты сдался. Поражение.');
                } else {
                    window.notifyGameOver?.('Соперник сдался. Победа!');
                }
            }
        }

        if (data.type === 'update') {
            updateGame(data.game, data.result);
        }
    };
}

function loadRooms() {
    setInterval(() => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'getRooms' }));
        }
    }, 1000);
}

function createRoom() {
    if (ws.readyState !== 1) return alert('Нет соединения');

    const size = Number(document.getElementById('boardSize').value);
    const spawnMode = document.getElementById('spawnMode').value;

    ws.send(JSON.stringify({
        type: 'createRoom',
        settings: { size, spawnMode }
    }));
}

function joinRoom(id) {
    if (ws.readyState !== 1) return;

    currentRoomId = id;

    ws.send(JSON.stringify({
        type: 'joinRoom',
        roomId: id
    }));
}

function renderRooms(rooms) {
    const div = document.getElementById('rooms');
    div.innerHTML = '';

    rooms.forEach((r) => {
        const btn = document.createElement('button');
        btn.className = 'room-card';

        const count = r.playersCount || 0;
        const size = r.settings?.size || 7;
        const spawn = r.settings?.spawnMode === 'random' ? 'случайный' : 'по углам';
        const roomName = r.name || `Комната ${r.id.slice(0, 5)}`;

        btn.innerText = `${roomName} (${count}/2) • ${size}x${size}, ${spawn}`;
        btn.onclick = () => joinRoom(r.id);

        div.appendChild(btn);
    });
}

window.onload = () => {
    connect();

    const params = new URLSearchParams(window.location.search);
    const roomIdFromSite = params.get('room');
    const roomIdFromBot = params.get('startapp') || params.get('tgWebAppStartParam') || params.get('start');
    const roomIdRaw = roomIdFromSite || roomIdFromBot;
    const roomId = roomIdRaw && roomIdRaw.startsWith('room_')
        ? roomIdRaw.slice(5)
        : roomIdRaw;

    if (roomId) {
        const interval = setInterval(() => {
            if (ws && ws.readyState === 1) {
                joinRoom(roomId);
                clearInterval(interval);
            }
        }, 200);
    }
};

function copyLink() {
    if (!currentRoomId) {
        alert('Сначала создай комнату');
        return;
    }

    const link = `https://t.me/Gametg000bot?startapp=room_${currentRoomId}`;
    navigator.clipboard.writeText(link);
    document.getElementById('status').innerText = 'Ссылка скопирована';
}
