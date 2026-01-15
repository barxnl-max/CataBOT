const pinterestdl = require("../lib/pinterest");

async function pinterestcommand(sock, chatId, message, userMessage) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const url = text.split(" ").slice(1).join(" ").trim();

    if (!url) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ please provide a pinterest link\n\n" +
            "example:\n" +
            ".pinterest https://www.pinterest.com/pin/xxxxxxxxx/",
        },
        { quoted: message }
      );
    }

    // basic validation
    if (!url.match(/pinterest\.com|pin\.it/i)) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ that is not a pinterest link" },
        { quoted: message }
      );
    }

    // react loading
    await sock.sendMessage(chatId, {
      react: { text: "🔄", key: message.key },
    });

    const result = await pinterestdl(url);

    if (!result || result.status !== true) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ failed to download pinterest content\n\n" +
            (result && result.msg ? result.msg : "unknown error"),
        },
        { quoted: message }
      );
    }

    // caption
    let caption =
      "DOWNLOAD SUCCES";

    if (result.title) {
      caption += "\n\n📝 title: " + result.title;
    }

    if (!result.downloads || result.downloads.length === 0) {
      // no video found, send info only
      return await sock.sendMessage(
        chatId,
        {
          image: result.thumbnail ? { url: result.thumbnail } : undefined,
          text:
            caption +
            "\n\n❌ no downloadable video found\n" +
            "this pin might be image-only",
        },
        { quoted: message }
      );
    }

    // send first video (best available)
    const videoUrl = result.downloads[0].url;

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: caption,
      },
      { quoted: message }
    );

    // react done
    await sock.sendMessage(chatId, {
      react: { text: "✅", key: message.key },
    });

  } catch (e) {
    console.error("error pinterest command:", e);

    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ an error occurred while processing pinterest\n\n" +
          (e && e.message ? e.message : "unknown error"),
      },
      { quoted: message }
    );
  }
}

module.exports = pinterestcommand;
