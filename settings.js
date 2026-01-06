const settings = {
  packname: 'Catashtroph',
  author: '@barxnl250_',

  botName: 'Cata Bot',
  botOwner: 'Kontlo',
  ownerNumber: '6282198571732',

  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: 'private',

  maxStoreMessages: 20,
  storeWriteInterval: 10000,

  description: 'This is a bot for managing group commands and automating task.',
  version: '3.0.5',

  updateZipUrl: '',
}
// Wm Sticker
global.packname = settings.packname
global.author = settings.author
global.wm = settings.packname
global.auth = `Ig: ${settings.author.replace('@', '')}`

//Respon
global.error = "❌️ Terjadi kesalahan, mohon coba lagi nanti!"
global.load = "⏳️ Tunggu Sebentar, permintaan anda sedang kami proses"
global.succes = "✅️ Berhasil"

// CHANNEL
global.channel = "120363423464130445@newsletter"


module.exports = settings
