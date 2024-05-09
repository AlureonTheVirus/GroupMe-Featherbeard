const axios = require("axios");
const fs = require('fs');
const {helperbottoken} = require("../../config.json");

const token = helperbottoken;
const baseurl = "https://api.groupme.com/v3";
const authedUsers = JSON.parse(fs.readFileSync("./src/cache/connectedUsers.json", 'utf8'));

var blacklist = {}

module.exports = {
    alias : [],
    description: "Purges all users on Featherbeard's blacklist from the group.",
    usage: "!purge",
    args: 0,
    roles: ["admin", "owner"],
    channels: "group",
    requiresAuth: 1,
    cooldown: 15000,
    execute: async (bot, args, msg) => {
        let manualList = [{
                id: "114540744",
                name: "Gavin Kent",
            },
            {
                id: "119426908",
                name: "søulsearch",
            },
        ];

        let res = await axios.get(baseurl + '/groups?token=' + token);
        let groups = res.data.response;

        for (var i = 0; i < groups.length; i++) {
            for (var j = 0; j < groups[i].members.length; j++) {
                blacklist[groups[i].members[j].user_id] = {
                    user_id: groups[i].members[j].user_id,
                    name: groups[i].members[j].name,
                    reason: `Blacklisted automatically due to association with the group ${groups[i].name}`,
                    time: Date.now()
                }
            }
        }

        for (const user in authedUsers) {
            delete blacklist[user];
        }

        for (var i = 0; i < manualList.length; i++) {
            blacklist[manualList[i].id] = {
                user_id: manualList[i].id,
                name: manualList[i].name,
                reason: `Blacklisted Manually.`,
                time: Date.now()
            }
        }

        delete blacklist["118825642"];
        delete blacklist["120949756"];
        delete blacklist[bot.user_id];

        fs.writeFileSync("./src/cache/blacklist.json", JSON.stringify(blacklist, null, 4), 'utf8');

        let text = `Aye aye, Captain! Time to give the order for a grand purge--clearin' the decks of all those blacklisted scoundrels!`;
        await bot.send(msg.conversation_id, text, [{
            "type": "reply",
            "reply_id": msg.id,
            "base_reply_id": msg.id
        }]);

        let changes = ["A summery of purged users are as follows:\n"];

        res = await axios.get(baseurl + `/groups/${msg.parent_id}?token=` + bot.token);
        let members = res.data.response.members;

        let count = 0;
        let failedcount = 0;
        for (const user in blacklist) {
            for (i = 0; i < members.length; i++) {
                if (members[i].user_id === user) {
                    try {
                        await axios.post(`${baseurl}/groups/${msg.parent_id}/members/${members[i].id}/remove?token=${bot.token}`, {
                            membership_id: members[i].id
                        });

                        changes.push(`• Removed ${members[i].name}. Reason: ${blacklist[user].reason}`);
                        count++;
                    } catch {
                        changes.push(`• Failed to remove user: '${blacklist[user].name}'.`);
                        failedcount++;
                    }
                }
            }
        }

        let total = count + failedcount;
        if (total > 0) {
            if (failedcount > 0) {
                text = `Successfully scrubbed ${count} of ${total} shipmate(s) from the deck. Alas ${failedcount} fellow sailors(s) resisted removal due to unforseen troubles on the high seas. (Make sure Featherbeard has admin permissions and that the blacklisted users are not also admins in the chat.)`;
                await bot.send(msg.conversation_id, text, []);
            } else {
                text = `Successfully scrubbed ${count} of ${total} shipmate(s) from the deck.`;
                await bot.send(msg.conversation_id, text, []);
            }
            await bot.send(msg.conversation_id, changes.join("\n"), []);
        } else {
            text = `Arr matey, it be a calm sea for now--no blacklisted scallywags in sight to remove. Give it another shot when the tides be more turbulent!`;
            await bot.send(msg.conversation_id, text, []);
        }
    }
};