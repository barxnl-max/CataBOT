const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// =======================
// AUDIO FILTER PRESETS
// =======================
const FILTERS = {
    // BASIC
    volume: 'volume=1.5',
    normalize: 'loudnorm',
    bass: 'equalizer=f=94:width_type=o:width=2:g=30',
    treble: 'treble=g=8',

    // SPEED / PITCH
    fast: 'atempo=1.6',
    slow: 'atempo=0.7',
    nightcore: 'asetrate=44100*1.25,atempo=1.05',
    chipmunk: 'asetrate=65100,atempo=0.5',
    deep: 'asetrate=44100*0.7,atempo=1.0',
    fat: 'asetrate=22100,atempo=1.6',

    // DISTORTION / LOUD
    earrape: 'volume=12',
    blown: 'acrusher=.1:1:64:0:log',
    distorted: 'acrusher=level_in=1:level_out=1:bits=4:mode=log',
    overdrive: 'acompressor=threshold=0.05:ratio=20:attack=5:release=50',

    // EFFECT
    echo: 'aecho=0.8:0.9:1000:0.3',
    reverb: 'aecho=0.8:0.9:1000|1800:0.3|0.25',
    robot: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
    reverse: 'areverse',
    vaporwave: 'asetrate=44100*0.8,atempo=0.8',

    // STYLE
    radio: 'highpass=f=300,lowpass=f=3000',
    telephone: 'highpass=f=500,lowpass=f=2500',
    underwater: 'lowpass=f=1000',
    '8d': 'apulsator=hz=0.125'
};

async function AudioFilter(sock, chatId, message, args = []) {
    try {
        const filter = args[0]?.toLowerCase();
        if (!filter || !FILTERS[filter]) {
            return sock.sendMessage(
                chatId,
                {
                    text:
`❌ Audio filter tidak valid

Available:
${Object.keys(FILTERS).join(', ')}

Contoh:
.afilter nightcore`
                },
                { quoted: message }
            );
        }

        // =======================
        // AMBIL QUOTED MEDIA
        // =======================
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        if (!ctx?.quotedMessage) {
            return sock.sendMessage(
                chatId,
                { text: '❌ Reply audio / vn / video' },
                { quoted: message }
            );
        }

        const quoted = ctx.quotedMessage;
        const isAudio = !!quoted.audioMessage;
        const isVideo = !!quoted.videoMessage;

        if (!isAudio && !isVideo) {
            return sock.sendMessage(
                chatId,
                { text: '❌ Hanya support audio atau video' },
                { quoted: message }
            );
        }

        const mediaMsg = {
            key: {
                remoteJid: chatId,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        };

        const buffer = await downloadMediaMessage(
            mediaMsg,
            'buffer',
            {},
            { reuploadRequest: sock.updateMediaMessage }
        );

        // =======================
        // TEMP FILE
        // =======================
        const tmp = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

        const input = path.join(tmp, `afilter_in_${Date.now()}`);
        const output = path.join(tmp, `afilter_out_${Date.now()}.mp3`);

        fs.writeFileSync(input, buffer);

        // =======================
        // FFMPEG AUDIO FILTER
        // =======================
        const cmd = isVideo
            ? `ffmpeg -y -i "${input}" -vn -af "${FILTERS[filter]}" "${output}"`
            : `ffmpeg -y -i "${input}" -af "${FILTERS[filter]}" "${output}"`;

        await new Promise((resolve, reject) => {
            exec(cmd, err => err ? reject(err) : resolve());
        });

        // =======================
        // SEND RESULT
        // =======================
        await sock.sendMessage(
            chatId,
            {
                audio: fs.readFileSync(output),
                mimetype: 'audio/mpeg'
                // ptt: true → kalau mau VN
            },
            { quoted: message }
        );

        try {
            fs.unlinkSync(input);
            fs.unlinkSync(output);
        } catch {}

    } catch (err) {
        console.error('afilter error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal apply audio filter' },
            { quoted: message }
        );
    }
}

module.exports = AudioFilter
