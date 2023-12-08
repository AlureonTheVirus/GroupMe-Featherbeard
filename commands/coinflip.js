module.exports = {
    description : "Flips a coin.",
    usage : "!coinflip",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let text = "It's Tails!";
        if (Math.random() >= .5) {
            text = "It's Heads!";
        }
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
    }
};