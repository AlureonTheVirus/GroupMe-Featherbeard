module.exports = {
    alias : [],
    description : "Bonks the horny.",
    usage : "!bonk",
    args : 0,
    roles : "all",
    channels : "group",
    requiresAuth : 0,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        if (msg.name === "Elexis" || msg.name === "Alureon") {
            const imgURL = await bot.getImgURL("https://featherbeard.alureon.dev/img/bonk.jpeg");
            let reply = msg.attachments.find(o => o.type === 'reply');
            if (reply) {
                let text = "Aye! The horny not allowed here!";
                await bot.send(msg.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": reply.reply_id,
                        "base_reply_id": reply.reply_id
                    },
                    {
                        "type": "image",
                        "url": imgURL
                    },
                ]);
            }
        };
    }
};