const config = require("../config");

// Helper function for delay/sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    name: "hacker",
    aliases: ["hack", "exploit"],
    category: "fun",
    description: "Simulate a cyber hacking matrix prank",

    async execute(context) {
        // ⚡ react function ko context se nikal liya
        const { reply, react, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;

        try {
            await react("💻");

            // Initializing message
            let initialText = `⚡ *[KAMRAN-MINI-OS v4.2]*\n`;
            initialText += `⚠️ WARNING: Initiating remote cyber exploit protocol...`;
            
            const sentMsg = await client.sendMessage(from, { text: initialText }, { quoted: mek });
            const msgKey = sentMsg.key;

            // Sequential terminal emulation steps
            const hackSteps = [
                "📡 *[PROXIES]:* Routing connection through 5 hidden VPN nodes...",
                "🛰️ *[SATELLITE]:* Establishing secure quantum uplink... [OK]",
                "🔐 *[FIREWALL]:* Injecting custom payload bypass into target network...",
                "🛡️ *[WAF]:* Cloudflare security layers detected. Forcing cross-site injection...",
                "💾 *[DATABASE]:* Connected to root server! Downloading sensitive database tables...",
                "🔑 *[DECRYPTION]:* Brute-forcing SHA-256 password hashes... [████████░░] 80%",
                "🔓 *[AUTHORIZATION]:* Session tokens hijacked successfully!",
                "👤 *[USER DATA]:* Device info, chat logs, and contact credentials archived.",
                "💻 *[SYSTEM]:* Injecting Trojan.Backdoor... Clearing all system logs to hide tracks... [DONE]",
                "🛑 *[STATUS]:* SYSTEM FULLY COMPROMISED!"
            ];

            // Loop through each step and edit the previous message dynamically
            for (let i = 0; i < hackSteps.length; i++) {
                await sleep(1800); // 1.8 seconds delay

                let progressiveText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                progressiveText += `   💀  *CYBER EXPLOIT IN PROGRESS*  💀\n`;
                progressiveText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                // Show past logs
                for (let j = 0; j <= i; j++) {
                    progressiveText += `> ${hackSteps[j]}\n\n`;
                }

                progressiveText += `📊 *Progress:* [${i + 1}/${hackSteps.length}]\n`;
                progressiveText += `> *© KAMRAN-MINI-BOT ッ*`;

                // Editing the original message in real-time
                await client.sendMessage(from, { text: progressiveText, edit: msgKey });
            }

            // ⚡ FIXED: Native react function use kiye jo crash nahi karega
            await react("☠️");

        } catch (e) {
            console.error("Hacker command failed:", e.message);
            return reply(`❌ *Matrix Exploit Failed:* ${e.message}`);
        }
    }
};
