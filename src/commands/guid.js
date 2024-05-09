module.exports = {
    alias : [],
    description : "Reports the GUID of a message given a reply.",
    usage : "!guid [reply]",
    args : 0,
    roles : "hidden",
    channels : "group",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        let reply = msg.attachments.find(o => o.type === 'reply');
        if (!reply) {
            await bot.send(msg.conversation_id, "Ye never replied to a message!", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
            return;
        };

        reply = await bot.getMessageById(msg.conversation_id, reply.reply_id);
        let res;
        const andReg = /android-[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/
        const webReg = /[a-f0-9]{32}/
        const iOSReg = /[A-F0-9]{8}(-[A-F0-9]{4}){3}-[A-F0-9]{12}/
    
        if (andReg.test(reply.source_guid)) {
            res = `GUID: ${reply.source_guid} (Android)`;
        } else if (webReg.test(reply.source_guid)) {
            res = `GUID: ${reply.source_guid} (Web)`;
        } else if (iOSReg.test(reply.source_guid)) {
            res = `GUID: ${reply.source_guid} (iOS)`;
        } else {
            res = `Unknown GUID: ${reply.source_guid}`;
        };
        
        await bot.send(msg.conversation_id, res, [
            {
                "type": "reply",
                "reply_id": reply.id,
                "base_reply_id": reply.id,
            }
        ]);
    }
};