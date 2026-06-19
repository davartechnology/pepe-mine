import crypto from "crypto";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
}

/**
 * Vérifie et parse le initData envoyé par Telegram WebApp.
 * Lance une erreur si la signature est invalide ou si les données sont trop vieilles.
 */
export function validateTelegramInitData(initData: string): ValidatedInitData {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN manquant dans .env");
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) {
    throw new Error("Hash manquant dans initData");
  }
  urlParams.delete("hash");

  // Construire la data-check-string : toutes les paires triées alphabétiquement
  const dataCheckArr: string[] = [];
  urlParams.forEach((value, key) => {
    dataCheckArr.push(`${key}=${value}`);
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  // Calcul de la clé secrète : HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // Calcul du hash attendu
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("Signature initData invalide — falsification possible");
  }

  // Vérifier que les données ne sont pas trop vieilles (protection replay attack)
  const authDate = parseInt(urlParams.get("auth_date") || "0", 10);
  const now = Math.floor(Date.now() / 1000);
  const MAX_AGE_SECONDS = 86400; // 24h

  if (now - authDate > MAX_AGE_SECONDS) {
    throw new Error("initData expiré, reconnexion nécessaire");
  }

  const userRaw = urlParams.get("user");
  if (!userRaw) {
    throw new Error("Données utilisateur manquantes dans initData");
  }

  const user: TelegramUser = JSON.parse(userRaw);

  return { user, authDate };
}