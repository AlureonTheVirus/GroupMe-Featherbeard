module.exports = {
    alias : [],
    description : "Kicks a member from the group via an @mention or a reply.",
    usage : "!kick [@mention/reply]",
    args : 0,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');


        if (reply) {
            await bot.deleteMessage(msg.conversation_id, reply.reply_id);
        }

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

        if (ids.includes(bot.getMemberId(msg.parent_id))) {
            text = `Ye can't heave-ho Featherbeard off the plank of this here group. This ol' pengin pirate be stayin' put!`;
            await bot.send(msg.conversation_id, text, []);
            return;
        }

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
                text = `Oi! There be some hiccups here. Make sure I boast admin permissions and give !kick another go.`;
                await bot.send(msg.conversation_id, text, []);
            }
            text = `Alas ${fails} fellow sailors(s) resisted removal due to unforseen troubles on the high seas.`;
            await bot.send(msg.conversation_id, text, []);
        }
    }
};