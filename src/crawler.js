const events = require('events');
var fs = require('fs');
const faye = require('faye');
const axios = require('axios');

const v3 = "https://api.groupme.com/v3"

let groups = {};
let connections = JSON.parse(fs.readFileSync("./src/cache/connectedUsers.json", 'utf8'));

module.exports = async () => {
    console.log("fetching groups...");
    for (const user in connections) {
        try {
            let acc = await axios.get(`${v3}/users/me?token=${connections[user].token}`);
            let { data } = await axios.get(`${v3}/groups?per_page=500&token=${connections[user].token}`);
            data = data.response;
            for (let i = 0; i < data.length; i++) {
                if (!Object.keys(groups).includes(data[i].id)) {
                    let memberArr = [];
                    for (let member of data[i].members) {
                        memberArr.push(member.user_id);
                    }
                    groups[data[i].id] = {
                        "indexedBy": acc.data.response.user_id,
                        "id": data[i].id,
                        "name": data[i].name,
                        "url": data[i].share_url,
                        "image": data[i].image_url,
                        "members": memberArr
                    }
                };
            };

        } catch (err) {
            console.log(err.response);
        }
    }
    fs.writeFileSync("./src/cache/groups.json", JSON.stringify(groups, null, 2), 'utf8');
    console.log("DB contains", Object.keys(groups).length, "groups");
};

