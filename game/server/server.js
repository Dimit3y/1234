const WebSocket = require('ws');
const { createRoom, joinRoom, rooms } = require('./rooms');
const { createGame, makeMove } = require('./game');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

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
                const room = createRoom(ws);
                ws.roomId = room.id;
                ws.send(JSON.stringify({ type: 'roomCreated', room }));
                break;

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