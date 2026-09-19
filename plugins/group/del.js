module.exports = {
    name: "clear",
    alias: ["clean", "delete", "del", "dlt"],
    desc: "Delete a replied message",
    category: "group",

    async execute(conn, m, args) {
        try {
            // Group check
            if (!m.isGroup) {
                return await conn.sendMessage(m.chat, {
                    text: "❌ This command can only be used in groups!"
                });
            }

            // Creator check
            if (!m.isCreator) {
                return await conn.sendMessage(m.chat, {
                    text: "❌ Only the bot creator can use this command!"
                });
            }

            // Reply check
            if (!m.quoted) {
                return await conn.sendMessage(m.chat, {
                    text: "❌ Reply to a message that you want to delete!"
                });
            }

            // Delete message
            await conn.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                }
            });

            await conn.sendMessage(m.chat, {
                text: "✅ Message deleted successfully!"
            });

        } catch (err) {
            console.error(err);

            await conn.sendMessage(m.chat, {
                text: "❌ Failed to delete message."
            });
        }
    }
};
