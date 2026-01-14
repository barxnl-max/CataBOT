const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const webp = require('node-webpmux')
const crypto = require('crypto')

async function stickercropCommand(sock, chatId, message) {
    const messageToQuote = message
    let targetMessage = message

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const q = message.message.extendedTextMessage.contextInfo
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: q.stanzaId,
                participant: q.participant
            },
            message: q.quotedMessage
        }
    }

    const mediaMessage =
        targetMessage.message?.imageMessage ||
        targetMessage.message?.videoMessage ||
        targetMessage.message?.documentMessage ||
        targetMessage.message?.stickerMessage

    if (!mediaMessage) {
        return sock.sendMessage(
            chatId,
            { text: 'Reply image / video / sticker dengan .crop' },
            { quoted: messageToQuote }
        )
    }

    try {
        const mediaBuffer = await downloadMediaMessage(
            targetMessage,
            'buffer',
            {},
            { reuploadRequest: sock.updateMediaMessage }
        )

        if (!mediaBuffer) {
            return sock.sendMessage(
                chatId,
                { text: 'Gagal download media' },
                { quoted: messageToQuote }
            )
        }

        const tmpDir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

        const tempInput = path.join(tmpDir, `in_${Date.now()}`)
        const tempOutput = path.join(tmpDir, `out_${Date.now()}.webp`)
        fs.writeFileSync(tempInput, mediaBuffer)

        const isAnimated =
            mediaMessage.mimetype?.includes('gif') ||
            mediaMessage.mimetype?.includes('video') ||
            mediaMessage.seconds > 0

        const sizeKB = mediaBuffer.length / 1024
        const big = sizeKB > 5000

        let cmd
        if (isAnimated) {
            cmd = big
                ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -loop 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k "${tempOutput}"`
                : `ffmpeg -y -i "${tempInput}" -t 3 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=12" -c:v libwebp -loop 0 -pix_fmt yuva420p -quality 50 -compression_level 6 -b:v 150k "${tempOutput}"`
        } else {
            cmd = `ffmpeg -y -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -loop 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
        }

        await new Promise((res, rej) => {
            exec(cmd, err => (err ? rej(err) : res()))
        })

        const webpBuffer = fs.readFileSync(tempOutput)
        const img = new webp.Image()
        await img.load(webpBuffer)

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': global.packname,
            'sticker-pack-publisher': global.author || '@barxnl250_',
            emojis: ['✂️']
        }

        const exifAttr = Buffer.from([
            0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
            0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
            0x00,0x00,0x16,0x00,0x00,0x00
        ])

        const jsonBuffer = Buffer.from(JSON.stringify(json))
        const exif = Buffer.concat([exifAttr, jsonBuffer])
        exif.writeUIntLE(jsonBuffer.length, 14, 4)
        img.exif = exif

        const finalBuffer = await img.save(null)

        await sock.sendMessage(
            chatId,
            { sticker: finalBuffer },
            { quoted: messageToQuote }
        )

        fs.unlinkSync(tempInput)
        fs.unlinkSync(tempOutput)

    } catch (e) {
        sock.sendMessage(
            chatId,
            { text: 'Gagal crop sticker' },
            { quoted: messageToQuote }
        )
    }
}

module.exports = stickercropCommand
