// commands/tagbot.js
const settings = require('../settings')

const cooldown = new Map()
const COOLDOWN_MS = 10 * 1000

const responses = [
  'Iya iya, kenapa? 😑',
  'Dipanggil mulu, capek tau',
  'Apaan sih?',
  'Woy?',
  'Santai napa 😴',
  'Ada apa lagi?',
  'Aku bukan CS 😶',
  'Tag terus, batre gue abis'
]

async function tagBotCommand(sock, message) {
  try {
    if (!message?.message) return

    const chatId = message.key.remoteJid
    if (!chatId.endsWith('@g.us')) return
    if (message.key.fromMe) return

    const sender =
      message.key.participant || message.key.remoteJid

    const mentioned =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    if (!mentioned.length) return

    // NO BOT DARI SETTINGS
    const botJid = settings.ownerNumber + '@s.whatsapp.net'
    if (!mentioned.includes(botJid)) return

    // COOLDOWN
    const now = Date.now()
    if (cooldown.has(sender) && now - cooldown.get(sender) < COOLDOWN_MS) return
    cooldown.set(sender, now)

    const reply = responses[Math.floor(Math.random() * responses.length)]
    await new Promise(r => setTimeout(r, 600))

    await sock.sendMessage(chatId, { text: reply }, { quoted: message })
  } catch (e) {
    console.error('TagBot Error:', e)
  }
}

module.exports = tagBotCommand
