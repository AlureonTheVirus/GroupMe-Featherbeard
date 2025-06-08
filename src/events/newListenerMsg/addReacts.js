module.exports = async (bot, msg) => {
    const reactReg = /:([\u{0000}-\u{10FFFF}]):/gu;
    let match = reactReg.exec(msg.text);
    if (match !== null) {
        if (!await bot.verifyAuthStatus(msg.user_id)) {
            let text = `Arrr! Apologies, me heartie! You need a Featherbeard account to use custom reactions!\n\nHere's the link to get started: https://featherbeard.alureon.dev/auth/\n\n(You may just have been logged out, log back in to fix this issue)`;
            await bot.sendDirectMessage(msg.user_id, text, []);
            return;
        }
        let reply = msg.attachments.find(o => o.type === 'reply');
        let emoji = msg.attachments.find(o => o.type === 'emoji');
        let reaction;
        if (emoji) {
            reaction = {
                "type": "emoji",
                "pack_id": emoji.charmap[0][0],
                "pack_index": emoji.charmap[0][1]
            }
        } else {
            reaction = match[1];
        }

        if (reply) {
            await bot.likeMessage(msg.conversation_id, reply.reply_id, reaction, bot.authedUsers[msg.user_id].token);
        } else {
            await bot.likeMessage(msg.conversation_id, msg.id, reaction, bot.authedUsers[msg.user_id].token);
        }
    }
    return true;
}