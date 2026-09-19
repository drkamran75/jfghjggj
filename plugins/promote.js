const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = cleanId(conn.user?.id || '');
        const botLid = cleanId(conn.user?.lid || '');
        const sender = cleanId(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

                // Bot admin check
                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }

                // Sender admin check
                if (pId === sender || pLid === sender || pPhone === sender) {
                    isSenderAdmin = true;
                }
            }
        }

        return { isBotAdmin, isSenderAdmin };
    } catch (e) {
        console.error("Admin check error:", e);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

module.exports = {
    name: "promote",
    aliases: ["admin"],
    category: "group",
    description: "Promote member to admin",

    async execute(context) {
        const { conn, mek, m, reply, from, isBotOwner } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf groups ke liye hai.");
        }

        const senderId = msg.key.participant || msg.key.remoteJid;

        const { isBotAdmin, isSenderAdmin } =
            await checkAdminStatus(conn, from, senderId);

        // Sender permission
        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins members ko promote kar sakte hain.");
        }

        // Bot admin check
        if (!isBotAdmin) {
            return reply("⚠️ Mujhe admin banao pehle, tabhi main promote kar sakta hoon.");
        }

        // Mention check
        const mentioned =
            msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (!mentioned || mentioned.length === 0) {
            return reply(
                "❌ Kisi member ko mention karo.\n\nExample:\n.promote @user"
            );
        }

        try {
            await conn.groupParticipantsUpdate(from, mentioned, "promote");
            await reply("✅ Member successfully *promoted* to admin.");
        } catch (err) {
            console.error(err);
            await reply("❌ Promote karte waqt error aaya.");
        }
    }
};
