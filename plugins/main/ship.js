module.exports = {
    name: "ship",
    aliases: ["love", "match"],
    category: "fun",
    description: "Calculate love/friendship percentage",
    async execute(context) {
        const { reply, react, q } = context;
        try {
            await react("❤️");
            if (!q) return reply("📌 *Usage:* `.ship Name1 | Name2` or tag someone.");
            
            const percent = Math.floor(Math.random() * 100) + 1;
            let comment = "💔 Sakht dushmani hai!";
            if (percent > 30) comment = "⚠️ Bas guzara hi hai.";
            if (percent > 65) comment = "🤝 Behtareen jodi/dost!";
            if (percent > 85) comment = "💖 Made for each other! Rab ne bana di jodi.";

            let res = `💘 *KAMRAN MATCHMAKER* 💘\n\n`;
            res += `👥 *Match:* \`${q}\`\n`;
            res += `📊 *Compatibility:* \`${percent}%\`\n\n`;
            res += `📝 *Verdict:* ${comment}`;
            return reply(res);
        } catch (e) { reply(`❌ Error: ${e.message}`); }
    }
};
