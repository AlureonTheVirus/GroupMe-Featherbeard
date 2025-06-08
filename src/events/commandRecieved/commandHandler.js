const { flag } = require("../../../config.json");

module.exports = async (bot, msg) => {
    let command = msg.text.slice(1).split(" ")[0];
    
    let targetCommand;
    if (bot.commands[command]) {
        targetCommand = bot.commands[command];
    } else {
        for (let commandObj in bot.commands) {
            if (bot.commands[commandObj].alias) {
                if (bot.commands[commandObj].alias.includes(command)) targetCommand = bot.commands[commandObj];
            };
        }
    }

    if (!targetCommand) return true;
    
    let args = msg.text.split(" ").slice(1);
    
    if (bot.cooldowns[msg.user_id]) {
        if (bot.cooldowns[msg.user_id][command] && msg.user_id !== "93645911") {
            if (bot.cooldowns[msg.user_id][command] > Date.now()) {
                let text = `Belay that order, scallywag! Yer cannons be overheated, cool 'em down for another ${(bot.cooldowns[msg.user_id][command] - Date.now())/1000} seconds before ye fire '${flag}${command}' again.`
                await bot.send(msg.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    }
                ]);
                return true;
            }
        }
        bot.cooldowns[msg.user_id][command] = Date.now() + targetCommand.cooldown;
    } else {
        bot.cooldowns[msg.user_id] = {};
        bot.cooldowns[msg.user_id][command] = Date.now() + targetCommand.cooldown;
    };
    if (targetCommand.requiresAuth) {
        if (!await bot.verifyAuthStatus(msg.user_id)) {
            let text = `Arrr! Apologies, me heartie! It seems ye haven't hoisted yer colors on this ship. Forge a Featherbeard account in order to use '${flag}${command}' and sail forth on this digital sea! Here's the link to get started: https://featherbeard.alureon.dev/auth/`
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            return true;
        }
    };
    if (targetCommand.channels !== "all") {
        if (!targetCommand.channels.includes(msg.conversationType)) {
            let text;
            if (msg.conversationType === "dm") {
                text = `Arrr! Apologies, me hearty! That decree be only fit for execution within the confines of a crew. (You have to be in a group to use this command.)`;
            } else {
                text = `Arrr! Apologies, shipmate! That order be exclusive to me private messages.`;
            }
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            return true;
        }
    };
    if (targetCommand.roles !== "all") {  
        let senderRole;
        try {
            senderRole = await bot.fetchPermissions(msg.parent_id, msg.user_id);
        } catch (err) {
            console.log(`Error Fetching Permissions for msg:\n`, msg);
            console.error(err);
        }
        if (senderRole !== "dev" && !targetCommand.roles.includes("hidden")) {
            if (!targetCommand.roles.includes(senderRole)) {
                let text = `Arrr! Avast, ye scallywag! Apologies, but ye lack the proper permissions in this motley crew to wield that command!`;
                await bot.send(msg.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    }
                ]);
                return true;
            }
        }
    };
    if (args < targetCommand.args) {
        let text = `Avast ye! That directive be proper, but it be lackin' in some essential details. Follow the correct format, matey! (Usage: ${targetCommand.usage}).`
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
        return true;
    };

    try {
        await targetCommand.execute(bot, args, msg);
    } catch (err) {
        if (err === "shutdown") {
            throw "shutdown";
        } else {
            let text = "Arrr! Unluckily, that command failed to set sail. Ye might've encountered a bug in the code. Dispatch a missive to the developer, savvy?";
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            console.log("Bot failed with error:", err);
        }
    };
    
}