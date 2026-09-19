const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports = {
    name: "brainscan",
    aliases: ["brain", "dimaag"],
    category: "fun",
    description: "Scan someone's brain for funny stats",
    async execute(context) {
        const { reply, react, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;
        try {
            await react("🧠");
            let msg = await client.sendMessage(from, { text: "🔍 Connecting to neuro-link satellite..." }, { quoted: mek });
            
            await sleep(1500);
            await client.sendMessage(from, { text: "⚡ Scanning brain waves and cognitive cells...", edit: msg.key });
            
            await sleep(1500);
            const size = Math.floor(Math.random() * 10) + 1; // 1% to 10%
            const laziness = Math.floor(Math.random() * 40) + 60; // 60% to 100%
            
            let res = `🧠 *BRAIN SCAN RESULTS* 🧠\n\n`;
            res += `⚙️ *Brain Size:* \`${size}%\` (Severe Deficiency)\n`;
            res += `💤 *Laziness Level:* \`${laziness}%\`\n`;
            res += `💡 *Common Sense:* \`Not Found (404 Error)\`\n`;
            res += `🔋 *Current Motivation:* \`0.02%\`\n\n`;
            res += `Status: _Is dimaag ka kuch nahi ho sakta!_ 😂`;
            
            await client.sendMessage(from, { text: res, edit: msg.key });
            await react("🎯");
        } catch (e) { reply(`❌ Error: ${e.message}`); }
    }
};
