const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const { createRoom, joinRoom, rooms } = require('./rooms');
const { createGame, makeMove } = require('./game');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        let data;

        try {
            data = JSON.parse(msg);
        } catch {
            return;
        }

        switch (data.type) {
            case 'getRooms':
                ws.send(JSON.stringify({
                    type: 'rooms',
                    rooms: Object.values(rooms)
                        .filter(r => !r.inGame)
                        .map(r => ({
                            id: r.id,
                            name: r.name,
                            settings: r.settings,
                            playersCount: r.players.length
                        }))
                }));
                break;

            case 'createRoom': {
                const room = createRoom(ws, data.settings);
                ws.roomId = room.id;

                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    room
                }));
                break;
            }

            case 'joinRoom': {
                const joined = joinRoom(data.roomId, ws);
                if (!joined) return;

                ws.roomId = data.roomId;

                const roomData = rooms[data.roomId];
                if (!roomData) return;

                if (roomData.players.length === 2) {
                    const game = createGame(roomData);
                    roomData.game = game;
                    roomData.inGame = true;

                    roomData.players.forEach(p => {
                        p.ws.send(JSON.stringify({
                            type: 'startGame',
                            game,
                            playerIndex: game.players.findIndex(player => player.ws === p.ws)
                        }));
                    });
                }

                break;
            }

            case 'move': {
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

                if (result?.winner !== undefined) {
                    delete rooms[ws.roomId];
                }

                break;
            }

            case 'surrender': {
                const activeRoom = rooms[ws.roomId];
                if (!activeRoom || !activeRoom.game) return;

                const loserIndex = activeRoom.game.players.findIndex(player => player.ws === ws);
                if (loserIndex === -1) return;

                const winnerIndex = 1 - loserIndex;

                activeRoom.players.forEach(p => {
                    p.ws.send(JSON.stringify({
                        type: 'gameOver',
                        reason: 'surrender',
                        winner: winnerIndex,
                        loser: loserIndex,
                        playerIndex: activeRoom.game.players.findIndex(player => player.ws === p.ws)
                    }));
                });

                delete rooms[ws.roomId];
                break;
            }

            default:
                break;
        }
    });

    ws.on('close', () => {
        const roomId = ws.roomId;
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        room.players = room.players.filter(p => p.ws !== ws);

        if (room.players.length === 1) {
            const winner = room.players[0];

            winner.ws.send(JSON.stringify({
                type: 'gameOver',
                reason: 'opponent_left'
            }));

            delete rooms[roomId];
            return;
        }

        if (room.players.length === 0) {
            delete rooms[roomId];
        }
    });
});
