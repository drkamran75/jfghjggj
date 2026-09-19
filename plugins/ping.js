module.exports = {
    name: "ping",
    aliases: ["speed", "pong", "ping2"],
    category: "main",
    description: "Check bot's response time.",

    async execute(context) {
        const { socket, sock, conn, from, m, react, sender, reply } = context;
        const bot = socket || sock || conn;

        try {
            const start = new Date().getTime();

            // Emojis Logic
            const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
            const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

            const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
            let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

            // Ensure reaction and text emojis are different
            while (textEmoji === reactionEmoji) {
                textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
            }

            // Step 1: React to message
            await bot.sendMessage(from, {
                react: { text: textEmoji, key: m.key }
            });

            const end = new Date().getTime();
            const responseTime = (end - start) / 1000;

            // Step 2: Prepare Ping Text
            const pingText = `> *KAMRAN-MD SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

            // Step 3: Send Speed Message with Newsletter Forward Info (LID Fixed)
            await bot.sendMessage(from, {
                text: pingText,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: "DR KAMRAN",
                        serverMessageId: 143
                    }
                }
            }, { quoted: m });

            await react("⚡");

        } catch (e) {
            console.error("Error in ping command:", e);
            reply(`❌ Error: ${e.message}`);
        }
    }
};
                                
