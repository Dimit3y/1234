let ws;
let currentRoomId = null;

function connect() {
  ws = new WebSocket("wss://one234-0j7v.onrender.com");

  ws.onopen = () => {
    console.log("WS connected");
    const status = document.getElementById("connectionStatus");
    if (status) status.innerText = "Online";
    loadRooms();
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "rooms") {
      renderRooms(data.rooms || []);
    }

    if (data.type === "roomCreated") {
      currentRoomId = data.room.id;
    }

    if (data.type === "startGame") {
      startGame(data.game, data.playerIndex);
    }

    if (data.type === "gameOver") {
      const status = document.getElementById("status");
      if (!status) return;

      if (data.reason === "opponent_left") {
        status.innerText = "Opponent left. You win!";
      } else if (data.reason === "surrender") {
        if (data.loser === data.playerIndex) {
          status.innerText = "You surrendered. Defeat.";
        } else {
          status.innerText = "Opponent surrendered. You win!";
        }
      }
    }

    if (data.type === "update") {
      updateGame(data.game, data.result);
    }
  };
}

function loadRooms() {
  setInterval(() => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "getRooms" }));
    }
  }, 1000);
}

function createRoom() {
  if (!ws || ws.readyState !== 1) {
    alert("No connection");
    return;
  }

  const size = Number(document.getElementById("boardSize").value);
  const spawnMode = document.getElementById("spawnMode").value;

  ws.send(
    JSON.stringify({
      type: "createRoom",
      settings: { size, spawnMode },
    })
  );
}

function joinRoom(id) {
  if (!ws || ws.readyState !== 1) return;

  currentRoomId = id;

  ws.send(
    JSON.stringify({
      type: "joinRoom",
      roomId: id,
    })
  );
}

function renderRooms(rooms) {
  const div = document.getElementById("rooms");
  div.innerHTML = "";

  rooms.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "room-card";

    const count = r.playersCount || 0;
    const size = (r.settings && r.settings.size) || 7;
    const spawn =
      r.settings && r.settings.spawnMode === "random" ? "random" : "corners";

    btn.innerText =
      "Room " + r.id.slice(0, 5) + " (" + count + "/2) • " + size + "x" + size + ", " + spawn;

    btn.onclick = () => joinRoom(r.id);
    div.appendChild(btn);
  });
}

window.onload = () => {
  connect();

  const params = new URLSearchParams(window.location.search);
  const roomIdFromSite = params.get("room");
  const roomIdFromBot =
    params.get("startapp") || params.get("tgWebAppStartParam") || params.get("start");
  const roomIdRaw = roomIdFromSite || roomIdFromBot;
  const roomId =
    roomIdRaw && roomIdRaw.startsWith("room_") ? roomIdRaw.slice(5) : roomIdRaw;

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
    alert("Create room first");
    return;
  }

  const link = "https://t.me/Gametg000bot?startapp=room_" + currentRoomId;
  navigator.clipboard.writeText(link);

  const status = document.getElementById("status");
  if (status) status.innerText = "Link copied";
}
