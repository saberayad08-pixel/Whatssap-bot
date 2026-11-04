const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const pino = require("pino");

const tgBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
let waSock = null;
let allowed = [];
let myGroups = [];
let zrefData = { name: "مايكي مر من هنا 🍷", desc: "MAIKI 🍷" };

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState("./sessions/main");
  waSock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["MAIKI", "Chrome", "1.0"],
    printQRInTerminal: false
  });
  waSock.ev.on("creds.update", saveCreds);
  waSock.ev.on("connection.update", (u) => {
    if (u.connection === "close") startWA();
    if (u.connection === "open") console.log("✅ واتساب تربط 🍷");
  });

  waSock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || !m.key.fromMe) return;
    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
    const reply = (t) => waSock.sendMessage(from, { text: t });

    if (text === ".menu" || text === ".اوامر" || text === ".help") return reply(`🍷 *أوامر مايكي* 🍷\n\n.المالك\n.تست\n.bangb\n.طرد - رد على شخص\n.رفع - رد على شخص\n.خفض - رد على شخص\n.منشن جماعي\n.فتح / .سد\n.زرف\n.قسم زرف`);
    if (text === ".المالك") return reply(`👑 *الملك مايكي* 👑\nMAIKI 🍷`);
    if (text === ".تست") return reply(`*MAIKI BOT 🍷*\n"Legends never die 🍷"`);
    if (text === ".bangb") {
      let g = await waSock.groupFetchAllParticipating();
      myGroups = Object.values(g);
      let msg = `📋 غروباتي:\n`;
      myGroups.forEach((x, i) => msg += `${i+1} - ${x.subject}\n`);
      msg += `\nدير .bangb رقم باش تخرج`;
      return reply(msg);
    }
    if (text.startsWith(".bangb ")) {
      let i = parseInt(text.split(" ")[1]) - 1;
      if (myGroups[i]) { await waSock.groupLeave(myGroups[i].id); return reply(`✅ خرجت من ${myGroups[i].subject}`); }
    }
    if (text === ".طرد" && quoted && isGroup) { await waSock.groupParticipantsUpdate(from, [quoted], "remove"); return reply(`✅ تم الطرد`); }
    if (text === ".رفع" && quoted && isGroup) { await waSock.groupParticipantsUpdate(from, [quoted], "promote"); return reply(`✅ تم الرفع`); }
    if (text === ".خفض" && quoted && isGroup) { await waSock.groupParticipantsUpdate(from, [quoted], "demote"); return reply(`✅ تم الخفض`); }
    if (text === ".منشن جماعي" && isGroup) {
      let meta = await waSock.groupMetadata(from);
      let men = meta.participants.map(p => p.id);
      return waSock.sendMessage(from, { text: `@all`, mentions: men });
    }
    if (text === ".فتح" && isGroup) { await waSock.groupSettingUpdate(from, "not_announcement"); return reply(`✅ تفتح`); }
    if (text === ".سد" && isGroup) { await waSock.groupSettingUpdate(from, "announcement"); return reply(`✅ تسد`); }
    if (text.startsWith(".زرف اسم")) { zrefData.name = text.replace(".زرف اسم", "").trim(); return reply(`✅ تم تعديل اسم زرف`); }
    if (text.startsWith(".زرف وصف")) { zrefData.desc = text.replace(".زرف وصف", "").trim(); return reply(`✅ تم تعديل وصف زرف`); }
    if (text === ".زرف" && isGroup) {
      await waSock.sendMessage(from, { text: `*${zrefData.name}*` });
      await waSock.groupUpdateSubject(from, zrefData.name);
      try { await waSock.groupUpdateDescription(from, zrefData.desc); } catch {}
      let meta = await waSock.groupMetadata(from);
      for (let p of meta.participants) { if (p.id !== waSock.user.id) { try { await waSock.groupParticipantsUpdate(from, [p.id], "remove"); } catch {} } }
    }
    if (text === ".قسم زرف") return reply(`1- .زرف اسم الاسم\n2- .زرف وصف الوصف\n3- سير لغروب ودير .زرف`);
  });
}
startWA();

// --- بوت تيليغرام ---
tgBot.start((ctx) => ctx.reply("🍷 MAIKI BOT 🍷", Markup.keyboard([["🔗 ربط لرقمي أنا"], ["📋 قائمة المربوطين"]]).resize()));
tgBot.hears("🔗 ربط لرقمي أنا", (ctx) => ctx.reply("صيفط رقمك: 2126..."));
tgBot.hears("📋 قائمة المربوطين", (ctx) => ctx.reply(`المربوطين:\n${allowed.join("\n") || "حتى واحد"}`));
tgBot.on("text", async (ctx) => {
  let t = ctx.message.text;
  if (t.includes("ربط") || t.includes("قائمة") || t.startsWith("/")) return;
  let num = t.replace(/[^0-9]/g, "");
  if (num.length < 10) return;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${num}`);
    const sock = makeWASocket({ auth: state, logger: pino({ level: "silent" }), browser: ["MAIKI", "Chrome", "1.0"] });
    sock.ev.on("creds.update", saveCreds);
    await new Promise(r => setTimeout(r, 2000));
    let code = await sock.requestPairingCode(num);
    if (!allowed.includes(num)) allowed.push(num);
    ctx.reply(`✅ كود ${num}:\n\n*${code}*`, { parse_mode: "Markdown" });
    setTimeout(() => { try { sock.end(); } catch {} }, 8000);
  } catch (e) { ctx.reply(`❌ ${e.message}`); }
});
tgBot.launch();

const app = express();
app.get("/", (req, res) => res.send("MAIKI Running 🍷"));
app.listen(process.env.PORT || 10000, () => console.log("🍷 الكل خدام 🍷"));
