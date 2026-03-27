function createGame(room) {
    return {
        board: Array(7).fill().map(() => Array(7).fill(1)),
        players: [
    {
        x: 0,
        y: 0,
        name: room.players[0].name,
        ws: room.players[0].ws
    },
    {
        x: 6,
        y: 6,
        name: room.players[1].name,
        ws: room.players[1].ws
    }
],
        current: 0,
        removed: []
    };
}

function isInside(x, y) {
    return x >= 0 && x < 7 && y >= 0 && y < 7;
}

function getReachableCells(game, startX, startY, maxSteps, enemy) {
    const visited = new Set();
    const queue = [{ x: startX, y: startY, steps: 0 }];

    const result = [];

    while (queue.length > 0) {
        const { x, y, steps } = queue.shift();
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (steps > 0) {
            result.push({ x, y });
        }

        if (steps === maxSteps) continue;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx >= 0 && nx < 7 &&
                    ny >= 0 && ny < 7 &&
                    game.board[ny][nx] &&
                    !(nx === enemy.x && ny === enemy.y)
                ) {
                    queue.push({ x: nx, y: ny, steps: steps + 1 });
                }
            }
        }
    }

    return result;
}

function makeMove(game, ws, data) {
    const playerIndex = game.players.findIndex(p => p.ws === ws);
    if (playerIndex === -1) return { error: "Игрок не найден" };
    const player = game.players[playerIndex];

    const { moveX, moveY, removeX, removeY } = data;

    // Проверка хода
    if (Math.abs(moveX - player.x) > 1 || Math.abs(moveY - player.y) > 1) {
        return { error: "Неверный ход" };
    }

    if (playerIndex !== game.current) {
    return { error: "Не твой ход" };
    }

    // Перемещение
    player.x = moveX;
    player.y = moveY;

    const reachable = getReachableCells(
        game,
        player.x,
        player.y,
        2,
        enemy
    );
    
    const canRemove = reachable.some(c => c.x === removeX && c.y === removeY);
    
    if (!canRemove) {
        return { error: "Нельзя удалить эту клетку" };
    }

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
