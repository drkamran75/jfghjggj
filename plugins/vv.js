const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "vv",
    aliases: [],
    category: "owner",
    desc: "Download view once message",

    async execute({ conn, m, from, reply }) {
        try {
            const quoted =
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                m.message?.imageMessage?.contextInfo?.quotedMessage ||
                m.message?.videoMessage?.contextInfo?.quotedMessage;

            if (!quoted)
                return reply("⚠️ Reply to a view once message");

            let msg = quoted;

            if (msg.viewOnceMessageV2)
                msg = msg.viewOnceMessageV2.message;
            else if (msg.viewOnceMessage)
                msg = msg.viewOnceMessage.message;
            else if (msg.viewOnceMessageV2Extension)
                msg = msg.viewOnceMessageV2Extension.message;

            const type = Object.keys(msg)[0];
            const media = msg[type];

            const stream = await downloadContentFromMessage(
                media,
                type.replace('Message', '')
            );

            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await conn.sendMessage(from, {
                [type.replace('Message','')]: buffer
            }, { quoted: m });

        } catch (e) {
            console.log(e);
            reply("Error processing view once message.");
        }
    }
};
