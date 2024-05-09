module.exports = {
    alias : [],
    description : "Reverses a group action via a reply to a system message.",
    usage : "!undo [reply]",
    args : 0,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 0,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let reply = msg.attachments.find(o => o.type === 'reply');
        if (!reply) {
            await bot.send(msg.conversation_id, "Ye never specified a GroupMe system message to undo!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        };

        reply = await bot.getMessageById(msg.conversation_id, reply.reply_id);

        if (reply.sender_type !== "system") {
            await bot.send(msg.conversation_id, "That be a message alright, but it's not one I can undo!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        };

        if (reply.event.type === "membership.notifications.removed") {
            await bot.addUser(msg.parent_id, reply.event.data.removed_user.id, reply.event.data.removed_user.nickname);
        } else if (reply.event.type === "membership.announce.added") {
            for (let user in reply.event.data.added_users) {
                await bot.removeUser(msg.parent_id, `${reply.event.data.added_users[user].id}`);
            };
        } else {
            await bot.send(msg.conversation_id, "That be a system message alright, but it's not one I am able to undo right now!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        };
    }
};