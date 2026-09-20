// Zaynix-PRIME 2 / KAMRAN-MD
// Complete Main pairing router with GitHub Newsletter Auto-Follow & React
require('dotenv').config();

// ==================== ANTI-BUG GLOBAL PROTECTIONS ====================
process.on('uncaughtException', (err) => {
    console.error('🛡️ Anti-Bug Caught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🛡️ Anti-Bug Caught Rejection:', reason);
});
// ======================================================================

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const mongoose = require('mongoose');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { sms, downloadMediaMessage } = require("./lib/msg");
const config = require('./config');

const { userConfigCache, sessionCache, messageCache } = require('./lib/cache');
const { Session, loadUserConfig, updateUserConfig } = require('./lib/userConfigService');
const { sendPairingCodeToTelegram } = require('./lib/telegram'); 
const { setupAntiDelete, handleMessageStore } = require('./lib/antidel');
const { setupAntiEdit } = require('./lib/antiedit');
const { setupWelcome } = require('./lib/welcome');

// ==================== GITHUB NEWSLETTER LOADER ====================
async function loadNewsletterJIDsFromRaw() {
    try {
        const res = await axios.get('https://raw.githubusercontent.com/KAMRAN-SMD/data/refs/heads/main/newsletter.json'); // Do not edit this part
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error('❌ Failed to load newsletter list from GitHub:', err.message || err);
        return [];
    }
}

// ==================== GITHUB ZIP PLUGINS AUTO-UPDATER ====================
const PLUGINS_ZIP_URL = "https://github.com/drkamran75/jfghjggj/archive/refs/heads/main.zip";
let pluginManager = null;

async function downloadAndExtractPlugins() {
    try {
        console.log('🔄 Fetching latest plugins from GitHub ZIP...');
        const response = await axios({
            method: 'get',
            url: PLUGINS_ZIP_URL,
            responseType: 'arraybuffer'
        });

        const zipPath = path.join(__dirname, 'plugins_temp.zip');
        await fs.writeFile(zipPath, response.data);

        const zip = new AdmZip(zipPath);
        const extractPath = path.join(__dirname, 'temp_extracted');
        
        if (fs.existsSync(extractPath)) fs.removeSync(extractPath);
        fs.mkdirSync(extractPath, { recursive: true });

        zip.extractAllTo(extractPath, true);

        const files = fs.readdirSync(extractPath);
        if (files.length > 0) {
            const rootFolder = path.join(extractPath, files[0]);
            
            const sourceLoaderPath = path.join(rootFolder, 'pluginLoader.js');
            const targetLoaderPath = path.join(__dirname, 'plugins', 'pluginLoader.js');
            if (fs.existsSync(sourceLoaderPath)) {
                fs.ensureDirSync(path.dirname(targetLoaderPath));
                fs.copySync(sourceLoaderPath, targetLoaderPath, { overwrite: true });
            }

            const sourcePluginsPath = path.join(rootFolder, 'plugins');
            if (fs.existsSync(sourcePluginsPath)) {
                const targetPluginsPath = path.join(__dirname, 'plugins');
                fs.copySync(sourcePluginsPath, targetPluginsPath, { overwrite: true });
                console.log('✅ Plugins updated and synced successfully from GitHub ZIP.');
            }
        }
        
        if (fs.existsSync(zipPath)) fs.removeSync(zipPath);
        if (fs.existsSync(extractPath)) fs.removeSync(extractPath);
    } catch (err) {
        console.warn('⚠️ Failed to auto-update plugins from GitHub ZIP:', err.message);
    } finally {
        try {
            const PluginLoader = require('./plugins/pluginLoader');
            pluginManager = new PluginLoader();
            console.log('✅ Plugin Manager initialized successfully.');
        } catch (e) {
            console.error('❌ Failed to load PluginLoader:', e.message);
        }
    }
}

downloadAndExtractPlugins();
// =========================================================================

// ==================== BACKGROUND CLEANUP INTERVAL ====================
setInterval(() => {
    try {
        console.log('[⚠️] All warnings cleared automatically (15 minute interval)');
        if (typeof messageCache !== 'undefined' && messageCache.clear) {
            messageCache.clear();
        }
        console.log(`✅ Store cleaned successfully at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
        console.error('Cleanup error:', err.message);
    }
}, 15 * 60 * 1000);
// =====================================================================

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    getContentType,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');

let useMongoDb = false;
const connectMongoDB = async () => {
    if (!config.MONGODB_URI) return;
    try {
        await mongoose.connect(config.MONGODB_URI);
        useMongoDb = true;
        console.log('✅ Connected to MongoDB for Sessions');
        setTimeout(autoRestoreAllSessions, 3000);
    } catch (error) {
        useMongoDb = false;
        console.error('❌ MongoDB Connection Error:', error.message);
    }
};

connectMongoDB();

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = config.SESSION_BASE_PATH || './session';

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

function resolveBooleanFlag(userValue, defaultValue) {
    if (userValue !== undefined && userValue !== null) {
        return userValue === true || userValue === 'true';
    }
    return defaultValue === true || defaultValue === 'true';
}

async function joinGroup(socket) {
    let retries = config.MAX_RETRIES || 3;
    const inviteLink = config.GROUP_INVITE_LINK;
    if (!inviteLink) return { status: 'failed' };
    
    const inviteCodeMatch = inviteLink.match(/chat\.whatsapp\.com\/([a-zA-Z0-9-_]+)/);
    if (!inviteCodeMatch) return { status: 'failed' };
    const inviteCode = inviteCodeMatch[1];

    while (retries > 0) {
        try {
            const response = await socket.groupAcceptInvite(inviteCode);
            if (response?.gid || typeof response === 'string') {
                console.log(`📌 Group remembered & joined successfully: ${response.gid || response}`);
                return { status: 'success', gid: response.gid || response };
            }
            throw new Error();
        } catch (error) {
            retries--;
            if (retries === 0) return { status: 'failed' };
            await delay(2000);
        }
    }
    return { status: 'failed' };
}

const linkWarnings = new Map();

async function setupStatusAndSecurityHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key) return;

        handleMessageStore(message);

        try {
            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            const userConfig = await loadUserConfig(sanitizedNumber);

            const isGroup = message.key.remoteJid.endsWith('@g.us');
            const sender = message.key.participant || message.key.remoteJid;

            const antiStatus = resolveBooleanFlag(userConfig.ANTISTATUS, config.ANTISTATUS);
            const antiMention = resolveBooleanFlag(userConfig.ANTI_MENTION, config.ANTI_MENTION);

            if ((antiStatus || antiMention) && isGroup && !message.key.fromMe) {
                const msgString = JSON.stringify(message);
                const isStatusBroadcast = message.key.remoteJid === 'status@broadcast';
                const hasStatusRef = msgString.includes('status@broadcast') || msgString.includes('Your status') || msgString.includes('mentioned this group');

                if (isStatusBroadcast || hasStatusRef) {
                    await socket.sendMessage(message.key.remoteJid, { delete: message.key });
                    await socket.sendMessage(message.key.remoteJid, {
                        text: `⚠️ *ANTI-STATUS / MENTION*\n\n👤 @${sender.split('@')[0]}, Group mein status mentions allow nahi hain!`,
                        mentions: [sender]
                    });
                    return;
                }
            }

            if (message.key.remoteJid === 'status@broadcast') {
                const autoView = resolveBooleanFlag(userConfig.AUTO_VIEW_STATUS, config.AUTO_VIEW_STATUS);
                if (autoView) {
                    await socket.readMessages([message.key]);
                }
            }

            const body = message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || '';
            const antiLink = resolveBooleanFlag(userConfig.ANTI_LINK, config.ANTI_LINK);
            
            if (antiLink && isGroup && !message.key.fromMe) {
                if (body.includes('chat.whatsapp.com/')) {
                    await socket.sendMessage(message.key.remoteJid, { delete: message.key });

                    const warnKey = `${message.key.remoteJid}_${sender}`;
                    let warnings = linkWarnings.get(warnKey) || 0;
                    warnings += 1;

                    if (warnings < 3) {
                        linkWarnings.set(warnKey, warnings);
                        await socket.sendMessage(message.key.remoteJid, {
                            text: `⚠️ *ANTI-LINK WARNING (${warnings}/3)*\n\n👤 @${sender.split('@')[0]}, Group mein WhatsApp links share karna mana hai!`,
                            mentions: [sender]
                        });
                    } else {
                        linkWarnings.delete(warnKey);
                        await socket.sendMessage(message.key.remoteJid, {
                            text: `🚨 *ANTI-LINK LIMIT REACHED*\n\n👤 @${sender.split('@')[0]} ko group link bhejne par remove kar diya gaya hai!`,
                            mentions: [sender]
                        });
                        
                        try {
                            await socket.groupParticipantsUpdate(message.key.remoteJid, [sender], 'remove');
                        } catch (err) {
                            console.error('Failed to kick user:', err.message);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Security Handler Error:', error.message);
        }
    });
}

function setupCommandHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const type = getContentType(msg.message);
        msg.message = (type === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const m = sms(socket, msg);

        const body = (type === 'conversation') ? msg.message.conversation : msg.message?.extendedTextMessage?.text || '';
        const userConfig = await loadUserConfig(sanitizedNumber);
        const prefix = userConfig.PREFIX || config.PREFIX;
        
        const bodyStr = typeof body === 'string' ? body : '';
        const command = bodyStr && bodyStr.startsWith(prefix) ? bodyStr.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const text = bodyStr?.trim() || "";
        const args = text.startsWith(prefix) ? text.slice(prefix.length).trim().split(/\s+/).slice(1) : [];
        const q = args.join(" ").trim();

        let sender = msg.key.remoteJid;
        const reply = async (teks) => { await socket.sendMessage(sender, { text: teks }); };

        if (command === 'mgfhj' || command === 'jgjk') {
            try {
                const imagePath = config.XD_IMAGE_PATH || './data/zaynix.jpg';
                const captionText = `🤖 *${config.BOT_NAME || 'KAMRAN-MINI-BOT'}* is Online!\n\n> Creator: drkamran8245\n> Type .help or .menu for commands.`;
                
                if (fs.existsSync(imagePath)) {
                    await socket.sendMessage(sender, { 
                        image: fs.readFileSync(imagePath), 
                        caption: captionText 
                    }, { quoted: msg });
                } else {
                    await reply(captionText);
                }
            } catch (err) {
                await reply(`🤖 *${config.BOT_NAME}* is active and running successfully!`);
            }
            return;
        }

        if (!command) return;

        if (pluginManager) {
            const plugin = pluginManager.getCommand(command);
            if (plugin) {
                try {
                    const context = pluginManager.createPluginContext(
                        socket, msg, args, sender, sender, sanitizedNumber, 
                        userConfig, q, text, null, m, null, reply, msg.pushName, false, false, [], {}, []
                    );
                    await plugin.execute(context);
                } catch (error) {}
                return;
            }
        }

        try {
            if (command === 'ping') await reply('Pong! Bot is active 🚀');
        } catch (error) {}
    });
}

async function restoreSession(number, sessionPath) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    try {
        const session = await Session.findOne({ number: sanitizedNumber }).lean();
        if (session && session.creds) {
            fs.ensureDirSync(sessionPath);
            fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(session.creds, null, 2));
            console.log(`✅ Session restored successfully from MongoDB for: ${sanitizedNumber}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Failed to restore session for ${sanitizedNumber}:`, error.message);
    }
    return false;
}

async function autoRestoreAllSessions() {
    try {
        const sessions = await Session.find({}).lean();
        if (sessions && sessions.length > 0) {
            console.log(`🔄 Found ${sessions.length} saved session(s) in MongoDB. Auto-reconnecting...`);
            for (const sess of sessions) {
                if (sess.number && !activeSockets.has(sess.number)) {
                    const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                    await EmpirePair(sess.number, mockRes);
                    await delay(3000);
                }
            }
        }
    } catch (err) {
        console.error('❌ Auto-restore sessions error:', err.message);
    }
}

async function EmpirePair(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    fs.ensureDirSync(sessionPath);
    await restoreSession(sanitizedNumber, sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: 'fatal' });

    try {
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari')
        });

        socketCreationTime.set(sanitizedNumber, Date.now());

        setupStatusAndSecurityHandlers(socket, sanitizedNumber);
        setupCommandHandlers(socket, sanitizedNumber);
        setupAntiDelete(socket, sanitizedNumber);
        setupAntiEdit(socket, sanitizedNumber);
        setupWelcome(socket, sanitizedNumber);

        socket.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                try {
                    await delay(3000);
                    const userJid = jidNormalizedUser(socket.user.id);
                    
                    const groupJoinResult = await joinGroup(socket);
                    if (groupJoinResult.status === 'success') {
                        console.log(`📌 Group remembered & joined successfully: ${groupJoinResult.gid}`);
                    }

                    // ==================== NEWSLETTER AUTO-FOLLOW & REACT ====================
                    try {
                        const newsletterList = await loadNewsletterJIDsFromRaw();
                        for (const jid of newsletterList) {
                            try {
                                if (typeof socket.newsletterFollow === 'function') {
                                    await socket.newsletterFollow(jid);
                                } else {
                                    await socket.query({
                                        tag: 'iq',
                                        attrs: { type: 'set', xmlns: 'w:newsletter', to: jid },
                                        content: [{ tag: 'follow', attrs: {} }]
                                    });
                                }
                                await socket.sendMessage(jid, { react: { text: '❤️', key: { id: '1' } } });
                                console.log(`✅ Followed and reacted to newsletter: ${jid}`);
                            } catch (err) {
                                console.warn(`⚠️ Failed to follow/react to ${jid}:`, err.message || err);
                            }
                        }
                        console.log('✅ Auto-followed newsletters from GitHub list on connect');
                    } catch (error) {
                        console.error('❌ Newsletter startup error:', error.message || error);
                    }
                    // =========================================================================

                    activeSockets.set(sanitizedNumber, socket);
                    console.log(`✅ Bot successfully connected for number: ${sanitizedNumber}`);
                } catch (error) {}
            }
        });

        if (!socket.authState.creds.registered) {
            let retries = config.MAX_RETRIES || 3;
            let code;
            while (retries > 0) {
                try {
                    await delay(1500);
                    code = await socket.requestPairingCode(sanitizedNumber, "KAMRANMD");
                    if (code) {
                        await sendPairingCodeToTelegram(sanitizedNumber, code);
                    }
                    break;
                } catch (error) {
                    retries--;
                    await delay(2000);
                }
            }
            if (res && !res.headersSent) {
                try { res.send({ code }); } catch (err) {}
            }
        }

        socket.ev.on('creds.update', async () => {
            await saveCreds();
            const credsPath = path.join(sessionPath, 'creds.json');
            if (fs.existsSync(credsPath)) {
                try {
                    const fileContent = await fs.readFile(credsPath, 'utf8');
                    if (fileContent && fileContent.trim() !== '') {
                        const sessionData = JSON.parse(fileContent);
                        await Session.findOneAndUpdate(
                            { number: sanitizedNumber },
                            { creds: sessionData, lastActive: new Date(), updatedAt: new Date() },
                            { upsert: true }
                        );
                    }
                } catch (error) {}
            }
        });
    } catch (error) {
        if (res && !res.headersSent) {
            try { res.status(500).send({ error: 'Internal Server Error' }); } catch {}
        }
    }
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number parameter is required' });
    if (activeSockets.has(number.replace(/[^0-9]/g, ''))) {
        return res.status(200).send({ status: 'already_connected' });
    }
    await EmpirePair(number, res);
});

router.get('/code', async (req, res) => {
    try {
        const phoneNumber = req.query.number;
        if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });
        const sanitized = phoneNumber.replace(/[^0-9]/g, '');
        
        let responded = false;
        const mockRes = {
            headersSent: false,
            send: (data) => {
                if (!responded && !res.headersSent) {
                    responded = true;
                    res.json(data);
                }
            },
            status: (code) => {
                if (!res.headersSent) res.status(code);
                return mockRes;
            }
        };

        await EmpirePair(sanitized, mockRes);
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate pairing code' });
        }
    }
});

module.exports = router;
