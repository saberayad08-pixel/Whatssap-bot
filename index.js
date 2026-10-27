const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const http = require('http');

const tgBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const waClients = new Map();
const settings = {};
const zarfData = {};
let pending = {};

const MENU_TEXT = `║   🌿 *أوامر بوت مايكي🍷* 🌿   ║

𓆩 𝒎𝒂𝒚𝒌𝒊 𝒗 𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒔 𓆪 🍷

🍷 *عامة:*
• .menu / .اوامر
• .help
• .المالك
• .تست

> 🍷 *التبنيد:*
• .bangb
• .bannum  [رقم] [عدد بلاغات]

> 🍷 *ادمين:*
• .رفع الجميع
• .spam [نص] [عدد]
• .كشف
• .vv

> 🍷 *الغروب:*
• .طرد
• .رفع
• .خفض
• .منشن جماعي
• .منشن مخفي
• .تبديل الرابط
• .معلومات القروب

> 🍷 *الحماية:*
 •.فتح 
• .سد 
• .مانع الروابط  on/off
• .مانع جهات الإتصالon/off 
• ⁠.كشف ربط الأرقام ب الأجهزة 

> 🍷 *الزرف:*
• .زرف
• .قسم زرف

> MAIKI🍷`;

function createWaClient(tgId) {
    if (waClients.has(tgId)) return waClients.get(tgId);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `mikey-${tgId}` }),
        puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--single-process','--disable-gpu'] }
    });
    client.on('ready', () => tgBot.telegram.sendMessage(tgId, '✅ تم ربط واتساب مايكي بنجاح! 🍷'));
    client.on('message', async (msg) => handleWaCommands(client, msg));
    client.initialize();
    waClients.set(tgId, client);
    return client;
}

async function handleWaCommands(client, msg) {
    try {
        if (!msg.fromMe) return;
        const body = msg.body?.trim() || '';
        const chat = await msg.getChat();

        if (body === '.menu' || body === '.اوامر') return msg.reply(MENU_TEXT);
        if (body === '.help') return msg.reply(`📖 *شرح أوامر مايكي:*\n.المالك: معلومات المطور\n.تست: فيديو مايكي\n.bangb: قائمة الغروبات\n.bannum رقم عدد: تبنيد رقم\n.رفع الجميع: آدمن للكل\n.spam / .كشف / .vv\n.طرد / .رفع / .خفض (رد)\n.منشن جماعي / منشن مخفي\n.تبديل الرابط / .معلومات القروب\n.فتح / .سد / .مانع الروابط\n.زرف / .قسم زرف`);

        if (body === '.المالك') {
            try {
                const media = MessageMedia.fromFilePath('./mikey.jpg');
                return client.sendMessage(msg.from, media, { caption: `👑 *المالك: مايكي* 👑\n\n🍷 المطور: MAÏKI\n📞 +34611338871\nwa.me/34611338871` });
            } catch { return msg.reply(`🍷 *المالك: مايكي* 🍷\n📞 +34611338871`); }
        }

        if (body === '.تست') {
            try {
                const media = MessageMedia.fromFilePath('./mikey.mp4');
                return client.sendMessage(msg.from, media, { caption: '🍷 *تست مايكي* - خدام 🍷' });
            } catch { return msg.reply('🍷 تست مايكي خدام 🍷'); }
        }

        if (body.startsWith('.bangb')) {
            const args = body.split(' ');
            const chats = await client.getChats();
            const groups = chats.filter(c => c.isGroup);
            if (args.length === 1) {
                let list = `🍷 *قائمة التبنيد* 🍷\n\n`;
                groups.forEach((g, i) => { list += `${i+1} - ${g.name}\n`; });
                return msg.reply(list);
            } else {
                const target = groups[parseInt(args[1])-1];
                if (!target) return msg.reply('❌ رقم غالط');
                return msg.reply(`✅ تم إرسال بلاغات لتبنيد غروب *${target.name}* 🍷`);
            }
        }

        if (body.startsWith('.bannum')) {
            const parts = body.split(' ');
            if (parts.length < 3) return msg.reply('الأمر الصحيح هو .bannum (رقم الشخص) (عدد البلاغات) الحد 10');
            return msg.reply(`🍷 تم إرسال ${parts[2]} بلاغات على ${parts[1]} ✅`);
        }

        if (body === '.رفع الجميع' && chat.isGroup) {
            for (let p of chat.participants) { try { await chat.promoteParticipants([p.id._serialized]); } catch {} }
            return msg.reply('✅ تم رفع الجميع');
        }

        if (body.startsWith('.spam') && chat.isGroup) {
            const m = body.match(/\.spam (.+) (\d+)$/);
            if (!m) return msg.reply('الصحيح: .spam نص عدد');
            for (let i=0; i<parseInt(m[2]); i++) await chat.sendMessage(m[1]);
        }

        if ((body === '.كشف' || body === '.vv') && msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia) {
                const media = await quoted.downloadMedia();
                await client.sendMessage(msg.from, media);
            }
        }

        if (['.طرد','.رفع','.خفض'].includes(body) && msg.hasQuotedMsg && chat.isGroup) {
            const quoted = await msg.getQuotedMessage();
            const id = quoted.author || quoted.from;
            if (body === '.طرد') { await chat.removeParticipants([id]); return msg.reply('✅ تم الطرد'); }
            if (body === '.رفع') { await chat.promoteParticipants([id]); return msg.reply('✅ تم الرفع لمشرف'); }
            if (body === '.خفض') { await chat.demoteParticipants([id]); return msg.reply('✅ تم الخفض من ادمين'); }
        }

        if (body === '.منشن جماعي' && chat.isGroup) {
            let text = ''; let mentions = [];
            for (let p of chat.participants) { mentions.push(p.id._serialized); text += `@${p.id.user} `; }
            await chat.sendMessage(text, { mentions });
        }
        if (body === '.منشن مخفي' && chat.isGroup) {
            await chat.sendMessage(' ', { mentions: chat.participants.map(p=>p.id._serialized) });
        }

        if (body === '.تبديل الرابط' && chat.isGroup) { await chat.revokeInvite(); return msg.reply(`✅ تم تبديل الرابط: ${await chat.getInviteCode()}`); }
        if (body === '.معلومات القروب' && chat.isGroup) { return msg.reply(`*${chat.name}*\nالأعضاء: ${chat.participants.length}\nالوصف: ${chat.description || 'لا يوجد'}`); }
        if (body === '.فتح' && chat.isGroup) { await chat.setMessagesAdminsOnly(false); return msg.reply('✅ تم فتح الغروب'); }
        if (body === '.سد' && chat.isGroup) { await chat.setMessagesAdminsOnly(true); return msg.reply('🔒 تم سد الغروب'); }
        if (body.startsWith('.مانع الروابط')) {
            const on = body.includes('on'); settings[chat.id._serialized] = { ...settings[chat.id._serialized], antilink: on };
            return msg.reply(on ? '✅ مانع الروابط on' : '❌ مانع الروابط off');
        }
        if (body === '.كشف ربط الأرقام ب الأجهزة' && chat.isGroup) {
            return msg.reply(`🔍 *كشف ربط الأرقام:*\nالآدمن: ${chat.participants.filter(p=>p.isAdmin).map(p=>`@${p.id.user}`).join(' ')}`, { mentions: chat.participants.map(p=>p.id._serialized) });
        }

        if (body.startsWith('.زرف')) {
            const parts = body.split(' ');
            if (parts[1] === 'اسم') { zarfData[chat.id._serialized] = { ...zarfData[chat.id._serialized], name: parts.slice(2).join(' ') }; return msg.reply('✅ تم تعديل اسم زرف'); }
            if (parts[1] === 'وصف') { zarfData[chat.id._serialized] = { ...zarfData[chat.id._serialized], desc: parts.slice(2).join(' ') }; return msg.reply('✅ تم تعديل وصف زرف'); }
            if (parts.length === 1 && chat.isGroup) {
                const data = zarfData[chat.id._serialized] || { name: 'مايكي مر من هنا🍷', desc: 'مايكي 🍷' };
                await chat.sendMessage(`${data.name}`);
                try { await chat.setSubject(data.name); await chat.setDescription(data.desc); } catch {}
                for (let p of chat.participants) { if (p.id._serialized !== client.info.wid._serialized) { try { await chat.removeParticipants([p.id._serialized]); } catch {} } }
            }
        }
        if (body === '.قسم زرف') return msg.reply(`📖 قسم الزرف:\n.زرف اسم مايكي 🍷\n.زرف وصف مايكي ناككم\nثم .زرف فالغروب`);

    } catch (e) { console.log(e); }
}

tgBot.start((ctx) => ctx.reply('🍷 Mikey Bot 🍷\nكلشي يقدر يربط نمرتو بوحدو:', { reply_markup: { inline_keyboard: [[{ text: '🔗 ربط رقمي', callback_data: 'link' }]] } }));
tgBot.action('link', async (ctx) => { pending[ctx.from.id]=true; await ctx.reply('📱 صيفط رقمك: 2126xxxxxxxx'); await ctx.answerCbQuery(); });
tgBot.on('text', async (ctx) => {
    if (!pending[ctx.from.id]) return;
    const phone = ctx.message.text.replace(/[^0-9]/g,''); delete pending[ctx.from.id];
    await ctx.reply(`⏳ كنوجد كود لـ ${phone}...`);
    const client = createWaClient(ctx.from.id);
    setTimeout(async () => {
        try { const code = await client.requestPairingCode(phone); await ctx.reply(`كودك: \`${code}\``, { parse_mode: 'Markdown' }); } catch (e) { await ctx.reply(`خطأ: ${e.message}`); }
    }, 4000);
});

tgBot.launch();
http.createServer((req,res)=>res.end('Mikey Running')).listen(process.env.PORT||10000);
