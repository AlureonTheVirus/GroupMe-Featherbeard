module.exports = {
    alias : ["ping"],
    description : "Tests if Featherbeard is awake and listening.",
    usage : "!ahoy",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        let text = "Aye! Ahoy there! ☠";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
    }
};