module.exports = {
    alias : [],
    description : "Fetch a comic from xkcd.com (defaults to the latest one)",
    usage : "!xkcd [random/#]",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 15000,
    execute : async (bot, args, msg) => {
        let comic = await bot.axios.get(`https://xkcd.com/info.0.json`);
        if (args[0] === "random") {
            const random = Math.floor(Math.random() * comic.data.num + 1);
            comic = await bot.axios.get(`https://xkcd.com/${random}/info.0.json`);
        } else if (parseInt(args[0]) !== NaN  && args[0]) {
            comic = await bot.axios.get(`https://xkcd.com/${args[0]}/info.0.json`);
        }

        const imgURL = await bot.getImgURL(comic.data.img);
        await bot.send(msg.conversation_id, `${comic.data.month}/${comic.data.day}/${comic.data.year}: "${comic.data.title} (#${comic.data.num})" -- ${comic.data.alt}`, [
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
};