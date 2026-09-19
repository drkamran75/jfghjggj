const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

module.exports = {
    name: "antiedit",
    aliases: ["antiedit-handler"],
    category: "group",
    description: "Detects edited messages and shows the original content",

    async execute(context) {
        const { conn, mek, m, store } = context;
        const msg = mek || m;

        // 1. Check karein ki kya ye ek 'protocolMessage' hai aur uska type 14 (Edit) hai
        if (msg.message?.protocolMessage && msg.message.protocolMessage.type === 14) {
            
            const editKey = msg.message.protocolMessage.key;
            const from = editKey.remoteJid;

            // Sirf groups ke liye
            if (!from.endsWith("@g.us")) return;

            if (!store) {
                console.log("Anti-Edit ke liye 'store' ka hona lazmi hai.");
                return;
            }

            // 2. Store se wo purana (original) message nikalen jo edit hone se pehle tha
            const chatMessages = store.messages[from];
            const originalMsg = chatMessages ? chatMessages.find(x => x.key.id === editKey.id) : null;

            if (!originalMsg) {
                // Agar original message store me nahi mila
                return;
            }

            // Sender ki ID
            const senderId = originalMsg.key.participant || originalMsg.key.remoteJid;

            // Agar bot ne khud apna message edit kiya hai, to ignore karein
            const botId = cleanId(conn.user?.id || '');
            if (cleanId(senderId) === botId) return;

            // 3. Purana (Original) content extract karein
            const oldContent = originalMsg.message;
            const oldText = oldContent?.conversation || 
                            oldContent?.extendedTextMessage?.text || 
                            oldContent?.imageMessage?.caption || 
                            oldContent?.videoMessage?.caption || '';

            // 4. Naya (Edited) content extract karein
            const newContent = msg.message.protocolMessage.editedMessage;
            const newText = newContent?.conversation || 
                            newContent?.extendedTextMessage?.text || 
                            newContent?.imageMessage?.caption || 
                            newContent?.videoMessage?.caption || '';

            // Agar dono text same hain ya text nahi mil paya to skip karein
            if (!oldText || oldText === newText) return;

            // 5. Notification Text tayyar karein
            let notificationText = `✏️ *Edited Message Detected!*\n\n` +
                                   `👤 *User:* @${senderId.split('@')[0]}\n\n` +
                                   `❌ *Pehle Kya Tha (Original):*\n» ${oldText}\n\n` +
                                   `✅ *Ab Kya Hai (Edited):*\n» ${newText}`;

            try {
                // Group me notification bhej dein
                await conn.sendMessage(from, {
                    text: notificationText,
                    mentions: [senderId],
                    // Ye line purane message ko tag (quote) kar degi
                    quoted: originalMsg 
                });
            } catch (err) {
                console.error("Anti-Edit send karne me error:", err);
            }
        }
    }
};
