const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const qrcode = require('qrcode');
const http = require('http');

const tgBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const waClients = new Map();

function createWaClient(tgId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `mikey-${tgId}`, dataPath: '/app/.wwebjs_auth' }),
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process']
        }
    });

    client.on('qr', async (qr) => {
        try {
            await tgBot.telegram.sendMessage(tgId, `QR CODE:\n${qr}\n\nCopy this and scan in WhatsApp > Linked Devices`);
        } catch (e) { console.log(e); }
    });

    client.on('ready', () => {
        tgBot.telegram.sendMessage(tgId, 'Mikey connected successfully! Bot is working now.');
    });

    client.on('message', async (msg) => {
        try {
            const body = msg.body.trim();
            const chat = await msg.getChat();
            if (body === '.menu') {
                return msg.reply(`MIKEY BOT MENU:\n\n.menu - show menu\n.kick @ - kick user\n.tagall - mention all\n.link - group link`);
            }
            if (body.startsWith('.kick')) {
                if (!chat.isGroup) return;
                const mentions = await msg.getMentions();
                for (let c of mentions) {
                    await chat.removeParticipants([c.id._serialized]);
                }
                return msg.reply('Kicked');
            }
            if (body === '.tagall') {
                if (!chat.isGroup) return;
                let text = '';
                let mentions = [];
                for (let p of chat.participants) {
                    mentions.push(`${p.id.user}@c.us`);
                    text += `@${p.id.user} `;
                }
                await chat.sendMessage(text, { mentions });
            }
        } catch (e) {
            console.log('msg error', e.message);
        }
    });

    client.initialize();
    waClients.set(tgId, client);
    return client;
}

tgBot.start((ctx) => {
    ctx.reply('Welcome to Mikey Bot. Click link to connect.', {
        reply_markup: { inline_keyboard: [[{ text: 'Link Number', callback_data: 'link' }]] }
    });
});

tgBot.action('link', async (ctx) => {
    const tgId = ctx.chat.id;
    await ctx.answerCbQuery();
    await ctx.reply('Generating QR... wait 20 seconds');
    if (waClients.has(tgId)) {
        try { await waClients.get(tgId).destroy(); } catch {}
    }
    createWaClient(tgId);
});

tgBot.launch();

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Mikey Running');
}).listen(process.env.PORT || 10000, () => console.log('Server running'));
