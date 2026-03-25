let playerName = "Игрок";

if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.expand();

    const user = tg.initDataUnsafe?.user;

    if (user) {
        playerName = user.first_name + (user.last_name ? " " + user.last_name : "");
    }
}

window.playerName = playerName;
