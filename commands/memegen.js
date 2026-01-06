const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { writeExifImg } = require('../lib/exif')
const { UploadFileUgu, TelegraPh } = require('../lib/uploader')
const settings = require('../settings')

// =========================
// DOWNLOAD QUOTED MEDIA (IMAGE / STICKER)
// =========================
async function downloadQuotedMedia(message) {
  const ctx = message.message?.extendedTextMessage?.contextInfo
  const quoted = ctx?.quotedMessage

  if (!quoted) return null

  let stream
  if (quoted.imageMessage) {
    stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
  } else if (quoted.stickerMessage) {
    stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker')
  } else {
    return null
  }

  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }

  return buffer
}

// =========================
// UPLOAD BUFFER → URL
// =========================
async function uploadImageBuffer(buffer) {
  const tempDir = path.join(__dirname, '../temp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const tempPath = path.join(tempDir, `${Date.now()}.jpg`)
  fs.writeFileSync(tempPath, buffer)

  let url
  try {
    url = await TelegraPh(tempPath)
  } catch {
    const res = await UploadFileUgu(tempPath)
    url = typeof res === 'string' ? res : res.url
  } finally {
    setTimeout(() => {
      try { fs.unlinkSync(tempPath) } catch {}
    }, 2000)
  }

  return url
}

// =========================
// MAIN COMMAND
// =========================
module.exports = async function memegenCommand(sock, chatId, message, userMessage) {
  try {
    // ====== REPLY IMAGE / STICKER ======
    const mediaBuffer = await downloadQuotedMedia(message)
    if (!mediaBuffer) {
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Reply gambar atau stiker (non gif)' },
        { quoted: message }
      )
    }

    // ====== PARSE ARG ======
    const isImage = userMessage.includes('--image')

    const cleanText = userMessage
      .replace(/^\.memegen/i, '')
      .replace('--image', '')
      .trim()

    let [top = '', bottom = ''] = cleanText.split('|')

    top = encodeURIComponent(top || '_')
    bottom = encodeURIComponent(bottom || '_')

    // ====== UPLOAD BG ======
    const bgUrl = await uploadImageBuffer(mediaBuffer)

    // ====== MEMEGEN URL ======
    const memeUrl =
      `https://api.memegen.link/images/custom/${top}/${bottom}.png` +
      `?background=${encodeURIComponent(bgUrl)}`

    // ================= IMAGE MODE =================
    if (isImage) {
      return await sock.sendMessage(
        chatId,
        {
          image: { url: memeUrl },
          caption: '🖼️ Meme Generated'
        },
        { quoted: message }
      )
    }

    // ================= STICKER MODE (DEFAULT) =================
    const img = await axios.get(memeUrl, { responseType: 'arraybuffer' })

    const webpPath = await writeExifImg(img.data, {
      packname: settings.packname,
      author: settings.author
    })

    const sticker = fs.readFileSync(webpPath)
    fs.unlinkSync(webpPath)

    await sock.sendMessage(
      chatId,
      { sticker },
      { quoted: message }
    )

  } catch (err) {
    console.error('MEMEGEN ERROR:', err)
    await sock.sendMessage(
      chatId,
      { text: 'BOT: Ya gimana bang, gagal ini!' },
      { quoted: message }
    )
  }
}
