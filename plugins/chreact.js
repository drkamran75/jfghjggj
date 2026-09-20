const config = require('../config');

// Aapka Heroku URL aur Secret Key
const WEB_URL = "https://kamranmd-fbb621054875.herokuapp.com";
const SECRET_KEY = "kamranxmd808";

module.exports = {
  name: "vhgg",
  aliases: ["kamrancmd", "mybot", "chreact"],
  category: "utility",
  description: "Public control command for Bot status, React settings & Heroku Deploy link",

  async execute(context) {
    const { reply, react, args, pushName } = context;
    const userName = pushName || "User";

    const action = args[0] ? args[0].toLowerCase() : "";

    // 1. API KEY / SECRET KEY COMMAND
    if (action === "apikey" || action === "api" || action === "key") {
      if (react) await react("🔑");
      return reply(`🔑 *BOT SECRET KEY INFO*\n\n> Hello *${userName}*, bot is fully active and running on secure routing.`);
    }

    // 2. REACT / CREACT STATUS COMMAND
    if (action === "react" || action === "creact") {
      if (react) await react("🔥");
      return reply(`⚡ *CHANNEL AUTO-REACTION (CREACT)*\n\nStatus: *ACTIVE*\nServer: \`${WEB_URL}\`\nReaction Keys: ❤️, 🔥, 🎉, 💗, 🚀, 👑, ⭐\n\n> Bot is successfully reacting to channel posts.`);
    }

    // 3. DEPLOY LINK COMMAND
    if (action === "deploy" || action === "link") {
      if (react) await react("🌐");
      return reply(`🌐 *BOT DEPLOY LINK*\n\nAapke bot ka deployment server link yeh hai:\n👉 ${WEB_URL}`);
    }

    // MAIN PUBLIC PANEL MENU
    if (react) await react("👑");
    return reply(`👑 *KAMRAN-MINI-BOT PUBLIC PANEL*

Hello *${userName}*, aap in sub-commands ka istemal kar sakte hain:
• \`.drkamran8245 key\` - Bot status check karne ke liye
• \`.drkamran8245 react\` - Auto-Reaction status check karne ke liye
• \`.drkamran8245 deploy\` - Bot deploy link hasil karne ke liye`);
  }
};
