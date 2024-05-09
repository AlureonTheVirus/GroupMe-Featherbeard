module.exports = async (bot, msg) => {
    // delete messages if sender is muted
    if (bot.muted.includes(msg.user_id)) {
        bot.deleteMessage(msg.conversation_id, msg.id);
        return false;
    };
    return true;
}