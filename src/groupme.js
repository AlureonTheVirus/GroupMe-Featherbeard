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
			} else if (msg.type === "direct_message.create") {
				msg.conversationType = "dm"
				msg.conversation_id = msg.chat_id;
				if (!msg.parent_id) msg.parent_id = msg.chat_id;
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

		app.post("/creds", async (req, res) => {
			const { uname, pword } = req.body;
			let credRes;
			try {
				credRes = await axios.post(`${v2}/access_tokens`, {
					"username": uname,
					"password": pword,
					"grant_type": "password",
					"app_id": "groupme-web",
					"device_id": "FEATHERBEARD_CLIENT"
				});
			} catch (err) {
				credRes = err.response;
			};

			if (credRes.data.meta.code === 401) {
				res.json({"response": "INVALID"});
			} else if (credRes.data.meta.code === 20200) {
				try {
					await axios.post(`${v3}/verifications/${credRes.data.response.verification.code}/initiate`, {
						"verification": {
							"method": "sms",
						},
					});
					res.json({"response": "VERIFY", "code": credRes.data.response.verification.code, "methods": credRes.data.response.verification.methods});
				} catch (err) {
					res.json({"response": "ERR"});
					console.log(err.response);
				};
			} else if (credRes.data.meta.code === 20000) {
				res.json({"response": "OK", "user": credRes.data.response});
				let user = credRes.data.response;
				if (this.authedUsers[`${user.user_id}`]) {
					console.log("USER RECONNECTED:", `'${user.user_name}'@${user.user_id} TOKEN: '${user.access_token}'`);
					this.authUser(user.user_id, user.user_name, user.access_token, user.user.email, pword, this.authedUsers[`${user.user_id}`].xp);
				} else {
					console.log("USER CONNECTED:", `'${user.user_name}'@${user.user_id} TOKEN: '${user.access_token}'`);
					this.authUser(user.user_id, user.user_name, user.access_token, user.user.email, pword, 0);
				}
			};
		});

		app.post("/verify", async (req, res) => {
			const { uname, pword, verification_token, code } = req.body;
			let verifyRes;
			try {
				verifyRes = await axios.post(`${v3}/verifications/${verification_token}/confirm`, {
					"verification":{
						"pin": code,
					},
				});
			} catch (err) {
				verifyRes = err.response;
			};

			console.log(verifyRes.data.response);
			if (verifyRes.data.meta.code !== 200 && verifyRes.data.meta.code !== 20000) {
				res.json({"response": "INVALID-PIN", "attempts": verifyRes.data.response.remaining_attempts});
				return;
			};

			let credRes;
			try {
				credRes = await axios.post(`${v2}/access_tokens`, {
					"username": uname,
					"password": pword,
					"grant_type": "password",
					"app_id": "groupme-web",
					"device_id": "FEATHERBEARD_CLIENT",
					"verification":{
						"code": verification_token
					}
				});
			} catch (err) {
				credRes = err.response;
			};
			
			if (credRes.data.meta.code !== 20000 && credRes.data.meta.code !== 200) {
				res.json({"response": "INVALID"});
			} else {
				res.json({"response": "OK", "user": credRes.data.response});
				let user = credRes.data.response;
				if (this.authedUsers[`${user.user_id}`]) {
					console.log("USER RECONNECTED:", `'${user.user_name}'@${user.user_id} TOKEN: '${user.access_token}'`);
					this.authUser(user.user_id, user.user_name, user.access_token, user.user.email, pword, this.authedUsers[`${user.user_id}`].xp);
				} else {
					console.log("USER CONNECTED:", `'${user.user_name}'@${user.user_id} TOKEN: '${user.access_token}'`);
					this.authUser(user.user_id, user.user_name, user.access_token, user.user.email, pword, 0);
				}
			}
		});

		await this.verifyAllAuths();
		app.use(express.static(path.join(__dirname, '/public')));
		app.listen(port, () => {});
	};
	async pirateify(english) {
		const res = await axios.get(`https://pirate.monkeyness.com/api/translate?english=${english}`);
		return res.data;
	};
	async insult() {
		const res = await axios.get(`https://pirate.monkeyness.com/api/insult`);
		return res.data.split("...")[0];
	};
	async likeMessage(conversation_id, message_id, text) {
		try {
			if (text) {
				let res = await axios.post(`${v3}/messages/${conversation_id}/${message_id}/like?token=${this.token}`, {
					"like_icon": {
						"type": "unicode",
						"code": text
					}
				});
			} else {
				let res = await axios.post(`${v3}/messages/${conversation_id}/${message_id}/like?token=${this.token}`, {});
			}
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
	async send(conversation_id, text, attachments) {
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
				currentMessage = `${word}`
			}
		}
		if (currentMessage.trim().length > 0) {
			messages.push(currentMessage.trim());
		}
		for (let i = 0; i < messages.length; i++) {
			if (i > 0) attachments = [];
			try {
				if (conversation_id.includes("+") || conversation_id.includes("_")) {
					res = await axios.post(`${v3}/direct_messages?token=${this.token}`, {
						"direct_message": {
							"source_guid": `Featherbeard-${Date.now()}-${Math.floor(Math.random()*69420)}`,
							"recipient_id": conversation_id.split('+').join('=').split('=')[0],
							"text": messages[i],
							"attachments": attachments,
						}
					});
				} else {
					res = await axios.post(`${v3}/groups/${conversation_id}/messages?token=${this.token}`, {
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
			return final;
		}
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
		} catch (error) {
			console.error("Failed sending direct message to". user_id, "because:", err.response);
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
	async uploadVideo(path, conversation_id) {
		const form = new FormData();
		form.append('file', fs.createReadStream(path));

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
	async deleteMessage(group_id, message_id) {
		try {
			await axios.delete(`${v3}/conversations/${group_id}/messages/${message_id}?token=${this.token}`);
		} catch (err) {
			//console.error(err.response);
		};
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
			let res = await axios.post(`${v3}/groups/${group_id}/members/${member_id}/remove?token=${this.token}`, {
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
			console.error(err.response);
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
		if (user_id === "93645911") return "dev";
		try {
			if (conversation_id.includes("+") || conversation_id.includes("_")) return "member";
			let group = await axios.get(`${v3}/groups/${conversation_id}?token=${this.token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === user_id).roles;
			if (roles.includes("owner")) return "owner";
			if (roles.includes("admin")) return "admin";
			return "member";
		} catch {
			return "member";
		};
	};
	async fetchOwnerId(conversation_id) {
		try {
			let group = await axios.get(`${v3}/groups/${conversation_id}?token=${this.token}`);
			let owner = group.data.response.members.find(obj => obj["roles"].includes("owner")).user_id;
			return owner;
		} catch {}
	};
	syncConnectedUsers() {
		fs.writeFileSync(userCachePath, JSON.stringify(this.authedUsers, null, 2), 'utf8')
	};
	delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
	authedUsers = JSON.parse(fs.readFileSync(userCachePath, 'utf8'));
	blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
	commands = {};
	events = {};
	cooldowns = {};
	muted = [];
	axios = axios;
}