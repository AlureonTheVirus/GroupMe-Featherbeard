const { nasakey } = require("../../config.json");

module.exports = {
    alias : [],
    description : "Sends NASA's astronomy photo of the day.",
    usage : "!nasa",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 60000,
    execute : async (bot, args, msg) => {
        let apod = await bot.axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasakey}`);
        if (apod.data.media_type === "video") {
            await bot.send(msg.conversation_id, `"${apod.data.title}" ${apod.data.date}\n${apod.data.url}`, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        } else {
            const imgURL = await bot.getImgURL(apod.data.hdurl);
            await bot.send(msg.conversation_id, `"${apod.data.title}" ${apod.data.date}`, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                },
                {
                    "type": "image",
                    "url": imgURL
                },
            ]);
        }
    }
};