module.exports = {
    description : "Kicks a member from the group via an @mention or a reply.",
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