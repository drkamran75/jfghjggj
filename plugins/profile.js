module.exports = {
    name: "pp",
    aliases: ["dp"],
    category: "utility",
    description: "Get profile picture",

    async execute(context) {
        const { conn, m, mek, reply, from } = context;
        const msg = mek || m;

        try {
            const target =
                msg.message?.extendedTextMessage?.contextInfo?.participant ||
                msg.key.participant ||
                msg.key.remoteJid;

            const pp = await conn.profilePictureUrl(target, "image");

            await conn.sendMessage(from, {
                image: { url: pp },
                caption: "🖼️ Profile Picture"
            }, { quoted: msg });

        } catch {
            reply("❌ Profile picture not available.");
        }
    }
};
