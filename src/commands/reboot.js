module.exports = {
    alias : [],
    description : "Reboots Featherbeard in the case of a critical error.",
    usage : "!reboot",
    args : 0,
    roles : "dev",
    channels : "all",
    requiresAuth : 1,
    cooldown: 6000,
    execute : async (bot, args, msg) => {
        let text = "Rebooting! Catch you on the flipside of this digital sea!.";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
        process.kill(process.pid, 'SIGUSR2')
    }
};