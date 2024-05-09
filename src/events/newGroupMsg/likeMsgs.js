module.exports = async (bot, msg) => {
    // like messages that refer to the bot, insult those that are rude
    const names = [
        "featherbeard",
        "featherbot",
        "feather",
        "featherbread",
        "alureon",
        "alu",
        "pirate",
    ];
    const meanWords = [
        "hate",
        "stupid",
        "suck",
        "worst",
        "annoying",
        "bitch",
        "fuck",
        "idiot",
        "shit",
        "ass",
        "twink",
        "poop",
        "jerk",
        "fart",
        "butt",
        "bad",
        "dick",
        "tard",
        "shit",
        "kys",
        "kill your",
        "ugly",
        "lame",
        "dumb",
        "coward",
        "bastard",
        "gay",
        "stinky",
    ];
    const pattern = new RegExp(meanWords.join('|'), 'i');
    if (msg.text.toLowerCase().replace(/[^a-z0-9\s]|s/g, "").split(" ").some(item => names.includes(item))) {
        if (pattern.test(msg.text)) {
            await bot.send(msg.conversation_id, await bot.insult(), [{
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }]);
        } else {
            const reactions = ["🏴‍☠️", "💀", "⚔️", "☠️", "⚓", "🐧", "🌊", "⛵", "🧭"];
            const emoji = reactions[Math.floor(Math.random()*reactions.length)];
            const webReg = /[a-f0-9]{32}/
            if (webReg.test(msg.source_guid)) {
                await bot.likeMessage(msg.conversation_id, msg.id, emoji);
            } else {
                await bot.likeMessage(msg.conversation_id, msg.id);
            }
        }
    };
    return true;
}