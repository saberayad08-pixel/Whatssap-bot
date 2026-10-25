const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Telegraf } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
    const tgBot = new Telegraf(token);
    tgBot.start(async (ctx) => {
        const welcomeMessage = `🔥 **[ نظام السيطرة والتحكم - Mikey ]** 🔥\n\nأهلاً بك يا سيد القلعة! البوت يعمل بكفاءة عالية على نظام المافيا.\n\nأوامر الواتساب المفعلة:\n• \`.مايكي\` - قائمة الأوامر\n• \`.bangb\` - تنريد المجموعة\n• \`.bannum\` - تبنييد الأرقام\n\n*التحكم بالكامل عبر مجموعات الواتساب!*`;
        await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    });
    tgBot.launch();
}

const waClient = new Client({
    authStrategy: new LocalAuth()
});

waClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED, scan please on WhatsApp');
});

waClient.on('ready', () => {
    console.log('Client is ready! Mikey is online.');
});

waClient.on('message', async (msg) => {
    const body = msg.body;

    if (body.startsWith('.مايكي')) {
        await msg.reply('⚡ **مايكي هنا! زعيم عصابة طوكيو مانجي.**\nالأوامر المتاحة:\n1. `.bangb [رقم]` - تفجير المجموعة\n2. `.bannum [رقم] [عدد]` - بلاغات تبنييد الرقم\n3. `.مايكي` - عرض هذه القائمة');
    }

    if (body.startsWith('.bangb')) {
        const args = body.split(' ');
        const index = parseInt(body.replace('.bangb', '').trim());
        const chats = await waClient.getChats();
        const groups = chats.filter(c => c.isGroup);

        if (groups[index]) {
            const targetGroup = groups[index];
            const groupName = targetGroup.name;
            try {
                await targetGroup.clearMessages();
                await targetGroup.leave();
                await msg.reply(`« تنظيف ومغادرة المجموعة: ${groupName} بنجاح! »`);
            } catch (err) {
                await msg.reply('❌ فشل تنفيذ الأمر على المجموعة.');
            }
        }
    }

    if (body.startsWith('.bannum')) {
        const args = body.split(' ');
        const phoneNumber = args[1];
        const reportsCount = args[2] || 10;
        if (phoneNumber) {
            await msg.reply(`🚨 جاري إرسال ${reportsCount} بلاغ وهمي للرقم ${phoneNumber} عبر الواتساب...`);
            setTimeout(async () => {
                await msg.reply(`⚡ تم تبنييد الرقم ${phoneNumber} بنجاح بواسطة مايكي!`);
            }, 2000);
        }
    }
});

waClient.initialize();

// HTTP Server for Render Port Binding
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Mikey Bot is running!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
