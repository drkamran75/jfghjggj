const axios = require("axios");

const AXIOS_DEFAULTS = { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } };

module.exports = {
    name: "fb",
    alias: ["fbdl", "facebook", "fbvideo"],
    category: "download",
    desc: "Download Facebook videos and reels with format selection",

    async execute(context) {
        const { socket, sock, conn, from, q, reply, m, react } = context;
        const bot = socket || sock || conn;

        if (!q) return reply("❓ Example: .fb https://www.facebook.com/reel/1606079790876668/");

        // Facebook URL validation
        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            return reply("❌ Please provide a valid Facebook video or reel link.");
        }

        try {
            await react("🔍");

            // 1. Fetch API Data
            const apiUrl = `https://vajira-official-apis.vercel.app/api/fbdl?apikey=vajira-23ikssig51-1780651873767&url=${encodeURIComponent(q)}`;
            const { data: res } = await axios.get(apiUrl, AXIOS_DEFAULTS);

            // Validate API status response layout
            if (!res || res.status !== true || !res.links || !res.links.download_url) {
                return reply("❌ Failed to fetch downloadable links for this Facebook video.");
            }

            // Extract metadata fields
            const title = res.title || "Facebook Video";
            const duration = res.duration || "N/A";
            const size = res.links.size_mb ? `${res.links.size_mb} MB` : "N/A";
            const uploader = res.uploader || "Unknown";
            const videoUrl = res.links.download_url;
            const thumbnailUrl = res.thumbnail || "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg";

            // 2. Format Menu Caption using your design
            let caption = `╭━━〔 🎬 FB DOWNLOADER 〕━━━╮\n`;
            caption += `┃ 📝 *Title:* ${title}\n`;
            caption += `┃ 👤 *Uploader:* ${uploader}\n`;
            caption += `┃ 🕒 *Duration:* ${duration}\n`;
            caption += `┃ 📦 *Size:* ${size}\n`;
            caption += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            caption += `┌───────────────────\n`;
            caption += `│ 🎞️ *1* ☛ Video (Normal)\n`;
            caption += `│ 🎵 *2* ☛ Audio (MP3)\n`;
            caption += `│ 🎤 *3* ☛ Voice Note (PTT)\n`;
            caption += `│ 📂 *4* ☛ Document (File)\n`;
            caption += `│ 🎥 *5* ☛ Video Note (PTV)\n`;
            caption += `└───────────────────\n\n`;
            caption += `*📥 Reply with a number to download*`;

            // 3. Send Menu with Thumbnail
            const sent = await bot.sendMessage(from, {
                image: { url: thumbnailUrl },
                caption: caption
            }, { quoted: m });

            const msgId = sent.key.id;

            // 4. Response Handler (Listener)
            const handler = async (update) => {
                const incoming = update.messages?.[0];
                if (!incoming?.message || incoming.key.remoteJid !== from) return;

                const body = (incoming.message.conversation || incoming.message.extendedTextMessage?.text || "").trim();
                const ctx = incoming.message.extendedTextMessage?.contextInfo;

                if (ctx?.stanzaId !== msgId || isNaN(body)) return;
                
                let num = parseInt(body);
                if (num < 1 || num > 5) return; // 1 se 5 ke beech option check

                await bot.sendMessage(from, { react: { text: "📥", key: incoming.key } });

                try {
                    // Switch case mapping options to Baileys formats
                    switch (num) {
                        case 1: // Video Normal
                            await bot.sendMessage(from, { 
                                video: { url: videoUrl }, 
                                caption: `🎬 *${title}*`,
                                mimetype: "video/mp4"
                            }, { quoted: incoming });
                            break;

                        case 2: // Audio MP3
                            await bot.sendMessage(from, { 
                                audio: { url: videoUrl }, 
                                mimetype: "audio/mpeg",
                                fileName: `${title}.mp3`
                            }, { quoted: incoming });
                            break;

                        case 3: // Voice Note PTT
                            await bot.sendMessage(from, { 
                                audio: { url: videoUrl }, 
                                mimetype: "audio/mp4",
                                ptt: true 
                            }, { quoted: incoming });
                            break;

                        case 4: // Document File
                            await bot.sendMessage(from, { 
                                document: { url: videoUrl }, 
                                mimetype: "video/mp4",
                                fileName: `${title}.mp4`
                            }, { quoted: incoming });
                            break;

                        case 5: // Video Note PTV (Round shape video message)
                            await bot.sendMessage(from, { 
                                video: { url: videoUrl }, 
                                ptv: true 
                            }, { quoted: incoming });
                            break;
                    }

                    await bot.sendMessage(from, { react: { text: "✅", key: incoming.key } });
                    bot.ev.off("messages.upsert", handler); // Turn off listener after task done

                } catch (err) {
                    console.error(err);
                    bot.sendMessage(from, { text: "⚠️ Failed to send media: " + err.message }, { quoted: incoming });
                }
            };

            // Start Listening
            bot.ev.on("messages.upsert", handler);
            
            // Timeout after 10 minutes to prevent memory leaks
            setTimeout(() => { bot.ev.off("messages.upsert", handler); }, 600000);

            await react("✅");

        } catch (err) {
            console.error(err);
            await react("❌");
            reply("⚠️ Error: " + err.message);
        }
    }
};
