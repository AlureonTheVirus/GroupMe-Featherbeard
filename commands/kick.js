const axios = require("axios");

module.exports = {
    description : "Kicks a member from the group via an @mention or a reply to one of their messages.",
    usage : "!kick [user]",
    args : 0,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');

        if (ids) {
            ids = ids.user_ids;
            if (reply) {
                ids.push(reply.user_id);
            }
        } else {
            if (reply) {
                ids = [reply.user_id];
            } else {
                await bot.send(msg.conversation_id, "No user specified.", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                ]);
                return;
            }
        }
        ids = Array.from(ids, x => `${x}`);

        let count = 0;
        let fails = 0;
        for (let j = 0; j < ids.length; j++) {
            try {
                await bot.removeUser(msg.parent_id, ids[j]);
                count++;
            } catch (err) {
                text = `Failure to remove because ${err}`;
                await bot.send(msg.conversation_id, text, []);
                fails++;
            }
        }

        if (fails > count) {
            text = `There were errors this run. Double check that Sputnik has admin permissions and try using this command again.`;
            await bot.send(msg.conversation_id, text, []);
        }

        text = `Finished removing ${count} of ${ids.length} user(s). Failed to remove ${fails} of ${ids.length} user(s) due to errors.`;
        await bot.send(msg.conversation_id, text, []);
    }
};