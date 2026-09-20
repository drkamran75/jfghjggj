const yts = require("yt-search");
const axios = require("axios");

module.exports = {
  name: "play",
  alias: ["song", "music", "ytmp3"],
  category: "download",
  desc: "Download songs using OfficialHectoManuel API",

  async execute(context) {
    const { socket, sock, conn, from, q, reply, m, react } = context;
    const bot = socket || sock || conn;

    try {
      if (!q) {
        return reply("❓ Example: .play Alone Alan Walker");
      }

      // Search Reaction
      await react("🔍");

      // Search Song
      const search = await yts(q);

      if (!search || !search.videos.length) {
        return reply("❌ No results found!");
      }

      const vid = search.videos[0];

      // Caption
      const caption = `╭━━〔 🎵 MUSIC FOUND 〕━━━╮
┃ 🎧 Title : ${vid.title}
┃ ⏱️ Duration : ${vid.timestamp}
┃ 👁️ Views : ${vid.views.toLocaleString()}
╰━━━━━━━━━━━━━━━━━╯

⏳ Downloading audio...`;

      // Send Thumbnail
      await bot.sendMessage(
        from,
        {
          image: { url: vid.thumbnail },
          caption: caption
        },
        { quoted: m }
      );

      await react("⏳");

      // Download Audio
      const api = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(
        vid.url
      )}`;

      const { data } = await axios.get(api);

      if (!data || !data.status || !data.audio) {
        return reply("❌ Could not fetch audio. Try another song.");
      }

      // Send Audio
      await bot.sendMessage(
        from,
        {
          audio: { url: data.audio },
          mimetype: "audio/mpeg",
          fileName: `${vid.title}.mp3`
        },
        { quoted: m }
      );

      await react("✅");
    } catch (err) {
      console.error(err);
      await react("❌");
      reply("⚠️ Download failed: " + err.message);
    }
  }
};
