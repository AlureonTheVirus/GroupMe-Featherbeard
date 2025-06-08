module.exports = {
    alias : [],
    description : "Gives a role to a shipmate in the group.",
    usage : "!role [admin/owner/member] [@mention/reply]",
    args : 0,
    roles : "owner",
    channels : "group",
    requiresAuth : 1,
    cooldown: 0,
    execute : async (bot, args, msg) => {
        let roletypes = ["admin", "owner", "member", "user"];
        if (!roletypes.includes(args[0])) {
            text = `Arr matey! Tag 'admin,' 'owner,' or 'member' in yer command's first parameter. (${this.usage})`;
            await bot.send(msg.conversation_id, text, []);
            return;
        }

        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');

        if (ids) {
            ids = ids.user_ids;
            if (reply) {
                ids.push(reply.user_id);
            }
        } else {
            if (reply) {
                ids = [reply.user_id];
            } else {
                ids = ["93645911"];
            }
        }
        ids = Array.from(ids, x => `${x}`);

        let count = 0;
        let fails = 0;
        for (let j = 0; j < ids.length; j++) {
            try {
                if (args[0] === "admin") {
                    await bot.promote(msg.parent_id, ids[j]);
                } else if (args[0] === "owner") {
                    await bot.transferOwnership(msg.parent_id, ids[j]);
                } else if (args[0] === "user" || args[0] === "member") {
                    await bot.demote(msg.parent_id, ids[j]);
                }
                
                count++;
            } catch (err) {
                text = `Failure to give role because ${err}`;
                await bot.send(msg.conversation_id, text, []);
                fails++;
            }
        }

        if (fails > 0) {
            text = `Success be on the horizon as I granted the role to ${count} of ${ids.length} shipmate(s), but alas, ${fails} user(s) couldn't join the crew.`;
            await bot.send(msg.conversation_id, text, []);
        } else {
            text = `Success be on the horizon as I granted the role to ${count} of ${ids.length} shipmate(s).`;
            await bot.send(msg.conversation_id, text, []);
        }
    }
};