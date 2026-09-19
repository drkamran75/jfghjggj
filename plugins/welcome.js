const fs = require("fs");
const path = require("path");

// Path ko thoda safe banate hain, agar folder nahi hai to create ho jaye
const dataDir = path.join(__dirname, "../database");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const welcomePath = path.join(dataDir, "welcome.json");

function loadWelcomeSettings() {
  try {
    if (fs.existsSync(welcomePath)) {
      return JSON.parse(fs.readFileSync(welcomePath, "utf8"));
    }
    return {};
  } catch (e) {
    console.error("Load Error:", e);
    return {};
  }
}

function saveWelcomeSettings(data) {
  try {
    fs.writeFileSync(welcomePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Save Error:", e);
  }
}

module.exports = {
  name: "welcome",
  aliases: ["setwelcome", "greet"],
  category: "group",
  description: "Set welcome message for new members",
  
  async execute(context) {
    // context se variables nikalna (Aapke bot ke hisaab se)
    const { reply, react, from, args, q, isAdmins, isBotOwner } = context;
    
    // Group check
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    // Admin check
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    try {
      const settings = loadWelcomeSettings();
      // Command action (on/off/set/etc)
      const action = args[0] ? args[0].toLowerCase() : null;
      
      // Default Menu agar koi action na ho
      if (!action || !["on", "off", "set", "status", "preview"].includes(action)) {
        const groupSettings = settings[from] || { enabled: false, message: "Welcome {user} to {group}!" };
        const currentStatus = groupSettings.enabled ? "✅ ON" : "❌ OFF";
        
        const menu = `╭━━━〔 *WELCOME SETTINGS* 〕━━━╮
┃ 📊 *Status:* ${currentStatus}
┃ 📝 *Usage:*
┃  .welcome on/off
┃  .welcome set <text>
┃  .welcome preview
┃ 📌 *Variables:*
┃  {user} , {group} , {desc}
╰━━━━━━━━━━━━━━━━━━━━━╯`;
        return reply(menu);
      }
      
      // Action: ON
      if (action === "on") {
        if (!settings[from]) settings[from] = { enabled: true, message: "Welcome {user} to {group}! 👋" };
        settings[from].enabled = true;
        saveWelcomeSettings(settings);
        if (react) await react("✅");
        return reply("✅ Welcome message has been *Enabled*.");
      }
      
      // Action: OFF
      if (action === "off") {
        if (!settings[from]) settings[from] = { enabled: false, message: "Welcome {user} to {group}! 👋" };
        settings[from].enabled = false;
        saveWelcomeSettings(settings);
        if (react) await react("✅");
        return reply("❌ Welcome message has been *Disabled*.");
      }
      
      // Action: SET
      if (action === "set") {
        const text = q || args.slice(1).join(" ");
        if (!text) return reply("❌ Please provide the welcome text!\nExample: `.welcome set Hello {user}!`");
        
        if (!settings[from]) settings[from] = { enabled: true };
        settings[from].message = text;
        settings[from].enabled = true;
        saveWelcomeSettings(settings);
        
        if (react) await react("✅");
        return reply(`✅ *Success!* Welcome message updated.\n\n*Preview:* ${text.replace(/{user}/g, "@user").replace(/{group}/g, "Group Name")}`);
      }
      
      // Action: PREVIEW / STATUS
      if (action === "preview" || action === "status") {
        const groupSettings = settings[from];
        if (!groupSettings || !groupSettings.message) {
          return reply("❌ No welcome message found for this group.");
        }
        const preview = groupSettings.message
          .replace(/{user}/g, "@User")
          .replace(/{group}/g, "Group Name")
          .replace(/{desc}/g, "Group Description");
          
        return reply(`*Current Welcome Preview:* \n\n${preview}`);
      }
      
    } catch (error) {
      console.error("Welcome CMD Error:", error);
      return reply("❌ Something went wrong while saving settings.");
    }
  }
};
      

