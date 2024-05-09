module.exports = async (bot, msg) => {
    // delete links
    const urlPattern = /\b(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|net|gov|edu|io|co|us|uk|ly|be|dev)\b/i;
    const phonePattern = /\b(?:\d{3}[-./s]?)?\d{3}[-./s]?\d{4}\b/
    if (urlPattern.test(msg.text) || phonePattern.test(msg.text)) {
        if (!msg.text.includes("v.groupme.com") && 
            !msg.text.includes("spotify.com") && 
            !msg.text.includes("youtu") &&
            !msg.text.includes("github")) {
            await bot.send(msg.conversation_id, `${await bot.insult()} (Posting links is not allowed)`, [{
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }]);
            await bot.deleteMessage(msg.conversation_id, msg.id);
            return false;
        }
    };
    return true;
}