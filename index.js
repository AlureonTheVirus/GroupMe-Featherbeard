const fs = require('fs');
const { port, flag } = require("./config.json");
const GroupMe = require("./src/groupme.js");
const bot = new GroupMe();

const init = async () => {
    console.log("Loading commands. . .");
    const commands = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js") || file.endsWith(".mjs"));
    for (const file of commands) {
        if (file.endsWith(".mjs")) {
            bot.commands[`${file.split(".")[0]}`] = await import(`./src/commands/${file}`);
        } else {
            bot.commands[`${file.split(".")[0]}`] = require(`./src/commands/${file}`);
        }
    }
    console.log("All commands Loaded. Awaiting WebSocket connection. . .");
    bot.once("ready", async () => { 
        console.log(`WebSocket connected. Hosting webserver on port: ${port}.`);
    });
};

const commandHandler = async (msg) => {
    let command = msg.subject.text.slice(1).split(" ")[0];
    let args = msg.subject.text.slice(1).split(" ").slice(1);

    let targetCommand = bot.commands[command];
    if (!targetCommand) {
        let text = `Ahoy there, matey! Seems ye be sailin' uncharted waters with that command, '${flag}${command}'. Double check yer map, or hoist the '${flag}help' flag and I'll show ye the ropes.`;
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
                let text = `Belay that order, scallywag! Yer cannons be overheated, cool 'em down for another ${(bot.cooldowns[msg.subject.user_id][command] - Date.now())/1000} seconds before ye fire '${flag}${command}' again.`
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
            let text = `Arrr! Apologies, me heartie! It seems ye haven't hoisted yer colors on this ship. Forge a Featherbeard account in order to use '${flag}${command}' and sail forth on this digital sea! Here's the link to get started: https://featherbeard.alureon.dev/auth/`
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
        if (bot.blacklist.hasOwnProperty(msg.subject.user_id)) {
            let text = `Ye be castin' a shadow on the horizon, for ye have been BLACKLISTED from the realm of Featherbeard. If ye reckon this be a mistake, send word to the developer to plead yer case.`;
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
        if (!targetCommand.channels.includes(msg.subject.conversationType)) {
            let text;
            if (msg.subject.conversationType === "dm") {
                text = `Arrr! Apologies, me hearty! That decree be only fit for execution within the confines of a crew. (You have to be in a group to use this command.)`;
            } else {
                text = `Arrr! Apologies, shipmate! That order be exclusive to me private messages.`;
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
                let text = `Arrr! Avast, ye scallywag! Apologies, but ye lack the proper permissions in this motley crew to wield that command!`;
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
        let text = `Avast ye! That directive be proper, but it be lackin' in some essential details. Follow the correct format, matey! (Usage: ${targetCommand.usage}).`
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
        let text = "Arrr! Unluckily, that command failed to set sail. Ye might've encountered a bug in the code. Dispatch a missive to the developer, savvy? Mayhaps they'll mend the glitch, ensuring it never plagues us again in the future."
        await bot.send(msg.subject.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.subject.id,
                "base_reply_id": msg.subject.id
            }
        ]);
        console.log("Bot failed with error:", err);
    }
}

const msgHandler = async (msg) => {
    if (msg.subject.conversationType === "group") {

    } else if (msg.subject.conversationType === "dm") {

    }
}

bot.on("ws", async (msg) => {
    if (msg.type === "line.create") {
        msg.subject.conversationType = "group";
        msg.subject.conversation_id = msg.subject.group_id;
        if (!msg.subject.parent_id) msg.subject.parent_id = msg.subject.group_id;
    } else if (msg.type === "direct_message.create") {
        msg.subject.conversationType = "dm"
        msg.subject.conversation_id = msg.subject.chat_id;
        if (!msg.subject.parent_id) msg.subject.parent_id = msg.subject.chat_id;
    } else return;
    
    if (!msg.subject.conversationType) return;
    if (msg.subject.sender_type !== "user") return;
    if (msg.subject.user_id === bot.user_id) return;
    if (!msg.subject.text) return;
    
    if (msg.subject.text.startsWith(flag)) {
        await commandHandler(msg);
    } else {   
        await msgHandler(msg);   
    }
});

process.on('SIGINT', () => {
    console.log(`\nInterrupt detected. Cleaning up. . .`);
    process.exit(0);
});

init();