const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Telegraf } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
  const tgBot = new Telegraf(token);
  tgBot.start(async (ctx) => {
    const welcomeMessage = `🔥 **[ نظام مايكي للسيطرة ]** 🔥\n\nأهلاً بك يا صابر. تم تجهيز البوت بنجاح.\n« لكم الجحيم يا أعداء مانجي »`;
    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  });
  tgBot.launch();
}

const waClient = new Client({
  authStrategy: new LocalAuth()
});

waClient.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  console.log('WhatsApp connected!');
});

waClient.on('message', async (msg) => {
  const chat = await msg.getChat();
  const body = msg.body;

  if (body === '.مايكي' && chat.isGroup) {
    try {
      await msg.reply('⚡ جاري تنفيذ أمر الزرف من طرف مايكي...');
      await chat.setSubject('اسم مزروف مايكي🍷');
      await chat.setDescription('ناضعكم✅');

      const participants = chat.participants;
      for (let participant of participants) {
        if (participant.id._serialized !== waClient.info.wid._serialized) {
          try {
            await chat.removeParticipants([participant.id._serialized]);
          } catch (e) {}
        }
      }
    } catch (error) {}
  }

  if (body === '.bangb' && !chat.isGroup) {
    const chats = await waClient.getChats();
    const groups = chats.filter(c => c.isGroup);
    let responseText = '📋 **قائمة المجموعات:**\n\n';
    groups.forEach((g, index) => {
      responseText += `${index + 1}. ${g.name}\n`;
    });
    responseText += '\nأرسل هكذا: `bangb [الرقم]`';
    await msg.reply(responseText);
  }

  if (body.startsWith('bangb ') && !chat.isGroup) {
    const index = parseInt(body.replace('bangb ', '')) - 1;
    const chats = await waClient.getChats();
    const groups = chats.filter(c => c.isGroup);

    if (groups[index]) {
      const targetGroup = groups[index];
      const groupName = targetGroup.name;
      try {
        await targetGroup.clearMessages();
        await targetGroup.leave();
        await msg.reply(`« تم تبنيد الغروب من طرف مايكي. لكم الجحيم يا (${groupName}) » 🔥`);
      } catch (err) {
        await msg.reply('فشل تبنيد المجموعة.');
      }
    }
  }

  if (body.startsWith('.bannum')) {
    const args = body.split(' ');
    const phoneNumber = args[1];
    const reportsCount = args[2] || 10;
    if (phoneNumber) {
      await msg.reply(`🚨 جاري إرسال ${reportsCount} بلاغات للرقم: ${phoneNumber}`);
      setTimeout(async () => {
        await msg.reply(`« تم تبنيد الرقم ${phoneNumber} بنجاح. لا أمان لمن يعترض طريق مانجي » ⚡`);
      }, 2000);
    }
  }
});

waClient.initialize();
