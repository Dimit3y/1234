function createGame(room) {
    const size = room.settings?.size || 7;
    const spawnMode = room.settings?.spawnMode || 'corners';
    const board = Array(size).fill(null).map(() => Array(size).fill(1));

    const spawnPositions = getSpawnPositions(size, spawnMode);

    return {
        size,
        board,
        players: [
            {
                x: spawnPositions[0].x,
                y: spawnPositions[0].y,
                ws: room.players[0].ws
            },
            {
                x: spawnPositions[1].x,
                y: spawnPositions[1].y,
                ws: room.players[1].ws
            }
        ],
        current: 0,
        removed: []
    };
}

function getSpawnPositions(size, spawnMode) {
    if (spawnMode === 'random') {
        const first = {
            x: Math.floor(Math.random() * size),
            y: Math.floor(Math.random() * size)
        };

        let second = {
            x: Math.floor(Math.random() * size),
            y: Math.floor(Math.random() * size)
        };

        while (second.x === first.x && second.y === first.y) {
            second = {
                x: Math.floor(Math.random() * size),
                y: Math.floor(Math.random() * size)
            };
        }

        return [first, second];
    }

    return [
        { x: 0, y: 0 },
        { x: size - 1, y: size - 1 }
    ];
}

function isInside(game, x, y) {
    return x >= 0 && x < game.size && y >= 0 && y < game.size;
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
                    isInside(game, nx, ny) &&
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

function hasAnyMove(game, playerIndex) {
    const player = game.players[playerIndex];
    const enemy = game.players[1 - playerIndex];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const moveX = player.x + dx;
            const moveY = player.y + dy;

            if (!isInside(game, moveX, moveY)) continue;
            if (!game.board[moveY][moveX]) continue;
            if (moveX === enemy.x && moveY === enemy.y) continue;

            const removable = getReachableCells(game, moveX, moveY, 2, enemy);
            if (removable.length > 0) {
                return true;
            }
        }
    }

    return false;
}

function makeMove(game, ws, data) {
    const playerIndex = game.players.findIndex(p => p.ws === ws);
    if (playerIndex === -1) return { error: 'Игрок не найден' };

    if (playerIndex !== game.current) {
        return { error: 'Не твой ход' };
    }

    const player = game.players[playerIndex];
    const enemy = game.players[1 - playerIndex];

    const { moveX, moveY, removeX, removeY } = data;

    if (Math.abs(moveX - player.x) > 1 || Math.abs(moveY - player.y) > 1) {
        return { error: 'Неверный ход' };
    }

    if (!isInside(game, moveX, moveY) || !game.board[moveY][moveX]) {
        return { error: 'Нельзя ходить в эту клетку' };
    }

    if (moveX === enemy.x && moveY === enemy.y) {
        return { error: 'Клетка занята соперником' };
    }

    player.x = moveX;
    player.y = moveY;

    const reachable = getReachableCells(game, player.x, player.y, 2, enemy);
    const canRemove = reachable.some(c => c.x === removeX && c.y === removeY);

    if (!canRemove) {
        return { error: 'Нельзя удалить эту клетку' };
    }

    game.board[removeY][removeX] = 0;

    game.current = 1 - game.current;

    if (!hasAnyMove(game, game.current)) {
        return { winner: playerIndex };
    }

    return {};
}

module.exports = { createGame, makeMove };
