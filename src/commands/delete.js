module.exports = {
    alias : ["del"],
    description : "Delete a given message.",
    usage : "!delete [reply]",
    args : 0,
    roles : "all",
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let role = await bot.fetchPermissions(msg.parent_id, msg.user_id);
        let reply = msg.attachments.find(o => o.type === 'reply');

        if (!reply) {
            await bot.send(msg.conversation_id, "Ye never replied to a message!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        }

        if (role == "member") {
            if (reply.user_id !== bot.user_id && reply.user_id !== msg.user_id) {
                await bot.send(msg.conversation_id, "Non-admins can only delete their own messages and me own responses!", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                ]);
                return;
            }

        }
        if (!await bot.deleteMessage(msg.conversation_id, reply.reply_id)) {
            await bot.send(msg.conversation_id, "Arr! I couldn't delete that message! Make sure I'm an admin and try again!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
        }
        

    }
};