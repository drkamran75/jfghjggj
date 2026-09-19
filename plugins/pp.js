module.exports = {
    name: "setpp",
    aliases: ["setdp", "setgrouppp"],
    category: "group",
    description: "Change group profile picture",

    async execute(context) {
        const { conn, m, mek, reply, from, isAdmins, isBotAdmins } = context;
        const msg = mek || m;

        try {
            // ✅ sirf group
            if (!from.endsWith("@g.us")) {
                return reply("❌ This command works only in groups!");
            }

            // ✅ admin check
            if (!isAdmins) {
                return reply("❌ Only group admins can use this command!");
            }

            if (!isBotAdmins) {
                return reply("❌ Bot must be admin to change group DP!");
            }

            // ✅ image check (reply)
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted || !quoted.imageMessage) {
                return reply("❌ Kisi image par reply karke `.setpp` likho");
            }

            // ✅ image download
            const media = await conn.downloadMediaMessage(
                {
                    message: quoted,
                    key: {
                        remoteJid: from,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    }
                },
                "buffer"
            );

            // ✅ set group profile picture
            await conn.updateProfilePicture
