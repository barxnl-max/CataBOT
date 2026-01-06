 async function helpCommand(sock, chatId, message) {
    const sender = message.key.participant || message.key.remoteJid

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const args = text.trim().split(/\s+/).slice(1)
    const isAll = args[0]?.toLowerCase() === 'all'

    const helpMessage = `
Saya adalah *WhatsApp Bot* 🤖
Dibuat untuk membantu berbagai aktivitas harian Anda, mulai dari kebutuhan praktis hingga hiburan.

Saya dapat membantu Anda untuk:
• Download media (TikTok, Instagram, YouTube)
• Membuat stiker, quote sticker (QC), dan meme
• Utilitas serta manajemen grup
• Hiburan, game, dan fitur seru lainnya

Bot ini dibangun menggunakan *TypeScript*,
dengan fokus pada *performa*, *stabilitas*, dan *kemudahan penggunaan*.

✨ *Fitur Andalan*:
• .sticker → Reply gambar / video ke stiker
• .qc <text> → Quote chat jadi stiker
• .play <query> → Cari & download lagu
• .memegen → Generator meme
• .brat <text> → Brat meme sticker
• .xvsearch <query> → Cari video Xvideos
• .getxvideo <nomor> → Download video Xvideos
• .tiktok <url > → Download TikTok tanpa watermark
• .waifu (opsional) → Tampilkan gambar animeh
• .waifunsfw (opsional) → Tampilkan gambar animeh telanjang
• .menu all → Tampilkan seluruh fitur bot

Silakan gunakan perintah dengan bijak ✨
`.trim()

    const helpMessageAll = `
╭───〔 📌 GENERAL 〕───╮
.help / .menu → Menampilkan menu bot
.menu all → Menampilkan semua fitur
.ping → Cek respon bot
.alive → Status bot
.owner → Info owner bot
.jid → Menampilkan JID chat
.url → Menampilkan URL chat
╰────────────────────╯

╭───〔 🔁 AUTORESPON 〕───╮
.addautorespon <kata>|<respon> → Tambah autorespon
.listautorespon → List autorespon
.delautorespon <kata> → Hapus autorespon
╰──────────────────────╯

╭───〔 🛠️ UTILITY 〕───╮
.tts <text> → Text ke suara
.trt <text> <lang> → Translate teks
.ss <link> → Screenshot website
.vv → View once ke biasa
.toptt <text> → Text ke sticker
.weather <city> → Info cuaca
.news → Berita terbaru
.lyrics <judul> → Lirik lagu
.8ball <pertanyaan> → Jawaban random
.groupinfo → Info grup
.staff / .admins → List admin
╰────────────────────╯

╭───〔 🖼️ STICKER & IMAGE 〕───╮
.sticker → Kirim / reply gambar jadi sticker
.attp <text> → Sticker teks animasi
.qc <warna> <teks> → Quote chat ke sticker
.triggered → Reply gambar jadi sticker triggered
.blur → Blur gambar
.crop → Crop gambar
.simage → Sticker ke gambar
.removebg → Hapus background
.remini → HD gambar
.tgsticker <link> → Sticker dari Telegram
.meme → Meme random
.take <packname> → Ubah pack sticker
.emojimix 😄+😂 → Gabung emoji
.brat <text> → Brat meme sticker
╰────────────────────────╯

╭───〔 📥 DOWNLOADER 〕───╮
.snapsave <link> → TikTok / IG / FB
.play <judul> → Download lagu
.song <judul> → Download lagu
.spotify <query> → Download Spotify
.instagram <link> → Download Instagram
.facebook <link> → Download Facebook
.tiktok <link> → Download TikTok
.video <judul> → Cari video
.ytmp4 <link> → Download YouTube
╰──────────────────────╯

╭───〔 🔞 XVIDEOS 〕───╮
.xvsearch <judul> → Cari video
.getxvideo <nomor> → Download video
╰───────────────────╯

╭───〔 🌸 WAIFU 〕───╮
.waifu → Random waifu
.nsfwwaifu → Random waifu NSFW
.pies <country> → Cewek berdasarkan negara
.china / .indonesia / .japan
.korea / .hijab
╰──────────────────╯

╭───〔 🎮 GAME 〕───╮
.tictactoe @user → Tic Tac Toe
.hangman → Tebak kata
.guess <huruf> → Tebak huruf
.trivia → Soal trivia
.answer <jawaban> → Jawab trivia
.truth → Truth
.dare → Dare
╰──────────────────╯

╭───〔 🎉 FUN 〕───╮
.compliment @user → Pujian
.insult @user → Ejekan
.flirt → Gombalan
.shayari → Puisi
.goodnight → Ucapan malam
.roseday → Ucapan roseday
.character @user → Cek karakter
.wasted @user → Efek wasted
.ship @user → Cek kecocokan
.simp @user → Cek simp
.stupid @user <text> → Stupid meme
╰──────────────────╯

╭───〔 📝 TEXT MAKER 〕───╮
.metallic <text>
.ice <text>
.snow <text>
.impressive <text>
.matrix <text>
.light <text>
.neon <text>
.devil <text>
.purple <text>
.thunder <text>
.leaves <text>
.1917 <text>
.arena <text>
.hacker <text>
.sand <text>
.blackpink <text>
.glitch <text>
.fire <text>
╰──────────────────────╯

╭───〔 🛡️ ADMIN 〕───╮
.ban @user
.unban @user
.promote @user
.demote @user
.mute <menit>
.unmute
.delete / .del
.kick @user
.warn @user
.warnings @user
.antilink
.antibadword
.clear
.tag <pesan>
.tagall
.tagnotadmin
.hidetag <pesan>
.resetlink
.welcome on/off
.goodbye on/off
.setgdesc <teks>
.setgname <nama>
.setgpp
╰──────────────────╯

╭───〔 👑 OWNER 〕───╮
.mode public/private
.clearsession
.antidelete
.cleartmp
.update
.settings
.setpp
.autoreact on/off
.autostatus on/off
.autotyping on/off
.autoread on/off
.anticall on/off
.pmblocker on/off
.pmblocker setmsg <text>
.setmention
.mention on/off
╰──────────────────╯

✨ Terima kasih sudah menggunakan Cata Bot`.trim()

    const messageText = isAll ? helpMessageAll : helpMessage

    try {
        await sock.sendMessage(
            chatId,
            {
                text: messageText,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: 'Cata La Li Lo? Catashtroph Assistant',
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://i.ibb.co.com/Jj8YJPRN/3aaa806df7ed8d95e652858749b37d7e.jpg'
                        // sourceUrl sengaja dihilangkan
                    }
                },
                mentions: [sender]
            },
            { quoted: message }
        )
    } catch (err) {
        console.error('HELP ERROR:', err)
        await sock.sendMessage(chatId, { text: messageText }, { quoted: message })
    }
}

module.exports = helpCommand 
