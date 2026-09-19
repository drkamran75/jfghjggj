const config = require('../config');

// --- HELPER FUNCTIONS (Normalize ID Logic for LID Fix) ---
const normalizeId = (id) => {
    if (!id) return '';
    // Ye ID se @lid, @s.whatsapp.net aur extra codes hata kar sirf numbers nikalta hai
    return id.replace(/:[0-9]+/g, '').replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '').replace(/[^\d]/g, '');
};

async function isUserAdmin(conn, chatId, userId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const nUserId = normalizeId(userId); // Sender ki ID ko saaf kiya
        
        for (let p of participants) {
            // Har participant ki ID, LID aur Phone Number ko check karein
            const pIds = [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean);
            for (let pid of pIds) {
                if (normalizeId(pid) === nUserId) {
                    return p.admin === "admin" || p.admin === "superadmin";
                }
            }
        }
        return false;
    } catch (err) { return false; }
}

// --- MAIN COMMAND: ON/OFF ---
module.exports = {
    name: "antilink2",
    category: "admin",
    description: "Anti-link toggle with LID fix",

    async execute(context) {
        const { socket, conn, reply, from, args, sender, isGroup, isBotOwner, m } = context;
        const client = socket || conn;

        if (!isGroup) return reply("❌ Ye command sirf groups ke liye hai.");
        
        // Admin Recognition Fix: normalizeId logic use ho raha hai
        const senderId = sender || m.sender;
        const senderIsAdmin = await isUserAdmin(client, from, senderId);
        
        if (!senderIsAdmin && !isBotOwner) {
            return reply("🚫 *Only group admins can use this command!*");
        }

        if (!args[0]) return reply("Usage: `.antilink on` or `.antilink off`.");

        const mode = args[0].toLowerCase();
        if (mode === 'on') {
            config.ANTI_LINK = 'true';
            return reply("✅ *Anti-link Protection ON ho gayi hai.*");
        } else if (mode === 'off') {
            config.ANTI_LINK = 'false';
            return reply("❌ *Anti-link Protection OFF ho gayi hai.*");
        } else {
            return reply("❌ Galat option! `on` ya `off` use karein.");
        }
    }
};
          
