const axios = require("axios");

module.exports = {
    name: "sim",
    aliases: ["database", "simdata", "find", "simdb"],
    category: "tools",
    desc: "Find SIM ownership details.",
    react: "💎",
    async execute(...allArgs) {
        try {
            // --- FRAMEWORK AUTO-DETECTION ---
            // Aapka bot handler chahe kisi bhi sequence me variables bhej raha ho, hum unhe dhoond nikalenge
            let conn = null;
            let msg = null;
            let inputArgs = [];
            let originalReply = null;

            for (const arg of allArgs) {
                if (!arg) continue;
                
                // 1. WhatsApp Connection Object ko dhoondna
                if (arg.sendMessage && (arg.ev || arg.ws)) {
                    conn = arg;
                } 
                // 2. Message Object (m) ko dhoondna
                else if (arg.key && (arg.message || arg.chat)) {
                    msg = arg;
                } 
                // 3. Command Arguments Array ko dhoondna
                else if (Array.isArray(arg)) {
                    inputArgs = arg;
                } 
                // 4. Context Object ko scan karna (agar data wrap ho kar aaya ho)
                else if (typeof arg === "object") {
                    if (arg.conn) conn = arg.conn;
                    if (arg.m) msg = arg.m;
                    if (arg.args) inputArgs = arg.args;
                    if (arg.reply) originalReply = arg.reply;
                }
            }

            // Agar core objects nahi mile toh safe logs generate karein
            if (!conn) return console.error("SIM CMD: WhatsApp connection object (conn) not found in arguments.");
            
            const from = msg?.chat || msg?.key?.remoteJid || allArgs.find(a => typeof a === 'string' && a.endsWith('@s.whatsapp.net'));
            if (!from) return console.error("SIM CMD: Target JID (from) could not be resolved.");

            // Dynamic Reply Wrapper
            const reply = originalReply || ((text) => conn.sendMessage(from, { text: text }, { quoted: msg }));

            // --- ARGUMENTS PROCESSING ---
            const q = inputArgs.join(" ");
            if (!q) return reply("Provide a number! Example: .sim 0303xxxxxxx");

            // --- NUMBER FORMATTING ---
            let raw = q.replace(/\D/g, '');
            if (raw.startsWith('92')) raw = '0' + raw.slice(2);
            if (raw.length < 10 || raw.length > 11) {
                return reply("❌ Invalid number format. Use 10 or 11 digit format.");
            }

            // Send searching reaction
            if (msg?.key) {
                await conn.sendMessage(from, { react: { text: "🔍", key: msg.key } }).catch(() => null);
            }

            // --- API CALL ---
            const api = `https://fam-official.serv00.net/api/database.php?number=${raw}`;
            const { data: resp } = await axios.get(api, { timeout: 20000 });

            // Check if data exists
            if (!resp?.success || !resp?.data?.records?.length) {
                if (msg?.key) await conn.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => null);
                return reply("🚫 No Record Found for this number.");
            }

            const record = resp.data.records[0];
            const name = record.full_name || "N/A";
            const cnic = record.cnic || "N/A";
            const address = record.address || "N/A";
            const phone = record.phone || raw;

            // --- STYLISH RESPONSE ---
            const text = `⚡ *S I M  D E T A I L S* ⚡\n\n` +
                         `👤 *NAME* : ${name}\n` +
                         `🪪 *CNIC* : ${cnic}\n` +
                         `📍 *ADDR* : ${address}\n` +
                         `📞 *NUM* : ${phone}\n\n` +
                         `💻 *SYSTEM* : ONLINE`;

            await reply(text);

            // Send success reaction
            if (msg?.key) {
                await conn.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => null);
            }

        } catch (e) {
            console.error("SIM CMD CRITICAL ERROR:", e);
        }
    }
};
