const fs = require("fs");
const config = require("../../config");

module.exports = {
  name: "help",
  aliases: ["menu", "commands", "list", "cmd"],
  category: "main",
  description: "Show full command list",

  async execute(context) {
    const { reply, react, getUserConfig, socket, sock, conn, client, from, pushName, m } = context;
    const botClient = socket || sock || conn || client;

    try { if (react) await react("🎐"); } catch (e) {}

    // ===== Dynamic User Config =====
    const user = await (getUserConfig ? getUserConfig() : Promise.resolve({}));
    const prefix = user.PREFIX || config.PREFIX || ".";
    const userName = pushName || "User";
    const botName = user.BOT_NAME || config.BOT_NAME || "KAMRAN-MINI";

    // ===== Uptime =====
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    // ===== FULL ORIGINAL MENU (UNCHANGED) =====
    const caption = `『 *${botName}* 』

*╭───〔 👤 ᴜsᴇʀ ɪɴғᴏ 〕───┈⊷*
│ ⚡ *User:* ${userName}
│ 🌀 *Prefix:* ${prefix}
│ ⏳ *Uptime:* ${hours}h ${minutes}m
╰────────────────┈⊷

*┏━━〔 💠 𝐌𝐀𝐈𝐍 〕*
┃ ❍ ${prefix}ᴀʟɪᴠᴇ
┃ ❍ ${prefix}ᴘɪɴɢ
┃ ❍ ${prefix}ᴀʙᴏᴜᴛ
┃ ❍ ${prefix}ᴏᴡɴᴇʀ
┃ ❍ ${prefix}ᴜᴘᴛɪᴍᴇ
┃ ❍ ${prefix}ᴄʜᴀɴɴᴇʟ
┗━━━━━━━━━━━━┛

*┏━━〔 👥 𝐆𝐑𝐎𝐔𝐏 〕*
┃ ❍ ${prefix}ᴀᴅᴅ
┃ ❍ ${prefix}ᴋɪᴄᴋ
┃ ❍ ${prefix}ᴘʀᴏᴍᴏᴛᴇ
┃ ❍ ${prefix}ᴅᴇᴍᴏᴛᴇ
┃ ❍ ${prefix}ᴀᴅᴍɪɴs
┃ ❍ ${prefix}ᴛᴀɢᴀʟʟ
┃ ❍ ${prefix}ʜɪᴅᴇᴛᴀɢ
┃ ❍ ${prefix}ᴏᴘᴇɴ
┃ ❍ ${prefix}ᴄʟᴏsᴇ
┃ ❍ ${prefix}ɢɪɴғᴏ
┃ ❍ ${prefix}ᴡᴇʟᴄᴏᴍᴇ
┃ ❍ ${prefix}ɢᴏᴏᴅʙʏᴇ
┃ ❍ ${prefix}ᴡᴀʀɴ
┃ ❍ ${prefix}ᴍᴜᴛᴇ
┃ ❍ ${prefix}ᴜɴᴍᴜᴛᴇ
┃ ❍ ${prefix}ᴀɴᴛɪʙᴏᴛ
┃ ❍ ${prefix}ᴀɴᴛɪsᴘᴀᴍ
┗━━━━━━━━━━━━┛

*┏━━〔 🤖 𝐀𝐈 𝐓𝐎𝐎𝐋𝐒 〕*
┃ ❍ ${prefix}ᴀɪ
┃ ❍ ${prefix}ɢᴘᴛ
┃ ❍ ${prefix}ɢᴇᴍɪɴɪ
┃ ❍ ${prefix}ᴄʟᴀᴜᴅᴇ
┃ ❍ ${prefix}ᴅᴇᴇᴘsᴇᴇᴋ
┃ ❍ ${prefix}ᴄᴏᴅᴇᴀɪ
┗━━━━━━━━━━━━┛

*┏━━〔 📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 〕*
┃ ❍ ${prefix}ᴘʟᴀʏ
┃ ❍ ${prefix}ᴠɪᴅᴇᴏ
┃ ❍ ${prefix}ᴀᴜᴛᴏsᴏɴɢ
┃ ❍ ${prefix}ғʙ
┃ ❍ ${prefix}ɪɴsᴛᴀ
┃ ❍ ${prefix}ᴛɪᴋᴛᴏᴋ
┃ ❍ ${prefix}sᴘᴏᴛɪғʏ
┃ ❍ ${prefix}ʏᴛsᴇᴀʀᴄʜ
┗━━━━━━━━━━━━┛

*┏━━〔 🛠️ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘 〕*
┃ ❍ ${prefix}ᴡᴇᴀᴛʜᴇʀ
┃ ❍ ${prefix}ᴛʀᴀɴsʟᴀᴛᴇ
┃ ❍ ${prefix}ᴄᴀʟᴄ
┃ ❍ ${prefix}ǫʀ
┃ ❍ ${prefix}ɢᴏᴏɢʟᴇ
┃ ❍ ${prefix}ɢᴇᴛᴅᴘ
┃ ❍ ${prefix}sᴀᴠᴇ
┗━━━━━━━━━━━━┛

*┏━━〔 ⚙️ 𝐎𝐖𝐍𝐄𝐑 〕*
┃ ❍ ${prefix}ᴀɴᴛɪᴄᴀʟʟ
┃ ❍ ${prefix}ᴀɴᴛɪᴇᴅɪᴛ
┃ ❍ ${prefix}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ
┃ ❍ ${prefix}ᴀɴᴛɪʟɪɴᴋ
┃ ❍ ${prefix}ᴀɴᴛɪɢʀᴏᴜᴘ
┃ ❍ ${prefix}sᴇᴛᴛɪɴɢs
┃ ❍ ${prefix}ᴍᴏᴅᴇ
┃ ❍ ${prefix}ʙᴏᴛɴᴀᴍᴇ
┃ ❍ ${prefix}ʙᴏᴛɪᴍᴀɢᴇ
┃ ❍ ${prefix}sᴇᴛᴘʀᴇғɪx
┃ ❍ ${prefix}ᴀʟʟᴠᴀʀ
┃ ❍ ${prefix}ʙʀᴏᴀᴅᴄᴀsᴛ
┃ ❍ ${prefix}ʀᴇsᴛᴀʀᴛ
┃ ❍ ${prefix}ᴊɪᴅ
┗━━━━━━━━━━━━┛

> ɢᴇɴᴇʀᴀᴛᴇᴅ ʙʏ *${botName}* ✨`.trim();

    // ===== BOT IMAGE FROM .botimage =====
    let botImage;
    if (user.BOT_IMAGE) {
      botImage = Buffer.from(user.BOT_IMAGE, "base64");
    } else {
      botImage = { url: "https://files.catbox.moe/g6odib.jpg" };
    }

    const chatId = from || (m && m.chat);

    try {
      await botClient.sendMessage(chatId, {
        image: botImage,
        caption: caption
      }, { quoted: m });
    } catch {
      await reply(caption);
    }

    try { if (react) await react("✅"); } catch (e) {}
  }
};
