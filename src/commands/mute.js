module.exports = {
    alias : [],
    description : "Mutes a member so that any message they send is automatically deleted.",
    usage : "!mute [@mention/reply]",
    args : 0,
    roles : "owner",
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

        if (ids.includes(bot.user_id)) {
            text = `Ye can't mute Featherbeard. This ol' pengin pirate be stayin' put!`;
            await bot.send(msg.conversation_id, text, []); 
        };

        for (let j = 0; j < ids.length; j++) {
            if (bot.muted.includes(ids[j])) {
                text = `Argh! A user ye selected already be muted!`;
                await bot.send(msg.conversation_id, text, []);
            } else {
                bot.muted.push(ids[j]);
                text = `Arrr! The member be muted successfully!`;
                await bot.send(msg.conversation_id, text, []);
            }
        }
    }
};