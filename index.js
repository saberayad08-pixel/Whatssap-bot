const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const qrcode = require('qrcode');
const http = require('http');

// التوكن ديال تيليغرام
const tgBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const waClients = new Map();
const qrCache = new Map();

function createWaClient(tgId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `mikey-${tgId}`, dataPath: '/app/.wwebjs_auth' }),
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
        }
    });

    client.on('qr', async (qr) => {
        try {
            const img = await qrcode.toDataURL(qr);
            const base64 = img.split(',')[1];
            // نحفظ QR باش نصيفطوه
            qrCache.set(tgId, qr);
            await tgBot.telegram.sendMessage(tgId, `QR ديالك، سكانيه فـ واتساب > الأجهزة المرتبطة:\n\`${qr}\``, { parse_mode: 'Markdown' });
        } catch (e) {
            console.log(e);
        }
    });

    client.on('ready', () => {
        tgBot.telegram.sendMessage(tgId, '✅ تم ربط مايكي بنجاح 🍷 البوت خدام دابا!');
    });

    client.on('message', async (msg) => {
        try {
            const body = msg.body.trim();
            const chat = await msg.getChat();
            
            if (body === '.menu' || body === '.الاوامر') {
                return msg.reply(`🍷 *بوت مايكي* 🍷
                
.menu - قائمة الأوامر
.زرف @ - طرد عضو
.طرد @ - طرد
.ت - تثبيت
.بان - بان للكل
.لينك - رابط المجموعة
.الكل - منشن الكل
`);
            }
            if (body.startsWith('.زرف') || body.startsWith('.طرد')) {
                if (!chat.isGroup) return msg.reply('خاصك تكون فـ مجموعة');
                const mentions = await msg.getMentions();
                for (let contact of mentions) {
                    await chat.removeParticipants([contact.id._serialized]);
                }
                return msg.reply('تم الزرف 🗑️');
            }
            if (body === '.الكل' || body === '.tagall') {
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

// بوت تيليغرام
tgBot.start((ctx) => {
    ctx.reply('🍷 مرحبا فـ بوت مايكي 🍷\nدوس ربط باش تربط رقمك', {
        reply_markup: {
            inline_keyboard: [[{ text: '🔗 ربط رقمي', callback_data: 'link' }]]
        }
    });
});

tgBot.action('link', async (ctx) => {
    const tgId = ctx.chat.id;
    await ctx.answerCbQuery();
    await ctx.reply('⏳ كنوجد
