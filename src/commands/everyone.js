const axios = require("axios");

module.exports = {
    alias : [],
    description : "@mentions every user in the group for an announcment.",
    usage : "!everyone [message]",
    args : 0,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 1,
    cooldown: 15000,
    execute : async (bot, args, msg) => {
        const message = args.join(" ");
        let members = [];
        let loci = [];
        const { data } = await axios.get(`https://api.groupme.com/v3/groups/${msg.conversation_id}?token=${bot.token}`);
        const memberList = data.response.members;

        for (let i = 0; i < memberList.length; i++) {
            members.push(memberList[i].user_id);
            loci.push([10, 9]);
        }

        await bot.send(msg.conversation_id, `Attention @everyone, ${msg.name} has made an announcement! Here it is:\n\n"${message}"`, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            },
            {
                "type": "mentions",
                "user_ids": members,
                "loci": loci
            }
        ]);
    }
};