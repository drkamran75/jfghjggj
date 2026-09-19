const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

module.exports = {
    name: "antidelete54",
    aliases: ["antidel24"],
    category: "group",
    description: "Detects deleted messages and sends them back to the chat",

    async execute(context) {
        const { conn, mek, m, store } = context;
        const msg = mek || m;

        // 1. Check karein ki kya ye ek 'protocolMessage' (delete command) hai
        if (msg.message?.protocolMessage && msg.message.protocolMessage.type === 0) {
            
            const deletedKey = msg.message.protocolMessage.key;
            const from = deletedKey.remoteJid;

            // Sirf groups ke liye (agar aap inbox me bhi chahte hain to ye line hata dein)
            if (!from.endsWith("@g.us")) return;

            // 2. Store se wo purana message nikalen jo delete kiya gaya hai
            // Note: Iske liye aapke bot me 'store' configure hona zaroori hai
            if (!store) {
                console.log("Anti-Delete ke liye 'store' ka hona lazmi hai.");
                return;
            }

            const chatMessages = store.messages[from];
            const originalMsg = chatMessages ? chatMessages.find(x => x.key.id === deletedKey.id) : null;

            if (!originalMsg) {
                // Agar message store me nahi mila (bohot purana tha ya bot restart hua tha)
                return;
            }

            // Sender aur deletion karne wale ki ID
            const senderId = originalMsg.key.participant || originalMsg.key.remoteJid;
            const deleterId = msg.key.participant || msg.key.remoteJid;

            // Agar bot ne khud apna message delete kiya hai, to ignore karein
            const botId = cleanId(conn.user?.id || '');
            if (cleanId(senderId) === botId) return;

            // 3. Deleted message ka content extract karein
            const content = originalMsg.message;
            if (!content) return;

            // Caption text tayyar karein
            let notificationText = `🗑️ *Deleted Message Detected!*\n\n` +
                                   `👤 *Bhejne Wala:* @${senderId.split('@')[0]}\n` +
                                   `🚫 *Delete Karne Wala:* @${deleterId.split('@')[0]}\n\n` +
                                   `👇 *Neeche deleted message hai:*`;

            // 4. Message type ke hisab se use dubara send karein
            try {
                // Agar normal text message tha
                if (content.conversation || content.extendedTextMessage) {
                    const text = content.conversation || content.extendedTextMessage.text;
                    await conn.sendMessage(from, { 
                        text: `${notificationText}\n\n💬 "${text}"`,
                        mentions: [senderId, deleterId]
                    });
                } 
                // Agar Media message tha (Image, Video, Audio, Document, Voice Note)
                else {
                    await conn.sendMessage(from, { 
                        text: notificationText, 
                        mentions: [senderId, deleterId] 
                    });
                    
                    // Dubara wahi media forward/send kar dein
                    await conn.sendMessage(from, { forward: originalMsg });
                }
            } catch (err) {
                console.error("Anti-Delete send karne me error:", err);
            }
        }
    }
};
