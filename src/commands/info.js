module.exports = {
    description : "Introduces and explains what Featherbeard is and how you can learn more about him.",
    usage : "!info",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        let text = "Ahoy! I be Captain Featherbeard, the mighty matey in charge of keepin' order and managin' groups. Should ye need to reach me savvy developer, send a message to him here: https://groupme.com/contact/93645911/a2jufjEF";
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            }
        ]);
    }
};