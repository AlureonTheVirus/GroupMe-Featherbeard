module.exports = {
    description : "Credits the developer.",
    usage : "!whosyourdaddy",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let text = "I'm designed and maintained by a user who goes by the name 'alureon'.";
        if (msg.sender_id === "93645911") {
            text = "You of course!";
        }
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};