const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const http = require('http');

// توكن بوت تيليغرام ديالك
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8864421941:AAFMEEXQXsbSOFpWhsQwjX1kDrxTe2HATEI";
const tgBot = new Telegraf(TELEGRAM_TOKEN);

const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
        ]
    }
});

let pendingPairingUsers = {};

tgBot.start(async (ctx) => {
    await ctx.reply('🔥 **[ نظام السيطرة والتحكم - Mikey Bot ]** 🔥\n\nأهلاً بك يا سيد القلعة!\nاختر الزر أسفله لربط رقم الواتساب ديالك وتوليد الكود:', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔗 توليد كود ربط الواتساب', callback_data: 'get_pairing_code' }],
                [{ text: '📖 شرح الأوامر', callback_data: 'help_commands' }]
            ]
        }
    });
});

tgBot.action('get_pairing_code', async (ctx) => {
    await ctx.reply('📱 أرسل الآن **رقم الواتساب** الخاص بك (مع رمز الدولة، مثلاً: `2126xxxxxxxx`):', { parse_mode: 'Markdown' });
    pendingPairingUsers[ctx.from.id] = true;
    await ctx.answerCbQuery();
});

tgBot.action('help_commands', async (ctx) => {
    await ctx.reply('📖 **دليل أوامر مايكي:**\n• `.bangb` ➔ إظهار قائمة المجموعات للتبنيد.', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (pendingPairingUsers[userId]) {
        const phone = ctx.text.trim().replace(/[^0-9]/g, '');
        delete pendingPairingUsers[userId];
        await ctx.reply(`⏳ جاري طلب كود الربط للرقم \`${phone}\`...`, { parse_mode: 'Markdown' });
        try {
            const pairingCode = await waClient.requestPairingCode(phone);
            await ctx.reply(`✅ **كود الربط الخاص بك:**\n\n\`${pairingCode}\``, { parse_mode: 'Markdown' });
        } catch (err) {
            await ctx.reply(`❌ حدث خطأ أثناء توليد الكود. تأكد أن الرقم صحيح.`);
        }
    }
});

tgBot.launch();
console.log('🤖 Telegram Bot is active!');

waClient.initialize();

waClient.on('message', async (msg) => {
    const body = msg.body || '';
    if (body.startsWith('.bangb')) {
        const chats = await waClient.getChats();
        const groups = chats.filter(c => c.isGroup);
        let listText = `🍷 **قائمة التبنيد** 🍷\n\n`;
        groups.forEach((g, i) => { listText += `${i + 1} - ${g.name}\n`; });
        await msg.reply(listText);
    }
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!\n');
});

server.listen(process.env.PORT || 10000);
