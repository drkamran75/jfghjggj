const axios = require('axios');

/**
 * SPOTIFY DOWNLOADER
 * Powered by GamePVZ API
 */

module.exports = {
    name: "spotify",
    alias: ["spdl", "spotifydl"],
    category: "download",
    description: "Download music from Spotify links.",
    async execute(context) {
        const { sock, m, reply, react, args, from } = context;

        const url = args[0];
        if (!url || !url.includes('spotify.com')) {
            return reply("🎵 *Error:* Please provide a valid Spotify track link.\n\n*Example:* .spotify https://open.spotify.com/track/...");
        }

        try {
            await react('⏳');
            reply("_🎧 Fetching audio data... Please wait._");

            // 1. Request to API
            const res = await axios.post(
                'https://gamepvz.com/api/download/get-url',
                { url: url },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 30000
                }
            );

            const data = res.data;

            if (data.code !== 0 || !data.originalVideoUrl) {
                throw new Error(data.msg || "Failed to retrieve download link.");
            }

            // 2. Prepare Data
            const downloadUrl = 'https://gamepvz.com' + data.originalVideoUrl;
            const caption = `✅ *SPOTIFY DOWNLOAD*\n\n` +
                            `📌 *Title:* ${data.title}\n` +
                            `👤 *Artist:* ${data.authorName || 'Unknown'}\n\n` +
                            `> © Powered by KAMRAN-MD`;

            // 3. Send Thumbnail/Cover and Audio
            // We use the coverUrl provided by the API
            await sock.sendMessage(from, { 
                image: { url: data.coverUrl }, 
                caption: caption 
            }, { quoted: m });

            // Send as Document or Audio (PTT false for regular audio file)
            await sock.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${data.title}.mp3`
            }, { quoted: m });

            await react('✅');

        } catch (err) {
            console.error("Spotify DL Error:", err.response?.data || err.message);
            await react('❌');
            reply(`❌ *Failed:* ${err.message || "An error occurred while processing the Spotify link."}`);
        }
    }
};
