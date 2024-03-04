const { translate } = require('@vitalets/google-translate-api');

module.exports = {
    description : "Translate a given message back to english.",
    usage : "!translate [reply]",
    args : 0,
    roles : "all",
    channels : "group",
    requiresAuth : 0,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        const replyAttachment = msg.attachments.find(o => o.type === 'reply');
        const reply = await bot.getMessageById(msg.conversation_id, replyAttachment.reply_id);

        translate(reply.text, { to: 'en' }).then(async (res) => {
            const toText = `"${res.text}"`;
            await bot.send(msg.conversation_id, toText, [
                {
                    "type": "reply",
                    "reply_id": reply.id,
                    "base_reply_id": reply.id
                },
            ]); 
        }).catch();
    }
};