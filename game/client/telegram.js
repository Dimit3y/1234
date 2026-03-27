let playerName = "Игрок";

if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;

    if (user) {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        playerName = fullName || user.username || `id${user.id}`;
    }
}

window.playerName = playerName;
