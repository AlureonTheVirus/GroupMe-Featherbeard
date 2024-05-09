module.exports = {
    alias : ["pirateify"],
    description : "Translate to pirate speak!",
    usage : "!piratify [phrase]",
    args : 1,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 7000,
    execute : async (bot, args, msg) => {
        let phrase = await bot.pirateify(args.join(" "));
        await bot.send(msg.conversation_id, `"${phrase}"`, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            },
        ]);
    }
};