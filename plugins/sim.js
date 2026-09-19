const axios = require('axios');

const API_URL = 'https://api.theresav.biz.id/ai/feelbetter';
const API_KEY = 'SurGG';
const AI_PROMPT = 'nama kamu adalah seorang Reze initially appears to be a kind and gentle girl who has a crush on Denji soon after meeting him, taking interest in him at first sight and was portrayed to be as somewhat enthusiastic, as shown when both Denji and her have a drink of coffee at the Café she had worked at. She is shown to be laughing at his jokes and isn’t afraid to get close and intimate with him. (Source: Chainsaw Man Wiki, edited)';

const getMessageText = (m) => {
    if (!m) return '';
    return (
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        ''
    ).trim();
};

module.exports = {
    name: "autoai",
    aliases: ["airespond"],
    category: "ai",
    desc: "Debug version to catch parameter mismatch.",
    react: "🪐",
    
    async execute() {
        // 🔍 TERMINAL DEBUG LOGGING
        console.log("==========================================");
        console.log("[DEBUG] .autoai command triggered!");
        console.log("[DEBUG] Total arguments passed by core:", arguments.length);
        
        for (let i = 0; i < arguments.length; i++) {
            console.log(`[DEBUG] Param [${i}] Type:`, typeof arguments[i]);
            if (arguments[i] && typeof arguments[i] === 'object') {
                console.log(`[DEBUG] Param [${i}] Keys:`, Object.keys(arguments[i]).slice(0, 10));
            }
        }
        console.log("==========================================");

        // Crash loop protection fallback
        let conn, m, args;
        
        // Dynamically resolving components
        if (arguments[0] && typeof arguments[0] === 'object' && arguments[0].sendMessage) {
            conn = arguments[0];
            m = arguments[1];
            args = arguments[2] || [];
        } else if (arguments[1] && typeof arguments[1] === 'object' && arguments[1].sendMessage) {
            m = arguments[0];
            conn = arguments[1];
            args = arguments[2] || [];
        } else {
            // Ultimate fallback if structure is completely distorted
            m = arguments[0] || {};
            conn = arguments[1] || global.conn;
            args = arguments[2] || [];
        }

        // Safe extraction variables
        const targetChat = m?.chat || m?.key?.remoteJid || m?.from;
        const sender = m?.sender || m?.key?.participant || targetChat;

        if (!targetChat || !conn) {
            console.log("[DEBUG] CRITICAL: Could not find valid chat ID or conn instance!");
            return; 
        }

        if (!args || !args[0]) {
            return conn.sendMessage(targetChat, { text: `🪐 *Gunakan: .autoai on / off*` }, { quoted: m });
        }

        try {
            conn.autoai = conn.autoai || {};
            const chatKey = `${targetChat}:${sender}`;
            const opt = args[0].toLowerCase();

            if (opt === 'on') {
                conn.autoai[chatKey] = { active: true, sessionid: Date.now().toString() };
                return conn.sendMessage(targetChat, { text: `💜 *AutoAI Activated (Debug Mode)*` }, { quoted: m });
            }

            if (opt === 'off') {
                delete conn.autoai[chatKey];
                return conn.sendMessage(targetChat, { text: `🫧 *AutoAI Deactivated (Debug Mode)*` }, { quoted: m });
            }
        } catch (e) {
            console.error("[DEBUG EXECUTE ERROR]:", e.message);
        }
    },

    async before(m, { conn }) {
        // Safe check for background runner
        const currentConn = conn || global.conn;
        if (!m || !currentConn) return;

        try {
            const targetChat = m.chat || m.key?.remoteJid || m.from;
            if (!targetChat || m.isBaileys || m.fromMe) return;

            currentConn.autoai = currentConn.autoai || {};
            const sender = m.sender || m.key?.participant || targetChat;
            const chatKey = `${targetChat}:${sender}`;
            const state = currentConn.autoai[chatKey];

            if (!state?.active || !state?.sessionid) return;

            const text = getMessageText(m);
            if (!text || /^[!./#%$^&*~|-]/.test(text)) return;

            await currentConn.sendPresenceUpdate('composing', targetChat).catch(() => null);
            const res = await axios.get(`${API_URL}?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(AI_PROMPT)}&apikey=${API_KEY}&chatId=${state.sessionid}`, { timeout: 15000 });
            await currentConn.sendPresenceUpdate('paused', targetChat).catch(() => null);

            if (res.data?.result) {
                await currentConn.sendMessage(targetChat, { text: `*AutoAI* ✨\n\n${res.data.result}` }, { quoted: m });
            }
        } catch (e) {
            console.error("[DEBUG BEFORE ERROR]:", e.message);
        }
    }
};
