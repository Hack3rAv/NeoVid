# ⚡ NeoVid - Universal Media Extractor

![NeoVid UI](https://img.shields.io/badge/UI-Glassmorphism-00f3ff?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=nodedotjs)
![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)

**NeoVid** is a powerful, self-hosted universal video downloader and extraction tool. It bypasses standard web protocols by compiling raw HLS streams and encrypted media fragments on a backend server, routing the final `.mp4` payload directly to the user's local device.

Built with a sleek, responsive Cyberpunk/Neon UI, it features real-time extraction tracking, clipboard integration, and an automated SQLite database to track usage statistics.

**Powered by [Neopix](https://neopix.in)**

---

## ✨ Features

* 🌍 **Universal Support:** Powered by `yt-dlp`, supporting thousands of websites (YouTube, Instagram, Twitter, etc.).
* 🎬 **Auto-Stitching:** Utilizes FFmpeg to automatically merge high-quality video and audio tracks.
* 💾 **Direct-to-Device:** Downloads securely process on the server, then automatically trigger a local download on the client device.
* 🧹 **Auto-Cleanup:** The server automatically deletes temporary files to prevent hard drive bloat.
* 📊 **Admin Logs:** Built-in SQLite database tracks target URLs, extraction duration, timestamps, and IP origins.
* 📱 **Responsive UI:** Fully responsive glassmorphism interface with a persistent "Total Minutes Fetched" sticky counter.

---

## 🛠️ Prerequisites

To run NeoVid, your machine (or VPS) must have the following installed:

1. **[Node.js](https://nodejs.org/)** (v16 or higher)
2. **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** (Must be added to system PATH)
3. **[FFmpeg](https://ffmpeg.org/)** (Must be added to system PATH)

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Hack3rAv/neovid.git](https://github.com/Hack3rAv/neovid.git)
   cd neovid
