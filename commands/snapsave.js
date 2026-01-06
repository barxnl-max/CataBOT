const snapsave = require('../lib/snapsave')

module.exports = async (sock, chatId, message, userMessage) => {
    try {
        const args = userMessage.trim().split(/\s+/).slice(1)
        const url = args[0]

        if (!url) {
            await sock.sendMessage(
                chatId,
                { text: 'URL mana?' },
                { quoted: message }
            )
            return
        }

        const res = await snapsave(url)
        if (!res.success) {
            await sock.sendMessage(
                chatId,
                { text: res.message || 'Gagal mengambil media' },
                { quoted: message }
            )
            return
        }

        const media = res.data.media
        if (!media || !media.length) {
            await sock.sendMessage(
                chatId,
                { text: 'Media kosong' },
                { quoted: message }
            )
            return
        }

        for (const v of media) {
            if (v.type === 'image') {
                await sock.sendMessage(
                    chatId,
                    { image: { url: v.url } },
                    { quoted: message }
                )
            } else {
                await sock.sendMessage(
                    chatId,
                    { video: { url: v.url } },
                    { quoted: message }
                )
            }
        }
    } catch (e) {
        console.error('SNAPSAVE ERROR:', e)
    }
}
