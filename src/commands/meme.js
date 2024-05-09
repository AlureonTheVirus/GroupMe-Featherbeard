module.exports = {
    alias : [],
    description : "Posts a random meme.",
    usage : "!meme",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 10000,
    execute : async (bot, args, msg) => {

        let res;
        let nsfw = true;
        while (nsfw) { // fetch a meme until you get one thats not nsfw
            res = await bot.axios.get("https://meme-api.com/gimme");
            nsfw = res.data.nsfw;
        };

        const imgURL = await bot.getImgURL(res.data.url);
        await bot.send(msg.conversation_id, "⠀", [
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