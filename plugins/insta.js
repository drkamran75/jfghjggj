const axios = require("axios");

const AXIOS_DEFAULTS = { timeout: 60000, headers: { "User-Agent": "Mozilla/5.0" } };

module.exports = {
    name: "ig",
    alias: ["igdl", "instagram", "reel"],
    category: "download",
    desc: "Download Instagram videos with format selection",

    async execute({ socket, sock, conn, from, q, reply, m, react }) {
        const bot = socket || sock || conn;

        if (!q) {
            return reply("❓ Example:\n.ig https://www.instagram.com/reel/ABC123/");
        }

        if (!q.includes("instagram.com")) {
            return reply("❌ Please provide a valid Instagram link.");
        }

        try {
            await react("🔍");

            const apiUrl = `https://vajira-official-apis.vercel.app/api/igdl?apikey=vajira-23ikssig51-1780651873767&url=${encodeURIComponent(q)}`;
            const { data: res } = await axios.get(apiUrl, AXIOS_DEFAULTS);

            if (!res?.url_list?.length) {
                return reply("❌ Failed to fetch video.");
            }

            const videoUrl = res.url_list[0];
            const username = res.post_info?.owner_username || "Unknown";
            const captionText = res.post_info?.caption || "Instagram Post";

            // Menu caption
            let caption = `╭━━〔 📸 IG DOWNLOADER 〕━━━╮\n`;
            caption += `┃ 📝 *Title:* ${captionText.substring(0, 50)}...\n`;
            caption += `┃ 👤 *User:* ${username}\n`;
            caption += `╰━━━━━━━━━━━━━╯\n\n`;
            caption += `┌───────────────────\n`;
            caption += `│ 🎞️ *1* ☛ Video (Normal)\n`;
            caption += `│ 🎵 *2* ☛ Audio (MP3)\n`;
            caption += `│ 🎤 *3* ☛ Voice Note (PTT)\n`;
            caption += `│ 📂 *4* ☛ Document (File)\n`;
            caption += `│ 🎥 *5* ☛ Video Note (PTV)\n`;
            caption += `└───────────────────\n\n`;
            caption += `*📥 Reply with a number to download*`;

            // Send menu
            const sent = await bot.sendMessage(from, {
                video: { url: videoUrl },
                caption: caption
            }, { quoted: m });

            const msgId = sent.key.id;

            // Listener
            const handler = async (update) => {
                const incoming = update.messages?.[0];
                if (!incoming?.message || incoming.key.remoteJid !== from) return;

                const body = (incoming.message.conversation || incoming.message.extendedTextMessage?.text || "").trim();
                const ctx = incoming.message.extendedTextMessage?.contextInfo;

                if (ctx?.stanzaId !== msgId || isNaN(body)) return;
                
                let num = parseInt(body);
                if (num < 1 || num > 5) return;

                await bot.sendMessage(from, { react: { text: "📥", key: incoming.key } });

                try {
                    const fileName = `ig_${username}`;
                    switch (num) {
                        case 1: // Video Normal
                            await bot.sendMessage(from, { video: { url: videoUrl }, caption: `📸 @${username}` }, { quoted: incoming });
                            break;
                        case 2: // Audio MP3
                            await bot.sendMessage(from, { audio: { url: videoUrl }, mimetype: "audio/mpeg", fileName: `${fileName}.mp3` }, { quoted: incoming });
                            break;
                        case 3: // Voice Note PTT
                            await bot.sendMessage(from, { audio: { url: videoUrl }, mimetype: "audio/mp4", ptt: true }, { quoted: incoming });
                            break;
                        case 4: // Document
                            await bot.sendMessage(from, { document: { url: videoUrl }, mimetype: "video/mp4", fileName: `${fileName}.mp4` }, { quoted: incoming });
                            break;
                        case 5: // Video Note PTV
                            await bot.sendMessage(from, { video: { url: videoUrl }, ptv: true }, { quoted: incoming });
                            break;
                    }

                    await bot.sendMessage(from, { react: { text: "✅", key: incoming.key } });
                    bot.ev.off("messages.upsert", handler);

                } catch (err) {
                    console.error(err);
                    bot.sendMessage(from, { text: "⚠️ Failed to send media: " + err.message }, { quoted: incoming });
                }
            };

            bot.ev.on("messages.upsert", handler);
            setTimeout(() => { bot.ev.off("messages.upsert", handler); }, 600000);

            await react("✅");

        } catch (err) {
            console.error(err);
            await react("❌");
            reply(`⚠️ Error: ${err.message}`);
        }
    }
};
