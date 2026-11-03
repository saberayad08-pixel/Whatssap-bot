const { Telegraf, Markup } = require('telegraf');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const app = express();
app.get('/', (req,res)=> res.send('MAIKI BOT خدام 24/24 🍷'));
app.listen(3000, ()=> console.log('سيرفر خدام'));

const BOT_TOKEN = "8864421941:AAHrX8rD6d6RULSE-NJ7mFl5E8ZDdyUMZj4";
const bot = new Telegraf(BOT_TOKEN);
if(!fs.existsSync('./allowed.json')) fs.writeFileSync('./allowed.json','[]');
let allowed = JSON.parse(fs.readFileSync('./allowed.json'));
let zrefData = { name: "مايكي مر من هنا 🍷", desc: "MAIKI 🍷" };
let myGroups = []; let antiLink = {}; let antiContact = {};
const saveAllowed = ()=> fs.writeFileSync('./allowed.json', JSON.stringify(allowed));
const isAllowed = (jid)=> allowed.length===0 || allowed.includes(jid.split('@')[0]);

let waSock = null;
async function startWA(){
  const { state, saveCreds } = await useMultiFileAuthState('./sessions/maiki');
  waSock = makeWASocket({ auth: state, browser: ["MAIKI","Chrome","1.0"] });
  waSock.ev.on('creds.update', saveCreds);
  waSock.ev.on('messages.upsert', async ({messages})=>{
    let m=messages[0]; if(!m.message || m.key.fromMe) return;
    let from=m.key.remoteJid; let isGroup=from.endsWith('@g.us');
    let sender=isGroup?m.key.participant:from;
    if(!isAllowed(sender)) return;
    let text=m.message.conversation||m.message.extendedTextMessage?.text||"";
    let quoted=m.message.extendedTextMessage?.contextInfo?.participant;
    if(!text.startsWith('.')) return;

    if(text==='.menu'||text==='.اوامر'){
      await waSock.sendMessage(from,{text:`║   🌿 *~أوامر بوت مايكي🍷~* 🌿   ║

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
• .فتح 
• .سد 
• .مانع الروابط  on/off
• .مانع جهات الإتصال on/off 
• .كشف ربط الأرقام ب الأجهزة 

> 🍷 *الزرف:*
• .زرف
• .قسم زرف

> MAIKI🍷`});
    }
    if(text==='.help'){ await waSock.sendMessage(from,{text:`🍷 شرح: .المالك يعطي الملك، .تست فيديو ملاحظة، .bangb ليستة غروبات، .طرد رد على شخص، .رفع/خفض ادمين، .منشن جماعي، .فتح/سد، .زرف يبدل الاسم ويطرد`}); }
    if(text==='.المالك'||text==='.الملك'){ await waSock.sendMessage(from,{text:`👑 *الملك مايكي* 👑\nMAIKI 🍷`}); }
    if(text==='.تست'){ await waSock.sendMessage(from,{text:`*𝕸𝕬𝕴𝕶𝕴 𝕭𝕺𝕿 🍷*\n"𝑳𝒆𝒈𝒆𝒏𝒅𝒔 𝒏𝒆𝒗𝒆𝒓 𝒅𝒊𝒆 🍷"\n(حط maiki.mp4 فالملفات باش يولي فيديو)`}); }
    if(text==='.bangb'){ let g=await waSock.groupFetchAllParticipating(); myGroups=Object.values(g); let msg=`📋 غروباتي:\n`; myGroups.forEach((x,i)=>msg+=`${i+1} - ${x.subject}\n`); msg+=`\nدير .bangb رقم`; await waSock.sendMessage(from,{text:msg}); }
    if(text.startsWith('.bangb ')){ let i=parseInt(text.split(' ')[1])-1; if(myGroups[i]){ await waSock.groupLeave(myGroups[i].id); await waSock.sendMessage(from,{text:`✅ خرجت من ${myGroups[i].subject}`}); } }
    if(text==='.رفع الجميع'&&isGroup){ let meta=await waSock.groupMetadata(from); for(let p of meta.participants){ if(!p.admin) try{await waSock.groupParticipantsUpdate(from,[p.id],'promote')}catch(e){} } await waSock.sendMessage(from,{text:`✅ تم رفع الجميع`}); }
    if(text==='.طرد'&&quoted&&isGroup){ await waSock.groupParticipantsUpdate(from,[quoted],'remove'); await waSock.sendMessage(from,{text:`✅ تم الطرد`}); }
    if(text==='.رفع'&&quoted&&isGroup){ await waSock.groupParticipantsUpdate(from,[quoted],'promote'); await waSock.sendMessage(from,{text:`✅ تم الرفع`}); }
    if(text==='.خفض'&&quoted&&isGroup){ await waSock.groupParticipantsUpdate(from,[quoted],'demote'); await waSock.sendMessage(from,{text:`✅ تم الخفض`}); }
    if(text==='.منشن جماعي'&&isGroup){ let meta=await waSock.groupMetadata(from); let men=meta.participants.map(p=>p.id); await waSock.sendMessage(from,{text:`@all`, mentions:men}); }
    if(text==='.تبديل الرابط'&&isGroup){ await waSock.groupRevokeInvite(from); await waSock.sendMessage(from,{text:`✅ تم تبديل الرابط`}); }
    if(text==='.فتح'&&isGroup){ await waSock.groupSettingUpdate(from,'not_announcement'); await waSock.sendMessage(from,{text:`✅ تفتح`}); }
    if(text==='.سد'&&isGroup){ await waSock.groupSettingUpdate(from,'announcement'); await waSock.sendMessage(from,{text:`✅ تسد`}); }
    if(text==='.زرف'&&isGroup){ await waSock.sendMessage(from,{text:`*مايكي مر من هنا 🍷*`}); await waSock.groupUpdateSubject(from,zrefData.name); }
    if(text==='.قسم زرف'){ await waSock.sendMessage(from,{text:`1- .زرف اسم مزروف الاسم\n2- .زرف وصف الوصف\n3- سير لغروب ودير .زرف`}); }
  });
  waSock.ev.on('connection.update', u=>{ if(u.connection==='close') startWA(); });
}
startWA();

bot.start(ctx=>ctx.reply('🍷 MAIKI BOT 🍷', Markup.keyboard([['🔗 ربط لرقمي أنا'],['👤 ربط لشي عضو آخر'],['📋 قائمة المربوطين'],['🚫 طرد عضو']]).resize()));
bot.hears('🔗 ربط لرقمي أنا', ctx=>ctx.reply('صيفط رقمك: 2126...'));
bot.hears('👤 ربط لشي عضو آخر', ctx=>ctx.reply('صيفط رقم العضو: 2126...'));
bot.hears('📋 قائمة المربوطين', ctx=>ctx.reply(`المربوطين:\n${allowed.join('\n')||'حتى واحد'}`));
bot.on('text', async ctx=>{
  let t=ctx.message.text; if(t.includes('ربط')||t.includes('قائمة')||t.startsWith('/')) return;
  let num=t.replace(/[^0-9]/g,''); if(num.length<10) return;
  try{
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${num}`);
    const sock=makeWASocket({auth:state,browser:["MAIKI","Chrome","1.0"]});
    sock.ev.on('creds.update', saveCreds);
    await new Promise(r=>setTimeout(r,2000));
    let code=await sock.requestPairingCode(num);
    if(!allowed.includes(num)){ allowed.push(num); saveAllowed(); }
    ctx.reply(`✅ كود ${num}:\n\n*${code}*`,{parse_mode:'Markdown'});
    setTimeout(()=>{try{sock.end()}catch(e){}},8000);
  }catch(e){ ctx.reply(`❌ ${e.message}`); }
});
bot.launch();
console.log('🍷 الكل خدام 🍷');
