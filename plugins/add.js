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

                // Bot admin
                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }

                // Sender admin
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
    name: "add",
    aliases: ["invite"],
    category: "group",
    description: "Add a member to group",

    async execute(context) {
        const { conn, mek, m, reply, from, isBotOwner, args } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf groups ke liye hai.");
        }

        const senderId = msg.key.participant || msg.key.remoteJid;

        const { isBotAdmin, isSenderAdmin } =
            await checkAdminStatus(conn, from, senderId);

        // Sender permission
        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins members add kar sakte hain.");
        }

        // Bot admin check
        if (!isBotAdmin) {
            return reply("⚠️ Mujhe admin banao, tabhi main member add kar sakta hoon.");
        }

        // Number check
        const number = args[0]?.replace(/[^0-9]/g, '');

        if (!number) {
            return reply(
                "❌ Number do ya likho.\n\nExample:\n.add 923001234567"
            );
        }

        const jid = number + "@s.whatsapp.net";

        try {
            await conn.groupParticipantsUpdate(from, [jid], "add");
            await reply(`✅ Member *added* successfully:\n+${number}`);
        } catch (err) {
            console.error(err);
            await reply(
                "❌ Member add nahi ho saka.\nYa to privacy on hai ya pehle se group me hai."
            );
        }
    }
};
