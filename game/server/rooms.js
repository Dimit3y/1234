const { v4: uuidv4 } = require('uuid');

const rooms = {};

function createRoom(ws, name = "Игрок") {
    const id = uuidv4();

    rooms[id] = {
        id,
        players: [{ ws, name }],
        game: null
    };

    return rooms[id];
}

function joinRoom(id, ws, name = "Игрок") {
    const room = rooms[id];
    if (!room || room.players.length >= 2) return false;

    room.players.push({ ws, name });
    return true;
}

module.exports = { createRoom, joinRoom, rooms };
