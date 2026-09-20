const axios = require('axios');

const WEB_URL = "https://kamranmd-fbb621054875.herokuapp.com";
const SECRET_KEY = "kamranxmd808";

// Validate channel post URL format
function isValidChannelPostUrl(url) {
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

// Extract channel ID and post ID from URL
function extractIdsFromUrl(url) {
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (match) {
        return {
            channelId: match[1],
            postId: match[2]
        };
    }
    return null;
}

// Parse emojis
function parseEmojis(input) {
    let emojis = [];
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    for (const part of parts) {
        const emojiRegex = /[\p{Emoji}\u200d]/u;
        if (emojiRegex.test(part)) {
            emojis.push(part);
        }
    }
    return emojis;
}

module.exports = {
    name: "chreact",
    aliases: ["channelreact", "reactpost"],
    category: "utility",
    description: "React to WhatsApp channel posts securely",

    async execute(context) {
        const { socket, m, from, args, reply } = context;

        try {
            if (!args[0]) {
                return reply(`❌ *Please provide a channel post URL!*\n\n*Example:* \n.chreact https://whatsapp.com/channel/0029Vb.../609 😂,❤️,🔥`);
            }

            const url = args[0];
            if (!isValidChannelPostUrl(url)) {
                return reply(`❌ *Invalid Channel Post URL!*`);
            }

            const ids = extractIdsFromUrl(url);
            if (!ids) {
                return reply(`❌ *Failed to extract channel/post IDs!*`);
            }

            let emojis = ['❤️', '🔥', '😂'];
            if (args.length > 1) {
                const remaining = args.slice(1).join(' ');
                const parsed = parseEmojis(remaining);
                if (parsed.length > 0) emojis = parsed;
            }

            const emojisString = emojis.join(',');

            if (m && m.key) {
                await socket.sendMessage(from, { react: { text: '⏳', key: m.key } });
            }

            const reactUrl = `${WEB_URL}/react?key=${SECRET_KEY}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            await axios.get(reactUrl, { timeout: 8000 });

            if (m && m.key) {
                await socket.sendMessage(from, { react: { text: '✅', key: m.key } });
            }

            return reply(`✅ *Channel post par successfully reactions bhej diye gaye hain!*\n\n🎯 *Channel ID:* ${ids.channelId}\n📝 *Post ID:* ${ids.postId}\n😊 *Emojis:* ${emojis.join(' ')}`);

        } catch (error) {
            console.error("Chreact Error:", error.message);
            if (m && m.key) {
                await socket.sendMessage(from, { react: { text: '❌', key: m.key } });
            }
            return reply(`❌ *Error:* Reaction bhejne mein nakamyabi hui.`);
        }
    }
};
