const axios = require("axios");

module.exports = {
    description : "Finds the Urban Dictionary defininition for a given word.",
    usage : "!ud [word]",
    args : 1,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 30000,
    execute : async (bot, args, msg) => {
        let query = args.join(" ");
        let response = await axios.get(`http://api.urbandictionary.com/v0/define?term=${query}`);
        if (response.data.list[0]) {
            let def = response.data.list[0].definition.replace(/[\[\]]/g, '');
            let word = response.data.list[0].word.replace(/[\[\]]/g, '');
            let example = response.data.list[0].example.replace(/[\[\]]/g, '');
            let text = `This be the definition of '${word}'! (...according to Urban Dictionary)\n${def}\n\nExamples:\n${example}`
            if (text.length < 1000) {
                await bot.send(msg.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id,
                    }
                ]);
            } else {
                text = `Arr, the definition of ${query} be a lengthly tale fit for ye own exploration on the Urban Dictionary seas. Dive into the depths there to uncover it's meaning, me curious shipmate!`
                await bot.send(msg.conversation_id, text, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id,
                    }
                ]);  
            }

        } else {
            let text = `Ahoy! It appears that the term '${query}' be missing from the Urban Dictionary. No traces of the word in these waters.`
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        }
    }
};