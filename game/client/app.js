let ws;

function connect() {
    ws = new WebSocket("wss://your-app.onrender.com");

    ws.onopen = () => {
        console.log("WS connected");
        document.getElementById("connectionStatus").innerText = "Онлайн ✅";
        loadRooms();
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === "rooms") {
            renderRooms(data.rooms);
        }

        if (data.type === "startGame") {
            startGame(data.game);
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

connect();

window.ws = ws;
const ws = new WebSocket("wss://one234-0j7v.onrender.com");

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "rooms") {
        renderRooms(data.rooms);
    }

    if (data.type === "startGame") {
        startGame(data.game);
    }

    if (data.type === "update") {
        updateGame(data.game, data.result);
    }
};

function createRoom() {
    if (ws.readyState !== 1) return alert("Соединение...");
    ws.send(JSON.stringify({ type: "createRoom" }));
}

function joinRoom(id) {
    ws.send(JSON.stringify({ type: "joinRoom", roomId: id }));
}

function renderRooms(rooms) {
    const div = document.getElementById("rooms");
    div.innerHTML = "";

    rooms.forEach(r => {
        const btn = document.createElement("button");
        btn.innerText = "Комната " + r.id.slice(0, 5);
        btn.onclick = () => joinRoom(r.id);
        div.appendChild(btn);
    });
}

setInterval(() => {
    ws.send(JSON.stringify({ type: "getRooms" }));
}, 1000);
