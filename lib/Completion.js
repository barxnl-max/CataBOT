const { CohereClient } = require ("cohere-ai");
const apiKey = "e80vWhYkAs5DWeAUubVLquLZo3ZplBqOIYknGSNg"

class Completion {
  constructor(user) {
    this.client = new CohereClient({
    token: apiKey,
});
    this.messages = [];
    this.user = user;
    this.msg = null;
  }

  async chat(content = 'Hi!') {
    this.messages.push({
      role: 'USER',
      message: `${content}\n\nTimestamp: ` + require("moment-timezone").tz("Asia/Jakarta").format("DD/MM/YYYY, hh:mm:ss A")
    });

    const chat = await this.client.chat({
        model: "command-r-08-2024",
        preamble: global.prompt,
        chat_history: this.messages,
        message: content,
        temperature: 0.5,
       // connectors: [{"id": "web-search"}]
    });
    this.messages.push({ role: "CHATBOT", message: chat.text });
    return chat.text;
  }
  updateMsg(msg) {
    this.msg = msg;
    return this.msg;
  }
  deleteMsg() {
    if (this.msg) {
      delete this.msg;
      return true;
    }
    return false;
  }
}
module.exports = Completion;
