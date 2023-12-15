const axios = require("axios");
const fs = require('fs');

module.exports = {
    description : "Adds a member to Featherbeard's blacklist via an @mention or a reply. Then kicks them from the group.",
    usage : "!blacklist [user]",
    args : 0,
    roles : "owner",
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');
        let blacklist = JSON.parse(fs.readFileSync("./cache/blacklist.json", 'utf8'));

        if (ids) {
            ids = ids.user_ids;
            if (reply) {
                ids.push(reply.user_id);
                text = `Off the plank it is!`;
                await bot.send(msg.conversation_id, text, []);
            }
        } else {
            if (reply) {
                ids = [reply.user_id];
                text = `Off the plank it is!`;
                await bot.send(msg.conversation_id, text, []);
            } else {
                await bot.send(msg.conversation_id, "Ye forgot to name a shipmate!", [
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
                text = `Avast! "${members[i].name}" now be marked on the blacklist, set to be cast away from any crew I aid in managin'. No room for them scallywags on me ship!`;
                await bot.send(msg.conversation_id, text, []);
            }
        }

        fs.writeFileSync("./cache/blacklist.json", JSON.stringify(blacklist, null, 4), 'utf8');

        text = `Blacklisting done. Now haulin' those troublemakers off the ship.`;
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

        if (fails > 0) {
            if (fails > count) {
                text = `Oi! There be some hiccups this run. Make sure I boast admin permissions and give the command another go.`;
                await bot.send(msg.conversation_id, text, []);
            }
            text = `Successfully scrubbed ${count} of ${ids.length} shipmate(s) from the deck. Alas ${fails} fellow sailors(s) resisted removal due to unforseen troubles on the high seas.`;
            await bot.send(msg.conversation_id, text, []);
        } else {
            text = `Successfully scrubbed ${count} of ${ids.length} shipmate(s) from the deck.`;
            await bot.send(msg.conversation_id, text, []);
        }
    }
};