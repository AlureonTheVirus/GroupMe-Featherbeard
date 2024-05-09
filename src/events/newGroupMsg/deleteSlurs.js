module.exports = async (bot, msg) => {
    // delete message if it contains certain slurs
    const wordsToDel = [
        "nigger",
        "nigga",
        "fag",
        "faggot",
        "retard"
    ];
    if (msg.text.toLowerCase().replace(/[^a-z0-9\s]|s/g, "").split(" ").some(item => wordsToDel.includes(item))) {
        await bot.deleteMessage(msg.conversation_id, msg.id);
        return false;
    };
    return true;
};