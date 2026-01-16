const settings = {
  packname: 'Catashtroph',
  author: '@barxnl250_',

  botName: 'Cata Bot',
  botOwner: 'Akbar',
  ownerNumber: '62821985717322',

  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: 'private',

  maxStoreMessages: 20,
  storeWriteInterval: 10000,

  description: 'This is a bot for managing group commands and automating task.',
  version: '3.0.6',

  updateZipUrl: '',
}
// Wm Stickerr
global.packname = settings.packname
global.author = settings.author
global.wm = settings.packname
global.auth = `Ig: ${settings.author.replace('@', '')}`

//Respon
global.error = "❌️ Terjadi kesalahan, mohon coba lagi nanti!"
global.load = "⏳️ Tunggu Sebentar, permintaan anda sedang kami proses"
global.succes = "✅️ Berhasil..."
// CHANNEL
global.channel = "120363423464130445@newsletter"

global.prompt = "Kamu adalah lydia dan kamu diciptakan oleh Akbar, aksen kamu jaksel dan kamu membantu dalam pengodean"


module.exports = settings
