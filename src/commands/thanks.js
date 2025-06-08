module.exports = {
    alias : ["thank", "thankyou"],
    description : "Thanks Featherbeard for all of his hard work",
    usage : "!thanks",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        const yw = [
            "Arr, 'twas nothin', matey!",
            "Ye be welcome aboard me ship, me hearty!",
            "Think nothin' of it, ye scurvy dog!",
            "Aye, 'tis me pleasure, ye landlubber!",
            "Don't mention it, ye bilge rat!",
            "Anytime, ye salty sea dog!",
            "Ye be welcome as the wind in me sails!",
            "Arr, 'tis a small deed for a buccaneer like meself!",
            "Glad to be of service, ye sea scallywag!",
            "Ye owe me nothin', but yer thanks be appreciated, matey!",
            "Arrr, 'tis but a trifle, me hearty!",
            "Ye be welcome to plunder me gratitude, matey!",
            "Fair winds and a hearty welcome to ye!",
            "Ye be as welcome as gold doubloons in me treasure chest!",
            "No need for thanks, 'tis all part of the pirate's code!",
            "Ye be welcome to share the spoils of me goodwill!",
            "Aye, 'twas a mere drop in the ocean of me kindness!",
            "Ye be welcome aboard the ship of gratitude, me bucko!",
            "Arrr, 'twas me pleasure to assist ye on yer journey!",
            "May yer sails catch the wind of appreciation, me hearties!"
        ];

        let text = yw[Math.floor(Math.random()*yw.length)]
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};