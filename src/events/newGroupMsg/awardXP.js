module.exports = async (bot, msg) => {
    // award XP for sending messages
    if (!bot.cooldowns[msg.user_id] || !bot.cooldowns[msg.user_id]["XP_COOLDOWN"] || bot.cooldowns[msg.user_id]["XP_COOLDOWN"] < Date.now()) {
        let xp = Math.floor((Math.random() * (8 - 1) + 1));
        bot.authedUsers[`${msg.user_id}`].xp += xp;
        bot.syncConnectedUsers();
        if (!bot.cooldowns[msg.user_id]) bot.cooldowns[msg.user_id] = {};
        bot.cooldowns[msg.user_id]["XP_COOLDOWN"] = Date.now() + 300000;
    };
    return true;
}