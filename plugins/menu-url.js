module.exports = {
  name: "botimage",
  aliases: ["setbotdp", "menudpp"],
  category: "owner",
  description: "Set menu image",

  async execute(context) {
    const { m, reply, isOwner, updateUserConfig } = context;

    if (!isOwner) return reply("❌ Only owner!");

    try {
      // 🔥 universal quoted getter
      const q = m.quoted ? m.quoted : m;

      // 🔥 image detection without mtype
      const isImage =
        q?.message?.imageMessage ||
        q?.imageMessage;

      if (!isImage) {
        return reply("📌 Image par reply karke .botimage use karo");
      }

      // download image
      const buffer = await q.download();
      if (!buffer) return reply("❌ Image download failed");

      const base64 = buffer.toString("base64");

      await updateUserConfig({ BOT_IMAGE: base64 });

      return reply("✅ Bot menu image updated successfully!");
    } catch (e) {
      console.log(e);
      return reply("❌ Failed to set bot image");
    }
  }
};
