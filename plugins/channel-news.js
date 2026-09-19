/**
 * Newsletter Command - Get newsletter information from WhatsApp channel link
 */

const config = require('../config');

/**
 * Extract invite code from WhatsApp channel link
 * @param {string} link - Channel link (e.g., https://whatsapp.com/channel/0029VaAbCdEfGhIJkL)
 * @returns {string|null} - Invite code or null if invalid
 */
function getChannelInviteCode(link) {
  try {
    let cleanLink = link.trim();
    cleanLink = cleanLink.split('?')[0].split('#')[0];
    
    try {
      const url = new URL(cleanLink);
      const parts = url.pathname.split('/').filter(Boolean);
      const code = parts[parts.length - 1];
      if (code && code.length > 0) {
        return code;
      }
    } catch (urlError) {}
    
    const patterns = [
      /(?:whatsapp\.com|wa\.me)\/channel\/([A-Za-z0-9]+)/i,
      /\/channel\/([A-Za-z0-9]+)/i,
      /channel\/([A-Za-z0-9]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = cleanLink.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    if (/^[A-Za-z0-9]+$/.test(cleanLink)) {
      return cleanLink;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting invite code:', error);
    return null;
  }
}

module.exports = {
  name: 'newsletter',
  aliases: ['id', 'channelinfo', 'nl'],
  category: 'owner',
  description: 'Get newsletter information from WhatsApp channel link',
  usage: '.newsletter <channel link>',
  ownerOnly: true,

  async execute(context) {
    // 1. Naye context handler se elements destructure kiye
    const { reply, react, args, msg, socket, sock, conn, from } = context;
    const client = socket || sock || conn;

    try {
      await react("🔍");

      // 2. Get link from args or message text safely
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text ||
                   (args ? args.join(' ') : '');
      
      if (!text || text.trim().length === 0) {
        await react("❌");
        return reply('❌ Please provide a WhatsApp channel link!\n\nExample: .newsletter https://whatsapp.com/channel/0029VaAbCdEfGhIJkL');
      }
      
      const prefix = config.prefix || '.';
      let link = text.replace(new RegExp(`^\\${prefix}(newsletter|nl|channel|channelinfo)\\s+`, 'i'), '').trim();
      
      if (!link && args) {
        link = args.join(' ').trim();
      }
      
      if (!link || link.length === 0) {
        await react("❌");
        return reply('❌ Please provide a WhatsApp channel link!\n\nExample: .newsletter https://whatsapp.com/channel/0029VaAbCdEfGhIJkL');
      }
      
      const inviteCode = getChannelInviteCode(link);
      
      if (!inviteCode) {
        await react("❌");
        return reply('❌ Could not extract invite code from the link!\n\nPlease provide a valid WhatsApp channel link.\nExample: https://whatsapp.com/channel/0029VaAbCdEfGhIJkL\n\nOr just the invite code: .newsletter 0029VaAbCdEfGhIJkL');
      }
      
      link = inviteCode;
      
      try {
        // Baileys client functions safely checked
        if (!client || typeof client.newsletterMetadata !== 'function') {
           throw new Error('newsletterMetadata feature not available in your Baileys version');
        }

        const meta = await client.newsletterMetadata('invite', link);
        
        if (!meta) {
          throw new Error('Newsletter not found');
        }
        
        // 3. Info Text formatting with design consistency
        let infoText = `📢 *NEWSLETTER METADATA*\n\n`;
        infoText += `🆔 *ID:* \`${meta.id || 'N/A'}\`\n`;
        infoText += `📌 *Name:* ${meta.name || 'N/A'}\n`;
        
        if (meta.description) {
          infoText += `📝 *Description:* ${meta.description}\n`;
        }
        
        if (meta.invite) {
          infoText += `🔗 *Invite Code:* \`${meta.invite}\`\n`;
        }
        
        if (meta.subscriberCount !== undefined) {
          infoText += `👥 *Subscribers:* ${meta.subscriberCount.toLocaleString()}\n`;
        }
        
        if (meta.creationTime) {
          const date = new Date(meta.creationTime * 1000);
          infoText += `📅 *Created:* ${date.toLocaleDateString()}\n`;
        }

        infoText += `\n> © KAMRAN-MINI-BOT ッ`;
        
        // 4. Send Message according to new layout
        if (from) {
          if (meta.image) {
            await client.sendMessage(from, {
              image: { url: meta.image },
              caption: infoText
            }, { quoted: msg });
          } else {
            await client.sendMessage(from, {
              text: infoText
            }, { quoted: msg });
          }
          await react("✅");
        }
        
      } catch (error) {
        console.error('Newsletter internal error:', error);
        await react("❌");
        
        if (error.message.includes('Invalid channel link')) {
          await reply('❌ Invalid channel link format!');
        } else if (error.message.includes('NotFound') || error.message.includes('not found')) {
          await reply('❌ Newsletter not found! link check karein.');
        } else if (error.message.includes('newsletterMetadata')) {
          await reply('❌ Newsletter feature not available! Baileys update karein.');
        } else {
          await reply(`❌ Failed to get newsletter information: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Newsletter main catch error:', error);
      await react("❌");
      await reply(`❌ An error occurred: ${error.message}`);
    }
  }
};
