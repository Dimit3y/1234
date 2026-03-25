const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { createRoom, joinRoom, rooms } = require('./rooms');
const { createGame, makeMove } = require('./game');

const app = express();
app.use(cors());
app.use(express.json());

// Определяем порт Render
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket сервер поверх HTTP
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        switch (data.type) {
            case 'getRooms':
                ws.send(JSON.stringify({
                    type: 'rooms',
                    rooms: Object.values(rooms)
                }));
                break;

            case 'createRoom':
                const room = createRoom(ws, data.name);
                ws.roomId = room.id;
                break;

            case 'joinRoom':
                const joined = joinRoom(data.roomId, ws, data.name);

            case 'joinRoom':
                const joined = joinRoom(data.roomId, ws);
                if (!joined) return;

                ws.roomId = data.roomId;
                const roomData = rooms[data.roomId];

                if (roomData.players.length === 2) {
                    const game = createGame(roomData);
                    roomData.game = game;

                    roomData.players.forEach(p => {
                        p.send(JSON.stringify({
                            type: 'startGame',
                            game
                        }));
                    });
                }
                break;

            case 'move':
                const roomObj = rooms[ws.roomId];
                const result = makeMove(roomObj.game, ws, data);

                roomObj.players.forEach(p => {
                    p.send(JSON.stringify({
                        type: 'update',
                        game: roomObj.game,
                        result
                    }));
                });
                break;
        }
    });
});
