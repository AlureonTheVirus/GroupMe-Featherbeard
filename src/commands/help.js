const { flag } = require("../../config.json");

module.exports = {
    description : "Shows this message.",
    usage : "!help",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let text = ["My command list is as follows:"];
        const commands = Object.keys(bot.commands);
        for (const command of commands) {
            if (bot.commands[command].roles !== "dev") {
                text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
            }
        }
        await bot.send(msg.conversation_id, text.join("\n"), [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};