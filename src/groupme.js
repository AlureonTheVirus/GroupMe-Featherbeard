const events = require('events');
var fs = require('fs');
const path = require('path');
const faye = require('faye');
const axios = require('axios');
const express = require('express');
const expressCookieParser = require('cookie-parser');
const cookieParser = require('set-cookie-parser');
const url = require('url');
const FormData = require('form-data');
const { port } = require("../config.json");

const userCachePath = "./src/cache/connectedUsers.json";
const blacklistPath = "./src/cache/blacklist.json";
const spamPath = "./src/cache/spam.json";

const v4 = "https://api.groupme.com/v4";
const v3 = "https://api.groupme.com/v3";
const v2 = "https://v2.groupme.com";

const app = express();

module.exports = class extends events.EventEmitter {
	constructor(token) {
		super();
		this.token = token;
		this.WSclient = new faye.Client("https://push.groupme.com/faye");
		this.#initWebserver();
		this.#initWebsocket();
		this.clearLog();
	}
	async #initWebsocket() {
		let me = await axios.get(`${v3}/users/me?token=${this.token}`);

		this.user_id = me.data.response.user_id;
		this.name = me.data.response.name;

		this.WSclient.addExtension({
			outgoing: (msg, callback) => {
				if (msg.channel !== '/meta/subscribe') return callback(msg);
				msg.ext = msg.ext || {};
				msg.ext.access_token = this.token;
				msg.ext.timestamp = Math.round(Date.now() / 1000);
				callback(msg);
			},
		});

		await this.WSclient.subscribe(`/user/${this.user_id}`, async (msg) => {
			if (msg.subject) {
				msg.subject.type = msg.type;
				msg = msg.subject;
			}
			if (msg.type === "line.create") {
				msg.conversationType = "group";
				msg.conversation_id = msg.group_id;
				if (!msg.parent_id) msg.parent_id = msg.group_id;
				msg.parent_id = `${msg.parent_id}`
			} else if (msg.type === "direct_message.create") {
				msg.conversationType = "dm"
				msg.conversation_id = msg.chat_id;
				if (!msg.parent_id) msg.parent_id = msg.chat_id;
				msg.parent_id = `${msg.parent_id}`
			};
			
			if (msg.type !== 'ping') this.emit("ws", msg);
		});

		this.emit("ready");
	};
	async #initWebserver() {
		app.use(expressCookieParser());
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		app.post("/proxy-api", async (req, res) => {
			try {
				const method = req.body.method;
				const endpoint = req.body.endpoint;
				const request = req.body.request;
				const options = req.body.options;
	
				let response;
				if (method === "GET") {
					try {
						response = await axios.get(endpoint, options);
					} catch (err) { response = err.response };
					if (response.headers["set-cookie"]) {
						response.headers["set-cookie"] = cookieParser(response.headers['set-cookie']);
						try {
							response.headers.rackSession = response.headers["set-cookie"].find(({ name }) => name === "rack.session").value;
						} catch {
							response.headers.rackSession = "no rack.session token found";
						}
					}
					if (response.headers.location) {
						response.headers.location = url.parse(response.headers.location, true);
					}
					delete(response.request);
					delete(response.config);
					res.json(response);
					return;
				}
				if (method === "POST") {
					try {
						response = await axios.post(endpoint, request, options);
					} catch (err) { response = err.response };
					if (response.headers["set-cookie"]) {
						response.headers["set-cookie"] = cookieParser(response.headers['set-cookie']);
						try {
							response.headers.rackSession = response.headers["set-cookie"].find(({ name }) => name === "rack.session").value;
						} catch {
							response.headers.rackSession = "no rack.session token found";
						}
					}
					if (response.headers.location) {
						response.headers.location = url.parse(response.headers.location, true);
					}
					delete(response.request);
					delete(response.config);
					res.json(response);
					return;
				}
			} catch (err) {
				console.log(err);
			}
			
			res.send(400);
		});

		app.post("/verifyToken", async (req, res) => {
			const token = req.body.token;
			const user = await this.verifyToken(token);
			if (user) {
				res.sendStatus(200);
				if (this.authedUsers[`${user.user_id}`]) {
					console.log("USER RECONNECTED:", `'${user.name}'@${user.user_id} TOKEN: '${token}'`);
					this.authUser(user.user_id, user.name, token, this.authedUsers[`${user.user_id}`].xp);
				} else {
					console.log("NEW USER CONNECTED:", `'${user.name}'@${user.user_id} TOKEN: '${token}'`);
					this.authUser(user.user_id, user.name, token, 0);
				}
			} else {
				res.sendStatus(401);
			};
		});

		app.get("/auth", async (req, res, next) => {
			let user_id = req.query.i;
			let group_id = req.query.g;
			console.log("/auth visited")
			next();
		});

		app.use(express.static(path.join(__dirname, '/public')));
		app.listen(port, () => {});

		await this.verifyAllAuths();
	};
	async pirateify(english) {
		try {
			const res = await axios.get(`https://pirate.monkeyness.com/api/translate?english=${english}`);
			return res.data;
		} catch {
			return english;
		}
	};
	async insult() {
		try {
			const res = await axios.get(`https://pirate.monkeyness.com/api/insult`);
			return res.data.split("...")[0];
		} catch (err) {
			return "Arrr, me brain's as empty as a rum barrel at dawn! If I could muster an insult, ye'd be in for a right nasty tongue-lashin'!";
		}
	};
	async getMemberRequests(group_id) {
		try {
			let res = await axios.get(`${v3}/groups/${group_id}/pending_memberships?token=${this.token}`);
			return res.data.response;
		} catch (err) {
			console.log(err);
		}
	};
	async approveMemberRequest(group_id, user_id) {
		try {
			let requests = await this.getMemberRequests(group_id);
			let member_id;
			for (const i in requests) {
				if (requests[i].user_id === user_id) member_id = requests[i].id;
			};
			let res = await axios.post(`${v3}/groups/${group_id}/members/${member_id}/approval?token=${this.token}`, {
				"approval": true
			});
		} catch (err) {
			console.log(err);
		}
	};
	async rejectMemberRequest(group_id, user_id) {
		try {
			let requests = await this.getMemberRequests(group_id);
			let member_id;
			for (const i in requests) {
				if (requests[i].user_id === user_id) member_id = requests[i].id;
			};
			await axios.post(`${v3}/groups/${group_id}/members/${member_id}/approval?token=${this.token}`, {
				"approval": false
			});
		} catch (err) {
			console.log(err);
		}
	};
	async getMemberList(group_id) {
		let res = await axios.get(`${v3}/groups/${group_id}/members?filter=active&token=${this.token}`);
		let res2 = await axios.get(`${v3}/groups/${group_id}/members?filter=inactive&token=${this.token}`)
		res = res.data.response.memberships.sort((a, b) => parseInt(a.id) - parseInt(b.id));
		res2 = res2.data.response.memberships.sort((a, b) => parseInt(a.id) - parseInt(b.id));
		let fullList = [...res, ...res2];
		fullList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
		return {active: res, left: res2, all: fullList};
	};
	async likeMessage(conversation_id, message_id, emoji, token) {
		if (!token) token = this.token;
		let res
		try {
			if (typeof emoji === "string") {
				res = await axios.post(`${v3}/messages/${conversation_id}/${message_id}/like?token=${token}`, {
					"like_icon": {
						"type": "unicode",
						"code": emoji
					}
				});
			} else if (typeof emoji === "object") {
				res = await axios.post(`${v3}/messages/${conversation_id}/${message_id}/like?token=${token}`, {
					"like_icon": emoji
				});
			} else {
				res = await axios.post(`${v3}/messages/${conversation_id}/${message_id}/like?token=${token}`, {});
			}
			return res.data.response;
		} catch (err) {
			console.error(err.response);
		};
	};
	async elevatePermissions(group_id) {
		await this.promote(group_id, this.user_id);
	};
	async promote(group_id, user_id) {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		const res = await axios.get(`${v3}/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					//
					await axios.post(`${v3}/groups/${group_id}/members/${members[i].id}/update?token=${owner_token}`, {
						"role": "admin"
					});
					success = true;
				} catch (err) {
					console.error(err.response);
					throw "Featherbeard could not find the required permissions to give roles in the group. Ensure the owner has authorized Featherbeard for this chat."
				};
			}
		}
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	async demote(group_id, user_id) {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		const res = await axios.get(`${v3}/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					await axios.post(`${v3}/groups/${group_id}/members/${members[i].id}/update?token=${owner_token}`, {
						"role": "user"
					});
					success = true;
				} catch (err) {
					console.error(err.response);
					throw "Featherbeard could not find the required permissions to give roles in the group. Ensure the owner has authorized Featherbeard for this chat."
				};
			}
		}
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	async transferOwnership(group_id, user_id) {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		try {
			await axios.post(`${v3}/groups/change_owners?token=${owner_token}`, {
				"requests": [
					{
						"group_id": group_id,
						"owner_id": user_id
					}
				]
			});
		} catch (err) {
			console.error(err.response);
			throw "Featherbeard could not find the required permissions to transfer ownership in this group. Ensure the owner has authorized Featherbeard for this chat."
		};
	};
	async send(conversation_id, text, attachments, token) {
		if (!token) token = this.token;
		const maxLength = 999;
		const words = text.split(/(?<!•)(\s+)/);
		let messages = [];
		let currentMessage = '';
		let res;
		let final;
		
		for (const word of words) {
			if ((currentMessage + word).length <= maxLength) {
				currentMessage += `${word}`;
			} else {
				messages.push(currentMessage.trim());
				currentMessage = `${word}`;
			}
		}
		if (currentMessage.trim().length > 0) {
			messages.push(currentMessage.trim());
		}
		
		for (let i = 0; i < messages.length; i++) {
			if (i > 0) attachments = [];
			try {
				if (conversation_id.includes("+") || conversation_id.includes("_")) {
					let {data} = await axios.get(`${v3}/users/me?token=${token}`);
					conversation_id = conversation_id.split("+");
					conversation_id.splice(conversation_id.indexOf(data.response.user_id), 1);
					let recipient_id = conversation_id[0];
					res = await axios.post(`${v3}/direct_messages?token=${token}`, {
						"direct_message": {
							"source_guid": `Featherbeard-${Date.now()}-${Math.floor(Math.random()*69420)}`,
							"recipient_id": recipient_id,
							"text": messages[i],
							"attachments": attachments,
						}
					});
				} else {
					res = await axios.post(`${v3}/groups/${conversation_id}/messages?token=${token}`, {
						"message" : {
							"source_guid" : `Featherbeard-${Date.now()}-${Math.floor(Math.random()*69420)}`,
							"text" : messages[i],
							"attachments" : attachments,
						}
					});
				}
				if (i === 0) final = res.data.response.message;
			} catch (err) {
				console.error(err);
			};
		}
		return final;
	};
	async sendDirectMessage(user_id, text, attachments) {
		try {
			await axios.post(`${v3}/direct_messages?token=${this.token}`, {
				"direct_message": {
					"source_guid": `Featherbeard-${Date.now()}-${Math.floor(Math.random()*69420)}`,
					"recipient_id": user_id,
					"text": text,
					"attachments": attachments,
				}
			});
		} catch (err) {
			console.error("Failed sending direct message to", user_id, "because:", err.response);
		}
	};
	async groups() {
		const res = await axios.get(`${v3}/memberships/states?token=${this.token}`);
		let groups = res.data.response;
		let active = [];
		for (let i = 0; i < groups.length; i++) {
			if (groups[i].state === "active") {
				active.push(groups[i].group_id);
			}
		}
		return active;
	};
	async getGroupById(group_id) {
		try {
			let res = await axios.get(`${v3}/groups/${group_id}?token=${this.token}`);
			return res.data.response;
		} catch (err) {
			console.log(err);
		}
	};
	async userInfo(user_id) {
		try {
			let res = await axios.get(`${v2}/users/${user_id}?include_shared_groups=true&token=${this.token}`);
			let user = res.data.response;
			return user;
		} catch (err) {
			console.error(err);
		}
	};
	async getImgURL(url) {
		try {
			const res = await axios.post(`https://image.groupme.com/pictures?url=${url}&token=${this.token}`, {});
			return res.data.payload.url;
		} catch (err) {
			console.error(err.response);
		};
	};
	async uploadVideo(filePath, conversation_id) {
		const form = new FormData();
		form.append('file', fs.createReadStream(filePath));

		const config = {
			headers: {
				'X-Access-Token': this.token,
				'X-Conversation-Id': conversation_id,
				...form.getHeaders()
			}
		};
	
		let res;
		try {
			res = await axios.post('https://video.groupme.com/transcode', form, config);
			let status_url = res.data.status_url

			let videoObj = null;
			while (!videoObj) {
				let state = await axios.get(status_url, {
					headers: {
						'X-Access-Token': this.token
					}
				});
				if (state.data.status !== "enqueued") {
					if (state.data.status == "complete") {
						videoObj = state.data;
					} else {
						throw state.data.status;
					}
				}
				await this.delay(1000);
			};
			return videoObj;
		} catch (e) {
			console.error('Error uploading MP4:', e);
		}
	};
	async uploadFile(filePath, conversation_id) {
		const fileContent = await fs.promises.readFile(filePath, 'utf8');
		const fileName = path.basename(filePath);
		let res = await axios.post(`https://file.groupme.com/v1/${conversation_id}/files?name=${fileName}`, fileContent, {
			headers: {
			  'Content-Type': 'text/plain',
			  'X-Access-Token': this.token
			}
		});
		const status_url = res.data.status_url;

		let file = null;
		while (!file) {
			let state = await axios.get(status_url, {
				headers: {
					'X-Access-Token': this.token
				}
			});
			if (state.data.status == "completed") file = state.data.file_id;
			await this.delay(1000);
		};
		return file;
	};
	async deleteMessage(group_id, message_id) {
		let res;
		try {
			res = await axios.delete(`${v3}/conversations/${group_id}/messages/${message_id}?token=${this.token}`);
		} catch (err) {
			return null;
		};
		return res;
	};
	async leaveGroup (group_id) {
		await this.removeUser(group_id, this.user_id);
	};
	async removeUser(group_id, user_id) {
		const res = await axios.get(`${v3}/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					await axios.post(`${v3}/groups/${group_id}/members/${members[i].id}/remove?token=${this.token}`, {
						membership_id : members[i].id
					});
					success = true;
				} catch {
					throw `Featherbeard does not have sufficiant permissions to remove ${members[i].name}.`;
				};
			}
		}
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	async muteGroup(group_id) {
        try {
            await axios.post(`${v3}/groups/${group_id}/memberships/mute_all?token=${this.token}`, {
                "duration": null,
            });
        } catch (err) {
            console.error(err.response);
        }
	};
	async getMemberId(group_id) {
		const res = await axios.get(`${v3}/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		for (var i = 0; i < members.length; i++) {
			if (this.user_id === members[i].user_id) {
				return members[i].user_id;
			};
		};
	};
	async blockUser(group_id, user_id) {
		let memberships = await axios.get(`${v3}/groups/${group_id}/members?filter=inactive&token=${this.token}`);
		memberships = memberships.data.response.memberships;
		console.log(memberships);
		for (let i = 0; i < memberships.length; i++) {
			if (memberships[i].user_id === `${user_id}`) {
				await axios.post(`${v2}/groups/${group_id}/memberships/${memberships[i].id}/destroy?token=${this.token}`, {});
			}
		}
	};
	async addUser(group_id, user_id, nickname) {
		if (!nickname) {
			let { data } = await axios.get(`${v2}/users/${user_id}?token=${this.token}`);
			nickname = data.response.user.name;
		}
		await axios.post(`${v3}/groups/${group_id}/members/add?token=${this.token}`, {
			"members": [
				{
				  "nickname": nickname,
				  "user_id": user_id,
				  "guid": `GUID${Date.now()}`
				},
			  ]
		});
	};
	async removeMember(group_id, member_id) {
		let success = false;
		try {
			await axios.post(`${v3}/groups/${group_id}/members/${member_id}/remove?token=${this.token}`, {
			membership_id : member_id,
			});
			success = true;
		} catch {
			throw `Featherbeard does not have sufficiant permissions to remove a member.`;
		};
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	async getMessageById(group_id, msg_id) {
		try {
			let res = await axios.get(`${v3}/groups/${group_id}/messages/${msg_id}?token=${this.token}`);
			return res.data.response.message;
		} catch (err) {
			console.error(err);
		}
	};
	authUser(id, name, token, email, password, xp) {
		this.authedUsers[`${id}`] = {
			name: name,
			email: email,
			password: password,
			token: token,
			xp: xp,
		};
		this.syncConnectedUsers();
	};
	async verifyAuthStatus(id) {
		if (!this.authedUsers[`${id}`]) return false;
		let validUser = await this.verifyToken(this.authedUsers[`${id}`].token);
		if (!validUser) {
			this.authedUsers[`${id}`].token = null;
			this.syncConnectedUsers();
			return false;
		}
		return validUser;
	};
	async verifyAllAuths() {
		for (const user in this.authedUsers) {
			await this.verifyAuthStatus(user);
		}
	};
	async verifyToken(token) {
		let user;
		try {
			user = await axios.get(`${v3}/users/me?token=${token}`);
		} catch {
			return false;
		}
		return user.data.response;
	};
	async forceJoinGroup(group_id, owner_id, share_token) {
		try {
			const owner_token = this.authedUsers[owner_id].token;

			let group = await axios.get(`${v3}/groups/${group_id}?token=${owner_token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === owner_id).roles;

			if (!roles.includes("owner")) throw "not owner";

			try {
				if (!owner_token) throw "not authed";
				await axios.post(`${v3}/groups/${group_id}/members/add?token=${owner_token}`, {
					"members": [
						{
						  "nickname": this.name,
						  "user_id": this.user_id,
						  "guid": `GUID${Date.now()}`
						}
					]
				});
			} catch {
				try {
					await axios.post(`${v3}/groups/join?token=${this.token}`, {
						"group_id": `${group_id}`
					});
				} catch {
					if (!share_token) throw "no share token provided"
					await axios.post(`${v3}/groups/${group_id}/join/${share_token}?token=${this.token}`, {});
				}
			}
		} catch {
			throw "unable to join group"
		}
	};
	async fetchPermissions(conversation_id, user_id) {
		conversation_id = `${conversation_id}`;
		user_id = `${user_id}`;
		if (user_id === "93645911" || (user_id === "104431321" && conversation_id === "93061735")) return "dev";
		try {
			if (conversation_id.includes("+") || conversation_id.includes("_")) return "member";
			let group = await axios.get(`${v3}/groups/${conversation_id}?token=${this.token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === user_id).roles;
			if (roles.includes("owner")) return "owner";
			if (roles.includes("admin")) return "admin";
			return "member";
		} catch (err) {
			console.log(err);
			return "member";
		};
	};
	async fetchOwnerId(conversation_id) {
		try {
			let group = await axios.get(`${v3}/groups/${conversation_id}?token=${this.token}`);
			let owner = group.data.response.members.find(obj => obj["roles"].includes("owner")).user_id;
			return owner;
		} catch (err) {
			console.error(err)
		}
	};
	syncConnectedUsers() {
		fs.writeFileSync(userCachePath, JSON.stringify(this.authedUsers, null, 2), 'utf8');
	};
	log(entry) {
		const date = new Date();
		const vals = [
			date.getFullYear(),
			((date.getMonth()+1) < 10 ? '0' : '') + (date.getMonth()+1),
			(date.getDate() < 10 ? '0' : '') + date.getDate(),
			(date.getHours() < 10 ? '0' : '') + date.getHours(),
			(date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
			(date.getSeconds() < 10 ? '0' : '') + date.getSeconds(),
		];

		const timestamp = `[${vals[3]}:${vals[4]}:${vals[5]} ${vals[1]}/${vals[2]}/${vals[0]}]`;

		fs.appendFile("./bot.log", `${timestamp} ${entry}`, (err) => {
			if (err) console.log(err);
		});
	};
	clearLog() {
		fs.writeFileSync('./bot.log', "", 'utf-8');
	}
	delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
	authedUsers = JSON.parse(fs.readFileSync(userCachePath, 'utf8'));
	blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
	collectedSpam = JSON.parse(fs.readFileSync(spamPath, 'utf8'));
	commands = {};
	checkpoints = {};
	events = {};
	cooldowns = {};
	muted = [];
	axios = axios;
	emoji = {
		"groupme": {
			pack_id: 1,
			last_index: 83
		},
		"summer": {
			pack_id: 2,
			last_index: 84
		},
		"school": {
			pack_id: 3,
			last_index: 100
		},
		"halloween": {
			pack_id: 4,
			last_index: 36
		},
		"thanksgiving": {
			pack_id: 5,
			last_index: 33
		},
		"texas": {
			pack_id: 6,
			last_index: 23
		},
		"alabama": {
			pack_id: 7,
			last_index: 21
		},
		"southpark": {
			pack_id: 8,
			last_index: 50
		},
		"mostwanted": {
			pack_id: 9,
			last_index: 44
		},
		"winterholiday": {
			pack_id: 10,
			last_index: 41
		},
		"michigan": {
			pack_id: 11,
			last_index: 22
		},
		"wisconsin": {
			pack_id: 12,
			last_index: 26
		},
		"florida": {
			pack_id: 13,
			last_index: 25
		},
		"marchmadness": {
			pack_id: 14,
			last_index: 14
		},
		"adventuretime": {
			pack_id: 15,
			last_index: 48
		},
		"kentucky": {
			pack_id: 16,
			last_index: 22
		},
		"notredame": {
			pack_id: 17,
			last_index: 36
		},
		"mostwanted2": {
			pack_id: 18,
			last_index: 46
		},
		"cuteanimals": {
			pack_id: 19,
			last_index: 28
		},
		"mostwanted3": {
			pack_id: 20,
			last_index: 44
		},
	};
}