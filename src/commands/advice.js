module.exports = {
    alias : [],
    description : "Returns a slip of useful advice.",
    usage : "!advice",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        const advice = await bot.axios.get("https://api.adviceslip.com/advice");
        await bot.send(msg.conversation_id, await bot.pirateify(advice.data.slip.advice), [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            },
        ]);
    }
};