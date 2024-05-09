module.exports = {
    alias : [],
    description : "Adds me to any of your chats with a link!",
    usage : "!join [group_share_link]",
    args : 0,
    roles : "all",
    channels : "dm",
    requiresAuth : 1,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        const link = args.join(" ");
        const id = link.match(/\/join_group\/(\d+)\/([^/]+)$/);
        let group_id;
        let share_token;
        if (!id) {
            let text = "Thats not a group share link! Try again.";
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
            return;
        }

        group_id = id[1];
        share_token = id[2];
        
        try {
            await bot.forceJoinGroup(group_id, msg.sender_id, share_token);
            let text = "I have joined your group. If you dont see me yet, check for a membership request.";
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        } catch (err) {
            let text = "For whatever reason I was unable to join your group. Double check that you are the owner and try again later.";
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        }

    }
};