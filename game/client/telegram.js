const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

window.playerName = user
    ? (user.first_name + (user.last_name ? " " + user.last_name : ""))
    : "Игрок";
