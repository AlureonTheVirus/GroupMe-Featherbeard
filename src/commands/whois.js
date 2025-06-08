module.exports = {
    alias : ["whoami"],
    description : "Shares some brief technical info about yourself or someone else.",
    usage : "!whois [@mention/reply]",
    args : 0,
    roles : "all",
    channels : "group",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let perms = await bot.fetchPermissions(msg.parent_id, bot.user_id);
        if (perms === "member") {
            let text = "Arr! I need admin permissions to execute that command!"
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            return;
        }

        let member = {};
        member.user_id = msg.user_id;

        let ids = msg.attachments.find(o => o.type === 'mentions');
        let reply = msg.attachments.find(o => o.type === 'reply');

        if (ids) {
            member.user_id = `${ids.user_ids[0]}`;
        } else if (reply) {
            member.user_id = `${reply.user_id}`;
        }

        try {
            let {active, all} = await bot.getMemberList(msg.parent_id);
            member.active_total = active.length;
            member.all_total = all.length;
            if (msg.user_id === "93645911") console.log(all);
            for (const i in active) {
                if (active[i].user_id === member.user_id) member.active_pos = parseInt(i) + 1;
            }
            for (const i in all) {
                if (all[i].user_id === member.user_id) {
                    member.overal_pos = parseInt(i) + 1;
                    member.name = all[i].name;
                    member.nickname = all[i].nickname;
                    member.id = all[i].id;
                }
            }
        } catch (err) {
            console.log(err);
        }

        let text;
        if (!member.active_pos) member.active_pos = "N/A"

        text = `Here be some info about ${member.name}:\nUser ID: ${member.user_id}\nMember ID: ${member.id}\nAlias: ${member.nickname}\nCurrent Join Rank: #${member.active_pos}/${member.active_total}\nOverall Join Rank: #${member.overal_pos}/${member.all_total}\n`;
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);

    }
};