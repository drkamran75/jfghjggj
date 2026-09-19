const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

// Runtime helper function (Uptime calculate karne ke liye)
const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor((seconds % (3600 * 24)) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > dDisplay ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

// Format category with premium sleek styles & Stylist Uppercase Commands
const formatCategory = (category, cmds) => {
    const validCmds = cmds.filter(cmd => (cmd.name || cmd.pattern) && (cmd.name || cmd.pattern).trim() !== '');
    
    if (validCmds.length === 0) return '';
    
    let title = `\n╭━━━〔 *${toStylistUpper(category.toUpperCase())}* 〕━━━┈⊷\n`;
    let body = validCmds.map(cmd => {
        const cmdName = cmd.name || cmd.pattern || '';
        const commandName = toStylistUpper(cmdName);
        return `┃ ⚡ \`${commandName}\``;
    }).join('\n');
    let footer = `\n╰━━━━━━━━━━━━━━━━━━━┈⊷`;
    return `${title}${body}${footer}`;
};

// Function to validate image URL
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    const urlLower = url.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => urlLower.endsWith(ext));
};

module.exports = {
    name: "help",
    aliases: ["menu", "commands", "list", "cmd", "allmenu", "fullmenu", "m"],
    category: "main",
    description: "Show full command list",
    use: '.menu',
    react: "⚡",
    
    execute: async (conn, mek, m, { from, reply, userConfig, commands }) => {
        try {
            await conn.sendPresenceUpdate('composing', from);
            
            const allCommands = commands || global.commands || {};
            let totalCommands = Object.keys(allCommands).length;
            
            const categories = [...new Set(Object.values(allCommands).map(c => c.category))].filter(cat => 
                cat && cat.trim() !== '' && cat !== 'undefined'
            );
            
            const categorized = {};
            categories.forEach(cat => {
                const categoryCommands = Object.values(allCommands).filter(c => c.category === cat);
                const validCommands = categoryCommands.filter(cmd => (cmd.name || cmd.pattern) && (cmd.name || cmd.pattern).trim() !== '');
                if (validCommands.length > 0) {
                    categorized[cat] = validCommands;
                }
            });

            let menuSections = '';
            for (const [category, cmds] of Object.entries(categorized)) {
                if (cmds && cmds.length > 0) {
                    const section = formatCategory(category, cmds);
                    if (section !== '') {
                        menuSections += section;
                    }
                }
            }

            const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
            const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Owner";
            const PREFIX = userConfig?.PREFIX || config.PREFIX || ".";
            const MODE = userConfig?.MODE || config.MODE || "private";
            const VERSION = userConfig?.VERSION || config.VERSION || "10.0.0";
            const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
            
            const BOT_IMAGE = userConfig?.BOT_IMAGE || userConfig?.BOT_MEDIA_URL || config.BOT_IMAGE || config.BOT_MEDIA_URL;
            
            let dec = `✨ *${toStylistUpper(BOT_NAME)} ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ* ✨

┌━━━〔 *ɪɴғᴏ ʙᴏx* 〕━━━┈⊷
┃ 👑 *${toStylistUpper('Owner')}:* ${OWNER_NAME}
┃ 📊 *${toStylistUpper('Commands')}:* ${totalCommands}
┃ ⏳ *${toixels ? '' : toStylistUpper('Runtime')}:* ${runtime(process.uptime())}
┃ 📡 *${toStylistUpper('Prefix')}:* [  ${PREFIX}  ]
┃ ⚙️ *${toStylistUpper('Mode')}:* ${MODE}
┃ 🏷️ *${toStylistUpper('Version')}:* ${VERSION}
╰━━━━━━━━━━━━━━━━━━━┈⊷
${menuSections}

> 💡 _${DESCRIPTION || 'Powered by WhatsApp Bot'}_`;

            // Agar local image path set karni ho toh apna image path yahan adjust kar sakte hain
            let imageToUse = BOT_IMAGE;
            
            await conn.sendMessage(from, { 
                image: { url: imageToUse },
                caption: dec, 
                contextInfo: { 
                    mentionedJid: [m.sender], 
                    forwardingScore: 999, 
                    isForwarded: true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid: '120363418144382782@newsletter', 
                        newsletterName: BOT_NAME, 
                        serverMessageId: 143 
                    } 
                } 
            }, { quoted: mek });

        } catch (e) { 
            console.log(e); 
            reply(`Error: ${e}`); 
        } 
    }
};
