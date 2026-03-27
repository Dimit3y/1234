let gameState = null;
let selectedMove = null;
let myPlayerIndex = null;

function startGame(game, playerIndex) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    gameState = game;
    myPlayerIndex = playerIndex;
    selectedMove = null;

    const gameElement = document.getElementById("game");
    gameElement.classList.remove("player-blue", "player-red");
    gameElement.classList.add(myPlayerIndex === 0 ? "player-blue" : "player-red");

    const myColorInfo = document.getElementById("myColorInfo");
    myColorInfo.innerText = myPlayerIndex === 0
        ? "Ты играешь за 🔵 СИНЕГО"
        : "Ты играешь за 🔴 КРАСНОГО";

    renderPlayers();

    draw();
}

function renderPlayers() {
    const div = document.getElementById("playersInfo");
    const turnText = document.getElementById("status");

    turnText.innerText =
        gameState.current === 0
            ? "Ход: 🔵 Синий"
            : "Ход: 🔴 Красный";

    div.innerHTML = `
        <div class="player ${gameState.current === 0 ? 'active' : ''}">
            🔵 Синий
        </div>
        <div class="player ${gameState.current === 1 ? 'active' : ''}">
            🔴 Красный
        </div>
    `;
}

function updateGame(game, result) {
    gameState = game;
    selectedMove = null;

    renderPlayers();
    draw();

    if (result?.winner !== undefined) {
        const me = myPlayerIndex;
        const text = (result.winner === me)
            ? "🎉 Ты победил!"
            : "💀 Ты проиграл";

        document.getElementById("status").innerText = text;
    }
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.addEventListener("click", (e) => {
    if (!gameState) return;
    if (myPlayerIndex === null) return;
    if (gameState.current !== myPlayerIndex) return;

    const rect = canvas.getBoundingClientRect();
    const size = canvas.width / gameState.size;

    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);

    const me = gameState.players[myPlayerIndex];

    // ЭТАП 1: выбор клетки для хода
    if (!selectedMove) {␊
        const dx = Math.abs(x - me.x);␊
        const dy = Math.abs(y - me.y);␊
␊
        if (Math.max(dx, dy) === 1 && gameState.board[y][x]) {␊
            selectedMove = { x, y, fromX: me.x, fromY: me.y };
        }␊
    }␊
    // ЭТАП 2: удаление клетки
    else {
        const dist = Math.max(
            Math.abs(x - selectedMove.x),
            Math.abs(y - selectedMove.y)
        );

        if (dist <= 2 && gameState.board[y][x]) {
            ws.send(JSON.stringify({
                type: "move",
                moveX: selectedMove.x,
                moveY: selectedMove.y,
                removeX: x,
                removeY: y
            }));

            selectedMove = null;
        }
    }

    draw();
});

function getAvailableMoves() {␊
    const moves = [];␊
    const me = gameState.players[myPlayerIndex];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;␊
␊
            const x = me.x + dx;␊
            const y = me.y + dy;␊
␊
            if (␊
                x >= 0 && x < gameState.size &&
                y >= 0 && y < gameState.size &&
                gameState.board[y][x] &&␊
                !isOccupied(x, y)␊
            ) {␊
                moves.push({ x, y });
            }
        }
    }

    return moves;
}

function getAvailableRemovals(fromX, fromY, fromOldX, fromOldY) {
    const visited = new Set();
    const queue = [{ x: fromX, y: fromY, steps: 0 }];
    const result = [];

    while (queue.length > 0) {
        const { x, y, steps } = queue.shift();
        const key = x + "," + y;

        if (visited.has(key)) continue;
        visited.add(key);

        if (steps > 0) {
            result.push({ x, y });
        }

        if (steps === 2) continue;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (␊
                    nx >= 0 && nx < gameState.size &&
                    ny >= 0 && ny < gameState.size &&
                    gameState.board[ny][nx] &&␊
                    !isOccupied(nx, ny, fromOldX, fromOldY)
                ) {␊
                    queue.push({ x: nx, y: ny, steps: steps + 1 });␊
                }␊
            }
        }
    }

    return result;
}

function isOccupied(x, y, ignoreX = null, ignoreY = null) {
    return gameState.players.some(p => {
        if (p.x === ignoreX && p.y === ignoreY) {
            return false;
        }

        return p.x === x && p.y === y;
    });
}

function draw() {
    const size = canvas.width / gameState.size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gameState.size; y++) {
        for (let x = 0; x < gameState.size; x++) {

            if (gameState.board[y][x]) {
                // обычная клетка
                ctx.fillStyle = "#2ecc71"; // зелёная
                ctx.fillRect(x * size, y * size, size, size);

                ctx.strokeStyle = "#1e8449";
                ctx.strokeRect(x * size, y * size, size, size);
            } else {
                // удалённая клетка
                ctx.fillStyle = "#111";
                ctx.fillRect(x * size, y * size, size, size);
            }
        }
    }

    // подсветка ходов
    if (!selectedMove) {
        getAvailableMoves().forEach(c => {
            ctx.fillStyle = "rgba(255,255,0,0.4)";
            ctx.fillRect(c.x * size, c.y * size, size, size);
        });
    } else {
        getAvailableRemovals(
            selectedMove.x,
            selectedMove.y,
            selectedMove.fromX,
            selectedMove.fromY
        ).forEach(c => {
            ctx.fillStyle = "rgba(255,0,0,0.4)";
            ctx.fillRect(c.x * size, c.y * size, size, size);
        });
    }

    // игроки
    gameState.players.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "#3498db" : "#e74c3c";

        ctx.beginPath();
        ctx.arc(
            p.x * size + size / 2,
            p.y * size + size / 2,
            Math.max(8, size * 0.36),
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function surrenderGame() {
    if (!gameState || myPlayerIndex === null) return;

    const ok = window.confirm("Точно сдаться? Это засчитается как поражение.");
    if (!ok) return;

    ws.send(JSON.stringify({ type: "surrender" }));
}

window.startGame = startGame;
window.updateGame = updateGame;
window.surrenderGame = surrenderGame;
