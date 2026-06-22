import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBAPP_URL; // ex: https://pepe-mine-six.vercel.app

async function setWebhook() {
  if (!BOT_TOKEN || !WEBHOOK_URL) {
    throw new Error("TELEGRAM_BOT_TOKEN ou WEBAPP_URL manquant dans .env");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  const webhookUrl = `${WEBHOOK_URL}/api/telegram-webhook`;

  console.log(`Setting webhook to: ${webhookUrl}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();
  console.log("Résultat:", JSON.stringify(data, null, 2));

  if (data.ok) {
    console.log("✅ Webhook activé avec succès !");
    console.log(`📡 URL: ${webhookUrl}`);
  } else {
    console.error("❌ Erreur:", data.description);
  }
}

setWebhook().catch(console.error);