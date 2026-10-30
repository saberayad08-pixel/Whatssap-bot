const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = 8933514774;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN ما موجودش فـ Secrets');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const MENU = `
╔═══ 🌿 MAIKI 🍷 ═══╗

𓆩 𝑴𝑨𝑰𝑲𝑰 𝑽 𝑩𝑶𝑻 𓆪

🍷 مرحباً بك في نظام MAIKI

اختار واحد من الأزرار لتحت:

╚═══ MAIKI 🍷 ═══╝
`;

const BUTTONS = Markup.inlineKeyboard([
  [
    Markup.button.callback('🍷 ربط البوت', 'connect'),
  ],
  [
    Markup.button.callback('👑 الملك', 'king'),
    Markup.button.callback('📖 المساعدة', 'help'),
  ],
  [
    Markup.button.callback('📊 حالة البوت', 'status'),
  ],
]);

bot.start(async (ctx) => {
  await ctx.reply(MENU, BUTTONS);
});

bot.action('connect', async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    '🍷 MAIKI — ربط واتساب\n\n' +
    'خاصية الربط ما زالت غير مفعلة.\n' +
    'ما ترسلش كود التحقق أو معلومات الجلسة لأي شخص.'
  );
});

bot.action('king', async (ctx) => {
  await ctx.answerCbQuery();

  const user = ctx.from;

  if (user.id !== OWNER_ID) {
    return ctx.reply('⛔ هاد المعلومات خاصة بالمالك.');
  }

  const caption =
    '╔═══ 👑 MAIKI KING ═══╗\n\n' +
    '🍷 الاسم: MAIKI\n' +
    '👑 المالك: @' + (user.username || 'بدون_معرف') + '\n' +
    '🆔 ID: ' + user.id + '\n\n' +
    '╚═══ MAIKI 🍷 ═══╝';

  const imagePath = path.join(__dirname, 'maiki.jpg');

  if (fs.existsSync(imagePath)) {
    await ctx.replyWithPhoto(
      { source: imagePath },
      { caption }
    );
  } else {
    await ctx.reply(caption + '\n\n📷 صورة مايكي ما زالت ما ترفعاتش.');
  }
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    '🍷 MAIKI — المساعدة\n\n' +
    '/start — القائمة الرئيسية\n\n' +
    '👑 الملك: معلومات المالك.\n' +
    '🍷 ربط البوت: واجهة الربط.\n' +
    '📊 حالة البوت: حالة الخدمة.'
  );
});

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    '🍷 MAIKI STATUS\n\n' +
    '✅ بوت تيليغرام خدام.\n' +
    '⚪ ربط واتساب: غير مفعّل.'
  );
});

bot.catch((err) => {
  console.error('MAIKI ERROR:', err);
});

bot.launch()
  .then(() => console.log('🍷 MAIKI Telegram Bot is running!'))
  .catch((err) => {
    console.error('تعذر تشغيل البوت:', err.message);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
