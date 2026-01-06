const util = require('util')

function autoReturn(code) {
  const lines = code
    .split('\n')
    .map(v => v.trim())
    .filter(v => v)

  if (lines.length === 0) return code

  const last = lines[lines.length - 1]

  // kalau sudah return / throw / await return → skip
  if (/^(return|throw)/.test(last)) return code

  lines[lines.length - 1] = `return (${last})`
  return lines.join('\n')
}

module.exports = async (sock, chatId, message, senderId, userMessage) => {
  const owner = ['6282198571732@s.whatsapp.net'] // GANTI
  if (!owner.includes(senderId)) return

  let code = ''
  let isArrow = false

  if (userMessage.startsWith('=>')) {
    isArrow = true
    code = userMessage.slice(2).trim()
  } else if (userMessage.startsWith('>')) {
    code = userMessage.slice(1).trim()
  } else return

  if (!code) return

  try {
    let finalCode = code
    if (isArrow) {
      finalCode = autoReturn(code)
    }

    let result = await eval(`
      (async () => {
        ${finalCode}
      })()
    `)

    if (typeof result !== 'string') {
      result = util.inspect(result, { depth: 1 })
    }

    await sock.sendMessage(chatId, {
      text: String(result).slice(0, 4000)
    })
  } catch (e) {
    await sock.sendMessage(chatId, {
      text: String(e)
    })
  }
}
