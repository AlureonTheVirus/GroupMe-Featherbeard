const axios = require("axios");
const fs = require('fs');

module.exports = {
    description : "Adds a member to Sputnik's blacklist via an @mention or a reply to one of their messages. Then it kicks them from the group.",
    usage : "!blacklist [user]",
    args : 0,
    roles : "owner",
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {

        text = `Blacklisting user(s).`;
        await bot.send(msg.conversation_id, text, []);

        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');
        let blacklist = JSON.parse(fs.readFileSync("./cache/blacklist.json", 'utf8'));

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

        const { data } = await axios.get(`https://api.groupme.com/v3/groups/${msg.parent_id}?token=${bot.token}`);
        const members = data.response.members;

        for (let i = 0; i < members.length; i++) {
            if (ids.includes(members[i].user_id)) {
                blacklist[members[i].user_id] = {
                    user_id: members[i].user_id,
                    name: members[i].name,
                    reason: `Blacklisted manually by ${msg.name}.`,
                    time: Date.now()
                }
                text = `User: "${members[i].name}" was added to the blacklist and will be removed from any group Sputnik helps manage.`;
                await bot.send(msg.conversation_id, text, []);
            }
        }

        fs.writeFileSync("./cache/blacklist.json", JSON.stringify(blacklist, null, 4), 'utf8');

        text = `Blacklisting complete, now removing offending users from the group.`;
        await bot.send(msg.conversation_id, text, []);

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