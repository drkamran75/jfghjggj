const config = require("../config");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    name: "virus",
    aliases: ["trojan", "infect", "crashprank"],
    category: "fun",
    description: "Simulate a fake virus injection in the chat",

    async execute(context) {
        const { reply, react, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;

        try {
            await react("☣️");

            let initialText = `⚠️ *[SYSTEM WARNING]* ⚠️\n\n`;
            initialText += `Unknown external script detected in this chat. Trying to isolate...`;
            
            const sentMsg = await client.sendMessage(from, { text: initialText }, { quoted: mek });
            const msgKey = sentMsg.key;

            // Loading bar frames
            const frames = [
                { percent: "10%", bar: "█░░░░░░░░░", status: "Downloading Ransomware payload..." },
                { percent: "25%", bar: "██░░░░░░░░", status: "Injecting into WhatsApp database media cache..." },
                { percent: "40%", bar: "████░░░░░░", status: "Bypassing Group Admin privileges..." },
                { percent: "55%", bar: "█████░░░░░", status: "Extracting contact storage keys..." },
                { percent: "70%", bar: "███████░░░", status: "Encrypting local chat history (AES-256)..." },
                { percent: "85%", bar: "█████████░", status: "Forcing remote memory overflow..." },
                { percent: "100%", bar: "██████████", status: "Payload Execution Successful!" }
            ];

            for (let i = 0; i < frames.length; i++) {
                await sleep(1500); // 1.5 seconds gap

                let virusText = `☣️ *[KAMRAN-BOT VIRUS INJECTOR]* ☣️\n`;
                virusText += `───────────────────────────\n\n`;
                virusText += `💀 *Status:* ${frames[i].status}\n\n`;
                virusText += `📊 *Progress:* [${frames[i].bar}] ${frames[i].percent}\n\n`;
                virusText += `⚠️ _Do not close WhatsApp or turn off your internet..._\n\n`;
                virusText += `> *© KAMRAN-MINI-BOT ッ*`;

                await client.sendMessage(from, { text: virusText, edit: msgKey });
            }

            // Glitchy Final screen effect after 2 seconds
            await sleep(2000);
            
            let finalGlitch = `☠️ *[SYSTEM CRITICAL - ERROR 404]* ☠️\n`;
            finalGlitch += `🚫📱 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 𝘾𝙝𝙖𝙩 𝘾𝙤𝙧𝙧𝙪𝙥𝙩𝙚𝙙! 📱🚫\n\n`;
            finalGlitch += `01001000 01000001 01000011 01001011 01000101 01010100\n`;
            finalGlitch += `Your device storage has been flagged. Restart your device immediately to prevent complete data wipe.\n\n`;
            finalGlitch += `🤡 *Relax bhai! Just a prank by KAMRAN-MINI-BOT!* 😂`;

            await client.sendMessage(from, { text: finalGlitch, edit: msgKey });
            await react("🎯");

        } catch (e) {
            console.error("Virus prank failed:", e.message);
            return reply(`❌ *Virus Simulation Failed:* ${e.message}`);
        }
    }
};
