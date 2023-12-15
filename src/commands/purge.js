const axios = require("axios");
const fs = require('fs');
const { helperbottoken } = require("../../config.json");

const token = helperbottoken;
const baseurl = "https://api.groupme.com/v3";
const authedUsers = JSON.parse(fs.readFileSync("./src/cache/connectedUsers.json", 'utf8'));

//var blacklist = JSON.parse(fs.readFileSync("./cache/blacklist.json", 'utf8'));
var blacklist = {}

async function main() {
    const res = await axios.get(baseurl+'/groups?token='+token);
    const groups = res.data.response;
    for (var i = 0; i < groups.length; i++) {
        for (var j = 0; j < groups[i].members.length; j++) {
            blacklist[groups[i].members[j].user_id] = {
                user_id : groups[i].members[j].user_id,
                name : groups[i].members[j].name,
                reason: `Blacklisted automatically due to association with the group ${groups[i].name}.`,
                time: Date.now()
            }
        }
    }
    delete blacklist["118825642"]; // helperbot
    delete blacklist[bot.user_id]; // sputnik
    delete blacklist["117173298"]; // chey


    for (const user in authedUsers) {
        delete blacklist[user];
    }

    fs.writeFileSync("./cache/blacklist.json", JSON.stringify(blacklist, null, 4), 'utf8');
};

module.exports = {
    description : "Purges all users on Sputnik's blacklist from the group.",
    usage : "!purge",
    args : 0,
    roles : "owner",
    channels : "group",
    requiresAuth : 1,
    cooldown: 15000,
    execute : async (bot, args, msg) => {
        await main();
        let text = `Purging ALL members in my blacklist!`;
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);

        const { data } = await axios.get(baseurl+`/groups/${msg.parent_id}?token=`+bot.token);
        const members = data.response.members;
        let count = 0;
        let failedcount = 0;
        for (const user in blacklist) {
            for (i = 0; i < members.length; i++) {
                if (members[i].user_id === user) {
                    try {
                        await axios.post(`${baseurl}/groups/${msg.parent_id}/members/${members[i].id}/remove?token=${bot.token}`, {
                            membership_id : members[i].id
                        });
                        count++;
                    } catch {
                        text = `Failed to remove user: '${blacklist[user].name}'.`;
                        await bot.send(msg.conversation_id, text, []);
                        failedcount++;
                    }
                }
            }
        }
        if (count < failedcount) {
            text = `There were a significant number of failures this run. Try double checking that Sputnik has admin permissions and running the command again.`;
            await bot.send(msg.conversation_id, text, []);
        }
        text = `Purge complete. ${count} user(s) removed. failed to remove ${failedcount} blacklisted user(s).`;
        await bot.send(msg.conversation_id, text, []);
    }
};