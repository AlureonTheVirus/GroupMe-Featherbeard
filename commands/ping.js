module.exports = {
    description : "Tests if Sputnik is alive.",
    usage : "!ping",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 6000,
    execute : async (bot, args, msg) => {
        let text = "🏓 Pong!";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
    }
};