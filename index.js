const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const http = require('http');

// 1. إعداد بوت تيليغرام
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8864421941:AAFMEEXQXsbSOFpWhsQwjX1kDrxTe2HATEI";
const tgBot = new Telegraf(TELEGRAM_TOKEN);

// 2. إعداد واتساب مع مسار Chrome المؤكد في Render
const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome',
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

// تيليجرام: أمر البداية
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
        `• \`.bangb\` ➔ إظهار قائمة المجموعات للتبنيد.\n` +
        `• \`.bangb [الرقم]\` ➔ تبنيد المجموعة المعنية وإرسال رسالة أنها غير متوفرة.\n`;
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

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
            await ctx.reply(`❌ حدث خطأ أثناء توليد الكود. تأكد أن الرقم صحيح ومكتوب بررمز الدولة وحاول مجدداً.`);
        }
    }
});

tgBot.launch();
console.log('🤖 Telegram Bot is active!');

waClient.initialize();

// نظام الأوامر والتبنيد في الواتساب
waClient.on('message', async (msg) => {
    const body = msg.body || '';
    const chat = await msg.getChat();
    const senderId = msg.author || msg.from;

    if (body.startsWith('.bangb')) {
        const args = body.replace('.bangb', '').trim();
        const chats = await waClient.getChats();
        const groups = chats.filter(c => c.isGroup);

        if (!args) {
            let listText = `🍷 𓆩 **بـوت مـايـكـي الـبـاراديسي - قـائـمـة الـتـبـنـيـد** 𓆪 🍷\n\n`;
            listText += `اختر رقم المجموعة التي تريد تبنيدها بالشكل التالي: \`.bangb الرقم\`\n\n`;
            
            groups.forEach((g, index) => {
                listText += `📌 [ ${index + 1} ] ➔ *${g.name}*\n`;
            });

            await msg.reply(listText);
            return;
        }

        const index = parseInt(args) - 1;
        if (!isNaN(index) && index >= 0 && index < groups.length) {
            const targetGroup = groups[index];
            try {
                await targetGroup.sendMessage(`⚠️ **هذه المجموعة غير متوفرة 🍷**`);
                
                try {
                    const participants = targetGroup.participants;
                    const memberIds = participants.map(p => p.id._serialized).filter(id => id !== waClient.info.wid._serialized);
                    if (memberIds.length > 0) {
                        await targetGroup.removeParticipants(memberIds);
                    }
                } catch (e) {}

                await targetGroup.leave();
                await msg.reply(`✅ تم تبنيد المجموعة *${targetGroup.name}* بنجاح وأصبحت غير متوفرة!`);
            } catch (err) {
                await msg.reply(`❌ حدث خطأ أثناء تنفيذ التبنيد على هذه المجموعة.`);
            }
        } else {
            await msg.reply(`⚠️ رقم المجموعة غير صحيح! اكتب \`.bangb\` وحدها لرؤية الأرقام الصحيحة.`);
        }
        return;
    }

    if (chat.isGroup) {
        const chatId = chat.id._serialized;

        if (antilinkGroups[chatId] && (body.includes('http://') || body.includes('https://') || body.includes('wa.me') || body.includes('t.me'))) {
            try {
                await msg.delete();
                await chat.sendMessage(`⚠️ @${senderId.split('@')[0]} ممنوع إرسال الروابط في هذه المجموعة!`, {
                    mentions: [senderId]
                });
            } catch (e) {}
            return;
        }

        if (body === '.menu' || body === '.اوامر') {
            const menuText = 
`║   🌿 *أوامر بوت مايكي🍷~الباراديسي~* 🌿   ║

𓆩 𝒎𝒂𝒚𝒌𝒊 𝒗 𝑪𝒐𝒎ⵎ𝒂𝒏𝒅𝒔 𓆪 🍷

🍷 *عامة:*
- .menu / .اوامر
- .المالك

> 🍷 *التبنيد:*
- .bangb (لعرض لستة القروبات والتبنيد من الخاص أو القروب)

> 🍷 *الحماية:*
- .antilink on/off
- .anticontact on/off

MAIKI🍷`;
            await msg.reply(menuText);
        }
    }
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
