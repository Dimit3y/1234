let gameState = null;
let selectedMove = null;

function startGame(game) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    gameState = game;
    selectedMove = null;

    draw();
}

function renderPlayers() {
    const div = document.getElementById("playersInfo");

    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    div.innerHTML = `
        <div class="player ${gameState.current === 0 ? 'active' : ''}">
            🔵 ${p1.name}
        </div>
        <div class="player ${gameState.current === 1 ? 'active' : ''}">
            🔴 ${p2.name}
        </div>
    `;
}

function updateGame(game, result) {
    gameState = game;
    selectedMove = null;

    draw();

    if (result?.winner !== undefined) {
    const me = gameState.current; // текущий игрок после хода

    const text = (result.winner === me)
        ? "🎉 Ты победил!"
        : "💀 Ты проиграл";

    document.getElementById("status").innerText = text;
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.addEventListener("click", (e) => {
    if (!gameState) return;

    const rect = canvas.getBoundingClientRect();
    const size = 50;

    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);

    const me = gameState.players[gameState.current];

    // ЭТАП 1: выбор клетки для хода
    if (!selectedMove) {
        const dx = Math.abs(x - me.x);
        const dy = Math.abs(y - me.y);

        if (Math.max(dx, dy) === 1 && gameState.board[y][x]) {
            selectedMove = { x, y };
        }
    }
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

function getAvailableMoves() {
    const moves = [];
    const me = gameState.players[gameState.current];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const x = me.x + dx;
            const y = me.y + dy;

            if (
                x >= 0 && x < 7 &&
                y >= 0 && y < 7 &&
                gameState.board[y][x] &&
                !isOccupied(x, y)
            ) {
                moves.push({ x, y });
            }
        }
    }

    return moves;
}

function getAvailableRemovals(fromX, fromY) {
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

                if (
                    nx >= 0 && nx < 7 &&
                    ny >= 0 && ny < 7 &&
                    gameState.board[ny][nx] &&
                    !isOccupied(nx, ny)
                ) {
                    queue.push({ x: nx, y: ny, steps: steps + 1 });
                }
            }
        }
    }

    return result;
}

function isOccupied(x, y) {
    return gameState.players.some(p => p.x === x && p.y === y);
}

function draw() {
    const size = 50;
    ctx.clearRect(0, 0, 350, 350);

    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {

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
        getAvailableRemovals(selectedMove.x, selectedMove.y).forEach(c => {
            ctx.fillStyle = "rgba(255,0,0,0.4)";
            ctx.fillRect(c.x * size, c.y * size, size, size);
        });
    }

    // игроки
    gameState.players.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "#3498db" : "#e74c3c";

        ctx.beginPath();
        ctx.arc(p.x * size + 25, p.y * size + 25, 18, 0, Math.PI * 2);
        ctx.fill();
    });
    document.getElementById("status").innerText =
    "Ход игрока: " + (gameState.current === 0 ? "Синий" : "Красный");
}

window.startGame = startGame;
window.updateGame = updateGame;
