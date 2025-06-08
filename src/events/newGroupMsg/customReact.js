module.exports = async (bot, msg) => {
    // custom reactions
    const reactsRegex = /:(.*?):/g;
    let matches = [];
    let match;
    while ((match = reactsRegex.exec(msg.text)) !== null) {
        matches.push(match[1]); // match to text between the ::
    }

    const reactions = {
        "shrug": {
            type: "text",
            data: "¯\\_(ツ)_/¯",
        },
        "confusion": {
            type: "image",
            data: "https://featherbeard.alureon.dev/img/confusion.gif"
        },
        "yay": {
            type: "image",
            data: "https://featherbeard.alureon.dev/img/yay.gif"
        }
    };

    for (let i = 0; i < matches.length; i++) {
        if (Object.keys(reactions).includes(matches[i])) {
            if (reactions[matches[i]].type === "text") {
                await bot.send(msg.conversation_id, reactions[matches[i]].data, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    }
                ]);
            } else if (reactions[matches[i]].type === "image") {
                const imgURL = await bot.getImgURL(reactions[matches[i]].data);
                await bot.send(msg.conversation_id, "⠀", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                    {
                        "type": "image",
                        "url": imgURL
                    }
                ]);
            };
        };
    };
    return true;
}