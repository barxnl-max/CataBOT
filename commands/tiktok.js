const axios = require("axios")

const processedMessages = new Set()

module.exports = async function tiktokCommand(sock, chatId, message) {
  if (processedMessages.has(message.key.id)) return
  processedMessages.add(message.key.id)
  setTimeout(() => processedMessages.delete(message.key.id), 300000)

  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text

    if (!text) return

    const args = text.split(" ").slice(1)
    const url = args.find(v => v.startsWith("http"))

    const isViewOnce = args.includes("--vv")
    const isPTV = args.includes("--ptv")

    if (!url) {
      return sock.sendMessage(chatId, {
        text: "❌ Masukkan link TikTok"
      }, { quoted: message })
    }

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    })

    let data
    let lastError

    // ================= RETRY MAX 3x =================
    for (let i = 0; i < 3; i++) {
      try {
        const api = await axios.get(
          `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
          { timeout: 20000 }
        )

        if (api.data?.status && api.data?.data?.urls?.length) {
          data = api.data.data
          break
        }
      } catch (e) {
        lastError = e
        await new Promise(r => setTimeout(r, 3000)) // delay 3 detik
      }
    }

    if (!data) throw lastError || "API gagal"

    const title = data.metadata?.title || "TikTok Video"

    // ⚠️ URL KEDUA LEBIH STABIL
    const videoUrl = data.urls[1] || data.urls[0]

    // ================= SEND =================
    const payload = {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: `📥 TikTok Download\n📝 ${title}`,
      viewOnce: isViewOnce
    }

    // PTV = video bulat
    if (isPTV) {
      payload.videoNote = true
      delete payload.caption // WA tidak suka caption di PTV
    }

    await sock.sendMessage(chatId, payload, { quoted: message })

  } catch (e) {
    console.error("TIKTOK ERROR:", e)
    await sock.sendMessage(chatId, {
      text: "❌ Gagal download TikTok"
    }, { quoted: message })
  }
}
