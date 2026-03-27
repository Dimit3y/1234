const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const { createRoom, joinRoom, rooms } = require('./rooms');
const { createGame, makeMove } = require('./game');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// HTTP сервер
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket поверх HTTP
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

    // 📩 сообщения от клиента
    ws.on('message', (msg) => {
        let data;

        try {
            data = JSON.parse(msg);
        } catch {
            return;
        }

        switch (data.type) {

            // 📋 список комнат
            case 'getRooms':
                ws.send(JSON.stringify({
                    type: 'rooms',
                    rooms: Object.values(rooms).filter(r => !r.inGame)
                }));
                break;

            // ➕ создать комнату
            case 'createRoom':
                const room = createRoom(ws, data.name);
                ws.roomId = room.id;

                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    room
                }));
                break;

            // 🚪 войти в комнату
            case 'joinRoom':
                const joined = joinRoom(data.roomId, ws, data.name);
                if (!joined) return;

                ws.roomId = data.roomId;

                const roomData = rooms[data.roomId];
                if (!roomData) return;

                // если 2 игрока → старт
                if (roomData.players.length === 2) {
                    const game = createGame(roomData);
                    roomData.game = game;
                    roomData.inGame = true;

                    roomData.players.forEach(p => {
                        p.ws.send(JSON.stringify({
                            type: 'startGame',
                            game
                        }));
                    });
                }
                break;

            // 🎮 ход
            case 'move':
                const roomObj = rooms[ws.roomId];
                if (!roomObj || !roomObj.game) return;

                const result = makeMove(roomObj.game, ws, data);

                roomObj.players.forEach(p => {
                    p.ws.send(JSON.stringify({
                        type: 'update',
                        game: roomObj.game,
                        result
                    }));
                });

                // если есть победитель → можно удалить комнату
                if (result?.winner !== undefined) {
                    delete rooms[ws.roomId];
                }

                break;
        }
    });

    // ❌ игрок вышел
    ws.on('close', () => {
        const roomId = ws.roomId;
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        // удаляем игрока
        room.players = room.players.filter(p => p.ws !== ws);

        // если остался 1 → он победил
        if (room.players.length === 1) {
            const winner = room.players[0];

            winner.ws.send(JSON.stringify({
                type: 'gameOver',
                reason: 'opponent_left'
            }));

            delete rooms[roomId];
            return;
        }

        // если никого → удалить комнату
        if (room.players.length === 0) {
            delete rooms[roomId];
        }
    });

});
