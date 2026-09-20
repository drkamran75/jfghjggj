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
    name: "mlfbd2",
    aliases: ["movie2", "downloadmovie2", "cinemalk2"],
    category: "downloader",
    description: "Search and download movies from MLFBD via API",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from, mek } = context;
        const client = socket || sock || conn;

        const apiKey = "vajira-23ikssig51-1780651873767";
        const searchApiUrl = `https://vajira-official-apis.vercel.app/api/mlfbds`;
        const downloadApiUrl = `https://vajira-official-apis.vercel.app/api/mlfbddl`;

        try {
            await react("🎬");

            if (!q) {
                return reply(
                    "❌ *Opps! Movie Name Missing* ❌\n\n" +
                    "Please provide a movie name to search!\n" +
                    "📌 *Example:* `.mlfbd From Season 4`"
                );
            }

            await reply(`🔍 _Searching for *"${q}"* on MLFBD servers..._`);

            const response = await axios.get(searchApiUrl, {
                params: { apikey: apiKey, text: q },
                timeout: 30000
            });

            if (response.status !== 200 || !response.data || !response.data.result || response.data.result.length === 0) {
                await react("❌");
                return reply("🛸 *No Results Found!* \nWe couldn't find anything matching your query on MLFBD.");
            }

            const results = response.data.result;

            // Stylish Search List Layout
            let listText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            listText += `┃ 🎬  *MLFBD MOVIE SEARCH*  🎬 ┃\n`;
            listText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
            listText += `✨ *Results Found:* ${results.length}\n\n`;
            listText += `┌─────────────────────────┐\n`;

            results.forEach((v, i) => {
                listText += `│ 🍿 *[${i + 1}]* _${v.title}_\n`;
                listText += `│ ├─ ⭐ *Rating:* ${v.rate || 'N/A'}\n`;
                listText += `│ └─ 📅 *Year:* ${v.year || 'N/A'}\n`;
                if (i !== results.length - 1) listText += `├─────────────────────────┤\n`;
            });

            listText += `└─────────────────────────┘\n\n`;
            listText += `⚡ *Reply with the item number* to view options.\n\n`;
            listText += `> *© KAMRAN-MINI-BOT ッ*`;

            const sentSearch = await client.sendMessage(from, {
                image: { url: results[0].image || "https://placehold.co/600x400?text=No+Poster" },
                caption: listText
            }, { quoted: mek });

            const searchMsgId = sentSearch.key.id;
            let detailsTimeout, downloadTimeout;

            // ================= INTERACTIVE STEP: DETAILS HANDLER =================
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

                    const detailResponse = await axios.get(downloadApiUrl, {
                        params: { apikey: apiKey, url: selected.link },
                        timeout: 30000
                    });

                    if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.result) {
                        await react("❌");
                        return reply("❌ *Error:* Failed to pull download properties for this item.");
                    }

                    const movieDetails = detailResponse.data.result;
                    const dlLinks = movieDetails.downloads || [];

                    if (dlLinks.length === 0) {
                        await react("❌");
                        return reply("❌ *Sorry:* No downloadable files were located for this selection.");
                    }

                    // Stylish Movie Details Layout
                    let cap = `╭──────────────◆\n`;
                    cap += `│ 🎥 *${movieDetails.title || selected.title}*\n`;
                    cap += `╰──────────────◆\n\n`;
                    cap += `🎭 *Genres:* \`${movieDetails.genres || 'N/A'}\`\n`;
                    cap += `📅 *Release:* ${movieDetails.release || 'N/A'}\n`;
                    cap += `🌟 *Rating:* ${movieDetails.rating || selected.rate}\n\n`;
                    cap += `📝 *Description:* \n_${movieDetails.description || 'No description available.'}_\n\n`;
                    
                    cap += `┏───────────────────────┓\n`;
                    cap += `│   💾  AVAILABLE MIRRORS   │\n`;
                    cap += `┗───────────────────────┛\n`;
                    
                    dlLinks.forEach((dl, i) => {
                        cap += `╭─ 📥 *[${i + 1}]* Mirror ${i + 1}\n`;
                        cap += `├─ 🌟 *Quality:* \`${dl.quality || '720p'}\`\n`;
                        cap += `╰─ ⚖️ *Size:* \`${dl.size || 'Unknown'}\`\n\n`;
                    });

                    cap += `⚡ *Reply with a mirror number* to start downloading.\n\n`;
                    cap += `> *© KAMRAN-MINI-BOT ッ*`;

                    const sentDetail = await client.sendMessage(from, {
                        image: { url: movieDetails.image || selected.image || "https://placehold.co/600x400?text=No+Poster" },
                        caption: cap
                    }, { quoted: msg });

                    const detailMsgId = sentDetail.key.id;

                    // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
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
                            if (!selectedDl) return;

                            client.ev.off("messages.upsert", downloadHandler);
                            clearTimeout(downloadTimeout);

                            await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                            
                            const targetFileUrl = selectedDl.direct;
                            const cleanFileName = `${(movieDetails.title || selected.title).replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || '720p'}.mp4`;

                            await reply(`🚀 *Processing Request...* \nUploading your movie as a Document. Please hold tight!`);

                            // Stylish Final Caption
                            let finalCaption = `╭───────────────────◆\n`;
                            finalCaption += `│ 🎬 *${movieDetails.title || selected.title}*\n`;
                            finalCaption += `├───────────────────◆\n`;
                            finalCaption += `│ 🌟 *Quality:* ${selectedDl.quality || '720p'}\n`;
                            finalCaption += `│ ⚖️ *Size:* ${selectedDl.size || 'N/A'}\n`;
                            finalCaption += `╰───────────────────◆\n\n`;
                            finalCaption += `> *© KAMRAN-MINI-BOT ッ*`;

                            await client.sendMessage(from, {
                                document: { url: targetFileUrl },
                                mimetype: "video/mp4",
                                fileName: cleanFileName,
                                jpegThumbnail: await getThumbnailBuffer(movieDetails.image || selected.image),
                                caption: finalCaption
                            }, { quoted: dlMsg });

                            await client.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });

                        } catch (dlErr) {
                            console.error("Download execution failed:", dlErr.message);
                            reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                        }
                    };

                    client.ev.on("messages.upsert", downloadHandler);
                    
                    downloadTimeout = setTimeout(() => {
                        client.ev.off("messages.upsert", downloadHandler);
                    }, 300000); // 5 Mins Session Timeout

                } catch (detErr) {
                    console.error("Details execution failed:", detErr.message);
                    reply(`❌ An error occurred while loading details: ${detErr.message}`);
                }
            };

            client.ev.on("messages.upsert", detailsHandler);
            
            detailsTimeout = setTimeout(() => {
                client.ev.off("messages.upsert", detailsHandler);
            }, 300000); // 5 Mins Session Timeout

        } catch (e) {
            console.error("MLFBD Downloader error:", e.message);
            await react("❌");
            return reply(`❌ *Error Processing Request:* ${e.message}`);
        }
    }
};
