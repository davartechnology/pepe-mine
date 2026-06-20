const FAUCETPAY_API_URL = "https://faucetpay.io/api/v1/send";

// FaucetPay attend les montants dans la plus petite unité (8 décimales pour la plupart des tokens, dont PEPE)
const PEPE_DECIMALS = 8;

interface FaucetPayResponse {
  status: number;
  message: string;
  payout_id?: string;
  payout_user_hash?: string;
  balance?: string;
}

/**
 * Envoie un paiement réel via FaucetPay.
 * `amount` est fourni en PEPE "humain" (ex: 1700), converti automatiquement
 * vers la plus petite unité attendue par l'API.
 */
export async function sendFaucetPayPayout(
  toAddressOrEmail: string,
  amount: number
): Promise<FaucetPayResponse> {
  const apiKey = process.env.FAUCETPAY_API_KEY;
  if (!apiKey) {
    throw new Error("FAUCETPAY_API_KEY manquant");
  }

  // Conversion vers la plus petite unité (évite les erreurs de virgule flottante avec Math.round)
  const amountInSmallestUnit = Math.round(amount * Math.pow(10, PEPE_DECIMALS));

  const params = new URLSearchParams({
    api_key: apiKey,
    to: toAddressOrEmail,
    amount: amountInSmallestUnit.toString(),
    currency: "PEPE",
  });

  const res = await fetch(FAUCETPAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const raw = await res.json();

  // Parsing robuste : FaucetPay peut renvoyer status en string ou en number selon les cas.
  // On normalise pour ne JAMAIS rater un succès réel (ce qui causerait un remboursement
  // alors que l'argent a déjà été envoyé - le pire scénario possible).
  const normalizedStatus = Number(raw.status);

  return {
    status: normalizedStatus,
    message: raw.message ?? "Réponse inconnue de FaucetPay",
    payout_id: raw.payout_id,
    payout_user_hash: raw.payout_user_hash,
    balance: raw.balance,
  };
}