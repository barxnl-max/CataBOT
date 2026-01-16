const yts = require("yt-search")
const ytmp3 = require("../lib/ytmp3")

async function playCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ""

    const args = text.split(" ").slice(1).join(" ").trim()

    if (!args) {
      return await sock.sendMessage(
        chatId,
        { text: "🎵 Masukkan judul lagu atau link YouTube\n\nContoh:\n.play until i found you\n.ytmp3 https://youtu.be/xxxx" },
        { quoted: message }
      )
    }

    // ⏳ loading
    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    })

    let ytUrl = args

    // 🔎 kalau bukan link → search
    if (!/^https?:\/\//i.test(args)) {
      const search = await yts(args)
      if (!search.videos || search.videos.length === 0) {
        return await sock.sendMessage(
          chatId,
          { text: "❌ Lagu tidak ditemukan" },
          { quoted: message }
        )
      }
      ytUrl = search.videos[0].url
    }

    // 🎧 download mp3 (2–3 MB)
    const res = await ytmp3(ytUrl)

    if (!res.status) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Gagal download audio\n" + res.error },
        { quoted: message }
      )
    }

    const caption =
      `🎵 *${res.title}*\n` +
      `🎧 ${res.bitrate} | ${res.size}\n\n` +
      `Downloaded by bot\n` +
      `📸 Instagram: @barxnl250_`

    await sock.sendMessage(
      chatId,
      {
        audio: res.buffer,
        mimetype: "audio/mpeg",
        fileName: res.title + ".mp3",
        caption
      },
      { quoted: message }
    )

    await sock.sendMessage(chatId, {
      react: { text: "✅", key: message.key }
    })

  } catch (e) {
    console.error("playCommand error:", e)
    await sock.sendMessage(
      chatId,
      { text: "❌ Terjadi kesalahan, coba lagi nanti" },
      { quoted: message }
    )
  }
}

module.exports = playCommand
