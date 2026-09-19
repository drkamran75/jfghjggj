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

                if (pId === botId || pLid === botLid || pPhone === botId)
                    isBotAdmin = true;

                if (pId === sender || pLid === sender || pPhone === sender)
                    isSenderAdmin = true;
            }
        }

        return { isBotAdmin, isSenderAdmin, participants };
    } catch (e) {
        console.error("Admin check error:", e);
        return { isBotAdmin: false, isSenderAdmin: false, participants: [] };
    }
}

module.exports = {
    name: "kickall",
    aliases: ["sust", "allkick"],
    category: "group",
    description: "Kick all non-admin members",

    async execute(context) {
        const { conn, mek, m, reply, from, isBotOwner } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us"))
            return reply("❌ Ye command sirf group ke liye hai.");

        const senderId = msg.key.participant || msg.key.remoteJid;

        const { isBotAdmin, isSenderAdmin, participants } =
            await checkAdminStatus(conn, from, senderId);

        if (!isSenderAdmin && !isBotOwner)
            return reply("❌ Sirf group admins is command ko use kar sakte hain.");

        if (!isBotAdmin)
            return reply("⚠️ Mujhe admin banao pehle.");

        try {
            const botId = cleanId(conn.user?.id || '');
            const botLid = cleanId(conn.user?.lid || '');

            const toRemove = [];

            for (let p of participants) {
                // Skip admins
                if (p.admin === "admin" || p.admin === "superadmin") continue;

                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

                // Skip bot itself
                if (pId === botId || pLid === botLid || pPhone === botId) continue;

                toRemove.push(p.id);
            }

            if (toRemove.length === 0)
                return reply("✅ Koi non-admin member nahi mila remove karne ke liye.");

            await conn.groupParticipantsUpdate(from, toRemove, "remove");

            reply(`✅ ${toRemove.length} members removed from group.`);
        } catch (err) {
            console.error(err);
            reply("❌ Members remove karne mein error aaya.");
        }
    }
};
