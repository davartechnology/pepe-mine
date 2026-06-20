import { Telegraf, Markup } from "telegraf";
import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://example.com";

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN manquant dans .env");
}

export const bot = new Telegraf(BOT_TOKEN);

// Commande /start (avec gestion du paramètre de parrainage)
bot.start((ctx) => {
  const payload = ctx.startPayload; // récupère ce qu'il y a après "?start="
  // payload contiendra le telegram_id du parrain, ex: "123456789"

  const webAppUrl = payload
    ? `${WEBAPP_URL}?startapp=${payload}`
    : WEBAPP_URL;

  ctx.reply(
    `🐸 Bienvenue sur *PEPE MINE* !\n\n` +
      `Mine des PEPE gratuitement en regardant des publicités, et retire directement vers ton compte FaucetPay.\n\n` +
      `💰 200 PEPE par réclamation\n` +
      `⏱ Toutes les 60 minutes\n` +
      `👥 Gagne aussi en parrainant tes amis (20% / 10% / 5%)\n\n` +
      `Clique ci-dessous pour commencer 👇`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        Markup.button.webApp("🚀 Lancer PEPE MINE", webAppUrl),
      ]),
    }
  );
});

// Commande /help
bot.help((ctx) => {
  ctx.reply(
    `📖 *Aide PEPE MINE*\n\n` +
      `/start - Lancer l'application\n` +
      `/invite - Obtenir ton lien de parrainage\n` +
      `/balance - Voir ton solde\n\n` +
      `Pour toute question, contacte le support.`,
    { parse_mode: "Markdown" }
  );
});

// Commande /invite - génère le lien de parrainage personnel
bot.command("invite", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUsername = ctx.botInfo.username;
  const inviteLink = `https://t.me/${botUsername}?start=${telegramId}`;

  ctx.reply(
    `🔗 *Ton lien de parrainage personnel :*\n\n${inviteLink}\n\n` +
      `Partage-le et gagne :\n` +
      `• 20% sur le minage de tes filleuls directs\n` +
      `• 10% sur le minage de leurs filleuls\n` +
      `• 5% sur le niveau suivant`,
    { parse_mode: "Markdown" }
  );
});

// Commande /balance - renvoie vers l'app pour voir le solde en temps réel
bot.command("balance", (ctx) => {
  ctx.reply(
    `💰 Pour voir ton solde en temps réel, ouvre l'application :`,
    Markup.inlineKeyboard([
      Markup.button.webApp("📊 Voir mon solde", WEBAPP_URL),
    ])
  );
});

export default bot;