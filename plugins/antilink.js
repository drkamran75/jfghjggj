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

                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }

                if (pId === sender || pLid === sender || pPhone === sender) {
                    isSenderAdmin = true;
                }
            }
        }

        return { isBotAdmin, isSenderAdmin };
    } catch (e) {
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// Antilink activation state globally store karne ke liye
global.antilinkSettings = global.antilinkSettings || {};
global.antilinkRegistered = global.antilinkRegistered || false;

// AUTOMATIC LINK DETECTOR (Isi file ke andar listener register kar diya)
function registerAntilinkListener(conn) {
    if (global.antilinkRegistered) return; // Dubara register hone se rokne ke liye
    global.antilinkRegistered = true;

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            if (!from.endsWith('@g.us')) return; // Sirf groups ke liye

            // Agar is group mein antilink ON hai
            if (global.antilinkSettings[from] === true) {
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                
                // Link check regex (WhatsApp link ya koi bhi web link)
                if (text.includes('chat.whatsapp.com') || text.includes('http://') || text.includes('https://')) {
                    const senderId = msg.key.participant || msg.key.remoteJid;
                    
                    const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

                    // Agar link bhejne wala admin NAHIN hai, toh usko remove karo
                    if (!isSenderAdmin && isBotAdmin) {
                        // 1. Pehle message delete karo
                        await conn.sendMessage(from, { delete: msg.key });
                        
                        // 2. Member ko kick (remove) karo
                        await conn.groupParticipantsUpdate(from, [senderId], "remove");
                        
                        // 3. Inform karo group mein
                        await conn.sendMessage(from, { text: `🚨 *Antilink Action:* @${senderId.split('@')[0]} ko group link bhejne par remove kar diya gaya hai.`, mentions: [senderId] });
                    }
                }
            }
        } catch (error) {
            console.error("Antilink Listener Error:", error);
        }
    });
}

module.exports = {
    name: "antilink",
    aliases: ["antilinks"],
    category: "group",
    description: "Turn on/off antilink protection and auto-remove members",

    async execute(context) {
        const { conn, mek, m, reply, from, args, isBotOwner } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf group ke liye hai.");
        }

        // Listener ko initialize karein jab command pehli baar run ho
        registerAntilinkListener(conn);

        const senderId = msg.key.participant || msg.key.remoteJid;
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        // Permissions Check
        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins hi Antilink settings badal sakte hain.");
        }

        if (!isBotAdmin) {
            return reply("⚠️ Mujhe admin banao pehle, tabhi main links delete aur members ko remove kar paunga.");
        }

        const action = args[0] ? args[0].toLowerCase() : '';

        if (action === "on") {
            global.antilinkSettings[from] = true;
            return reply("✅ *Antilink ON ho gaya hai!* Ab jo bhi member link bhejega, use automatic *REMOVE* kar diya jayega.");
        } else if (action === "off") {
            global.antilinkSettings[from] = false;
            return reply("✅ *Antilink OFF* kar diya gaya hai.");
        } else {
            return reply("❌ Galat tarika.\n\n*Usey:* \n.antilink on\n.antilink off");
        }
    }
};
