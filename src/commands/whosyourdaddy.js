module.exports = {
    alias : ["dev", "credits"],
    description : "Credits the developer.",
    usage : "!whosyourdaddy",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let text = "I be crafted and kept shipshape by the skilled hand of Captain Alureon. If ye wish to parley with him, send a DM here: https://groupme.com/contact/93645911/a2jufjEF";
        if (msg.sender_id === "93645911") {
            text = "Why, ye be the mighty captain steerin' me ship, of course! Arrr, the helm be in capable hands!!";
        }
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};