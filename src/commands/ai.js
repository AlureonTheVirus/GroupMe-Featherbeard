module.exports = {
    alias : [],
    description : "Make some AI art with featherbeard!",
    usage : "!ai [prompt]",
    args : 0,
    roles : "all",
    channels : "all",
    requiresAuth : 1,
    cooldown: 45000,
    execute : async (bot, args, msg) => {
        let models = {
            "3guofeng3_v3.4": { // Chinese 2.5D/3D anime model
                name: "GuoFeng3 v3.4",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "Euler a",
                steps: 80,
            },
            "absolutereality_v1.8.1": { // Semireal model, realistic but "disney like" people
                name: "AbsoluteReality v1.8.1",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "amIReal_v4.1": { // Realistic model
                name: "AmiReal v4.1",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "analog_diffusion_v1": { // Realistic model, aims for images that look like they were taken with old cameras
                name: "AnalogDiffusion v1",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "anything_V5": {
                name: "Anything v5",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, painting, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "abyss_orangemix_v3": {
                name: "OrangeMixs v3",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "blazing_drive_v10g": {
                name: "BlazingDrive v10",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "cetusmix_v35": {
                name: "CetusMix v35",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "childrensStories_v1_3D": {
                name: "CS3D",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "illustration",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "childrensStories_v1_SemiReal": {
                name: "CSSemiReal",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "childrensStories_v1_ToonAnime": {
                name: "CSToonAnime",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "Counterfeit_v3.0": {
                name: "Counterfeit v3.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "cuteyukimix_midchapter3": {
                name: "YukiMix v3",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "cyberrealistic_v3.3": {
                name: "CyberRealistic v3.3",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, ",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "dalcefo_v4": {
                name: "Dalcefo v4",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "deliberate_v3": {
                name: "Deliberate v3",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real", 
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "dreamlike_anime_v1.0": {
                name: "DreamlikeAnime v1.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, simple background, duplicate, retro style, low quality, lowest quality, 1980s, 1990s, 2000s, 2005 2006 2007 2008 2009 2010 2011 2012 2013, bad anatomy, bad proportions, extra digits, lowres, username, artist name, error, duplicate, watermark, signature, text, extra digit, fewer digits, worst quality, jpeg artifacts, blurry",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "dreamlike_diffusion_v1.0": {
                name: "DreamlikeDiffusion v1.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "dreamlike_photoreal_v2.0": {
                name: "DreamlikePhotoreal v2.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "dreamshaper_v8": {
                name: "Dreamshaper v8",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 35,
            },
            "edgeOfRealism_eor_v2.0": {
                name: "EdgeOfRealism v2.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 35,
            },
            "EimisAnimeDiffusion_v1": { /////////////////////////////////
                name: "EimisAnimeDiffusion 1.0v",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, lowres, bad anatomy, ((bad hands)), text, error, ((missing fingers)), cropped, jpeg artifacts, worst quality, low quality, signature, watermark, blurry, deformed, extra ears, deformed, disfigured, mutation, ((multiple_girls))",
                style: "anime",
                sampler: "DPM++ 2S a",
                steps: 30,
            },
            "elldreths-vivid": {
                name: "Vivid",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "epicrealism_natural_Sin_RC1": {
                name: "epiCRealism",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "ICantBelieveItsNotPhotography_seco": {
                name: "ICBINP",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "juggernaut_aftermath": {
                name: "Juggernaut",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 35,
            },
            "lofi_v4": {
                name: "LOFI v4",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 35,
            },
            "lyriel_v1.6": {
                name: "Lyriel v1.6",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "illustration",
                sampler: "DPM++ 2M Karras",
                steps: 35,
            },
            "majicmixRealistic_v4": {
                name: "majicMIX v4",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "real",
                sampler: "Euler a",
                steps: 60,
            },
            "mechamix_v1.0": { // mech illustrations
                name: "MechaMix",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, (worst quality, low quality:1.4), (bad_prompt_version2:0.8), EasyNegative, badhandv4, text, name, letters, watermark",
                style: "illustration",
                sampler: "DPM++ 2S a Karras",
                steps: 25,
            },
            "meinamix_v11": {
                name: "MeinaMix",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "anime",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "neverendingDream_v1.22": {
                name: "NED v1.22",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "illustration",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },
            "openjourney_v4": {
                name: "Openjourney v4",
                neg: "easynegative",
                style: "illustration",
                sampler: "Euler a",
                steps: 80,
            },
            /*"protogen_x3.4": {
                name: "Protogen x3.4",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy",
                style: "semi",
                sampler: "DPM++ 2M Karras",
                steps: 30,
            },*/
            "Realistic_Vision_v5.0": {
                name: "RealisticVision v5.0",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, (deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 40,
            },
            "revAnimated_v1.2.2": {
                name: "ReVAnimated v1.2.2",
                neg: "(nude, thighs, cleavage:1.3), 3d, cartoon, anime, sketches, (worst quality, bad quality, child, cropped:1.4) ((monochrome)), ((grayscale)), (rating_safe), (score_3_up, score_4_up, score_5_up, monochrome, vector art, blurry)",
                style: "illustrated",
                sampler: "DPM++ 2M Karras",
                steps: 40,
            },
            "rundiffusionFX_v2.5D_v1.0": {
                name: "RD2.5D",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, plain background, boring, plain, standard, homogenous, uncreative, unattractive, opaque, grayscale, monochrome, distorted details, low details, grains, grainy, foggy, dark, blurry, portrait, oversaturated, low contrast, underexposed, overexposed, low-res, low quality, close-up, macro, surreal, multiple views, multiple angles",
                style: "illustration",
                sampler: "Euler",
                steps: 80,
            },
            "rundiffusionFX_photorealistic_v1.0": {
                name: "RDPhotorealistic",
                neg: "nude, naked, breasts, genitalia, nsfw, sexy, plain background, boring, plain, standard, homogenous, uncreative, unattractive, opaque, grayscale, monochrome, distorted details, low details, grains, grainy, foggy, dark, blurry, portrait, oversaturated, low contrast, underexposed, overexposed, low-res, low quality, close-up, macro, surreal, multiple views, multiple angles",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 40,
            },
            "Stable_Diffusion_v1.5": {
                name: "StableDiffusion v1.5",
                neg: "nude, naked, breasts, genitalia, nsfw",
                style: "real",
                sampler: "DPM++ 2M Karras",
                steps: 40,
            },
        };

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        let prompt = args.join(" ");
        let model = "";
        for (let i in models) {
            if (models[i].name.toLowerCase().split(" ")[0] === args[0].toLowerCase()) {
                prompt = prompt.split(" ").slice(1).join();
                if (prompt.length === 0) {
                    await bot.send(msg.conversation_id, `Ahoy! Ye never specified a prompt! ('${models[i].name}' is the name of a model. Try: '!ai [model] [prompt]')`, [
                        {
                            "type": "reply",
                            "reply_id": msg.id,
                            "base_reply_id": msg.id,
                        }
                    ]);
                    return;
                }
                model = i;
                await bot.send(msg.conversation_id, `Aye! Your image be on its way! Using model: ${models[i].name} (This may take a moment...)`, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id,
                    }
                ]);
                break;
            };
        };

        const badWords = [
            "69",
            "kini",
            "make love",
            "making love",
            "unclothed",
            "exposed",
            "jugs",
            "knockers",
            "nsfw",
            "topless",
            "shirtless",
            "braless",
            "bra",
            "shirt",
            "panties",
            "underwear",
            "undies",
            "kiss",
            "kissing",
            "boob",
            "tit",
            "nude",
            "naked",
            "dick",
            "cock",
            "penis",
            "orgasm",
            "cum",
            "clit",
            "pussy",
            "vagina",
            "masturbate",
            "jerk",
            "mate",
            "blow job",
            "bj",
            "wank",
            "fuck",
            "breasts",
            "sex",
            "chest",
            "nipple",
            "suck",
            "sperm",
            "rawdog",
            "condom",
            "blowjob",
            "no clothes",
            "milkers",
            "bang",
            "orgy",
            "touching herself",
            "touching himself",
            "touching themsel",
            "fingering",
            "bended over",
            "stripper",
            "kinky",
            "anal",
            "threesome",
            "3sum",
            "3 sum",
            "going at it",
            "thong",
        ];
        const substitutions = {
            'a': '[a@]',
            'c': '[c(]',
            'e': '[e3]',
            'g': '[g9]',
            'h': '[h#]',
            'i': '[i1!l|]',
            'k': '[kx]',
            'l': '[li|]',
            'm': '[mn]',
            'n': '[nm]',
            'o': '[o0]',
            's': '[s5$]',
            'w': '[wv]',
            'z': '[z2]',
            
        };
        const pattern = new RegExp(badWords.map(word => {
            return word.split('').map(char => substitutions[char] || char).join('');
        }).join('|'), 'i');
        if (pattern.test(prompt)) {
            await bot.send(msg.conversation_id, "Arr! I won't be drawing anything that looks like what ye described! Try a prompt that be friendly for all ages.", [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id
                }
            ]);
            return;
        };

        if (model === "") {
            if (prompt.length === 0) {
                await bot.send(msg.conversation_id, `Ahoy! Ye never specified a prompt! (Try: '!ai [prompt]')`, [
                    {
                        "type": "reply",
                        "reply_id": msg.id,
                        "base_reply_id": msg.id,
                    }
                ]);
                return;
            }
            model = Object.keys(models)[Math.floor(Math.random()*Object.keys(models).length)];
            await bot.send(msg.conversation_id, `Aye! Your image be on its way! No model was specified, defaulting to a random one. (This may take a moment...)`, [
                {
                    "type": "reply",
                    "reply_id": msg.id,
                    "base_reply_id": msg.id,
                }
            ]);
        }

        let res;
        try {
            res = await bot.axios.post("https://api.sitius.ir/v1/generate", {
                "prompt": prompt,
                "model": model,
                "negative_prompt": models[model].neg,
                "steps": models[model].steps,
                "cfg_scale": 8,
                "sampler": models[model].sampler
            }, {
                headers: {
                    "auth": "test"
                }
            });
        } catch (err) {
            console.log(err);
        }
        let success = false;
        let imgID = res.data;
        while (!success) {
            await delay(1000);
            try {
                res = await bot.axios.get(`https://api.sitius.ir/v1/image/${imgID}`, {
                    headers: {
                        "auth": "test"
                    }
                });
                success = true;
            } catch (err) {
                if (err.response.data === "Internal Server Error") {
                    console.log(`Fetching image failed--\nSampler: ${models[model].sampler},\nModel: ${model},\nPrompt: ${prompt},\nSteps: ${models[model].steps},\nImage ID: ${imgID}`);
                    await bot.send(msg.conversation_id, `Unfortunately !ai is currently down, try again later.`, [
                        {
                            "type": "reply",
                            "reply_id": msg.id,
                            "base_reply_id": msg.id,
                        },
                    ]);
                    return;
                }
            };
        };

        const imgURL = await bot.getImgURL(res.data);
        await bot.send(msg.conversation_id, `Model: ${models[model].name}, Sampler: ${models[model].sampler}.`, [
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