module.exports = {
    alias : [],
    description : "Begins the process of adding Featherbeard to any of your groups",
    usage : "!setup",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 10000,
    execute : async (bot, args, msg) => {
        if (msg.conversationType === "group") {
            let text = "Avast! Cast yer gaze upon yer direct messages, for Featherbeard hath dispatched instructions on the next course of action. Navigate wisely, me heartie!";
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        }
        if (!await bot.verifyAuthStatus(msg.user_id)) {
            let text = "Ahoy there! Pleasure to make yer acquaintance! I be Captain Featherbeard, a GroupMe moderation bot. But, before ye invite me to join yer chats, ye need to authorize me as an application with yer account. Begin the process by signin' in here: https://featherbeard.alureon.dev/auth/. Fair winds to ye, matey!";
            await bot.sendDirectMessage(msg.user_id, text, []);
        } else {
            let text = "Arr, it seems ye've already tethered GroupMe to yer Featherbeard account! Ye can now welcome me aboard any of yer chats.\n\nUse '!join [group_share_link]' to add me to any chat you own automatically.";
            await bot.sendDirectMessage(msg.user_id, text, []);
        }
    }
};