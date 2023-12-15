module.exports = {
    description : "Introduces and explains what Sputnik is and how you can learn more about him.",
    usage : "!info",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        let text = "Hi there! I'm Sputnik, a moderation and group management bot. If you want to add me to your own group or track my development process, feel free to join my announcement group to learn more! https://groupme.com/join_group/97959291/liv9t8r8.";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
    }
};