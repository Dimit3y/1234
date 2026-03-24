let gameState = null;
let selectedMove = null;

function startGame(game) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    gameState = game;
    selectedMove = null;

    draw();
}

function updateGame(game, result) {
    gameState = game;
    selectedMove = null;

    draw();

    if (result?.winner !== undefined) {
        document.getElementById("status").innerText =
            "Победил игрок " + result.winner;
    }
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

function draw() {
    const size = 50;

    ctx.clearRect(0, 0, 350, 350);

    // клетки
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (!gameState.board[y][x]) continue;

            ctx.strokeRect(x * size, y * size, size, size);
        }
    }

    // подсветка выбранного хода
    if (selectedMove) {
        ctx.fillStyle = "rgba(0,255,0,0.3)";
        ctx.fillRect(selectedMove.x * size, selectedMove.y * size, size, size);
    }

    // игроки
    gameState.players.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "blue" : "red";
        ctx.fillRect(p.x * size + 10, p.y * size + 10, 30, 30);
    });
}