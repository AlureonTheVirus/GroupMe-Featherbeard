module.exports = {
    alias : [],
    description : "Shows this message.",
    usage : "!help",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let text = ["Behold! Me list o' commands! (These are the commands you have permission to use in this channel, it may differ elsewhere)\n"];
        const commands = Object.keys(bot.commands);
        const senderRole = await bot.fetchPermissions(msg.conversation_id, msg.user_id);

        for (const command of commands) {
            if (bot.commands[command].channels === "all" || bot.commands[command].channels === msg.conversationType) {
                if (bot.commands[command].usage !== "!bonk") {
                    if (senderRole === "dev") {
                        if (bot.commands[command].roles !== "hidden") {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        }
                    } else if (senderRole === "owner") {
                        if (bot.commands[command].roles.includes("owner")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        } else if (bot.commands[command].roles.includes("admin")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        } else if (bot.commands[command].roles.includes("all")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        }
                    } else if (senderRole === "admin") {
                        if (bot.commands[command].roles.includes("admin")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        } else if (bot.commands[command].roles.includes("all")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        }
                    } else {
                        if (bot.commands[command].roles.includes("all")) {
                            text.push(`• ${bot.commands[command].usage} - ${bot.commands[command].description}`);
                        }
                    };
                }
            }
        };

        await bot.send(msg.conversation_id, text.join("\n"), [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};