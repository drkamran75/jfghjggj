const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "pinterest",
    aliases: ["pin", "pintres", "pindl"],
    category: "download",
    description: "Download Pinterest images and videos",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *KAMRAN PINTEREST* ▧──╮
│
│ ❌ Please provide a Pinterest URL
│
│ *Usage:* .pinterest <url>
│
│ *Example:*
│ .pinterest https://pin.it/...
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
        }

        await react("📌");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/pindl?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *KAMRAN PINTEREST* ▧──╮
│
│ ❌ Failed to download
│ Please check the URL
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
            }

            const result = data.result || data.data || data;
            const title = result.title || "Pinterest Media";
            const mediaUrl = result.image || result.video || result.url || result.download;
            const isVideo = result.type === "video" || mediaUrl?.includes("video");

            const caption = `╭──▧ *KAMRAN PINTEREST* ▧──╮
│
│ 📌 *Pinterest Download*
│
│ 📝 *Title:* ${title.slice(0, 50)}
│ 📁 *Type:* ${isVideo ? "Video" : "Image"}
│
╰────────────────────────╯
> © Zaynix-PRIME ッ`;

            if (isVideo) {
                await sock.sendMessage(from, {
                    video: { url: mediaUrl },
                    caption: caption
                }, { quoted: m });
            } else {
                await sock.sendMessage(from, {
                    image: { url: mediaUrl },
                    caption: caption
                }, { quoted: m });
            }

            await react("✅");

        } catch (error) {
            console.error("Pinterest download error:", error.message);
            await react("❌");
            return reply(`╭──▧ *KAMRAN PINTEREST* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
        }
    }
};
