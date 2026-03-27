let ws;
let currentRoomId = null;

function connect() {
    ws = new WebSocket("wss://one234-0j7v.onrender.com");

    ws.onopen = () => {
        console.log("WS connected");
        loadRooms();
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === "rooms") {
            renderRooms(data.rooms);
        }

        if (data.type === "roomCreated") {
            currentRoomId = data.room.id;

            const link = window.location.origin + "?room=" + data.room.id;
            alert("Скопируй ссылку:\n" + link);
        }

        if (data.type === "startGame") {
            startGame(data.game);
        }

        if (data.type === "gameOver") {
            if (data.reason === "opponent_left") {
                document.getElementById("status").innerText = "🎉 Соперник вышел. Ты победил!";
            }
        }

        if (data.type === "update") {
            updateGame(data.game, data.result);
        }
    };
}

function loadRooms() {
    setInterval(() => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: "getRooms" }));
        }
    }, 1000);
}

function createRoom() {
    if (ws.readyState !== 1) return alert("Нет соединения");

    ws.send(JSON.stringify({
        type: "createRoom",
        name: window.playerName
    }));
}

function joinRoom(id) {
    if (ws.readyState !== 1) return;

    currentRoomId = id;

    ws.send(JSON.stringify({
        type: "joinRoom",
        roomId: id,
        name: window.playerName
    }));
}

function renderRooms(rooms) {
    const div = document.getElementById("rooms");
    div.innerHTML = "";

    rooms.forEach(r => {
        const btn = document.createElement("button");

        const count = r.players ? r.players.length : 0;

        btn.innerText = `Комната ${r.id.slice(0, 5)} (${count}/2)`;

        btn.onclick = () => joinRoom(r.id);

        div.appendChild(btn);
    });
}

window.onload = () => {
    connect();

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");

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
        alert("Сначала создай комнату");
        return;
    }

    const link = window.location.origin + "?room=" + currentRoomId;

    navigator.clipboard.writeText(link);
    alert("Ссылка скопирована!");
}
