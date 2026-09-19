const axios = require("axios");
const config = require("../config");

module.exports = {
    name: "ccgen",
    aliases: ["vcc", "gencc", "creditcard"],
    category: "main",
    description: "Generate virtual credit card for testing",

    async execute(context) {
        const { reply, react, q, sock, from, m, isOwner } = context;

        if (!isOwner) {
            return reply(`╭──▧ *CCGEN* ▧──╮
│
│ ❌ Owner Only Command
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
        }

        await react("💳");

        try {
            const bin = q || "";
            const apiUrl = bin 
                ? `https://www.zaynix.zone.id/api/vcc?bin=${encodeURIComponent(bin)}`
                : `https://www.zaynix.zone.id/api/vcc`;
            
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *CCGEN* ▧──╮
│
│ ❌ Failed to generate card
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
            }

            const result = data.result || data.data || data;
            const cards = Array.isArray(result) ? result : [result];

            let cardInfo = `╭──▧ *CCGEN* ▧──╮
│
│ 💳 *Virtual Cards Generated*
│\n`;

            for (let i = 0; i < Math.min(cards.length, 10); i++) {
                const card = cards[i];
                const number = card.number || card.cc || card.card || "";
                const expiry = card.expiry || card.exp || `${card.month || "XX"}/${card.year || "XXXX"}`;
                const cvv = card.cvv || card.cvc || "XXX";
                const brand = card.brand || card.type || "Unknown";

                cardInfo += `│ *${i + 1}.* ${number}
│    📅 ${expiry} | 🔐 ${cvv}
│    🏷️ ${brand}
│\n`;
            }

            cardInfo += `╰────────────────────────╯

⚠️ *For Testing Purposes Only*

> © KAMRAN-MINI-BOT ッ`;

            await sock.sendMessage(from, {
                image: { url: config.XD_IMAGE_PATH },
                caption: cardInfo
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("CCGen error:", error.message);
            await react("❌");
            return reply(`╭──▧ *CCGEN* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © KAMRAN-MINI-BOT ッ`);
        }
    }
};
