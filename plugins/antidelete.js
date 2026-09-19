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

// Antidelete activation state globally store karne ke liye
global.antidelSettings = global.antidelSettings || {};
global.antidelRegistered = global.antidelRegistered || false;

// AUTOMATIC DELETE DETECTOR
function registerAntidelListener(conn) {
    if (global.antidelRegistered) return; // Dobara register hone se rokne ke liye
    global.antidelRegistered = true;

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            if (!from.endsWith('@g.us')) return; // Sirf groups ke liye

            // Agar is group mein antidelete ON hai
            if (global.antidelSettings[from] === true) {
                
                // Baileys mein delete message 'protocolMessage' type ka hota hai
                if (msg.message.protocolMessage && msg.message.protocolMessage.type === 0) {
                    const deletedKey = msg.message.protocolMessage.key;
                    
                    // Apne khud ke delete kiye message ko ignore karne ke liye
                    if (deletedKey.fromMe) return; 

                    const senderId = deletedKey.participant || deletedKey.remoteJid;

                    // Baileys ke cache (store) se purana message nikalne ki koshish (agar store implemented hai)
                    // Agar aapka bot store use nahi karta toh ye delete notification dega
                    let originalMsg = typeof conn.loadMessage === 'function' ? await conn.loadMessage(deletedKey.id) : null;

                    let caption = `🚨 *Anti-Delete Detected!* 🚨\n\n` +
                                  `👤 *Sender:* @${senderId.split('@')[0]}\n`;

                    if (originalMsg && originalMsg.message) {
                        // Agar message text tha
                        const text = originalMsg.message.conversation || originalMsg.message.extendedTextMessage?.text || '';
                        if (text) {
                            caption += `💬 *Message:* ${text}`;
                            await conn.sendMessage(from, { text: caption, mentions: [senderId] });
                        } else {
                            // Agar media message tha (Image/Video/Audio)
                            caption += `📦 *Type:* Media Message (Forwarding...)`;
                            await conn.sendMessage(from, { text: caption, mentions: [senderId] });
                            await conn.sendMessage(from, { forward: originalMsg });
                        }
                    } else {
                        // Agar store me message nahi mila toh simple alert
                        caption += `💬 Message delete kiya gaya tha par bot use recover nahi kar saka (Cache Empty).`;
                        await conn.sendMessage(from, { text: caption, mentions: [senderId] });
                    }
                }
            }
        } catch (error) {
            console.error("Antidelete Listener Error:", error);
        }
    });
}

module.exports = {
    name: "antidel",
    aliases: ["antidelete"],
    category: "group",
    description: "Turn on/off antidelete protection to catch deleted messages",

    async execute(context) {
        const { conn, mek, m, reply, from, args, isBotOwner } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf group ke liye hai.");
        }

        // Listener ko initialize karein jab command chalai jaye
        registerAntidelListener(conn);

        const senderId = msg.key.participant || msg.key.remoteJid;
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        // Permissions Check
        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins hi Antidelete settings badal sakte hain.");
        }

        const action = args[0] ? args[0].toLowerCase() : '';

        if (action === "on") {
            global.antidelSettings[from] = true;
            return reply("✅ *Antidelete ON ho gaya hai!* Ab agar koi bhi group mein message delete karega, main use pakad loonga.");
        } else if (action === "off") {
            global.antidelSettings[from] = false;
            return reply("✅ *Antidelete OFF* kar diya gaya hai.");
        } else {
            return reply("❌ Galat tarika.\n\n*Usey:* \n.antidel on\n.antidel off");
        }
    }
};
