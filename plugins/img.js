const axios = require("axios");
const FormData = require("form-data");

const AgungDevX = {
  base: "https://text2video.aritek.app",
  cipher: "hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW",
  shift: 3,

  decrypt() {
    return [...this.cipher].map(c =>
      /[a-z]/.test(c)
        ? String.fromCharCode((c.charCodeAt(0) - 97 - this.shift + 26) % 26 + 97)
        : /[A-Z]/.test(c)
        ? String.fromCharCode((c.charCodeAt(0) - 65 - this.shift + 26) % 26 + 65)
        : c
    ).join('');
  },

  async img(prompt) {
    const token = this.decrypt();
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("token", token);

    const { data } = await axios.post(
      `${this.base}/text2img`,
      form,
      { headers: { authorization: token, ...form.getHeaders() } }
    );

    if (!data.url) throw "Image generate failed";
    return data.url;
  }
};

module.exports = {
  name: "img",
  aliases: ["t2img", "aiimg"],
  category: "ai",
  description: "Text to AI Image",

  async execute({ m, reply, conn, text }) {
    if (!text) return reply("Example: .txt2img anime girl in forest");

    try {
      const url = await AgungDevX.img(text);

      await conn.sendMessage(m.chat, {
        image: { url },
        caption: `🎨 *AI Image*\n\nPrompt: ${text}`
      }, { quoted: m });

    } catch (e) {
      reply("❌ Error generating image");
    }
  }
};
