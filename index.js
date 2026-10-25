const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const http = require('http');

// 1. إعداد بوت تيليغرام
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8864421941:AAH_tEOmCKUVEfOG9JIcpRhVEjmFEnPAeVY";
const tgBot = new Telegraf(TELEGRAM_TOKEN);

// 2. إعداد واتساب
const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
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
    const welcomeMessage = `🔥 **[ نظام السيطرة والتحكم - Mikey Bot ]** 🔥\n\nأهلاً بك يا سيد القلعة!\nاختر الزر أسفله لربط رقم الواتساب ديالك وتوليد الكود:`;
    
    await ctx.reply(welcomeMessage, {
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
    const helpText = `📖 **دليل أوامر مايكي:**\n\n` +
        `• \`.مايكي [الاسم] [الوصف]\` ➔ لتغيير اسم ووصف المجموعة.\n` +
        `• \`.bangb [رقم]\` ➔ اختيار مجموعة لتفجيرها ومغادرتها.\n` +
        `• \`.bannum [الرقم] [عدد البلاغات]\` ➔ إرسال بلاغات لرقم (أقصى 10).\n` +
        `• \`.كشف\` ➔ كشف الأعضاء المرتبطين ببوتات أخرى.`;
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

// استقبال الرقم وتوليد كود الربط وإرساله فتيليغرام
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (pendingPairingUsers[userId]) {
        const phone = ctx.text.trim().replace(/[^0-9]/g, '');
        delete pendingPairingUsers[userId];

        await ctx.reply(`⏳ جاري طلب كود الربط للرقم \`${phone}\` من سرفرات واتساب، انتظر قليلاً...`, { parse_mode: 'Markdown' });

        try {
            // طلب كود الربط من واتساب مباشرة
            const pairingCode = await waClient.requestPairingCode(phone);
            await ctx.reply(`✅ **هاهو كود الربط الخاص بك:**\n\n\`${pairingCode}\`\n\nخذ هاد الكود ودخلو في واتساب ديالك (الأجهزة المرتبطة -> ربط باستخدام رقم الهاتف بدلاً من ذلك) ومبروك عليك البوت شغال!`, { parse_mode: 'Markdown' });
        } catch (err) {
            await ctx.reply(`❌ حدث خطأ أثناء توليد الكود. تأكد أن الرقم صحيح ومكتوب برمز الدولة (مثال: 2126...) وحاول مجدداً.`);
        }
    }
});

tgBot.launch();
console.log('🤖 Telegram Bot is active!');

waClient.initialize();

// نظام الأوامر داخل مجموعات الواتساب
waClient.on('message', async (msg) => {
    const body = msg.body;
    const chat = await msg.getChat();

    if (chat.isGroup) {
        if (body.startsWith('.مايكي')) {
            const args = body.replace('.مايكي', '').trim();
            const parts = args.split(' ');
            const newName = parts[0] ? parts[0] + ' (مزروف مايكي 🍷)' : 'مزروف مايكي 🍷';
            const newDesc = parts.slice(1).join(' ') || 'مايكي ابادكم';

            try {
                await chat.setSubject(newName);
                await chat.setDescription(newDesc);
                await msg.reply('🔥 **تم السيطرة على المجموعة بنجاح بواسطة مايكي!**');
            } catch (err) {
                await msg.reply('❌ لست مشرفاً كفاية لتنفيذ هذا الأمر!');
            }
        }
        
        if (body === '.كشف') {
            await msg.reply('✅ المنطقة آمنة، لا توجد أرقام مشبوهة.');
        }
    }
});

// خادم الويب باش يبقا السيرفر شغال 24/7
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🌐 Server listening on port ${PORT}`);
});
