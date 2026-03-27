const { v4: uuidv4 } = require('uuid');

const rooms = {};

function normalizeSettings(settings = {}) {
    const rawSize = Number(settings.size);
    const size = Number.isInteger(rawSize)
        ? Math.min(10, Math.max(3, rawSize))
        : 7;

    const spawnMode = settings.spawnMode === 'random' ? 'random' : 'corners';

    return { size, spawnMode };
}

function createRoom(ws, settings) {
    const id = uuidv4();

    rooms[id] = {
        id,
        settings: normalizeSettings(settings),
        players: [{ ws }],
        game: null,
        inGame: false
    };

    return rooms[id];
}

function joinRoom(id, ws) {
    const room = rooms[id];
    if (!room || room.players.length >= 2) return false;

    room.players.push({ ws });
    return true;
}

module.exports = { createRoom, joinRoom, rooms };
