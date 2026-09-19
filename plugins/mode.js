module.exports = {
    name: "mode",
    aliases: ["botmode", "setmode"],
    category: "owner",
    description: "Set bot mode (public/private)",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            // ❌ Owner only
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("⚙️");

            const userConfig = await getUserConfig();
            const option = args[0]?.toLowerCase();

            // 🔎 Get current mode safely
            const currentMode =
                userConfig.MODE ||
                process.env.MODE ||
                "public";

            // 📊 SHOW STATUS
            if (!option) {
                return reply(
`╭━━━━ *BOT MODE SETTINGS* ━━━━╮
┃
┃ 📊 *Current Mode:* ${currentMode === "public" ? "🌐 PUBLIC" : "🔒 PRIVATE"}
┃
┃ 📝 *Usage:*
┃ • .mode public
┃ • .mode private
┃
┃ ℹ️ *PUBLIC:* Everyone can
┃ use bot commands
┃
┃ ℹ️ *PRIVATE:* Only owner
┃ can use commands
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ᴅʀ-ᴍᴅ-ᴍɪɴɪ ッ`
                );
            }

            // 🌐 PUBLIC MODE
            if (["public", "all", "everyone"].includes(option)) {
                userConfig.MODE = "public";
                await updateUserConfig(userConfig);
                await react("🌐");
                return reply(
`🌐 *Bot Mode Set to PUBLIC*

All users can now use bot commands.`
                );
            }

            // 🔒 PRIVATE MODE
            if (["private", "owner", "self"].includes(option)) {
                userConfig.MODE = "private";
                await updateUserConfig(userConfig);
                await react("🔒");
                return reply(
`🔒 *Bot Mode Set to PRIVATE*

Only the bot owner can use commands now.`
                );
            }

            return reply("❌ Invalid option!\nUse: `.mode public` or `.mode private`");

        } catch (error) {
            console.error("Mode command error:", error);
            return reply("❌ Something went wrong while updating bot mode.");
        }
    }
};
