const fetch = require('node-fetch');
const fs = require('fs');
const { writeExifImg } = require('../lib/exif');
const settings = require('../settings');

async function sbratCommand(sock, chatId, message) {
    try {
        const rawText =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const texttt = rawText
            .replace(/^(\.brat|\.sbrat)\s*/i, '')
            .trim();
        if (!texttt) {
            return sock.sendMessage(
                chatId,
                { text: '⚠️ Contoh: .sbrat Akbar' },
                { quoted: message }
            );
        }

        const url = `https://aqul-brat.hf.space/?text=${encodeURIComponent(texttt)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fetch brat failed');

        const imgBuffer = Buffer.from(await res.arrayBuffer());

        const stickerPath = await writeExifImg(imgBuffer, {
            packname: settings.packname,
            author: settings.author
        });

        const stickerBuffer = fs.readFileSync(stickerPath);

        await sock.sendMessage(
            chatId,
            { sticker: stickerBuffer },
            { quoted: message }
        );

        fs.unlinkSync(stickerPath);
    } catch (err) {
        console.error('sbrat error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal bikin stiker brat' },
            { quoted: message }
        );
    }
}

module.exports = sbratCommand;
