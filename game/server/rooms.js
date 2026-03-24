const { v4: uuidv4 } = require('uuid');

const rooms = {};

function createRoom(ws) {
    const id = uuidv4();

    rooms[id] = {
        id,
        players: [ws],
        game: null
    };

    return rooms[id];
}

function joinRoom(id, ws) {
    const room = rooms[id];
    if (!room || room.players.length >= 2) return false;

    room.players.push(ws);
    return true;
}

module.exports = { createRoom, joinRoom, rooms };