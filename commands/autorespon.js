const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DATA_DIR = path.join(__dirname, '../data')
const MEDIA_DIR = path.join(__dirname, '../media')
const TEXT_DB = path.join(DATA_DIR, 'autorespon_text.json')
const MEDIA_DB = path.join(DATA_DIR, 'autorespon_media.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR)
if (!fs.existsSync(TEXT_DB)) fs.writeFileSync(TEXT_DB, '{}')
if (!fs.existsSync(MEDIA_DB)) fs.writeFileSync(MEDIA_DB, '{}')

const load = f => JSON.parse(fs.readFileSync(f))
const save = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2))
const rand = a => a[Math.floor(Math.random() * a.length)]

async function downloadQuotedMedia(quoted) {
    let mediaType, mediaMsg, isPTT = false

    if (quoted.imageMessage) {
        mediaType = 'image'
        mediaMsg = quoted.imageMessage
    } else if (quoted.videoMessage) {
        mediaType = 'video'
        mediaMsg = quoted.videoMessage
    } else if (quoted.audioMessage) {
        mediaType = 'audio'
        mediaMsg = quoted.audioMessage
        isPTT = quoted.audioMessage.ptt === true
    } else if (quoted.stickerMessage) {
        mediaType = 'sticker'
        mediaMsg = quoted.stickerMessage
    } else {
        return null
    }

    const stream = await downloadContentFromMessage(mediaMsg, mediaType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }

    return { mediaType, buffer, isPTT }
}

module.exports = async function autoresponCommand(
    sock,
    chatId,
    message,
    userMessage,
    channelInfo
) {
    try {
        const textDB = load(TEXT_DB)
        const mediaDB = load(MEDIA_DB)
        const text = userMessage.toLowerCase()

        /* ================= ADD ================= */
        if (text.startsWith('.addautorespon')) {
            const args = text.replace('.addautorespon', '').trim()
            if (!args) {
                await sock.sendMessage(chatId, { text: 'format: .addautorespon kata|respon1*respon2', ...channelInfo })
                return
            }

            const [keyRaw, respRaw] = args.split('|')
            const key = keyRaw.trim().toLowerCase()

            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage

            // ===== MEDIA =====
            if (quoted) {
                const media = await downloadQuotedMedia(quoted)
                if (!media) {
                    await sock.sendMessage(chatId, { text: 'media tidak didukung', ...channelInfo })
                    return
                }

                const ext =
                    media.mediaType === 'image' ? 'jpg' :
                    media.mediaType === 'video' ? 'mp4' :
                    media.mediaType === 'audio'
                        ? (media.isPTT ? 'ogg' : 'mp3')
                        : 'webp'

                const filename = crypto.randomBytes(8).toString('hex') + '.' + ext
                fs.writeFileSync(path.join(MEDIA_DIR, filename), media.buffer)

                mediaDB[key] = {
                    mediaType: media.mediaType,
                    file: filename,
                    isPTT: media.isPTT
                }
                save(MEDIA_DB, mediaDB)

                await sock.sendMessage(chatId, { text: `✅ autorespon media "${key}" ditambahkan`, ...channelInfo })
                return
            }

            // ===== TEXT =====
            if (!respRaw) {
                await sock.sendMessage(chatId, { text: 'respon teks kosong', ...channelInfo })
                return
            }

            const responses = respRaw
                .split('*')
                .map(v => v.trim())
                .filter(Boolean)

            textDB[key] = responses
            save(TEXT_DB, textDB)

            await sock.sendMessage(
                chatId,
                { text: `✅ autorespon teks "${key}" ditambahkan (${responses.length})`, ...channelInfo }
            )
            return
        }

        /* ================= LIST ================= */
        if (text === '.listautorespon') {
            const keys = [...Object.keys(textDB), ...Object.keys(mediaDB)]
            if (!keys.length) {
                await sock.sendMessage(chatId, { text: 'belum ada autorespon', ...channelInfo })
                return
            }
            await sock.sendMessage(chatId, {
                text: '📌 AUTORESPON:\n' + keys.map(v => `- ${v}`).join('\n'),
                ...channelInfo
            })
            return
        }

        /* ================= DELETE ================= */
        if (text.startsWith('.delautorespon')) {
            const key = text.replace('.delautorespon', '').trim().toLowerCase()
            if (!key) {
                await sock.sendMessage(chatId, { text: 'format: .delautorespon kata', ...channelInfo })
                return
            }

            if (textDB[key]) {
                delete textDB[key]
                save(TEXT_DB, textDB)
                await sock.sendMessage(chatId, { text: `✅ autorespon "${key}" dihapus`, ...channelInfo })
                return
            }

            if (mediaDB[key]) {
                const file = path.join(MEDIA_DIR, mediaDB[key].file)
                if (fs.existsSync(file)) fs.unlinkSync(file)
                delete mediaDB[key]
                save(MEDIA_DB, mediaDB)
                await sock.sendMessage(chatId, { text: `✅ autorespon "${key}" dihapus`, ...channelInfo })
                return
            }

            await sock.sendMessage(chatId, { text: `❌ autorespon "${key}" tidak ditemukan`, ...channelInfo })
            return
        }

        /* ================= AUTO TEXT (CONTAINS) ================= */
        for (const key in textDB) {
            if (text.includes(key)) {
                await sock.sendMessage(
                    chatId,
                    { text: rand(textDB[key]), ...channelInfo },
                    { quoted: message }
                )
                return
            }
        }

        /* ================= AUTO MEDIA (CONTAINS) ================= */
        for (const key in mediaDB) {
            if (text.includes(key)) {
                const data = mediaDB[key]
                const filePath = path.join(MEDIA_DIR, data.file)
                const buffer = fs.readFileSync(filePath)

                if (data.mediaType === 'audio') {
                    if (data.isPTT) {
                        await sock.sendMessage(chatId, {
                            audio: buffer,
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt: true
                        }, { quoted: message })
                        return
                    }

                    await sock.sendMessage(chatId, {
                        audio: buffer,
                        mimetype: 'audio/mpeg'
                    }, { quoted: message })
                    return
                }

                await sock.sendMessage(chatId, {
                    [data.mediaType]: buffer
                }, { quoted: message })
                return
            }
        }

    } catch (e) {
        console.error('AUTORESPON ERROR:', e)
         await sock.sendMessage(chatId, { text: 'Hi' })
    }
}
