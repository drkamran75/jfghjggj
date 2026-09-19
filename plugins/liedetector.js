const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports = {
    name: "liedetector",
    aliases: ["lie", "detector"],
    category: "fun",
    description: "Analyze a quoted message for truth or lies",
    async execute(context) {
        const { reply, react, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;
        try {
            await react("🔎");
            let msg = await client.sendMessage(from, { text: "🎙️ Analyzing voice patterns and text authenticity..." }, { quoted: mek });
            
            await sleep(1800);
            const outcomes = [
                "🟢 *RESULT:* 100% TRUTH! Yeh banda bilkul shareef aur sachha hai.",
                "🔴 *RESULT:* 99.9% LIIIIE! Itna jhoot toh neta bhi nahi bolte bhai!",
                "🟡 *RESULT:* 50% TRUE / 50% LIE! Baat me golmaal lag raha hai bakra fasne wala hai."
            ];
            const finalResult = outcomes[Math.floor(Math.random() * outcomes.length)];
            await client.sendMessage(from, { text: `📊 *LIE DETECTOR SCAN* 📊\n\n${finalResult}`, edit: msg.key });
        } catch (e) { reply(`❌ Error: ${e.message}`); }
    }
};
