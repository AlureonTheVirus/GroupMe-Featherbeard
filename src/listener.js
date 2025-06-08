const events = require('events');
const faye = require('faye');
const axios = require('axios');

const v4 = "https://api.groupme.com/v4";
const v3 = "https://api.groupme.com/v3";
const v2 = "https://v2.groupme.com";

module.exports = class extends events.EventEmitter {
    constructor(token) {
		super();
		this.token = token;
		this.WSclient = new faye.Client("https://push.groupme.com/faye");
	}

    async init() {
		try {
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
		} catch {
			console.log("Failed to activate listener for token:", this.token);
		}
        
    }
}