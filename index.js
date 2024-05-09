const path = require("path");
const fs = require('fs');
const { port, flag, token } = require("./config.json");
const GroupMe = require("./src/groupme.js");
const crawler = require("./src/crawler.js");
const bot = new GroupMe(token);

const Main = async () => {
    process.on('SIGINT', () => {
        console.log(`\nInterrupt detected. Cleaning up. . .`);
        const tmp = "./src/cache/temp";
        for (const file of fs.readdirSync(tmp)) {
            fs.unlink(path.join(tmp, file), () => {});
        }
        process.exit(0);
    });
    
    console.log("Loading commands. . .");
    const commands = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js"));
    for (const file of commands) {
        bot.commands[file.split(".")[0]] = require(`./src/commands/${file}`);
    }

    console.log("Loading events. . .");
    const eventsPath = './src/events';
    const events = fs.readdirSync(eventsPath).filter(file => fs.statSync(eventsPath + '/' + file).isDirectory());
    for (const event in events) {
        const funcs = fs.readdirSync(`${eventsPath}/${events[event]}`).filter(file => file.endsWith(".js"));
        bot.events[events[event]] = {};
        for (const func in funcs) {
            bot.events[events[event]][funcs[func].split(".")[0]] = require(`${eventsPath}/${events[event]}/${funcs[func]}`);
        }
    };

    console.log("Awaiting WebSocket connection. . .");

    bot.once("ready", async () => {
        console.log(`WebSocket connected. Hosting webserver on port: ${port}.`);
        let groups = await bot.groups();
        console.log(`Featherbeard is currently managing ${groups.length} groups and has ${Object.keys(bot.authedUsers).length} users in his DB.`);
    });
    
    const addedToGroupHandler = async (msg) => {
        if (await bot.verifyAuthStatus(await bot.fetchOwnerId(msg.id))) {
            try {
                await bot.elevatePermissions(msg.id);
            } catch (err) {
                console.error(err);
                let text = "Shiver me timbers! It seems the gears in me machinery be grindin' to a halt. Unfortunately, I couldn't hoist meself up to the rank of admin on me own. Ye'll have to take the helm on this one and promote me manually. Give the order to raise me flag to the top -- make me admin, Captain!";
                await bot.send(msg.id, text, []);
            }
            let text = `Ahoy there, me hearties! I be Captain Featherbeard, the swashbucklin' penguin of moderation and group wranglin'! Delighted to set sail with yer fine crew! Give a squawk to '!help' if ye be needin' a map of me commands. Add me to any other group you have with '!setup' Fair winds and following seas, me mateys!`
            await bot.send(msg.id, text, []);
            await bot.muteGroup(msg.id);
        };
    };
    
    bot.on("ws", async (msg) => {
        const allowedTypes = ["membership.create", "line.create", "direct_message.create"];
        if (!allowedTypes.includes(msg.type)) return;
        if (msg.type === "membership.create") {
            await addedToGroupHandler(msg);
            return;
        };
        if (!msg.conversationType) return;
        if (msg.user_id === bot.user_id || msg.sender_type !== "user") return;
        if (!msg.text) return;
    
        if (msg.text.startsWith(flag) && !bot.muted.includes(msg.user_id)) {
            const type = bot.events["commandRecieved"];
            if (!await type["commandHandler"](bot, msg)) return;
        } else {   
            if (msg.conversationType === "group") {
                const type = bot.events["newGroupMsg"];

                if (!await type["deleteSlurs"](bot, msg)) return;
                if (!await type["handleMutes"](bot, msg)) return;
                if (!await type["likeMsgs"](bot, msg)) return;
                if (!await type["guidLog"](bot, msg)) return;

                if (await bot.verifyAuthStatus(msg.user_id)) {
                    if (!await type["awardXP"](bot, msg)) return;
                    if (!await type["customReact"](bot, msg)) return;
                } else {
                    if (!await type["deleteLinks"](bot, msg)) return;
                }
            } else {
                // executes on a new direct message...
            }
        };
    });
};

Main();