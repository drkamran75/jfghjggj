const axios = require("axios");
const config = require("../../config");
const sharp = require("sharp");

// Helper function to process high-compatibility jpeg thumbnails
async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(data)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Error processing thumbnail:", err.message || err);
    return null;
  }
}

module.exports = {
    name: "123mkv",
    aliases: ["mkv", "123mkvdl"],
    category: "downloader",
    description: "Search and download movies from 123mkv via API",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;

        const apiKey = "vajira-hgk462fm81-1780387904602";
        const searchApiUrl = `https://vajira-official-apis.vercel.app/api/123mkv`;
        const downloadApiUrl = `https://vajira-official-apis.vercel.app/api/123mkvdetails`;

        try {
            await react("🎬");

            if (!q) {
                return reply(
                    "❌ *Oops! Title Missing* ❌\n\n" +
                    "Please provide a movie name to search!\n" +
                    "📌 *Example:* `.123mkv Avatar`"
                );
            }

            await reply(`🔍 _Searching for *"${q}"* on 123mkv servers..._`);

            const response = await axios.get(searchApiUrl, {
                params: { apikey: apiKey, q: q },
                timeout: 30000
            });

            if (response.status !== 200 || !response.data) {
                await react("❌");
                return reply("🛸 *API Error:* Server responded with an invalid status.");
            }

            let results = null;
            if (response.data) {
                if (Array.isArray(response.data.data)) results = response.data.data;
                else if (Array.isArray(response.data.result)) results = response.data.result;
                else if (Array.isArray(response.data)) results = response.data;
            }

            if (results && results.length === 0) {
                await react("❌");
                return reply(`🛸 *No Results Found!*\n123mkv par *"${q}"* naam ki koi movie nahi mili.`);
            }

            let listText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            listText += `┃ 🎬   *123MKV SEARCH* 🎬 ┃\n`;
            listText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n\n`;

            results.forEach((v, i) => {
                listText += `│ 🍿 *[${i + 1}]* _${v.title || v.name || 'Unknown'}_\n`;
                listText += `│ └─ 📅 *Details:* ${v.year || v.quality || 'N/A'}\n`;
                if (i !== results.length - 1) listText += `├─────────────────────────┤\n`;
            });
            listText += `└─────────────────────────┘\n\n⚡ *Reply with number* to get links.\n\n> *© KAMRAN-MINI-BOT ッ*`;

            const firstImage = results[0].image || results[0].poster || "https://placehold.co/600x400?text=No+Poster";
            const sentSearch = await client.sendMessage(from, { image: { url: firstImage }, caption: listText }, { quoted: mek });

            const searchMsgId = sentSearch.key.id;
            let detailsTimeout, downloadTimeout;

            // ================= STEP 2: DETAILS HANDLER =================
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
                    client.ev.off("messages.upsert", detailsHandler);
                    clearTimeout(detailsTimeout);

                    await react("⏳");
                    const targetUrl = selected.url || selected.link;

                    const detailResponse = await axios.get(downloadApiUrl, {
                        params: { apikey: apiKey, url: targetUrl },
                        timeout: 30000
                    });

                    // ⚡ FIX: Deep Recursive Array Finder to completely eliminate "No mirrors located" error
                    let dlLinks = [];
                    function findArrays(obj) {
                        if (!obj || typeof obj !== 'object') return false;
                        if (Array.isArray(obj)) {
                            const valid = obj.some(i => i && (i.url || i.link || i.direct || typeof i === 'string'));
                            if (valid) { dlLinks = obj; return true; }
                        }
                        for (let k in obj) {
                            if (typeof obj[k] === 'object' && findArrays(obj[k])) return true;
                        }
                        return false;
                    }
                    findArrays(detailResponse.data);

                    // Fallback for single link string response
                    if (dlLinks.length === 0) {
                        let singleLink = detailResponse.data?.result?.url || detailResponse.data?.data?.url || detailResponse.data?.url;
                        if (singleLink && typeof singleLink === 'string') {
                            dlLinks = [{ title: "Direct Mirror", url: singleLink, quality: "HD", size: "N/A" }];
                        }
                    }

                    if (dlLinks.length === 0) {
                        await react("❌");
                        return reply("❌ *Sorry:* API did not return any readable links for this movie selection.");
                    }

                    let cap = `🎥 *${selected.title || 'Movie Details'}*\n\n`;
                    cap += `┏───────────────────────┓\n│   💾  AVAILABLE MIRRORS   │\n┗───────────────────────┛\n`;
                    
                    dlLinks.forEach((dl, i) => {
                        cap += `╭─ 📥 *[${i + 1}]* ${dl.title || dl.name || 'Mirror ' + (i + 1)}\n`;
                        cap += `├─ 🌟 *Quality:* \`${dl.quality || 'Default'}\`\n`;
                        cap += `╰─ ⚖️ *Size:* \`${dl.size || 'Unknown'}\`\n\n`;
                    });
                    cap += `⚡ *Reply with mirror number* to download.\n\n> *© KAMRAN-MINI-BOT ッ*`;

                    const sentDetail = await client.sendMessage(from, { image: { url: firstImage }, caption: cap }, { quoted: msg });
                    const detailMsgId = sentDetail.key.id;

                    // ================= STEP 3: DOWNLOAD HANDLER =================
                    const downloadHandler = async (up) => {
                        try {
                            const dlMsg = up.messages[0];
                            if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                            const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                            if (dlCtx?.stanzaId !== detailMsgId) return;

                            const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                            const dlNum = parseInt(pick);
                            if (isNaN(dlNum) || dlNum < 1 || dlNum > dlLinks.length) return;

                            const selectedDl = dlLinks[dlNum - 1];
                            client.ev.off("messages.upsert", downloadHandler);
                            clearTimeout(downloadTimeout);

                            await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                            let fileUrl = selectedDl.url || selectedDl.link || selectedDl.direct;

                            if (!fileUrl) return reply("❌ Link parsing failed.");

                            // ⚡ FIX: Smart detection for Shorteners / HTML landing pages to avoid 38KB corrupted files
                            let isWebpage = fileUrl.includes("savelinks.us") || fileUrl.includes("drive.google.com") || fileUrl.includes("gdtot") || fileUrl.includes("gdflix");

                            let finalCaption = `╭───────────────────◆\n│ 🎬 *${selected.title}*\n├───────────────────◆\n`;
                            finalCaption += `│ 🌟 *Quality:* ${selectedDl.quality || 'N/A'}\n│ ⚖️ *Size:* ${selectedDl.size || 'N/A'}\n╰───────────────────◆\n\n`;

                            if (isWebpage) {
                                finalCaption += `🔗 *Note:* Direct file extraction restricted by host. Please open link in browser to download:\n\n📌 *Link:* ${fileUrl}\n\n> *© KAMRAN-MINI-BOT ッ*`;
                                return reply(finalCaption);
                            }

                            // If it's a true direct video link, push as Document file
                            const cleanFileName = `${selected.title.replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mkv`;
                            await reply(`🚀 *Processing File...* \nUploading document. Please wait!`);

                            let documentPayload = {
                                document: { url: fileUrl },
                                mimetype: "video/x-matroska",
                                fileName: cleanFileName,
                                caption: finalCaption + `> *© KAMRAN-MINI-BOT ッ*`
                            };

                            const thumbBuffer = await getThumbnailBuffer(firstImage);
                            if (thumbBuffer) documentPayload.jpegThumbnail = thumbBuffer;

                            await client.sendMessage(from, documentPayload, { quoted: dlMsg });
                            await client.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });

                        } catch (dlErr) {
                            reply(`❌ Download Error: ${dlErr.message}`);
                        }
                    };

                    client.ev.on("messages.upsert", downloadHandler);
                    downloadTimeout = setTimeout(() => client.ev.off("messages.upsert", downloadHandler), 300000);

                } catch (detErr) {
                    reply(`❌ Details Error: ${detErr.message}`);
                }
            };

            client.ev.on("messages.upsert", detailsHandler);
            detailsTimeout = setTimeout(() => client.ev.off("messages.upsert", detailsHandler), 300000);

        } catch (e) {
            await react("❌");
            return reply(`❌ Error: ${e.message}`);
        }
    }
};
