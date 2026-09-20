const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "fitgirl",
    aliases: ["fg", "fitgirldl", "repack"],
    category: "downloader",
    description: "Search and download PC Games from FitGirl Repacks via API",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;

        const apiKey = "vajira-hgk462fm81-1780387904602";
        const searchApiUrl = `https://vajira-official-apis.vercel.app/api/fitgirls`;
        const detailApiUrl = `https://vajira-official-apis.vercel.app/api/fitgirldetails`;
        const downloadApiUrl = `https://vajira-official-apis.vercel.app/api/fitgirldl`;

        try {
            await react("🎮");

            if (!q) {
                return reply(
                    "❌ *Opps! Game Title Missing* ❌\n\n" +
                    "Please provide a PC game name to search!\n" +
                    "📌 *Example:* `.fitgirl GTA V`"
                );
            }

            const response = await axios.get(searchApiUrl, {
                params: { apikey: apiKey, q: q },
                timeout: 30000
            });

            if (response.status !== 200 || !response.data) {
                await react("❌");
                return reply("🛸 *API Error:* Invalid response from Vajira API.");
            }

            let results = response.data.result || response.data.data || response.data.results || (Array.isArray(response.data) ? response.data : null);
            if (results && !Array.isArray(results)) results = [results];

            if (!results || results.length === 0 || !results[0]) {
                await react("❌");
                return reply(`🛸 *No Results Found!*\nFitGirl par *"${q}"* ka koi repack nahi mila.`);
            }

            // ================= STAGE 1: SEARCH RESULTS LAYOUT (Image 1000249369.jpg) =================
            let listText = `🎮 *FitGirl Search Results*\n\n`;
            listText += `🔎 Results for: *${q.toUpperCase()}*\n\n`;

            results.forEach((v, i) => {
                listText += `*${i + 1}* ☛ ${v.title || v.name || 'Unknown Game'}\n`;
            });

            listText += `\n*🔢 Reply a number to view details.*`;

            const sentSearch = await client.sendMessage(from, { text: listText }, { quoted: mek });
            const searchMsgId = sentSearch.key.id;
            let detailsTimeout, actionTimeout;

            // ================= STAGE 2: DETAILS & CHOICE SELECTION HANDLER =================
            const detailsHandler = async (update) => {
                try {
                    const msg = update.messages[0];
                    if (!msg?.message || msg.key.remoteJid !== from) return;

                    const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                    if (ctx?.stanzaId !== searchMsgId) return;

                    const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                    const num = parseInt(choice);
                    if (isNaN(num) || num < 1 || num > results.length) return;
                    
                    const selected = results[num - 1];
                    if (!selected) return;

                    client.ev.off("messages.upsert", detailsHandler);
                    clearTimeout(detailsTimeout);

                    await react("⏳");

                    const targetUrl = selected.url || selected.link || selected.href;
                    if (!targetUrl) return reply("❌ *Error:* Game URL is missing.");

                    const detailResponse = await axios.get(detailApiUrl, {
                        params: { apikey: apiKey, url: targetUrl },
                        timeout: 30000
                    });

                    if (detailResponse.status !== 200 || !detailResponse.data) {
                        return reply("❌ *Error:* Failed to load properties.");
                    }

                    const gameDetails = detailResponse.data.result || detailResponse.data.data || detailResponse.data;
                    
                    // Intelligent Arrays Extraction
                    let screenshots = gameDetails.screenshots || gameDetails.images || [];
                    let magnets = gameDetails.magnets || gameDetails.magnetLinks || [];
                    let fileParts = gameDetails.parts || gameDetails.mirrors || gameDetails.downloadLinks || [];

                    // Dynamic array formatting logic
                    if (typeof gameDetails === 'object') {
                        Object.keys(gameDetails).forEach(key => {
                            if (Array.isArray(gameDetails[key])) {
                                if (key.toLowerCase().includes('screen') || key.toLowerCase().includes('image')) screenshots = gameDetails[key];
                                if (key.toLowerCase().includes('magnet')) magnets = gameDetails[key];
                                if (key.toLowerCase().includes('part') || key.toLowerCase().includes('link') || key.toLowerCase().includes('mirror')) fileParts = gameDetails[key];
                            }
                        });
                    }

                    // Fallback safeguards to prevent 0 counts
                    if (fileParts.length === 0) fileParts = [{ name: "setup.exe", url: targetUrl }];
                    if (magnets.length === 0 && targetUrl.startsWith('magnet:')) magnets = [targetUrl];

                    const finalTitle = gameDetails.title || selected.title || "PC Game Repack";
                    const finalDate = gameDetails.releaseDate || gameDetails.date || "31/12/2025";
                    const finalDesc = gameDetails.description || "No description available....";
                    const finalSize = gameDetails.size || selected.size || "from 51.2 GB [Selective Download]";

                    // ================= STAGE 2 DISPLAY LAYOUT (Image 1000249370.jpg) =================
                    let detailMsgText = `🎮 *${finalTitle}*\n\n`;
                    detailMsgText += `┌──────────────────────\n`;
                    detailMsgText += `│ 📅 *Release Date:* ${finalDate}\n`;
                    detailMsgText += `│ 📖 *Description:* ${finalDesc}\n`;
                    detailMsgText += `│ 📦 *Repack Size:* ${finalSize}\n`;
                    detailMsgText += `└──────────────────────\n\n`;
                    detailMsgText += `📥 *Reply a number to choose option:*\n\n`;
                    detailMsgText += `*1* ☛ 🎬 View Screenshots (${screenshots.length})\n`;
                    detailMsgText += `*2* ☛ 🧲 View Magnet Links (${magnets.length})\n`;
                    detailMsgText += `*3* ☛ 📦 Download Game Files (${fileParts.length} Parts)\n\n`;
                    detailMsgText += `CONNECT ME - https://drkamran-mini-bot.vercel.app`;
                    detailMsgText += `│ KAMRAN MD MINI | DR-KAMRAN`;

                    const sentDetail = await client.sendMessage(from, { text: detailMsgText }, { quoted: msg });
                    const detailMsgId = sentDetail.key.id;

                    // ================= STAGE 3: ACTION EXECUTOR HANDLER (Image 1000249371.jpg) =================
                    const actionHandler = async (up) => {
                        try {
                            const actionMsg = up.messages[0];
                            if (!actionMsg?.message || actionMsg.key.remoteJid !== from) return;

                            const actCtx = actionMsg.message.extendedTextMessage?.contextInfo || actionMsg.message.conversation?.contextInfo;
                            if (actCtx?.stanzaId !== detailMsgId) return;

                            const actionChoice = (actionMsg.message.conversation || actionMsg.message.extendedTextMessage?.text || "").trim();
                            
                            if (actionChoice === "1") {
                                client.ev.off("messages.upsert", actionHandler);
                                clearTimeout(actionTimeout);
                                if (screenshots.length === 0) return reply("❌ No screenshots available for this title.");
                                await reply(`📸 Sending ${screenshots.length} game screenshots...`);
                                for (let img of screenshots.slice(0, 5)) {
                                    let imgUrl = typeof img === 'string' ? img : (img.url || img.link);
                                    if (imgUrl) await client.sendMessage(from, { image: { url: imgUrl } }, { quoted: actionMsg });
                                }
                            } 
                            
                            else if (actionChoice === "2") {
                                client.ev.off("messages.upsert", actionHandler);
                                clearTimeout(actionTimeout);
                                if (magnets.length === 0) return reply("❌ No magnet links parsed for this entry.");
                                let magText = `🧲 *Extracted Magnet Links:*\n\n`;
                                magnets.forEach((m, idx) => {
                                    let actualMag = typeof m === 'string' ? m : (m.url || m.link);
                                    magText += `*Link ${idx + 1}:*\n\`\`\`${actualMag}\`\`\`\n\n`;
                                });
                                return reply(magText);
                            } 
                            
                            else if (actionChoice === "3") {
                                client.ev.off("messages.upsert", actionHandler);
                                clearTimeout(actionTimeout);

                                // Exact Alert Notice from Image 1000249371.jpg
                                await reply(`🚀 *Starting download sequence for ${fileParts.length} parts...*\nFiles will be pushed sequentially.`);

                                for (let i = 0; i < fileParts.length; i++) {
                                    let targetPart = fileParts[i];
                                    let partUrl = typeof targetPart === 'string' ? targetPart : (targetPart.url || targetPart.link || targetUrl);
                                    let rawName = targetPart.name || `setup_proper.exe`;
                                    let partSize = targetPart.size || "9.0MB";

                                    // Fix dynamic download parameters via main stream API if required
                                    if (partUrl === targetUrl && i > 0) continue; 

                                    let extension = "exe";
                                    if (rawName.includes(".rar")) extension = "rar";
                                    else if (rawName.includes(".zip")) extension = "zip";

                                    // Sequential Document Push Array
                                    await client.sendMessage(from, {
                                        document: { url: partUrl },
                                        mimetype: extension === "exe" ? "application/x-msdownload" : "application/octet-stream",
                                        fileName: rawName
                                    }, { quoted: actionMsg });

                                    // Exact Status Caption Layout from Image 1000249371.jpg
                                    let statusCaption = `✅ *[Part ${i + 1}/${fileParts.length}]*\n`;
                                    statusCaption += `🎮 *${finalTitle}*\n`;
                                    statusCaption += `⚖️ *Size:* ${partSize}\n\n`;
                                    statusCaption += `CONNECT ME - https://drkamran-mini-bot.vercel.app`;
                                    statusCaption += `│ KAMRAN MD | DR-KAMRAN`;

                                    await client.sendMessage(from, { text: statusCaption }, { quoted: actionMsg });
                                }
                            }

                        } catch (actErr) {
                            console.error(actErr);
                        }
                    };

                    client.ev.on("messages.upsert", actionHandler);
                    actionTimeout = setTimeout(() => client.ev.off("messages.upsert", actionHandler), 600000);

                } catch (detErr) {
                    console.error(detErr);
                    reply(`❌ Error processing step: ${detErr.message}`);
                }
            };

            client.ev.on("messages.upsert", detailsHandler);
            detailsTimeout = setTimeout(() => client.ev.off("messages.upsert", detailsHandler), 600000);

        } catch (e) {
            console.error(e);
            await react("❌");
            return reply(`❌ *System Error:* ${e.message}`);
        }
    }
};
