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
    name: "open",
    aliases: ["groupopen", "unlock"],
    category: "group",
    description: "Open the group for everyone",

    async execute(context) {
        const { socket, conn, mek, m, reply, react, from, isBotOwner } = context;
        const client = socket || conn;
        const msg = mek || m;

        if (!from?.endsWith("@g.us")) return reply("❌ This command is only for groups!");

        try {
            await react("🔓");
            
            // Sender ID extraction with LID support
            const senderId = msg.key.participant || msg.key.remoteJid || '';
            
            // Admin status check using the LID fix
            const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(client, from, senderId);

            if (!isSenderAdmin && !isBotOwner) {
                return reply("❌ *Only group admins can open the group!*\n\n> © KAMRAN-MINI-BOT ッ");
            }
            
            if (!isBotAdmin) {
                return reply("❌ *Bot needs to be admin to open the group.*\n\n> © KAMRAN-MINI-BOT ッ");
            }
            
            await client.groupSettingUpdate(from, "not_announcement");
            await reply("🔓 *Group is now OPEN.*\n\nAll members can send messages now.\n\n> © KAMRAN-MINI-BOT ッ");
            
        } catch (error) {
            console.error("Open group error:", error);
            await reply(`❌ *Error opening group:* ${error.message || 'Unknown error'}`);
        }
    }
};
    
