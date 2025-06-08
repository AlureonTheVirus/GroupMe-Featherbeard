module.exports = {
    alias : [],
    description : "Flips Featherbeard's lucky doubloon.",
    usage : "!coinflip",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let text = "Aye! It be TAILS!";
        if (Math.random() >= .5) {
            text = "Aye! It be HEADS!";
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