const axios = require("axios");

module.exports = {
    alias : [],
    description : "Removes ALL members from a group.",
    usage : "!nuke",
    args : 0,
    roles : "dev",
    channels : "group",
    requiresAuth : 1,
    cooldown: 30000,
    execute : async (bot, args, msg) => {

        const res = await axios.get(`https://api.groupme.com/v3/groups/${msg.conversation_id}?token=${bot.token}`);
        const members = res.data.response.members;
        let count = 0;
        let fails = 0;
        for (let i = 0; i < members.length; i++) {
            if (members[i].user_id !== bot.user_id) {
                try {
                    await bot.removeMember(msg.conversation_id, members[i].id);
                    count++;
                } catch (err) {
                    text = err;
                    await bot.send(msg.conversation_id, text, []);
                    fails++;
                }
            }
        }

        if (fails > 0) {
            if (fails > count) {
                text = `Oi! There be some hiccups this run. Make sure I boast admin permissions and give the command another go.`;
                await bot.send(msg.conversation_id, text, []);
            }
            text = `Successfully scrubbed ${count} of ${ids.length} shipmate(s) from the deck. Alas ${fails} fellow sailors(s) resisted removal due to unforseen troubles on the high seas.`;
            await bot.send(msg.conversation_id, text, []);
        } else {
            text = `Successfully scrubbed ${count} of ${ids.length} shipmate(s) from the deck.`;
            await bot.send(msg.conversation_id, text, []);
        }
    }
};