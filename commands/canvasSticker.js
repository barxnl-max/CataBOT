const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const Canvacord = require('canvacord')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

async function canvasStickerCommand(sock, chatId, message) {
try {
const ctx = message.message?.extendedTextMessage?.contextInfo
const quoted = ctx?.quotedMessage

if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {  
        return sock.sendMessage(  
            chatId,  
            { text: '⚠️ Reply foto atau stiker(non gif)' },  
            { quoted: message }  
        )  
    }  

    // =========================  
    // DOWNLOAD MEDIA  
    // =========================  
    let buffer  
    let stream  

    if (quoted.imageMessage) {  
        stream = await downloadContentFromMessage(quoted.imageMessage, 'image')  
    } else if (quoted.stickerMessage) {  
        stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker')  
    }  

    buffer = Buffer.from([])  
    for await (const chunk of stream) {  
        buffer = Buffer.concat([buffer, chunk])  
    }  

    // =========================  
    // CANVACORD EFFECT  
    // =========================  
    const result = await Canvacord.Canvas.trigger(buffer)  

    // =========================  
    // CONVERT TO STICKER + WM  
    // =========================  
    const webpPath = await writeExifImg(result, {  
        packname: settings.packname,  
        author: settings.author  
    })  

    const sticker = fs.readFileSync(webpPath)  
    fs.unlinkSync(webpPath)  

    // =========================  
    // SEND  
    // =========================  
    await sock.sendMessage(  
        chatId,  
        { sticker },  
        { quoted: message }  
    )  

} catch (err) {  
    console.error('triggered error:', err)  
    await sock.sendMessage(  
        chatId,  
        { text: '❌ Gagal bikin stiker triggered' },  
        { quoted: message }  
    )  
}

}

module.exports = canvasStickerCommand
