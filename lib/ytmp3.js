const fs = require("fs")
const { spawn } = require("child_process")
const ytdl = require("@distube/ytdl-core")

async function ytmp3(url) {
  try {
    if (!ytdl.validateURL(url)) {
      return { status: false, error: "invalid youtube url" }
    }

    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title
    const thumbnail = info.videoDetails.thumbnails.at(-1)?.url

    const safe =
      title.replace(/[^\w\d]/gi, "_").toLowerCase()

    const mp4 = `${safe}_${Date.now()}.mp4`
    const mp3 = `${safe}_${Date.now()}.mp3`

    // 1️⃣ download video 360p (itag 18) → PALING STABIL
    await new Promise((resolve, reject) => {
      ytdl(url, {
        quality: "18",
        highWaterMark: 1 << 20
      })
        .pipe(fs.createWriteStream(mp4))
        .on("finish", resolve)
        .on("error", reject)
    })

    // 2️⃣ convert ke mp3 96kbps (±2–3MB)
    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-y",
        "-i", mp4,
        "-vn",
        "-ab", "96k",
        "-ar", "44100",
        mp3
      ])

      ff.on("close", code => {
        if (code === 0) resolve()
        else reject(new Error("ffmpeg failed"))
      })
    })

    const buffer = await fs.promises.readFile(mp3)
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)

    // 🧹 cleanup
    fs.unlink(mp4, () => {})
    fs.unlink(mp3, () => {})

    return {
      status: true,
      title,
      thumbnail,
      size: sizeMB + " MB",
      bitrate: "96kbps",
      buffer
    }

  } catch (e) {
    return { status: false, error: e.message }
  }
}

module.exports = ytmp3
