const events = require('events');
var fs = require('fs');
const path = require('path');
const faye = require('faye');
const axios = require('axios');
const express = require('express'),
	app = express();
const expressCookieParser = require('cookie-parser');
const cookieParser = require('set-cookie-parser');
const url = require('url');
const { port, token } = require("../config.json");

userCachePath = "./src/cache/connectedUsers.json";
blacklistPath = "./src/cache/blacklist.json";

module.exports = class extends events.EventEmitter {
	constructor() {
		super();
		this.token = token;
		this.WSclient = new faye.Client("https://push.groupme.com/faye");
		this.#initWebsocket();
		this.#initWebserver();
	}
	#initWebsocket = async () => {
		let me = await axios.get(`https://api.groupme.com/v3/users/me?token=${token}`);
		let groupsList = await axios.get(`https://api.groupme.com/v3/groups?omit=memberships&token=${token}`);
		let directMessagesList = await axios.get(`https://api.groupme.com/v3/chats?token=${token}`);
		this.user_id = me.data.response.user_id;
		this.name = me.data.response.name;
		this.groups = groupsList.data.response;
		this.directMessages = directMessagesList.data.response;

		this.WSclient.addExtension({
			outgoing: (msg, callback) => {
				if (msg.channel !== '/meta/subscribe') return callback(msg);
				msg.ext = msg.ext || {};
				msg.ext.access_token = token;
				msg.ext.timestamp = Math.round(Date.now() / 1000);
				callback(msg);
			}
		});

		await this.WSclient.subscribe(`/user/${this.user_id}`, (msg) => {
			msg.channel = `/user/${this.user_id}`;
			if (msg.type !== 'ping') this.emit("ws", msg);
		});

		for (let i = 0; i < this.groups.length; i++) {
			await this.WSclient.subscribe(`/group/${this.groups[i].group_id}`, (msg) => {
				msg.channel = `/group/${this.groups[i].group_id}`;
				if (msg.type !== 'ping') this.emit("ws", msg);
			});
		};

		for (let i = 0; i < this.directMessages.length; i++) {
			let dm_id = this.directMessages[i].last_message.conversation_id.replace('+', '_');
			await this.WSclient.subscribe(`/direct_message/${dm_id}`, (msg) => {
				msg.channel = `/direct_message/${dm_id}`;
				if (msg.type !== 'ping') this.emit("ws", msg);
			});
		}

		this.emit("ready")
	};
	#initWebserver = async () => {
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
					this.authUser(user.user_id, user.name, token);
				} else {
					console.log("NEW USER CONNECTED:", `'${user.name}'@${user.user_id} TOKEN: '${token}'`);
					this.authUser(user.user_id, user.name, token);
				}
			} else {
				res.sendStatus(401);
			};
		});

		app.use(express.static(path.join(__dirname, '/public')));
		app.listen(port, () => {});
	};
	elevatePermissions = async (group_id) => {
		await this.promote(group_id, this.user_id);
	};
	promote = async (group_id, user_id) => {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		const res = await axios.get(`https://api.groupme.com/v3/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					await axios.post(`https://api.groupme.com/v3/groups/${group_id}/members/${members[i].id}/update?token=${owner_token}`, {
						"role": "admin"
					});
					success = true;
				} catch (err) {
					console.error(err);
					throw "Featherbeard could not find the required permissions to give roles in the group. Ensure the owner has authorized Featherbeard for this chat."
				};
			}
		}
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	demote = async (group_id, user_id) => {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		const res = await axios.get(`https://api.groupme.com/v3/groups/${group_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					await axios.post(`https://api.groupme.com/v3/groups/${group_id}/members/${members[i].id}/update?token=${owner_token}`, {
						"role": "user"
					});
					success = true;
				} catch (err) {
					console.error(err);
					throw "Featherbeard could not find the required permissions to give roles in the group. Ensure the owner has authorized Featherbeard for this chat."
				};
			}
		}
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	transferOwnership = async (group_id, user_id) => {
		const owner_id = await this.fetchOwnerId(group_id);
		const owner_token = this.authedUsers[owner_id].token;
		try {
			await axios.post(`https://api.groupme.com/v3/groups/change_owners?token=${owner_token}`, {
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
	send = async (conversation_id, text, attachments) => {
		const maxLength = 999;
		const words = text.split(/(?<!•)(\s+)/);
		let messages = [];
		let currentMessage = '';
		
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
			if (i > 0) {
				try {
					if (conversation_id.includes("+") || conversation_id.includes("_")) {
						await axios.post(`https://api.groupme.com/v3/direct_messages?token=${token}`, {
							"direct_message": {
								"source_guid": `GUID${Date.now()}`,
								"recipient_id": conversation_id.split('+').join('=').split('=')[0],
								"text": messages[i],
								"attachments": [],
							}
						});
					} else {
						await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/messages?token=${token}`, {
							"message" : {
								"source_guid" : `GUID${Date.now()}`,
								"text" : messages[i],
								"attachments" : [],
							}
						});
					}
				} catch (err) {
					//console.error(err);
				};
			} else {
				try {
					if (conversation_id.includes("+") || conversation_id.includes("_")) {
						await axios.post(`https://api.groupme.com/v3/direct_messages?token=${token}`, {
							"direct_message": {
								"source_guid": `GUID${Date.now()}`,
								"recipient_id": conversation_id.split('+').join('=').split('=')[0],
								"text": messages[i],
								"attachments": attachments,
							}
						});
					} else {
						await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/messages?token=${token}`, {
							"message" : {
								"source_guid" : `GUID${Date.now()}`,
								"text" : messages[i],
								"attachments" : attachments,
							}
						});
					}
				} catch (err) {
					//console.error(err);
				};
			}
		}
	};
	sendDirectMessage = async (user_id, text, attachments) => {
		try {
			await axios.post(`https://api.groupme.com/v3/direct_messages?token=${token}`, {
				"direct_message": {
					"source_guid": `GUID${Date.now()}`,
					"recipient_id": user_id,
					"text": text,
					"attachments": attachments,
				}
			});
		} catch (error) {
			console.error("Failed sending direct message to". user_id, "because:", error);
		}
	};
	deleteMessage = async (conversation_id, message_id) => {
		try {
			await axios.delete(`https://api.groupme.com/v3/conversations/${conversation_id}/messages/${message_id}?token=${token}`);
		} catch {};
	};
	leaveGroup = async (conversation_id) => {
		await this.removeUser(conversation_id, this.user_id);
	};
	removeUser = async (conversation_id, user_id) => {
		const res = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/members/${members[i].id}/remove?token=${this.token}`, {
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
	removeMember = async (conversation_id, member_id) => {
		let success = false;
		try {
			let res = await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/members/${member_id}/remove?token=${this.token}`, {
			membership_id : member_id,
			});
			success = true;
		} catch {
			throw `Featherbeard does not have sufficiant permissions to remove a member.`;
		};
		if (!success) throw "Featherbeard could not find a user in the group matching one of the targets.";
	};
	getMessageById = async (conversation_id, message_id) => {
		try {
			let res = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}/messages/${message_id}?token=${this.token}`);
			return res.data.response.message;
		} catch (err) {
			console.error(err);
		}
	};
	authUser = (id, name, token) => {
		this.authedUsers[`${id}`] = {
			name : name,
			token : token
		};
		this.syncConnectedUsers();
	};
	verifyAuthStatus = async (id) => {
		if (!this.authedUsers[`${id}`]) return false;
		let validUser = await this.verifyToken(this.authedUsers[`${id}`].token);
		if (!validUser) {
			delete this.authedUsers[`${id}`];
			this.syncConnectedUsers();
			return false;
		}
		return validUser;
	};
	verifyAllAuths = async () => {
		for (const user in this.authedUsers) {
			await this.verifyAuthStatus(user);
		}
	};
	verifyToken = async (token) => {
		let user;
		try {
			user = await axios.get(`https://api.groupme.com/v3/users/me?token=${token}`);
		} catch {
			return false;
		}
		return user.data.response;
	};
	forceJoinGroup = async (group_id, owner_id, share_token) => {
		try {
			const owner_token = this.authedUsers[owner_id].token;

			let group = await axios.get(`https://api.groupme.com/v3/groups/${group_id}?token=${owner_token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === owner_id).roles;

			if (!roles.includes("owner")) throw "not owner";

			try {
				if (!owner_token) throw "not authed";
				await axios.post(`https://api.groupme.com/v3/groups/${group_id}/members/add?token=${owner_token}`, {
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
					await axios.post(`https://api.groupme.com/v3/groups/join?token=${this.token}`, {
						"group_id": `${group_id}`
					});
				} catch {
					if (!share_token) throw "no share token provided"
					await axios.post(`https://api.groupme.com/v3/groups/${group_id}/join/${share_token}?token=${this.token}`, {});
				}
			}
		} catch (err) {
			console.log("There was a major error, Featherbeard could not join the group.")
		}
	}
	fetchPermissions = async (conversation_id, user_id) => {
		if (user_id === "93645911") return "dev";
		if (conversation_id.includes("+") || conversation_id.includes("_")) return "member";
		try {
			let group = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}?token=${token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === user_id).roles;
			if (roles.includes("owner")) return "owner";
			if (roles.includes("admin")) return "admin";
			return "member";
		} catch {}
	};
	fetchOwnerId = async (conversation_id) => {
		try {
			let group = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}?token=${token}`);
			let owner = group.data.response.members.find(obj => obj["roles"].includes("owner")).user_id;
			return owner;
		} catch {}
	};
	syncConnectedUsers = () => {
		fs.writeFileSync(userCachePath, JSON.stringify(this.authedUsers, null, 2), 'utf8')
	};
	authedUsers = JSON.parse(fs.readFileSync(userCachePath, 'utf8'));
	blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
	commands = {};
	cooldowns = {};
	axios = axios;
}