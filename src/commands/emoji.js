module.exports = {
    alias : [],
    description : "Responds with an emoji",
    usage : "!emoji [pack] [index]",
    args : 2,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let text = "";
        let charmap = [];
        let pack_id;
        let pack_name;
        if (Object.keys(bot.emoji).includes(args[0])) {
            pack_id = bot.emoji[args[0]].pack_id;
            pack_name = args[0];
        } else if (parseInt(args[0]) !== null && parseInt(args[0]) <= Object.keys(bot.emoji).length + 1) {
            pack_id = parseInt(args[0]);
            pack_name = Object.keys(bot.emoji)[parseInt(args[0])-1];
        } else {
            text = "You didn't specify an emoji pack!"
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                },
            ]);
            return;
        };

        if (parseInt(args[1]) !== null && parseInt(args[1]) <= bot.emoji[pack_name].last_index) {
            text = "A"
            charmap = [ [pack_id, parseInt(args[1])] ];
        } else {
            for (let i = 0; i < bot.emoji[pack_name].last_index; i++) {
                text += "A";
                charmap.push([ pack_id, i ]);
            }
        }

        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            },
            {
                "type": "emoji",
                "charmap": charmap,
                "placeholder": "A"
            }
        ]);
    }
};