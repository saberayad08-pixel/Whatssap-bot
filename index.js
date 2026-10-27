const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const http = require('http');

const tgBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const waClients = new Map();
const waitingForNumber = new Set();

function createWaClient(tgId, phoneNumber) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `mikey-${tgId}`, dataPath: '/app/.wwebjs_auth' }),
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process']
        }
    });

    client.on('ready', () => {
        tgBot.telegram.sendMessage(tgId, '✅ تم الربط بنجاح! البوت خدام دابا في واتساب.');
    });

    client.initialize().then(async () => {
        // نطلب كود الربط بعد 3 ثواني
        setTimeout(async () => {
            try {
                const code = await client.requestPairingCode(phoneNumber);
                await tgBot.telegram.sendMessage(tgId, `🔑 كود الربط ديالك:\n\n*${code}*\n\nسير لـ واتساب > الاعدادات > الاجهزة المرتبطة > ربط جهاز > ربط برقم الهاتف وكتب هاد الكود\n\nالكود صالح لـ 60 ثانية`, { parse_mode: 'Markdown' });
            } catch (e) {
                await tgBot.telegram.sendMessage(tgId, `❌ خطأ في طلب الكود: ${e.message}\nتأكد الرقم صحيح بالصيغة الدولية مثال: 212612345678`);
            }
        }, 3000);
    });

    waClients.set(tgId, client);
    return client;
}

tgBot.start((ctx) => {
    ctx.reply('🍷 مرحبا في بوت مايكي\n\nدوس ربط باش نعطيك كود من 8 ارقام', {
        reply_markup: { inline_keyboard: [[{ text: '🔗 ربط برقم الهاتف', callback_data: 'link' }]] }
    });
});

tgBot.action('link', async (ctx) => {
    await ctx.answerCbQuery();
    waitingForNumber.add(ctx.chat.id);
    await ctx.reply('📱 صيفط ليا رقم واتساب ديالك بالصيغة الدولية:\n\nمثال للمغرب: 212612345678\nمثال للجزائر: 2135xxxxxxxx\n\nما تكتبش + ولا 00، كتب غير الرقم');
});

tgBot.on('text', async (ctx) => {
    const tgId = ctx.chat.id;
    if (!waitingForNumber.has(tgId)) return;
    
    const num = ctx.message.text.replace(/[^0-9]/g, '');
    if (num.length < 10) {
        return ctx.reply('❌ الرقم قصير، عاود كتبو صحيح مثال: 212612345678');
    }
    
    waitingForNumber.delete(tgId);
    await ctx.reply(`⏳ كنطلب كود للرقم ${num}... تسنا 10 ثواني`);
    
    if (waClients.has(tgId)) {
        try { await waClients.get(tgId).destroy(); } catch {}
    }
    createWaClient(tgId, num);
});

tgBot.launch();

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Mikey Running with Pairing Code');
}).listen(process.env.PORT || 10000, () => console.log('Server running'));
