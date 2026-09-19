const axios = require("axios");

module.exports = {
    name: "getdp",
    aliases: ["dp", "profile", "pfp"],
    category: "utility",
    description: "Get profile picture of user or group",

    async execute(context) {
        const { conn, m, mek, reply, from, args } = context;
        const msg = mek || m;

        try {
            let target;

            // 👉 agar reply kiya hai kisi user ko
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            }
            // 👉 agar mention kiya hai
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // 👉 group dp
            else if (args[0] === "group" && from.endsWith("@g.us")) {
                target = from;
            }
            // 👉 default sender
            else {
                target = msg.key.participant || msg.key.remoteJid;
            }

            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(target, "image");
            } catch {
                return reply("❌ DP not found or user has no profile picture.");
            }

            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: `🖼️ *Profile Picture*`
            }, { quoted: msg });

        } catch (err) {
            console.error("getdp error:", err);
            reply("❌ Error while fetching profile picture.");
        }
    }
};
