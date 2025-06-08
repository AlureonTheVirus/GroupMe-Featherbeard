module.exports = {
    alias : [],
    description : "Reverses !mute",
    usage : "!unmute [@mention/reply]",
    args : 0,
    roles : ["owner"],
    channels : "group",
    requiresAuth : 0,
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
                bot.muted.splice(bot.muted.indexOf(ids[j]), 1);
                text = `Arrr! The member be unmuted successfully!`;
                await bot.send(msg.conversation_id, text, []);
            } else {
                text = `Arrrgh! The user ye be choosin' can't be unmuted! They never had the silence put upon 'em in the first place!`;
                await bot.send(msg.conversation_id, text, []);
            }
        }
    }
};