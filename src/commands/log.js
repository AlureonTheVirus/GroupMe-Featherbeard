module.exports = {
    alias : [],
    description : "Returns the bot's current error log.",
    usage : "!log",
    args : 0,
    roles : "dev",
    channels : "all",
    requiresAuth : 1,
    cooldown: 1000,
    execute : async (bot, args, msg) => {
        const file = await bot.uploadFile("./bot.log", msg.conversation_id);
        await bot.send(msg.conversation_id, "Arr! Here be the captain's log!", [
            {
                "type": "file",
                "file_id": file
            }
        ]);
    }
};