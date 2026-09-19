module.exports = {
    name: "botname",
    aliases: ["setbotname"],
    category: "owner",
    description: "Change bot display name",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) return reply("❌ Only owner can use this!");

            await react("✏️");

            const newName = args.join(" ");
            if (!newName) {
                return reply("📝 Usage:\n.botname Your Bot Name");
            }

            const userConfig = await getUserConfig();
            userConfig.BOT_NAME = newName;

            await updateUserConfig(userConfig);

            await react("✅");
            return reply(`✅ *Bot name updated successfully!*\n\nNew Name: *${newName}*`);

        } catch (err) {
            console.error("Botname error:", err);
            return reply(`❌ Error: ${err.message}`);
        }
    }
};
