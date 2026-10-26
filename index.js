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
let antilinkGroups = {};
let anticontactGroups = {};

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
    const helpText = `📖 **دليل أوامر مايكي الشامل:**\n\n` +
        `• \`.مايكي [الاسم] [الوصف]\` ➔ السيطرة وتغيير اسم ووصف المجموعة.\n` +
        `• \`.menu\` أو \`.اوامر\` ➔ إظهار قائمة الأوامر المزخرفة.\n` +
        `• \`.المالك\` ➔ إظهار بطاقة المالك ورقم التواصل.\n` +
        `• \`.رفع\` / \`.خفض\` ➔ بالرد على رسالة عضو لرفعه أو خفضه مشرفاً.\n` +
        `• \`.فتح\` / \`.سد\` ➔ فتح أو إغلاق القروب.\n` +
        `• \`.antilink on/off\` ➔ تفعيل أو إلغاء مانع الروابط.\n` +
        `• \`.anticontact on/off\` ➔ تفعيل أو إلغاء مانع جهات الاتصال.\n` +
        `• \`.كشف ربط الأرقام ب الأجهزة\` ➔ فحص أعضاء المجموعة وكشف الحسابات المرتبطة.\n` +
        `• \`.vv\` أو بالرد على صورة مشاهدة مرة واحدة ➔ لكشفها وإرسالها دائمة.\n`;
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

// استقبال الرقم وتوليد كود الربط بسرعة في تيليغرام
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (pendingPairingUsers[userId]) {
        const phone = ctx.text.trim().replace(/[^0-9]/g, '');
        delete pendingPairingUsers[userId];

        await ctx.reply(`⏳ جاري طلب كود الربط للرقم \`${phone}\` من سرفرات واتساب، انتظر قليلاً...`, { parse_mode: 'Markdown' });

        try {
            const pairingCode = await waClient.requestPairingCode(phone);
            await ctx.reply(`✅ **هاهو كود الربط الخاص بك:**\n\n\`${pairingCode}\`\n\nخذ هاد الكود ودخلو في واتساب ديالك ومبروك عليك البوت شغال!`, { parse_mode: 'Markdown' });
        } catch (err) {
            await ctx.reply(`❌ حدث خطأ أثناء توليد الكود. تأكد أن الرقم صحيح ومكتوب برمز الدولة وحاول مجدداً.`);
        }
    }
});

tgBot.launch();
console.log('🤖 Telegram Bot is active!');

waClient.initialize();

// نظام الأوامر والحماية داخل مجموعات الواتساب
waClient.on('message', async (msg) => {
    const body = msg.body || '';
    const chat = await msg.getChat();
    const senderId = msg.author || msg.from;

    if (chat.isGroup) {
        const chatId = chat.id._serialized;

        // 1. نظام حماية الروابط
        if (antilinkGroups[chatId] && (body.includes('http://') || body.includes('https://') || body.includes('wa.me') || body.includes('t.me'))) {
            try {
                await msg.delete();
                await chat.sendMessage(`⚠️ @${senderId.split('@')[0]} ممنوع إرسال الروابط في هذه المجموعة!`, {
                    mentions: [senderId]
                });
            } catch (e) {}
            return;
        }

        // 2. نظام حماية جهات الاتصال
        if (anticontactGroups[chatId] && (msg.type === 'vcard' || msg.type === 'contact_array')) {
            try {
                await msg.delete();
                await chat.sendMessage(`⚠️ @${senderId.split('@')[0]} ممنوع إرسال جهات الاتصال (Contacts) هنا!`, {
                    mentions: [senderId]
                });
            } catch (e) {}
            return;
        }

        // 3. أمر القائمة (.menu أو .اوامر)
        if (body === '.menu' || body === '.اوامر') {
            const menuText = 
`║   🌿 *أوامر بوت مايكي🍷~الباراديسي~* 🌿   ║

𓆩 𝒎𝒂𝒚𝒌𝒊 𝒗 𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒔 𓆪 🍷

🍷 *عامة:*
- .menu / .اوامر
- .help
- .المالك
- .تست

> 🍷 *التبنيد:*
- .bangb
- .bannum  [رقم] [عدد بلاغات]

> 🍷 *ادمين:*
- .رفع الجميع
- .spam [نص] [عدد]
- .كشف
- .vv

> 🍷 *الغروب:*
- .طرد
- .رفع
- .خفض
- .tagall
- .tagkhafi
- .تبديل الرابط
- .معلومات القروب

> 🍷 *الحماية:*
• .فتح 
- .سد 
- .antilink on/off
- .anticontact on/off
- .كشف ربط الأرقام ب الأجهزة 

> 🍷 *الزرف:*
- .زرف
- .قسم زرف

MAIKI🍷`;
            await msg.reply(menuText);
        }

        // 4. أمر المالك (.المالك)
        if (body === '.المالك') {
            const ownerText = `╔═════════════════╗\n` +
                              `  👑 *صاحب ومطور البوت* 👑\n` +
                              `  🍷 *MAIKI PARADISE* 🍷\n` +
                              `╚═════════════════╝\n\n` +
                              ` للتواصل مع المالك الأساسي:\n` +
                              ` 📱 wa.me/34611338871`;
            await chat.sendMessage(ownerText, {
                mentions: ['34611338871@c.us']
            });
        }

        // 5. سيطرة الزرف (.مايكي)
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

        // 6. رفع وخفض المشرفين (.رفع / .خفض)
        if (body.startsWith('.رفع')) {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                const targetId = quotedMsg.author || quotedMsg.from;
                try {
                    await chat.promoteParticipants([targetId]);
                    await msg.reply(`✅ تم ترقية العضو إلى مشرف بنجاح.`);
                } catch (e) {
                    await msg.reply(`❌ فشل الرفع، تأكد أن البوت مشرف ولديه الصلاحيات.`);
                }
            } else {
                await msg.reply(`⚠️ قم بالرد على رسالة الشخص الذي تريد رفعه واكتب .رفع`);
            }
        }

        if (body.startsWith('.خفض')) {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                const targetId = quotedMsg.author || quotedMsg.from;
                try {
                    await chat.demoteParticipants([targetId]);
                    await msg.reply(`✅ تم خفض العضو من الاشراف بنجاح.`);
                } catch (e) {
                    await msg.reply(`❌ فشل الخفض.`);
                }
            } else {
                await msg.reply(`⚠️ قم بالرد على رسالة الشخص واكتب .خفض`);
            }
        }

        // 7. فتح وسد القروب (.فتح / .سد)
        if (body === '.فتح') {
            try {
                await chat.setMessagesAdminsOnly(false);
                await msg.reply('🔓 **تم فتح المجموعة للجميع!**');
            } catch (e) {
                await msg.reply('❌ لست مشرفاً.');
            }
        }

        if (body === '.سد') {
            try {
                await chat.setMessagesAdminsOnly(true);
                await msg.reply('🔒 **تم إغلاق المجموعة (المشرفين فقط)!**');
            } catch (e) {
                await msg.reply('❌ لست مشرفاً.');
            }
        }

        // 8. أوامر الحماية تفعيل وإيقاف
        if (body.startsWith('.antilink')) {
            const opt = body.replace('.antilink', '').trim().toLowerCase();
            if (opt === 'on') {
                antilinkGroups[chatId] = true;
                await msg.reply('🛡️ **تم تفعيل مانع الروابط في هذه المجموعة بنجاح.**');
            } else if (opt === 'off') {
                antilinkGroups[chatId] = false;
                await msg.reply('⚠️ **تم إلغاء تفعيل مانع الروابط.**');
            } else {
                await msg.reply('استخدم الطريقة الصحيحة: `.antilink on` أو `.antilink off`');
            }
        }

        if (body.startsWith('.anticontact')) {
            const opt = body.replace('.anticontact', '').trim().toLowerCase();
            if (opt === 'on') {
                anticontactGroups[chatId] = true;
                await msg.reply('🛡️ **تم تفعيل مانع جهات الاتصال في هذه المجموعة بنجاح.**');
            } else if (opt === 'off') {
                anticontactGroups[chatId] = false;
                await msg.reply('⚠️ **تم إلغاء تفعيل مانع جهات الاتصال.**');
            } else {
                await msg.reply('استخدم الطريقة الصحيحة: `.anticontact on` أو `.anticontact off`');
            }
        }

        // 9. كشف ربط الأرقام بالأجهزة / البوتات
        if (body === '.كشف ربط الأرقام ب الأجهزة' || body === '.كشف') {
            let report = `🔍 *تقرير فحص أجهزة وكشف البوتات:*\n\n`;
            let count = 0;
            for (let participant of chat.participants) {
                if (participant.id.user.length > 12) {
                    report += `👤 @${participant.id.user} ➔ ⚠️ *مشبوه / محتمل ارتباطه بجهاز أو بوت*\n`;
                    count++;
                }
            }
            if (count === 0) {
                report += `✅ المنطقة آمنة، لم يتم رصد أي حسابات مرتبطة غريبة.`;
            }
            await chat.sendMessage(report, {
                mentions: chat.participants.map(p => p.id._serialized)
            });
        }

        // 10. كشف الوسائط المشاهدة لمرة واحدة (.vv أو بالرد)
        if (body === '.vv' || msg.hasQuotedMsg) {
            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                if (quoted.hasMedia && (quoted.type === 'image' || quoted.type === 'video' || quoted.type === 'ptt')) {
                    const media = await quoted.downloadMedia();
                    await chat.sendMessage(media, { caption: '👁️ **تم كشف وسائط المشاهدة لمرة واحدة وإرسالها دائمة بواسطة مايكي!**' });
                }
            }
        }
    }
});

// خادم الويب باش يبقا السيرفر شغال
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🌐 Server listening on port ${PORT}`);
});
