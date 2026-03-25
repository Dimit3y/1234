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
        btn.innerText = "Комната " + r.id;
        btn.onclick = () => joinRoom(r.id);
        div.appendChild(btn);
    });
}

setInterval(() => {
    ws.send(JSON.stringify({ type: "getRooms" }));
}, 1000);
