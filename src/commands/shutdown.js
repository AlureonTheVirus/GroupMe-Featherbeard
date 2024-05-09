module.exports = {
    alias : [],
    description : "Kills Featherbeard in the case of a critical error. He will then need to be restarted manually",
    usage : "!shutdown",
    args : 0,
    roles : "dev",
    channels : "all",
    requiresAuth : 1,
    cooldown: 6000,
    execute : async (bot, args, msg) => {
        let text = "Avast ye! Featherbeard be takin' a snooze in his cozy iceberg hammock. No more squawks and clicks for now. Sweet slumber, ye dreamer!\n\n (Featherbeard is being shut down for the time being, the developer will have to manually turn him back on later.)";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
        throw "shutdown";
    }
};