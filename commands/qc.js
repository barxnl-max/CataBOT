const axios = require('axios')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

// =========================
// WARNA QC
// =========================
const COLORS = {
  white: '#ffffff',
  black: '#000000',
  red: '#f44336',
  blue: '#6cace4',
  green: '#4caf50',
  yellow: '#ffeb3b',
  purple: '#9c27b0',
  pink: '#f68ac9',
  orange: '#ff9800',
  teal: '#008080',
  magenta: '#ff00ff',
  gold: '#ffd700',
  silver: '#c0c0c0'
}

// =========================
// MAIN QC COMMAND
// =========================
module.exports = async function qcCommand(sock, chatId, message, userMessage) {
  try {
    const ctx = message.message?.extendedTextMessage?.contextInfo

    // =========================
    // TARGET (reply > self)
    // =========================
    const targetJid =
      ctx?.participant ||
      message.key.participant ||
      message.key.remoteJid

    // =========================
    // AMBIL NAMA TARGET
    // =========================
    let targetName
    try {
      targetName = await sock.getName(targetJid)
    } catch {
      targetName = 'User'
    }

    // =========================
    // AMBIL FOTO PROFIL TARGET
    // =========================
    let avatar
    try {
      avatar = await sock.profilePictureUrl(targetJid, 'image')
    } catch {
      avatar = 'https://files.catbox.moe/nwvkbt.png'
    }

    // =========================
    // AMBIL TEKS
    // =========================
    let text = ''

    if (ctx?.quotedMessage?.conversation) {
      text = ctx.quotedMessage.conversation
    } else {
      text = userMessage
        .replace(/^\.qc/i, '')
        .trim()
    }

    if (!text) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Tidak ada teks' },
        { quoted: message }
      )
    }

    if (text.length > 80) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Maksimal 80 karakter' },
        { quoted: message }
      )
    }

    // =========================
    // PARSE WARNA (DEFAULT PUTIH)
    // =========================
    let color = 'white'
    const split = text.split(' ')
    if (COLORS[split[0].toLowerCase()]) {
      color = split.shift().toLowerCase()
      text = split.join(' ')
    }

    const backgroundColor = COLORS[color]

    // =========================
    // PAYLOAD QC
    // =========================
    const payload = {
      type: 'quote',
      format: 'png',
      backgroundColor,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: targetName,
            photo: { url: avatar }
          },
          text,
          replyMessage: {}
        }
      ]
    }

    // =========================
    // REQUEST QC API
    // =========================
    const res = await axios.post(
      'https://bot.lyo.su/quote/generate',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const imgBuffer = Buffer.from(res.data.result.image, 'base64')

    // =========================
    // CONVERT KE STICKER
    // =========================
    const webpPath = await writeExifImg(imgBuffer, {
      packname: targetName,
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
    console.error('QC ERROR:', err)
    await sock.sendMessage(
      chatId,
      { text: '❌ Gagal membuat QC sticker' },
      { quoted: message }
    )
  }
}
