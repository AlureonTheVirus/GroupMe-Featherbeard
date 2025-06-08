module.exports = {
    alias : [],
    description : "caches stats for a group.",
    usage : "!checkpoint",
    args : 0,
    roles : "dev",
    channels : "group",
    requiresAuth : 1,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        let group = await bot.getGroupById(msg.group_id);

        console.log(group);

        let lastCheck;
        if (!bot.checkpoints[msg.group_id]) {
            lastCheck = null;
        } else {
            lastCheck = bot.checkpoints[msg.group_id];
        }


        bot.checkpoints[msg.group_id] = {
            memberCount: group.members_count,
            messagesCount: group.messages.count,
            time: Date.now()
        };

        if (!lastCheck) {
            let text = `No previous checkpoints! Saving this one:\nTime: ${bot.checkpoints[msg.group_id].time},\nMember Count: ${bot.checkpoints[msg.group_id].memberCount}\nMessages Count: ${bot.checkpoints[msg.group_id].messagesCount}`;
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                },
            ]);
            return;
        };

        let netMembers = bot.checkpoints[msg.group_id].memberCount - lastCheck.memberCount;
        let netMessages = bot.checkpoints[msg.group_id].messagesCount - lastCheck.messagesCount;
        let timeDifference = ((bot.checkpoints[msg.group_id].time - lastCheck.time) / 1000 / 60 / 60).toFixed(2);

        let membersChangeType = "increased";
        if (netMembers < 0) membersChangeType = "decreased";

        let text = `Checkpoint saved. Memberships have ${membersChangeType} by ${Math.abs(netMembers)} and there have been ${netMessages} new messages over the last ${timeDifference} hour/s.`
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id,
            },
        ]);

    }
};