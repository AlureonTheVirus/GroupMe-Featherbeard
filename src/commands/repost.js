const ytdl = require('ytdl-core');
const fs = require('fs');

module.exports = {
    alias : [],
    description : "Reposts a YouTube video given its URL.",
    usage : "!repost [link]",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 90000,
    execute : async (bot, args, msg) => {
        const noLink = async () => {
            await bot.send(msg.conversation_id, `Ahoy! I couldn't find a YouTube link in that message! Try "!repost [link]" or reply "!repost" to a message containing a video URL.`, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        };

        const ytreg = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?/g
        const repost = async (message) => {
            let matches = message.text.match(ytreg);
            if (matches.length < 1) { await noLink(); return };
            
            let match = matches[0];
            const path = `./src/cache/temp/v_${new Date().getTime()}.mp4`;

            const video = ytdl(match, { quality: 'lowest', filter: format => format.container === 'mp4'});
            await bot.send(msg.conversation_id, "Searching for the video on YouTube... (This may take a moment).", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            video.pipe(fs.createWriteStream(path));

            video.on('end', async () => {
                try {
                    let data = await bot.uploadVideo(path, msg.conversation_id);
                    await bot.send(msg.conversation_id, "⠀", [
                        {
                            "type": "reply",
                            "reply_id": message.id,
                            "base_reply_id": message.id
                        },
                        {
                            "type":"video",
                            "url": data.url,
                            "preview_url": data.thumbnail_url
                        }
                    ]);
                    fs.unlink(path, () => {});
                } catch (error) {
                    console.log(error);
                    await bot.send(msg.conversation_id, "Arr! I couldn't upload that video to GroupMe. Try again later.", [
                        {
                            "type": "reply",
                            "reply_id": msg.id,
                            "base_reply_id": msg.id
                        },
                    ]);
                }
            });

            video.on('error', async (error) => {
                try {
                    fs.unlink(path, () => {});
                } catch {}
                console.log(error);
                await bot.send(msg.conversation_id, "Arr! I couldn't find that video (It may be unavailable).", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                ]);
            });
        };
        
        let reply = msg.attachments.find(o => o.type === 'reply');
        if (reply) {
            await repost(await bot.getMessageById(msg.conversation_id, reply.reply_id));
        } else if (args.length > 0) {
            await repost(msg);
        } else {
            await noLink();
        }
    }
};