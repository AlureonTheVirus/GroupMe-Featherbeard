const axios = require("axios");

module.exports = {
    description : "@mentions every user in the group so you can make announcments.",
    usage : "!everyone [message]",
    args : 0,
    roles : ["admin", "owner"],
    channels : "group",
    requiresAuth : 1,
    cooldown: 15000,
    execute : async (bot, args, msg) => {
        let members = [];
        let loci = [];
        let { data } = await axios.get(`https://api.groupme.com/v3/groups/${msg.conversation_id}?token=${bot.token}`);
        let memberList = data.response.members;

        for (let i = 0; i < memberList.length; i++) {
            members.push(memberList[i].user_id);
            loci.push([10, 18]);
        }

        await bot.send(msg.conversation_id, "Attention @everyone! ^^", [
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