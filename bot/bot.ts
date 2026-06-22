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

// Enregistrement automatique des commandes visibles dans Telegram
bot.telegram.setMyCommands([
  { command: "start", description: "🚀 Lancer PEPE MINE" },
  { command: "invite", description: "🔗 Obtenir mon lien de parrainage" },
  { command: "balance", description: "💰 Voir mon solde" },
  { command: "help", description: "📖 Aide" },
]);

bot.start(async (ctx) => {
  const payload = ctx.startPayload; // contient le telegramId du parrain si lien de parrainage

  // Le bouton Mini App utilise le format natif avec startapp
  // pour transmettre fiablement le code de parrainage via tg.initDataUnsafe.start_param
  const miniAppUrl = payload
    ? `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=${payload}`
    : `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}`;

  const welcomeText = payload
    ? `🐸 Bienvenue sur *PEPE MINE* !\n\n` +
      `Tu as été invité par un ami 🎉\n\n` +
      `Mine des PEPE gratuitement en regardant des publicités, et retire directement vers ton compte FaucetPay.\n\n` +
      `💰 300 PEPE par réclamation\n` +
      `⏱ Toutes les 60 minutes\n` +
      `👥 Gagne aussi en parrainant tes amis (20% / 10% / 5%)\n\n` +
      `Clique ci-dessous pour commencer et ton ami recevra sa commission 👇`
    : `🐸 Bienvenue sur *PEPE MINE* !\n\n` +
      `Mine des PEPE gratuitement en regardant des publicités, et retire directement vers ton compte FaucetPay.\n\n` +
      `💰 300 PEPE par réclamation\n` +
      `⏱ Toutes les 60 minutes\n` +
      `👥 Gagne aussi en parrainant tes amis (20% / 10% / 5%)\n\n` +
      `Clique ci-dessous pour commencer 👇`;

  try {
    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        Markup.button.webApp("🚀 Lancer PEPE MINE", miniAppUrl),
      ]),
    });
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

  // Le lien de parrainage pointe vers le BOT (pas directement la mini app)
  // Ainsi l'user voit le message de bienvenue avant d'ouvrir la mini app
  const inviteLink = `https://t.me/${BOT_USERNAME}?start=${telegramId}`;

  await ctx.reply(
    `🔗 *Ton lien de parrainage personnel :*\n\n${inviteLink}\n\n` +
      `Quand un ami clique ce lien :\n` +
      `1️⃣ Il arrive sur le bot et voit le message de bienvenue\n` +
      `2️⃣ Il clique sur "🚀 Lancer PEPE MINE"\n` +
      `3️⃣ La Mini App s'ouvre et ton parrainage est enregistré ✅\n\n` +
      `Tu gagnes :\n` +
      `• 20% sur le minage de tes filleuls directs\n` +
      `• 10% sur le minage de leurs filleuls\n` +
      `• 5% sur le niveau suivant`,
    { parse_mode: "Markdown" }
  );
});

bot.command("balance", async (ctx) => {
  const miniAppUrl = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}`;
  await ctx.reply(
    `💰 Pour voir ton solde en temps réel, ouvre l'application :`,
    Markup.inlineKeyboard([
      Markup.button.webApp("📊 Voir mon solde", miniAppUrl),
    ])
  );
});

export default bot;