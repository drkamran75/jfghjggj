module.exports = {
    name: "groupdp",
    aliases: ["setpp", "setgdp", "setgroupdp"],
    category: "group",
    description: "Change group profile picture",

    async execute(context) {
        const {
            reply,
            react,
            socket,
            from,
            isGroup,
            isAdmins,
            isBotAdmins,
            quoted
        } = context;

        try {
            if (!isGroup) {
                return reply("❌ Ye command sirf group mein kaam karti hai");
            }

            if (!isAdmins) {
                return reply("❌ Sirf group admin group DP change kar sakta hai");
            }

            if (!isBotAdmins) {
                return reply("❌ Bot ko admin banao pehle");
            }

            const mime = quoted?.mimetype || "";
            if (!mime.startsWith("image")) {
                return reply("❌ Kisi image ko reply karo\n\nExample:\nimage reply + .groupdp");
            }

            await react("🖼️");

            const media = await quoted.download();
            await socket.updateProfilePicture(from, media);

            await react("✅");
            return reply("✅ *Group DP successfully change ho gayi*");

        } catch (err) {
            console.error("GroupDP Error:", err);
            return reply("❌ Group DP change nahi ho saki");
        }
    }
};
