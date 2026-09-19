const axios = require('axios');

const API_BASE_URL = 'https://techxpair.vercel.app/api';

function validateEmojis(input) {
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    if (consecutiveEmojisRegex.test(input)) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .reactpost https://whatsapp.com/channel/ID/123 😂,❤️,🔥,👏,😮'
        };
    }
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    if (emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .reactpost https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    return { valid: true, emojis: emojis };
}

module.exports = {
    name: "creact4",
    aliases: ["chreact4", "react4", "reactch4"],
    react: "🎯",
    desc: "React to WhatsApp channel post using all servers",
    category: "main", // Public category
    use: ".react <channel_url> <emojis>",
    filename: __filename,
    
    async execute({ 
        conn, mek, m, from, quoted, body, isCmd, command, args, q, 
        isGroup, sender, senderNumber, botNumber2, botNumber,
        pushname, isMe, isRealOwner, reply, react 
    }) {
        try {
            if (!args || !args[0]) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply(`❌ *Please provide a channel post URL!*\n\n*Example:*\n.react https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O/4961 😂,❤️,🔥`);
            }
            
            await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
            
            const url = args[0];
            let emojisInput = args.slice(1).join(' ');
            
            if (!emojisInput) {
                emojisInput = '❤️,👍,😮,😎,💀';
            }
            
            const validation = validateEmojis(emojisInput);
            if (!validation.valid) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply(validation.error);
            }
            
            const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
            
            if (!serversResponse.data || !serversResponse.data.servers) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply("❌ *Failed to fetch server list!*");
            }
            
            const servers = serversResponse.data.servers;
            const emojisString = validation.emojis.join(',');
            
            // Saare servers par requests parallel bhej rahe hain
            const reactPromises = servers.map(server => {
                let externalServerUrl = server.url.trim();
                if (externalServerUrl.endsWith('/')) {
                    externalServerUrl = externalServerUrl.slice(0, -1);
                }
                const reactUrl = `${externalServerUrl}/chreact?url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
                
                return axios.get(reactUrl, { timeout: 8000 }).catch((err) => {
                    console.log(`Server error (${externalServerUrl}):`, err.message);
                });
            });
            
            // Background process complete hone ka wait karega
            await Promise.all(reactPromises);
            
            // Server count aur server word dono ko hata diya gaya hai
            const resultMessage = `✅ *Successfully Done!* \n\n> *© Pᴏᴡᴇʀ Eᴅ Bʏ DR KAMRAN-♡*`;
            
            await reply(resultMessage);
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            
        } catch (error) {
            console.error("React post error:", error);
            if (conn && from && m) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } }).catch(() => {});
            }
            if (reply) await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`).catch(() => {});
        }
    }
};
