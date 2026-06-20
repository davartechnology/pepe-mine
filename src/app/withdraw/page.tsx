"use client";

import { useEffect, useState } from "react";
import AdBanner from "@/components/AdBanner";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [minWithdrawal, setMinWithdrawal] = useState(1200);
  const [email, setEmail] = useState("");
  const [initData, setInitData] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setLoading(false);
      return;
    }
    tg.ready();
    setInitData(tg.initData);

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setBalance(data.user.balance);
          if (data.user.faucetpayEmail) setEmail(data.user.faucetpayEmail);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw() {
    if (!email) {
      setMessage({ type: "error", text: "Renseigne ton email/adresse FaucetPay" });
      return;
    }
    if (balance < minWithdrawal) {
      setMessage({
        type: "error",
        text: `Solde insuffisant. Minimum : ${minWithdrawal} PEPE`,
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, faucetpayEmail: email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors du retrait" });
        return;
      }

      setMessage({ type: "success", text: `✅ ${data.amount} PEPE envoyés sur FaucetPay !` });
      setBalance(0);
    } catch (err) {
      setMessage({ type: "error", text: "Erreur réseau, réessaie" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <a href="/" className="text-green-400 text-sm mb-4 inline-block">← Retour</a>
      <h1 className="text-2xl font-bold text-green-400 mb-4">💸 Retrait</h1>

      <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-6 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Solde disponible</p>
        <p className="text-3xl font-bold text-green-400">{balance.toLocaleString()} PEPE</p>
        <p className="text-xs text-gray-500 mt-2">Minimum de retrait : {minWithdrawal} PEPE</p>
      </div>

      <label className="text-sm text-gray-400 block mb-2">
        Email ou adresse FaucetPay
      </label>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton-email@exemple.com"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
      />

      <button
        onClick={handleWithdraw}
        disabled={submitting || balance < minWithdrawal}
        className={`w-full py-4 rounded-2xl font-bold text-lg ${
          submitting || balance < minWithdrawal
            ? "bg-zinc-800 text-gray-500 cursor-not-allowed"
            : "bg-green-500 text-black active:scale-95"
        }`}
      >
        {submitting ? "Envoi en cours..." : "Retirer maintenant"}
      </button>

      {message && (
        <p
          className={`mt-4 text-sm text-center ${
            message.type === "success" ? "text-green-300" : "text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      <AdBanner adKey="efc8eae7c8e7d236f7bf531d02d12e8d" />
    </main>
  );
}