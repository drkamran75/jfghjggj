const config = require('../config');

// Aapka naya Heroku URL aur Secret Key (Base64 secured)
const WEB_URL = "https://kamranmd-fbb621054875.herokuapp.com";
const SECRET_KEY = "kamranxmd808";
const OWNER_NUMBER = "923147168309"; // Sirf aapka number authorized hai

module.exports = {
  name: "react",
  aliases: ["chreact", "mybot"],
  category: "owner",
  description: "Kamran's private control command for API Key, React settings & Heroku Deploy link",

  async execute(context) {
    const { reply, react, sender, args } = context;
    const senderNumber = sender ? sender.split('@')[0] : "";
    
    // Strict Security Check: Sirf Kamran (Owner) hi access kar sake
    if (senderNumber !== OWNER_NUMBER) {
      return reply("❌ Yeh command bilkul private hai aur sirf Bot Owner (Kamran) ke liye restricted hai!");
    }

    const action = args[0] ? args[0].toLowerCase() : "";

    // 1. API KEY / SECRET KEY COMMAND
    if (action === "apikey" || action === "api" || action === "key") {
      if (react) await react("🔑");
      return reply(`🔑 *YOUR PRIVATE SECRET KEY*\n\n\`${SECRET_KEY}\`\n\n> Isko kisi ke sath share mat karein.`);
    }

    // 2. REACT / CREACT STATUS COMMAND
    if (action === "react" || action === "creact") {
      if (react) await react("🔥");
      return reply(`⚡ *CHANNEL AUTO-REACTION (CREACT)*\n\nStatus: *ACTIVE*\nServer: \`${WEB_URL}\`\nReaction Keys: ❤️, 🔥, 🎉, 💗, 🚀, 👑, ⭐\n\n> Bot channel posts par automatic reactions laga raha hai.`);
    }

    // 3. DEPLOY LINK COMMAND
    if (action === "deploy" || action === "link") {
      if (react) await react("🌐");
      return reply(`🌐 *HEROKU DEPLOY LINK*\n\nAapke bot ka deployment server link yeh hai:\n👉 ${WEB_URL}`);
    }

    // MAIN PRIVATE PANEL MENU
    if (react) await react("👑");
    return reply(`👑 *DRKAMRAN8245 PRIVATE CONTROL PANEL*

Aap in sub-commands ka istemal kar sakte hain:
• \`.drkamran8245 apikey\` - Apni Secret Key dekhne ke liye
• \`.drkamran8245 react\` - Auto-Reaction & Server status check karne ke liye
• \`.drkamran8245 deploy\` - Heroku Deploy link hasil karne ke liye`);
  }
};
