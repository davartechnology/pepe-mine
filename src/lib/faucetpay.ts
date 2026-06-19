const FAUCETPAY_API_URL = "https://faucetpay.io/api/v1/send";

interface FaucetPayResponse {
  status: number;
  message: string;
  payout_id?: string;
  payout_user_hash?: string;
  balance?: string;
}

/**
 * Envoie un paiement réel via FaucetPay.
 * amount doit être dans la plus petite unité acceptée par FaucetPay pour PEPE
 * (vérifie la doc FaucetPay : certains tokens utilisent des décimales spécifiques).
 */
export async function sendFaucetPayPayout(
  toAddressOrEmail: string,
  amount: number
): Promise<FaucetPayResponse> {
  const apiKey = process.env.FAUCETPAY_API_KEY;
  if (!apiKey) {
    throw new Error("FAUCETPAY_API_KEY manquant");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    to: toAddressOrEmail,
    amount: amount.toString(),
    currency: "PEPE",
  });

  const res = await fetch(FAUCETPAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data: FaucetPayResponse = await res.json();
  return data;
}