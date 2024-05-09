module.exports = {
    alias : [],
    description : "Gives magical insight to mundane yes or no questions.",
    usage : "!8ball [question]",
    args : 1,
    roles : "all",
    channels : "group",
    requiresAuth : 1,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        const positive = [
            "Si.",
            "Sure, why not? Life is a mystery.",
            "Without a doubt, if the moon is full.",
            "Yes, now leave me alone.",
            "Sure.",
            "Why not.",
            "It is certain.",
            "It is decidedly so.",
            "Without a doubt.",
            "Yes definitely.",
            "You may rely on it.",
            "As I see it, yes.",
            "Most likely.",
            "Outlook good.",
            "Yes.",
            "Signs point to yes.",
            "Search your Feelings. You know it to be true.",
        ];
        const nutral = [
            "That sounds like a question for a crystal ball.",
            "Do I look like a wizard to you?",
            "The Magic Fluid Needs Replacement.",
            "You know I’m not actually magic right? I’m just a piece of plastic floating in alcohol, with prewritten responses embossed on the sides.",
            "Mayhaps.",
            "Go away. I need sleep.",
            "I was wondering that too...",
            "No comprende. Hable espanol.",
            "Sorry. That's classified.",
            "SHHH!! It's a secret.",
            "Signs point to pizza.",
            "Wouldn't you like to know?",
            "Get yourself together and ask again.",
            "Hey, leave me out of this!",
            "You don't want to know, trust me.",
            "Yes! I mean no! Wait...", 
            "I'm not nearly omnipotent enough for this.",
            "Whether I tell you yes or no, all I truly reveal is which one you were hoping for.",
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
        ];
        const negative = [
            "As likely as I'm a dinosaur.",
            "Nada.",
            "Don’t count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful.",
            "No.",
            "Of course not.",
            "naw",
        ];
        const bannedWords = [
            "peg",
            "shit",
            "fuck",
            "cum",
            "minor",
            "impregnate",
            "minors",
            "dildo",
            "porn",
            "strap",
            "rape",
            "rapes",
            "raping",
            "raped",
            "ass",
            "wank",
            "jerk",
            "suck",
            "attack",
            "dick",
            "cock",
            "balls",
            "consent",
            "pussy",
            "boom",
            "hurt",
            "drown",
            "strangle",
            "burn",
            "bomb",
            "kill",
            "killed",
            "shoot",
            "choke",
            "gay",
            "homo",
            "bi",
            "trans",
            "kms",
            "hurt",
            "idiot",
            "die",
            "stab",
            "kms",
            "idiot",
            "suicide",
            "dead",
            "died",
            "care",
            "cared",
            "sh",
            "harm",
            "selfharm",
            "homophobic",
            "homophobe",
            "crash",
            "hit",
            "cut",
            "self-harm"
        ];

        let text;
        if (args.some(element => bannedWords.includes(element.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')))) {
            text = "Apologies me heartie, but I can't entertain queries that be rude or touch upon violence or harm to oneself. Lets keep the seas civil and shipshape, aye?"
            await bot.send(msg.conversation_id, text, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            return;
        }

        let response;
        const chance = Math.random();
        if (chance < .33) {
            response = positive[Math.floor(Math.random()*positive.length)]
        } else {
            if (chance < .67) {
                response = nutral[Math.floor(Math.random()*nutral.length)]
            } else {
                response = negative[Math.floor(Math.random()*negative.length)]
            }
        }

        text = `*Shakes the 8 ball* Aye, me magic ball be sayin': "${response}" 🎱.`;
        await bot.send(msg.conversation_id, text, [
            {
                "type": "reply",
                "reply_id": msg.id,
                "base_reply_id": msg.id
            }
        ]);
    }
};