module.exports = {
    description : "Boop.",
    usage : "!beep",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 6000,
    execute : async (bot, args, msg) => {
        let text = "Boop!";
        await bot.send(msg.conversation_id, text, []);
    }
};