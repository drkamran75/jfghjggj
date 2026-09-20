const axios = require("axios");

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        "User-Agent": "Mozilla/5.0"
    }
};

module.exports = {
    name: "xnxx",
    alias: ["xnxxdl"],
    category: "download",
    desc: "Download XNXX videos",

    async execute(context) {
        const { socket, sock, conn, from, q, reply, m, react } = context;
        const bot = socket || sock || conn;

        if (!q) {
            return reply(
                "❓ Example:\n.xnxx https://www.xnxx.com/video-xxxxx"
            );
        }

        try {
            await react("🔍");

            const apiUrl =
                `https://vajira-official-apis.vercel.app/api/xnxx-dl?apikey=vajira-c4lyk0eh40-1780543016045&url=${encodeURIComponent(q)}`;

            const { data: res } = await axios.get(apiUrl, AXIOS_DEFAULTS);

            if (!res || !res.status) {
                return reply("❌ Failed to fetch video data.");
            }

            console.log(res); // Check API response structure

            const data = res.data || res.result;

            let caption = `╭━━〔 🎬 XNXX VIDEO 〕━━━╮
┃ 📝 Title : ${data.title || "Unknown"}
┃ ⏱️ Duration : ${data.duration || "Unknown"}
╰━━━━━━━━━━━━━━━━━╯

📥 Sending video...
`;

            await bot.sendMessage(
                from,
                {
                    image: {
                        url: data.thumbnail
                    },
                    caption
                },
                { quoted: m }
            );

            await react("📥");

            await bot.sendMessage(
                from,
                {
                    video: {
                        url:
                            data.download ||
                            data.url ||
                            data.video
                    },
                    mimetype: "video/mp4",
                    caption: `🎬 ${data.title || "XNXX Video"}`
                },
                { quoted: m }
            );

            await react("✅");

        } catch (err) {
            console.error(err);
            await react("❌");
            reply(`⚠️ Error: ${err.message}`);
        }
    }
};
