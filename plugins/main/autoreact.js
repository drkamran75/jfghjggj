const TARGET_CHANNEL_ID = '0029VbAhxYY90x2vgwhXJV3O@newsletter';
// Note: WhatsApp group invitation link se direct JID script mein nahi daal sakte, 
// isliye bot jab run hoga toh is link ke core ID se detect kar lega.
const TARGET_GROUP_INVITE_CODE = 'LRANzgJ8RNk0ArJoFtKZcp'; 

// Global variable taaki listener baar-baar duplicate na ho
if (global.isAutopostListenerAttached === undefined) {
    global.isAutopostListenerAttached = false;
}
if (global.autopostStatus === undefined) {
    global.autopostStatus = true; // By default ON rahega
}

module.exports = {
    name: "sautopost",
    aliases: ["schreactpost", "aautoreactpost"],
    react: "🔄",
    desc: "Monitor channel and automatically send react link to group",
    category: "main",
    use: ".autopost on/off",
    filename: __filename,

    async execute({ conn, mek, m, from, args, reply }) {
        // --- BACKGROUND LISTENER INJECTOR (Bina index.js ko chhede) ---
        if (!global.isAutopostListenerAttached) {
            conn.ev.on('messages.upsert', async (chatUpdate) => {
                try {
                    // Agar feature off hai toh kuch mat karo
                    if (!global.autopostStatus) return;

                    const msg = chatUpdate.messages[0];
                    if (!msg || !msg.message) return;

                    const jid = msg.key.remoteJid;

                    // Check karein agar message aapke target channel se aaya hai
                    if (jid === TARGET_CHANNEL_ID) {
                        const postId = msg.key.id;
                        const channelCleanId = TARGET_CHANNEL_ID.split('@')[0];
                        
                        // Link formatting
                        const channelPostLink = `https://whatsapp.com/channel/${channelCleanId}/${postId}`;
                        const autoPostMessage = `autopost\n.react ${channelPostLink}`;

                        // Group ki JID nikalne ke liye invite code ka use karenge
                        let targetGroupJid = global.savedTargetGroupJid;
                        
                        if (!targetGroupJid) {
                            // Agar JID saved nahi hai toh invite code se fetch karein
                            try {
                                const groupInfo = await conn.groupGetInviteInfo(TARGET_GROUP_INVITE_CODE);
                                if (groupInfo && groupInfo.id) {
                                    targetGroupJid = groupInfo.id.endsWith('@g.us') ? groupInfo.id : `${groupInfo.id}@g.us`;
                                    global.savedTargetGroupJid = targetGroupJid; // Cache it
                                }
                            } catch (err) {
                                console.error("Group JID fetch error:", err.message);
                            }
                        }

                        // Agar group JID mil gayi toh message send karein
                        if (targetGroupJid) {
                            await conn.sendMessage(targetGroupJid, { text: autoPostMessage });
                            console.log(`[AutoPost] Link successfully sent to group!`);
                        }
                    }
                } catch (error) {
                    console.error("Error inside Autopost Background Listener:", error);
                }
            });

            global.isAutopostListenerAttached = true;
            console.log("🟢 Autopost background listener successfully injected via command!");
        }
        // -------------------------------------------------------------

        // --- COMMAND LOGIC (ON/OFF CONTROL) ---
        const action = args[0] ? args[0].toLowerCase() : '';

        if (action === 'on') {
            global.autopostStatus = true;
            return reply("✅ *Auto-Post system has been activated/turned ON!*");
        } else if (action === 'off') {
            global.autopostStatus = false;
            return reply("🔴 *Auto-Post system has been paused/turned OFF!*");
        } else {
            return reply(`*🤖 Auto-Post System Status:* ${global.autopostStatus ? '🟢 ON' : '🔴 OFF'}\n\n*How to use:* \n\`.autopost on\` - Auto link share chalu karne ke liye\n\`.autopost off\` - Auto link share band karne ke liye\n\n> *© Pᴏᴡᴇʀ Eᴅ Bʏ DR KAMRAN-♡*`);
        }
    }
};
                  
