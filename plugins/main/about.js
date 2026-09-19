module.exports = {
    name: "about",
    aliases: ["info"],
    category: "main",
    description: "About this bot",

    async execute(context) {
        const { reply, react } = context;

        await react("ℹ️");

        const txt =
`🤖 *KAMRAN-MINI-BOT*
Lightweight, fast, and powerful WhatsApp bot.

👤 Developer: *KAMRAN-MINI-BOT*
🚀 Performance: Optimized
🛡 Security: Active
⚙ Framework: KAMRAN-MINI-BOT NEXT Engine`;

        await reply(txt);
        await react("✅");
    }
};