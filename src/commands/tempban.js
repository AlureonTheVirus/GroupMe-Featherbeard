module.exports = {
    alias : [],
    description : "Temporarily remove a user from the group, then add them back.",
    usage : "!tempban [@mention/reply] [y mo d h m s] [reason]",
    args : 1,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 1,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        const stripMentions = (string, ranges) => {
            let result = '';
            let index = 0;

            for (let range of ranges) {
                let start = range[0];
                let end = range[0]+ range[1];

                result += string.slice(index, start);

                index = end + 1;
            };

            result += string.slice(index);

            return result;
        };

        let mentions = msg.attachments.find(o => o.type === 'mentions');
        let text = stripMentions(msg.text, mentions.loci);

        args = text.split(" ").slice(1);

        const pattern = /^[0-9]+[smhdroy]$/;

        let times = [];
        let iterations = 0;
        for (let i = 0; i < args.length; i++) {
            if (pattern.test(args[i])) {
                times.push(args[i]);
                args.splice(i, 1);
                iterations++;
            } else {
                break;
            };
        }

        let duration = 0;
        for (let time of times) {
            let unit = time.charAt(time.length - 1).toLowerCase();
            let num = parseFloat(time.replace(/\D/g, ''));

            if (isNaN(num) || num <= 0) {
                await bot.send(msg.conversation_id, `Invalid length of time. Please specify a number followed by its unit. I.e: 15 minutes = 15m, supported units are: s, m, h, d, mo, and y.`, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id,
                    }
                ]);
                return;
            }

            if (unit === "y" || unit === "r") {
                duration += num*1000*60*60*24*30*12;
            } else if (unit === "o") {
                duration += num*1000*60*60*24*30;
            } else if (unit === "d") {
                duration += num*1000*60*60*24;
            } else if (unit === "h") {
                duration += num*1000*60*60;
            } else if (unit === "m") {
                duration += num*1000*60;
            } else if (unit === "s") {
                duration += num*1000;
            }
        };

        if (duration === 0) duration = 30*1000*60; // default to 30m if no time is set.

        const reason = args.join(" ");

        let attachments = msg.attachments;
        let ids = attachments.find(o => o.type === 'mentions');
        let reply = attachments.find(o => o.type === 'reply');

        if (ids) {
            ids = ids.user_ids;
            if (reply) {
                ids.push(reply.user_id);
            };
        } else {
            if (reply) {
                ids = [reply.user_id];
            } else {
                await bot.send(msg.conversation_id, "Ye forgot to name a shipmate!", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                ]);
                return;
            };
        };

        ids = Array.from(ids, x => `${x}`);
        if (ids.includes(bot.user_id)) {
            text = `Ye can't heave-ho Featherbeard off the plank of this here group. This ol' pengin pirate be stayin' put!`;
            await bot.send(msg.conversation_id, text, []); 
        }

        for (i = 0; i < ids.length; i++) {
            await bot.removeUser(msg.parent_id, ids[i]);
            if (reason) {
                await bot.sendDirectMessage(ids[i], `You have been temporarily removed from the chat for ${times.join(" ")} for reason: "${reason}".`);
            } else {
                await bot.sendDirectMessage(ids[i], `You have been temporarily removed from the chat for ${times.join(" ")}.`);
            };
        };

        await bot.send(msg.conversation_id, `${ids.length} member(s) have been temporarilly banned for ${times.join(" ")}.`);
    
        await new Promise(resolve => setTimeout(resolve, duration));

        for (i = 0; i < ids.length; i++) {
            await bot.addUser(msg.group_id, ids[i]);
        };

        await bot.send(msg.parent_id, `${ids.length} member(s) have been readded to the group after being banned for ${times.join(" ")}.`);
    }
};