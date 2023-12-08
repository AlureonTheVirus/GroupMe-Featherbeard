const axios = require("axios");

module.exports = {
    description : "Removes ALL members from a group.",
    usage : "!nuke",
    args : 0,
    roles : "dev",
    channels : "all",
    requiresAuth : 1,
    cooldown: 30000,
    execute : async (bot, args, msg) => {

        const res = await axios.get(`https://api.groupme.com/v3/groups/${msg.conversation_id}?token=${bot.token}`);
        const members = res.data.response.members;
        let count = 0;
        let fails = 0;
        for (let i = 0; i < members.length; i++) {
            if (members[i].user_id !== "116121837") {
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

        if (fails > count) {
            text = `There were errors this run. Double check that Sputnik has admin permissions and try using this command again.`;
            await bot.send(msg.conversation_id, text, []);
        }

        text = `Finished removing ${count} of ${members.length - 1} user(s). Failed to remove ${fails} of ${members.length - 1} user(s) due to errors.`;
        await bot.send(msg.conversation_id, text, []);
    }
};