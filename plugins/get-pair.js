const axios = require('axios');

module.exports = {
    name: "pair",
    aliases: ["getpair", "clonebot", "pairing", "code"],
    category: "main",
    description: "Get pairing code for V13 VIP Engine",

    async execute(context) {
        const { reply, react, m, args, q, socket, sock, conn, client, from } = context;
        const botClient = socket || sock || conn || client;

        try {
            // 1. Initial VIP Reaction
            if (react) await react("🌀");

            // 2. Extract Number (Args check -> then sender number)
            let phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : m.sender.split('@')[0];

            // 3. Validation & Usage Guide
            if (!phoneNumber || phoneNumber.length < 10) {
                return await reply("❌ *INVALID PROTOCOL*\n\n📝 *Usage:* `.pair 923xxxxxxxxx`\n_(Must include country code)_");
            }

            // 4. Stylish Processing Message
            const loadingMsg = await reply(`*々 ACCESSING NEURAL SERVER 々*\n\n_Fetching Pairing Code for +${phoneNumber}..._`);

            // 5. API Request to NEW V13 Node
            // Updated URL according to your request
            const apiUrl = `https://kamranmd-fbb621054875.herokuapp.com/code?number=${phoneNumber}`;
            const response = await axios.get(apiUrl);

            if (!response.data || !response.data.code) {
                return await reply("❌ *SERVER ERROR:* Node is currently overloaded or down.");
            }

            const pairingCode = response.data.code;

            // 6. Ultra-Stylish VIP Result
            const resultText = `
『 𝓓𝓡 𝓚𝓐𝓜𝓡𝓐𝓝 - 𝓜𝓓 』
  Ｖ１３ ＵＬＴＲＡ ＶＩＰ

┌───〔 🔢 ᴘᴀɪʀɪɴɢ ᴅᴀᴛᴀ 〕──┈⊷
│ 🔢 ᴄᴏᴅᴇ: *${pairingCode}*
│ 📱 ɴᴜᴍʙᴇʀ: +${phoneNumber}
│ ⚙️ sᴛᴀᴛᴜs: ʟɪɴᴋ ʀᴇᴀᴅʏ
└────────────────┈⊷

*﹝ ɪɴsᴛʀᴜᴄᴛɪᴏɴs ﹞*
1. Open WhatsApp Settings.
2. Linked Devices > Link a Device.
3. Select *'Link with phone number instead'*.
4. Input the code displayed above.

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅʀ ᴋᴀᴍʀᴀɴ ʟᴀʙꜱ © 2026`;

            // 7. Sending Result with Newsletter Context
            await botClient.sendMessage(from, {
                text: resultText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: "DR KAMRAN | PAIRING NODE",
                        serverMessageId: 143
                    }
                }
            }, { quoted: m });

            // 8. Separate Code for easy copy-paste
            await new Promise(resolve => setTimeout(resolve, 800));
            await reply(pairingCode);

            if (react) await react("✅");

        } catch (error) {
            console.error("Pairing API Error:", error.message);
            await reply("❌ *CONNECTION FAILED:* Neural server at mini-bot-1 did not respond.");
        }
    }
};
