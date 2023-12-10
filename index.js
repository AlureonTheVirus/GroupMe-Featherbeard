const fs = require('fs');
const { port, flag } = require("./config.json");
const GroupMe = require("./groupme.js");
      bot = new GroupMe();

var blacklist = JSON.parse(fs.readFileSync("./cache/blacklist.json", 'utf8'));

bot.commands = {};
bot.cooldowns = {};

console.log("Loading commands. . .");
const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commands) {
    bot.commands[`${file.split(".")[0]}`] = require(`./commands/${file}`);
}
console.log("All commands Loaded. Awaiting WebSocket connection. . .");
bot.once("ready", async () => { console.log(`WebSocket connected. Hosting webserver on port: ${port}.`)});

bot.on("ws", async (msg) => {
    let conversationType;
    if (msg.type === "line.create") {
        conversationType = "group";
        msg.subject.conversation_id = msg.subject.group_id;
        if (!msg.subject.parent_id) msg.subject.parent_id = msg.subject.group_id;
    }
    if (msg.type === "direct_message.create") {
        conversationType = "dm"
        msg.subject.conversation_id = msg.subject.chat_id;
        if (!msg.subject.parent_id) msg.subject.parent_id = msg.subject.chat_id;
    }
    if (!conversationType) return;
    if (msg.subject.sender_type !== "user") return;
    if (msg.subject.user_id === bot.user_id) return;

    let text = msg.subject.text;

    if (!text) return;
    if (!text.startsWith(flag)) return;
    let command = text.slice(1).split(" ")[0];
    let args = text.slice(1).split(" ").slice(1);

    let targetCommand = bot.commands[command];
    if (!targetCommand) {
        let text = `Sorry! The command '${flag}${command}' doesn't exist. Double check your spelling or use '${flag}help' for a list of my commands.`;
        await bot.send(msg.subject.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.subject.id,
                "base_reply_id": msg.subject.id
            }
        ]);
        return;
    }
    if (bot.cooldowns[msg.subject.user_id]) {
        if (bot.cooldowns[msg.subject.user_id][command]) {
            if (bot.cooldowns[msg.subject.user_id][command] > Date.now()) {
                let text = `You're on cooldown. Please wait ${(bot.cooldowns[msg.subject.user_id][command] - Date.now())/1000} more seconds to use '${flag}${command}' again.`;
                await bot.send(msg.subject.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.subject.id,
                        "base_reply_id": msg.subject.id
                    }
                ]);
                return;
            }
        }
        bot.cooldowns[msg.subject.user_id][command] = Date.now() + targetCommand.cooldown;
    } else {
        bot.cooldowns[msg.subject.user_id] = {};
        bot.cooldowns[msg.subject.user_id][command] = Date.now() + targetCommand.cooldown;
    }
    if (targetCommand.requiresAuth) {
        if (!await bot.verifyAuthStatus(msg.subject.user_id)) {
            let text = `Sorry! '${flag}${command}' requires a Sputnik account to use. Authorize me with your GroupMe account to add me to any of your groups and get access to certain commands. You can start by signing up here: https://sputnik.alureon.dev/auth.`;
            await bot.send(msg.subject.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.subject.id,
                    "base_reply_id": msg.subject.id
                }
            ]);
            return;
        }
    } else {
        if (blacklist.hasOwnProperty(msg.subject.user_id)) {
            let text = `You have been blacklisted from using Sputnik. Contact the developer if you believe this was a mistake.`;
            await bot.send(msg.subject.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.subject.id,
                    "base_reply_id": msg.subject.id
                }
            ]);
            return;
        }
    }
    if (targetCommand.channels !== "all") {
        if (!targetCommand.channels.includes(conversationType)) {
            let text;
            if (conversationType === "dm") {
                text = `Sorry! That command can only be used in a group.`;
            } else {
                text = `Sorry! That command can only be used in my DMs.`;
            }
            await bot.send(msg.subject.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.subject.id,
                    "base_reply_id": msg.subject.id
                }
            ]);
            return;
        }
    }
    if (targetCommand.roles !== "all") {
        let senderRole = await bot.fetchPermissions(msg.subject.conversation_id, msg.subject.user_id);
        if (senderRole !== "dev") {
            if (!targetCommand.roles.includes(senderRole) || targetCommand.roles === "internal") {
                let text = `Sorry! It looks like you dont have the correct permissions to use that command.`;
                await bot.send(msg.subject.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.subject.id,
                        "base_reply_id": msg.subject.id
                    }
                ]);
                return;
            }
        }
    }
    if (args < targetCommand.args) {
        let text = `That command was valid but is missing some arguments. Usage: ${targetCommand.usage}`;
        await bot.send(msg.subject.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.subject.id,
                "base_reply_id": msg.subject.id
            }
        ]);
        return;
    }

    try {
        await bot.commands[command].execute(bot, args, msg.subject);
    } catch (err) {
        let text = "Unfortunately that command failed to execute. You may have stumbled on a bug. Contact the developer to report this so that hopefully it never happens in the future."
        await bot.send(msg.subject.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.subject.id,
                "base_reply_id": msg.subject.id
            }
        ]);
        console.log("Bot failed with error:", err);
    }
});

process.on('SIGINT', () => {
    console.log(`\nInterrupt detected. Cleaning up. . .`)
    process.exit(0);
});