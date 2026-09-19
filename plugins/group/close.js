// Formatting function to clean IDs for comparison
const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const cBotId = cleanId(botId);
        const cBotLid = cleanId(botLid);
        const cSenderId = cleanId(senderId);
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            const pId = cleanId(p.id);
            const pLid = cleanId(p.lid);
            const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

            if (p.admin === "admin" || p.admin === "superadmin") {
                // Bot Admin Check
                if (pId === cBotId || pLid === cBotLid || pId === cBotLid || (cBotId && pPhone === cBotId)) {
                    isBotAdmin = true;
                }
                // Sender Admin Check
                if (pId === cSenderId || pLid === cSenderId || (pPhone && pPhone === cSenderId)) {
                    isSenderAdmin = true;
                }
            }
        }
        return { isBotAdmin, isSenderAdmin };
    } catch (err) {
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

module.exports = {
    name: "close",
    aliases: ["groupclose", "lock"],
    category: "group",
    description: "Close the group (Admins only)",

    async execute(context) {
        const { socket, conn, mek, m, reply, react, from, isBotOwner } = context;
        const client = socket || conn; // Kuch bots 'socket' use karte hain kuch 'conn'
        const msg = mek || m;

        if (!from?.endsWith("@g.us")) return reply("❌ This command is only for groups!");

        try {
            await react("🔒");
            
            // Sender ID nikalna (LID compatible)
            const senderId = msg.key.participant || msg.key.remoteJid || '';
            
            // Admin status verify karna
            const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(client, from, senderId);

            if (!isSenderAdmin && !isBotOwner) {
                return reply("❌ *Only group admins can close the group!*\n\n> © KAMRAN-MINI-BOT ッ");
            }
            
            if (!isBotAdmin) {
                return reply("❌ *Bot needs to be admin to close the group.*\n\n> © KAMRAN-MINI-BOT ッ");
            }
            
            await client.groupSettingUpdate(from, "announcement");
            await reply("🔒 *Group is now CLOSED.*\n\nOnly admins can send messages.\n\n> © KAMRAN-MINI-BOT ッ");
            
        } catch (error) {
            console.error("Close group error:", error);
            await reply(`❌ *Error:* ${error.message || 'Unknown error'}`);
        }
    }
};
                
