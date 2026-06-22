import { Telegraf, Markup } from "telegraf";
import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://pepe-mine-six.vercel.app";
const BOT_USERNAME = process.env.BOT_USERNAME || "pepemineor_bot";
const APP_SHORT_NAME = process.env.APP_SHORT_NAME || "pepemine";

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN manquant dans .env");
}

export const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const payload = ctx.startPayload;

  // ✅ Format natif Telegram Mini App — transmet startapp via tg.initDataUnsafe.start_param
  const webAppUrl = payload
    ? `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=${payload}`
    : `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}`;

  try {
    await ctx.reply(
      `🐸 Bienvenue sur *PEPE MINE* !\n\n` +
        `Mine des PEPE gratuitement en regardant des publicités, et retire directement vers ton compte FaucetPay.\n\n` +
        `💰 300 PEPE par réclamation\n` +
        `⏱ Toutes les 60 minutes\n` +
        `👥 Gagne aussi en parrainant tes amis (20% / 10% / 5%)\n\n` +
        `Clique ci-dessous pour commencer 👇`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          // ✅ Utilise webAppUrl (format natif) et non directUrl
          Markup.button.webApp("🚀 Lancer PEPE MINE", webAppUrl),
        ]),
      }
    );
  } catch (err) {
    console.error("Erreur reply start:", err);
  }
});

bot.help((ctx) => {
  ctx.reply(
    `📖 *Aide PEPE MINE*\n\n` +
      `/start - Lancer l'application\n` +
      `/invite - Obtenir ton lien de parrainage\n` +
      `/balance - Voir mon solde\n\n` +
      `Pour toute question, contacte le support.`,
    { parse_mode: "Markdown" }
  );
});

bot.command("invite", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  // ✅ Format natif t.me/BOT/SHORTNAME?startapp=ID — transmet start_param correctement
  const inviteLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=${telegramId}`;

  ctx.reply(
    `🔗 *Ton lien de parrainage personnel :*\n\n${inviteLink}\n\n` +
      `Partage-le et gagne :\n` +
      `• 20% sur le minage de tes filleuls directs\n` +
      `• 10% sur le minage de leurs filleuls\n` +
      `• 5% sur le niveau suivant`,
    { parse_mode: "Markdown" }
  );
});

bot.command("balance", (ctx) => {
  ctx.reply(
    `💰 Pour voir ton solde en temps réel, ouvre l'application :`,
    Markup.inlineKeyboard([
      Markup.button.webApp("📊 Voir mon solde", WEBAPP_URL),
    ])
  );
});

export default bot;