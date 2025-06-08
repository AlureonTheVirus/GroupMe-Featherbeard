const { text } = require("express");

const bold = {
    'a': '𝗮', 'A': '𝗔', 'j': '𝗷', 'J': '𝗝', 's': '𝘀', 'S': '𝗦',
    'b': '𝗯', 'B': '𝗕', 'k': '𝗸', 'K': '𝗞', 't': '𝘁', 'T': '𝗧',
    'c': '𝗰', 'C': '𝗖', 'l': '𝗹', 'L': '𝗟', 'u': '𝘂', 'U': '𝗨',
    'd': '𝗱', 'D': '𝗗', 'm': '𝗺', 'M': '𝗠', 'v': '𝘃', 'V': '𝗩',
    'e': '𝗲', 'E': '𝗘', 'n': '𝗻', 'N': '𝗡', 'w': '𝘄', 'W': '𝗪',
    'f': '𝗳', 'F': '𝗙', 'o': '𝗼', 'O': '𝗢', 'x': '𝘅', 'X': '𝗫',
    'g': '𝗴', 'G': '𝗚', 'p': '𝗽', 'P': '𝗣', 'y': '𝘆', 'Y': '𝗬',
    'h': '𝗵', 'H': '𝗛', 'q': '𝗾', 'Q': '𝗤', 'z': '𝘇', 'Z': '𝗭',
    'i': '𝗶', 'I': '𝗜', 'r': '𝗿', 'R': '𝗥',
};
const italic = {
    'a': '𝘢', 'A': '𝘈', 'j': '𝘫', 'J': '𝘑', 's': '𝘴', 'S': '𝘚',
    'b': '𝘣', 'B': '𝘉', 'k': '𝘬', 'K': '𝘒', 't': '𝘵', 'T': '𝘛',
    'c': '𝘤', 'C': '𝘊', 'l': '𝘭', 'L': '𝘓', 'u': '𝘶', 'U': '𝘜',
    'd': '𝘥', 'D': '𝘋', 'm': '𝘮', 'M': '𝘔', 'v': '𝘷', 'V': '𝘝',
    'e': '𝘦', 'E': '𝘌', 'n': '𝘯', 'N': '𝘕', 'w': '𝘸', 'W': '𝘞',
    'f': '𝘧', 'F': '𝘍', 'o': '𝘰', 'O': '𝘖', 'x': '𝘹', 'X': '𝘟',
    'g': '𝘨', 'G': '𝘎', 'p': '𝘱', 'P': '𝘗', 'y': '𝘺', 'Y': '𝘠',
    'h': '𝘩', 'H': '𝘏', 'q': '𝘲', 'Q': '𝘘', 'z': '𝘻', 'Z': '𝘡',
    'i': '𝘪', 'I': '𝘐', 'r': '𝘳', 'R': '𝘙',
}
const boldItalic = {
    'a': '𝙖', 'A': '𝘼', 'j': '𝙟', 'J': '𝙅', 's': '𝙨', 'S': '𝙎',
    'b': '𝙗', 'B': '𝘽', 'k': '𝙠', 'K': '𝙆', 't': '𝙩', 'T': '𝙏',
    'c': '𝙘', 'C': '𝘾', 'l': '𝙡', 'L': '𝙇', 'u': '𝙪', 'U': '𝙐',
    'd': '𝙙', 'D': '𝘿', 'm': '𝙢', 'M': '𝙈', 'v': '𝙫', 'V': '𝙑',
    'e': '𝙚', 'E': '𝙀', 'n': '𝙣', 'N': '𝙉', 'w': '𝙬', 'W': '𝙒',
    'f': '𝙛', 'F': '𝙁', 'o': '𝙤', 'O': '𝙊', 'x': '𝙭', 'X': '𝙓',
    'g': '𝙜', 'G': '𝙂', 'p': '𝙥', 'P': '𝙋', 'y': '𝙮', 'Y': '𝙔',
    'h': '𝙝', 'H': '𝙃', 'q': '𝙦', 'Q': '𝙌', 'z': '𝙯', 'Z': '𝙕',
    'i': '𝙞', 'I': '𝙄', 'r': '𝙧', 'R': '𝙍',
};
const italicReg = /(?:([^*]|^)\*([^*]+)\*([^*]|$))|(?:([^_]|^)\_([^_]+)\_([^_]|$))/gm
const boldReg = /([^*]|^)\*\*([^*]+)\*\*([^*]|$)/gm
const boldItalicReg = /([^*]|^)\*\*\*([^*]+)\*\*\*([^*]|$)/gm
const underlineReg = /([^_]|^)\_\_([^_]+)\_\_([^_]|$)/gm
const strikeThroughReg = /([^~]|^)\~\~([^~]+)\~\~([^~]|$)/gm


module.exports = async (bot, msg) => {
    let result = msg.text;

    while (underlineReg.test(result)) {
        result = result.replace(underlineReg, (match, first, inner, last) => {
            inner = inner.split('').map(char => char + "\u0332").join('');
            return (first || "") + inner + (last || "");
        });
    };

    while (strikeThroughReg.test(result)) {
        result = result.replace(strikeThroughReg, (match, first, inner, last) => {
            inner = inner.split('').map(char => char + "\u0336").join('');
            return (first || "") + inner + (last || "");
        });
    };

    while (italicReg.test(result)) {
        result = result.replace(italicReg, (match, g1, g2, g3, g4, g5, g6) => {
            let first = g1 || g4;
            let inner = g2 || g5;
            let last = g3 || g6;
            inner = inner.split("");
            for (let i = 0; i < inner.length; i++) {
                if (italic.hasOwnProperty(inner[i])) inner[i] = italic[inner[i]];
            }
            inner = inner.join("");

            return (first || "") + inner + (last || "");
        });
    };

    while (boldReg.test(result)) {
        result = result.replace(boldReg, (match, first, inner, last) => {
            inner = inner.split("");
            for (let i = 0; i < inner.length; i++) {
                if (bold.hasOwnProperty(inner[i])) inner[i] = bold[inner[i]];
            }
            inner = inner.join("");

            return (first || "") + inner + (last || "");
        });
    };

    while (boldItalicReg.test(result)) {
        result = result.replace(boldItalicReg, (match, first, inner, last) => {
            inner = inner.split("");
            for (let i = 0; i < inner.length; i++) {
                if (boldItalic.hasOwnProperty(inner[i])) inner[i] = boldItalic[inner[i]];
            }
            inner = inner.join("");

            return (first || "") + inner + (last || "");
        });
    };

    if (result !== msg.text) {
        if (await bot.verifyAuthStatus(msg.user_id)) {
            let token = bot.authedUsers[msg.user_id].token;
            await bot.send(msg.conversation_id, result, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ], token);
        };
    }

    return true;
}