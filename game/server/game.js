function createGame(room) {
    return {
        board: Array(7).fill().map(() => Array(7).fill(1)),
        players: [
            { x: 0, y: 0 },
            { x: 6, y: 6 }
        ],
        current: 0,
        removed: []
    };
}

function isInside(x, y) {
    return x >= 0 && x < 7 && y >= 0 && y < 7;
}

function makeMove(game, ws, data) {
    const playerIndex = game.current;
    const player = game.players[playerIndex];

    const { moveX, moveY, removeX, removeY } = data;

    // Проверка хода
    if (Math.abs(moveX - player.x) > 1 || Math.abs(moveY - player.y) > 1) {
        return { error: "Неверный ход" };
    }

    // Перемещение
    player.x = moveX;
    player.y = moveY;

    // Проверка удаления (макс 2 клетки)
    const dist = Math.max(Math.abs(removeX - player.x), Math.abs(removeY - player.y));
    if (dist > 2) return { error: "Слишком далеко" };

    game.board[removeY][removeX] = 0;

    // Смена игрока
    game.current = 1 - game.current;

    // Проверка поражения
    const next = game.players[game.current];
    let canMove = false;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = next.x + dx;
            const ny = next.y + dy;

            if (isInside(nx, ny) && game.board[ny][nx]) {
                canMove = true;
            }
        }
    }

    if (!canMove) {
        return { winner: playerIndex };
    }

    return {};
}

module.exports = { createGame, makeMove };