module.exports = {
    description : "Beep.",
    usage : "!boop",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 6000,
    execute : async (bot, args, msg) => {
        let text = "Beep!";
        await bot.send(msg.conversation_id, text, []);
    }
};