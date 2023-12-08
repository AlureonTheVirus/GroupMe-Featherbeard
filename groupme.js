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
const { port, token } = require("./config.json");

userCachePath = "./cache/connectedUsers.json";
blacklistPath = "./cache/blacklist.json";

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
	}
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

		app.use(express.static(path.join(__dirname, 'public')));
		app.listen(port, () => {});
	}

	send = async (conversation_id, text, attachments) => {
		try {
			if (conversation_id.includes("+") || conversation_id.includes("_")) {
				await axios.post(`https://api.groupme.com/v3/direct_messages?token=${token}`, {
					"direct_message": {
						"source_guid": `GUID${Date.now()}`,
						"recipient_id": conversation_id.split('+').join('=').split('=')[0],
						"text": text,
						"attachments": attachments,
					}
				});
			} else {
				await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/messages?token=${token}`, {
					"message" : {
						"source_guid" : `GUID${Date.now()}`,
						"text" : text,
						"attachments" : attachments,
					}
				});
			}
		} catch {};
	};
	deleteMessage = async (conversation_id, message_id) => {
		try {
			await axios.delete(`https://api.groupme.com/v3/conversations/${conversation_id}/messages/${message_id}?token=${token}`);
		} catch {};
	};
	removeUser = async (conversation_id, user_id) => {
		const res = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}?token=${this.token}`);
        const members = res.data.response.members;

		let success = false;
		for (var i = 0; i < members.length; i++) {
			if (user_id === members[i].user_id) {
				try {
					let res = await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/members/${members[i].id}/remove?token=${this.token}`, {
						membership_id : members[i].id
					});
					success = true;
				} catch {
					throw `Sputnik does not have sufficiant permissions to remove ${members[i].name}.`;
				};
			}
		}
		if (!success) throw "Sputnik could not find a user in the group matching one of the targets.";
	}
	removeMember = async (conversation_id, member_id) => {
		let success = false;
		try {
			let res = await axios.post(`https://api.groupme.com/v3/groups/${conversation_id}/members/${member_id}/remove?token=${this.token}`, {
			membership_id : member_id,
			});
			success = true;
		} catch {
			throw `Sputnik does not have sufficiant permissions to remove a member.`;
		};
		if (!success) throw "Sputnik could not find a user in the group matching one of the targets.";
	}

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
	}
	verifyAllAuths = async () => {
		for (const user in this.authedUsers) {
			await this.verifyAuthStatus(user);
		}
	}

	verifyToken = async (token) => {
		let user;
		try {
			user = await axios.get(`https://api.groupme.com/v3/users/me?token=${token}`);
		} catch {
			return false;
		}
		return user.data.response;
	}
	fetchPermissions = async (conversation_id, user_id) => {
		if (user_id === "93645911") return "dev";
		if (conversation_id.includes("+") || conversation_id.includes("_")) return "member";
		let group;
		try {
			group = await axios.get(`https://api.groupme.com/v3/groups/${conversation_id}?token=${token}`);
			let roles = group.data.response.members.find(obj => obj["user_id"] === user_id).roles;
			if (roles.includes("owner")) return "owner";
			if (roles.includes("admin")) return "admin";
			return "member";
		} catch {}
	};
	authedUsers = JSON.parse(fs.readFileSync(userCachePath, 'utf8'));
	blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
	syncConnectedUsers = () => {
		fs.writeFileSync(userCachePath, JSON.stringify(this.authedUsers, null, 2), 'utf8')
	};
}