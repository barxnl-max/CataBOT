const { exec } = require('child_process')

module.exports = async (sock, chatId, message, senderId, userMessage) => {
  const owner = ['6282198571732@s.whatsapp.net'] // GANTI
  if (!owner.includes(senderId)) return

  if (!userMessage.startsWith('$')) return

  const cmd = userMessage.slice(1).trim()
  if (!cmd) return

  exec(cmd, async (err, stdout, stderr) => {
    if (err) {
      return sock.sendMessage(chatId, { text: err.message })
    }
    if (stderr) {
      return sock.sendMessage(chatId, { text: stderr })
    }
    await sock.sendMessage(chatId, {
      text: stdout || 'Done'
    })
  })
}
