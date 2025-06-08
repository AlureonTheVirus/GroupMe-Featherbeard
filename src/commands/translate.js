const { translate } = require('@vitalets/google-translate-api');

module.exports = {
    alias : ["t"],
    description : "Translate a given message, defaults to english.",
    usage : "!translate [lang] [reply]",
    args : 0,
    roles : "all",
    channels : "group",
    requiresAuth : 0,
    cooldown: 5000,
    execute : async (bot, args, msg) => {
        const replyAttachment = msg.attachments.find(o => o.type === 'reply');
        const reply = await bot.getMessageById(msg.conversation_id, replyAttachment.reply_id);
        if (!reply) return;

        const langs = {
            "afrikaans":"af",
            "albanian":"sq",
            "amharic":"am",
            "arabic":"ar",
            "armenian":"hy",
            "assamese":"as",
            "aymara":"ay",
            "azerbaijani":"az",
            "bambara":"bm",
            "basque":"eu",
            "belarusian":"be",
            "bengali":"bn",
            "bhojpuri":"bho",
            "bosnian":"bs",
            "bulgarian":"bg",
            "catalan":"ca",
            "cebuano":"ceb",
            "chinese":"zh-CN",
            "chinese (simplified)":"zh-CN",
            "zh":"zh-CN",
            "chinese (traditional)":"zh-TW",
            "corsican":"co",
            "croatian":"hr",
            "czech":"cs",
            "danish":"da",
            "dhivehi":"dv",
            "dogri":"doi",
            "dutch":"nl",
            "english":"en",
            "esperanto":"eo",
            "estonian":"et",
            "ewe":"ee",
            "filipino":"fil",
            "finnish":"fi",
            "french":"fr",
            "frisian":"fy",
            "galician":"gl",
            "georgian":"ka",
            "german":"de",
            "greek":"el",
            "guarani":"gn",
            "gujarati":"gu",
            "haitian creole":"ht",
            "haitian":"ht",
            "hausa":"ha",
            "hawaiian":"haw",
            "hebrew":"he",
            "iw":"he",
            "hindi":"hi",
            "hmong":"hmn",
            "hungarian":"hu",
            "icelandic":"is",
            "igbo":"ig",
            "ilocano":"ilo",
            "indonesian":"id",
            "irish":"ga",
            "italian":"it",
            "japanese":"ja",
            "javanese":"jv",
            "jw":"jv",
            "kannada":"kn",
            "kazakh":"kk",
            "khmer":"km",
            "kinyarwanda":"rw",
            "konkani":"gom",
            "korean":"ko",
            "krio":"kri",
            "kurdish":"ku",
            "kurdish":"ckb",
            "sorani":"ckb",
            "kyrgyz":"ky",
            "lao":"lo",
            "latin":"la",
            "latvian":"lv",
            "lingala":"ln",
            "lithuanian":"lt",
            "luganda":"lg",
            "luxembourgish":"lb",
            "macedonian":"mk",
            "maithili":"mai",
            "malagasy":"mg",
            "malay":"ms",
            "malayalam":"ml",
            "maltese":"mt",
            "maori":"mi",
            "marathi":"mr",
            "meiteilon":"mni-Mtei",
            "manipuri":"mni-Mtei",
            "mizo":"lus",
            "mongolian":"mn",
            "myanmar":"my",
            "burmese":"my",
            "nepali":"ne",
            "norwegian":"no",
            "nyanja":"ny",
            "chichewa":"ny",
            "odia":"or",
            "oriya":"or",
            "oromo":"om",
            "pashto":"ps",
            "persian":"fa",
            "polish":"pl",
            "portuguese":"pt",
            "punjabi":"pa",
            "quechua":"qu",
            "romanian":"ro",
            "russian":"ru",
            "samoan":"sm",
            "sanskrit":"sa",
            "scots Gaelic":"gd",
            "sepedi":"nso",
            "serbian":"sr",
            "sesotho":"st",
            "shona":"sn",
            "sindhi":"sd",
            "sinhala":"si",
            "sinhalese":"si",
            "slovak":"sk",
            "slovenian":"sl",
            "somali":"so",
            "spanish":"es",
            "sundanese":"su",
            "swahili":"sw",
            "swedish":"sv",
            "tagalog":"tl",
            "tajik":"tg",
            "tamil":"ta",
            "tatar":"tt",
            "telugu":"te",
            "thai":"th",
            "tigrinya":"ti",
            "tsonga":"ts",
            "turkish":"tr",
            "turkmen":"tk",
            "twi":"ak",
            "akan":"ak",
            "ukrainian":"uk",
            "urdu":"ur",
            "uyghur":"ug",
            "uzbek":"uz",
            "vietnamese":"vi",
            "welsh":"cy",
            "xhosa":"xh",
            "yiddish":"yi",
            "yoruba":"yo",
            "zulu":"zu",
        }

        let lang = args.join(" ") || "en";
        lang = lang.toLowerCase();

        if (!Object.values(langs).includes(lang)) {
            if (Object.keys(langs).includes(lang)) {
                lang = langs[lang];
            } else {
                await bot.send(msg.conversation_id, "That be no language I've ever heard of!", [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id
                    },
                ]); 
                return;
            };
        };

        translate(reply.text, { to: lang }).then(async (res) => {
            let toText;
            if (res.text.startsWith('"')) {
                toText = `${res.text}`;
            } else {
                toText = `"${res.text}"`
            }
            await bot.send(msg.conversation_id, toText, [
                {
                    "type": "reply",
                    "reply_id": reply.id,
                    "base_reply_id": reply.id
                },
            ]); 
        }).catch(async () => {
            await bot.send(msg.conversation_id, "!translate is currently down at the moment (too many requests have been sent). Try again later.", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                },
            ]);
        });
    }
};