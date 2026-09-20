const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper function for SaveTik
 */
async function tiktokScraper(url) {
    try {
        const r = await axios.post(
            'https://savetik.co/api/ajaxSearch',
            new URLSearchParams({ q: url, lang: 'id' }).toString(),
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    origin: 'https://savetik.co',
                    referer: 'https://savetik.co/id1'
                }
            }
        );
        const $ = cheerio.load(r.data.data);
        return {
            title: $('h3').first().text().trim() || 'TikTok Media',
            mp4: $('.dl-action a:contains("MP4")').not(':contains("HD")').attr('href') || null,
            mp4_hd: $('.dl-action a:contains("HD")').attr('href') || null,
            mp3: $('.dl-action a:contains("MP3")').attr('href') || null,
            foto: $('.photo-list a[href*="snapcdn"]').map((_, e) => $(e).attr('href')).get()
        };
    } catch (e) {
        return { status: 'error', msg: e.message };
    }
}

module.exports = {
    name: "tiktok",
    aliases: ["tt", "ttdl"],
    category: "downloader",
    description: "Direct download TikTok video or audio.",

    async execute(context) {
        const { socket, sock, conn, from, q, reply, m, react } = context;
        const bot = socket || sock || conn;

        try {
            if (!q) return reply(`*Usage:* .tiktok <link>`);

            await react("⏳");

            const data = await tiktokScraper(q.trim());

            if (data.status === 'error' || (!data.mp4 && !data.mp3)) {
                return reply("❌ Failed to fetch TikTok media.");
            }

            // --- Direct Download Logic ---

            // 1. Agar Video hai toh Video bhejo
            if (data.mp4 || data.mp4_hd) {
                await bot.sendMessage(from, {
                    video: { url: data.mp4_hd || data.mp4 },
                    caption: `✅ *${data.title}*\n\n> © KAMRAN-MINI-BOT`,
                    mimetype: "video/mp4"
                }, { quoted: m });
                return await react("✅");
            } 
            
            // 2. Agar Video nahi hai aur sirf MP3 hai
            if (data.mp3) {
                await bot.sendMessage(from, {
                    audio: { url: data.mp3 },
                    mimetype: "audio/mpeg",
                    fileName: `${data.title}.mp3`
                }, { quoted: m });
                return await react("✅");
            }

        } catch (e) {
            console.error("TikTok Error:", e);
            reply("❌ Error occurred!");
        }
    }
};
