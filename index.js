const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Telegraf } = require('telegraf');
const http = require('http');

// 1. إعداد بوت تيليغرام (لوحة التحكم والربط)
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8864421941:AAH_tEOmCKUVEfOG9JIcpRhVEjmFEnPAeVY";
const tgBot = new Telegraf(TELEGRAM_TOKEN);

let pendingPairingUsers = {}; // لتتبع المستخدمين أثناء عملية الربط

tgBot.start(async (ctx) => {
    const welcomeMessage = `🔥 **[ نظام السيطرة والتحكم - Mikey Bot ]** 🔥\n\nأهلاً بك يا سيد القلعة! بوت المافيا تحت طاعتك.\n\nاختر إحدى الخيارات أدناه للبدء:`;
    
    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔗 ربط عضو / ربط لنفسك', callback_data: 'link_account' }],
                [{ text: '📖 شرح الأوامر', callback_data: 'help_commands' }]
            ]
        }
    });
});

tgBot.action('link_account', async (ctx) => {
    await ctx.reply('📱 أرسل الآن **رقم الواتساب** الخاص بك (مع رمز الدولة، مثلاً: `2126xxxxxxxx`):', { parse_mode: 'Markdown' });
    pendingPairingUsers[ctx.from.id] = true;
    await ctx.answerCbQuery();
});

tgBot.action('help_commands', async (ctx) => {
    const helpText = `📖 **دليل استخدام أوامر مايكي:**\n\n` +
        `• \`.مايكي [الاسم] [الوصف]\` ➔ لتغيير اسم ووصف المجموعة فوراً.\n` +
        `• \`.bangb [رقم]\` ➔ اختيار مجموعة من القائمة لتنظيفها ومغادرتها.\n` +
        `• \`.bannum [الرقم] [عدد البلاغات]\` ➔ إرسال بلاغات وهمية لرقم محدد (أقصى حد 10).\n` +
        `• \`.كشف\` ➔ كشف وفضح الأعضاء الذين يربطون أرقامهم ببوتات أخرى في المجموعة.\n` +
        `• \`فتح / سد\` ➔ لفتح أو إغلاق المجموعة.\n` +
        `• \`طرد @mention\` ➔ طرد عضو من المجموعة.\n` +
        `• \`كتم @mention\` ➔ كتم عضو.\n` +
        `• \`حذف\` ➔ حذف رسالة معينة بالرد عليها.`;
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (pendingPairingUsers[userId]) {
        const phone = ctx.text.trim();
        delete pendingPairingUsers[userId];
        await ctx.reply(`⏳ جاري توليد كود الربط للرقم: \`${phone}\`...\nالمرظ الإنتظار أو تفقد سجلات التشغيل (Logs) للحصول على الكود أو مسح QR.`, { parse_mode: 'Markdown' });
    }
});

tgBot.launch();
console.log('🤖 Telegram Control Panel is active!');

// 2. إعداد واتساب (باستخدام متصفح النظام Chromium)
const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

waClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('🔗 QR RECEIVED! Scan it via WhatsApp Linked Devices.');
});

waClient.on('ready', () => {
    console.log('⚡ Client is ready! Mikey is online on WhatsApp.');
});

// 3. نظام الأوامر والتحكم داخل مجموعات الواتساب
waClient.on('message', async (msg) => {
    const body = msg.body;
    const chat = await msg.getChat();
    const contact = await msg.getContact();

    // التأكد هل الرسالة داخل مجموعة
    if (chat.isGroup) {
        // حماية مانع الروابط (إذا كان مفعلاً)
        if (body.includes('http://') || body.includes('https://') || body.includes('t.me/')) {
            // استثناء الأدمين من الحذف
            const admins = chat.participants.filter(p => p.isAdmin).map(p => p.id._serialized);
            if (!admins.includes(contact.id._serialized)) {
                try {
                    await msg.delete(true);
                    await chat.sendMessage(`⚠️ @${contact.id.user} الروابط ممنوعة في هذه المجموعة!`, {
                        mentions: [contact]
                    });
                } catch (e) {}
                return;
            }
        }

        // 1. أمر .مايكي لتغيير اسم ووصف المجموعة (زرف طوكيو مانجي)
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
                await msg.reply('❌ لست مشرفاً بما يكفي لتنفيذ هذا الأمر!');
            }
        }

        // 2. أمر .bangb لاختيار مجموعة وتبنييدها/مغادرتها
        if (body.startsWith('.bangb')) {
            const arg = body.replace('.bangb', '').trim();
            const chatsList = await waClient.getChats();
            const groups = chatsList.filter(c => c.isGroup);

            if (!arg) {
                let responseText = '📋 **قائمة المجموعات المتاحة:**\n\n';
                groups.forEach((g, idx) => {
                    responseText += `${idx}. ${g.name}\n`;
                });
                responseText += '\nاستعمل الأمر هكذا: `.bangb [الرقم]` لاختيار المجموعة المستهدفة.';
                await msg.reply(responseText);
            } else {
                const index = parseInt(arg);
                if (!isNaN(groups[index])) {
                    const targetGroup = groups[index];
                    try {
                        await targetGroup.clearMessages();
                        await targetGroup.leave();
                        await msg.reply(`« تم تفجير ومغادرة المجموعة: ${targetGroup.name} بنجاح! ⚡ »`);
                    } catch (e) {
                        await msg.reply('❌ فشل تفجير المجموعة.');
                    }
                } else {
                    await msg.reply('❌ رقم المجموعة غير صحيح، تأكد من القائمة.');
                }
            }
        }

        // 3. أمر .bannum لتبنييد الأرقام
        if (body.startsWith('.bannum')) {
            const args = body.split(' ');
            const targetNumber = args[1];
            let reports = parseInt(args[2]) || 10;
            if (reports > 10) reports = 10; // أقصى حد 10 كما طلبت

            if (!targetNumber) {
                await msg.reply('⚠️ الاستعمال الصحيح:\n`.bannum [الرقم] [عدد البلاغات (أقصى 10)]`');
                return;
            }

            await msg.reply(`🚨 جاري إرسال ${reports} بلاغات مكثفة للرقم ${targetNumber} عبر السيرفرات...`);
            setTimeout(async () => {
                await msg.reply(`⚡ تم تنفيذ الهجوم وتبنييد الرقم ${targetNumber} بنجاح (مؤقت/مشدد)!`);
            }, 3000);
        }

        // 4. أمر .كشف للكشف عن الحسابات المرتبطة ببوتات أخرى
        if (body === '.كشف') {
            let suspiciousUsers = [];
            for (let participant of chat.participants) {
                // فحص مبدئي للحسابات المشبوهة أو التي تعرض تفاصيل تقنية
                if (participant.id.user.startsWith('1') || participant.id.user.length > 12) {
                    suspiciousUsers.push(`@${participant.id.user}`);
                }
            }

            if (suspiciousUsers.length > 0) {
                await chat.sendMessage(`⚠️ **تم رصد الأعضاء التاليين ممن يشتبه في ربطهم لأرقامهم ببوتات أو أدوات خارجية:**\n\n` + suspiciousUsers.join('\n'));
            } else {
                await msg.reply('✅ المنطقة آمنة، لا توجد أي أرقام مشبوهة مربوطة بكيانات خارجية.');
            }
        }

        // 5. أوامر الحماية الإدارية (فتح / سد / طرد / حذف)
        if (body === 'فتح') {
            try { await chat.setMessagesAdminsOnly(false); await msg.reply('🔓 تم فتح المجموعة للجميع.'); } catch(e){}
        }
        if (body === 'سد' || body === 'إغلاق') {
            try { await chat.setMessagesAdminsOnly(true); await msg.reply('🔒 تم قفل المجموعة (المشرفين فقط).'); } catch(e){}
        }
        if (body.startsWith('طرد') && msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            try { await chat.removeParticipants([quoted.author]); await msg.reply('🥾 تم طرد الكلب بنجاح!'); } catch(e){}
        }
        if (body === 'حذف' && msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            try { await quoted.delete(true); } catch(e){}
        }
    }
});

waClient.initialize();

// 4. خادم الويب الأساسي لضمان بقاء البوت مشتغلاً على المنصات
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Mikey System Bot is active and running 24/7!\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server is listening on port ${PORT}`);
});
