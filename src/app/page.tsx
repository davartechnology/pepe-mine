"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    Telegram: any;
    show_11174625?: (config?: any) => Promise<void>; // SDK Monetag (Zone ID 11174625)
  }
}

interface UserData {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  balance: number;
  totalMined: number;
  lastClaimAt: string | null;
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [initData, setInitData] = useState<string>("");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      const referralCode = tg.initDataUnsafe?.start_param;
      authenticate(tg.initData, referralCode);
    } else {
      setMessage("⚠️ Ouvre cette application depuis Telegram");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const interval = setInterval(() => {
      setCooldownMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  async function authenticate(initDataStr: string, referralCode?: string) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: initDataStr, referralCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Erreur d'authentification");
        setLoading(false);
        return;
      }

      setUser(data.user);

      if (data.user.lastClaimAt) {
        const lastClaim = new Date(data.user.lastClaimAt).getTime();
        const cooldownEnd = lastClaim + 60 * 60 * 1000;
        const remaining = cooldownEnd - Date.now();
        if (remaining > 0) setCooldownMs(remaining);
      }
    } catch (err) {
      setMessage("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  const handleClaim = useCallback(async () => {
    if (!initData || claiming || cooldownMs > 0) return;

    setClaiming(true);
    setMessage(null);

    try {
      // Monetag - Format Rewarded (Zone ID 11174625)
      // La promesse ne se résout QUE si la pub est entièrement visionnée.
      // Si l'user quitte trop tôt ou si aucune pub n'est dispo, ça rejette -> pas de claim.
      if (typeof window.show_11174625 === "function") {
        try {
          await window.show_11174625();
        } catch (adErr) {
          setMessage("⚠️ Regarde la publicité en entier pour miner du PEPE");
          setClaiming(false);
          return;
        }
      }

      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.remainingMs) {
          setCooldownMs(data.remainingMs);
        }
        setMessage(data.error || "Erreur lors de la réclamation");
        return;
      }

      setUser((prev) =>
        prev ? { ...prev, balance: data.newBalance } : prev
      );
      setCooldownMs(60 * 60 * 1000);
      setMessage(`✅ +${data.claimedAmount} PEPE minés !`);
    } catch (err) {
      setMessage("Erreur réseau, réessaie");
    } finally {
      setClaiming(false);
    }
  }, [initData, claiming, cooldownMs]);

  function formatCooldown(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-green-400">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white px-4 py-8">
      <h1 className="text-3xl font-bold text-green-400 mb-1">🐸 PEPE MINE</h1>
      <p className="text-sm text-gray-400 mb-8">Mine, partage, retire.</p>

      {user ? (
        <>
          <div className="w-full max-w-sm bg-zinc-900 border border-green-500/30 rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Solde</p>
            <p className="text-4xl font-bold text-green-400">
              {user.balance.toLocaleString()} <span className="text-lg">PEPE</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Total miné : {user.totalMined.toLocaleString()} PEPE
            </p>
          </div>

          <button
            onClick={handleClaim}
            disabled={claiming || cooldownMs > 0}
            className={`w-full max-w-sm py-4 rounded-2xl font-bold text-lg transition ${
              cooldownMs > 0
                ? "bg-zinc-800 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-black active:scale-95"
            }`}
          >
            {claiming
              ? "Minage en cours..."
              : cooldownMs > 0
              ? `⏱ ${formatCooldown(cooldownMs)}`
              : "⛏️ Miner 350 PEPE"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-center text-green-300">{message}</p>
          )}

          <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-8">
            <a href="/referral" className="bg-zinc-900 border border-zinc-700 rounded-xl py-3 text-center text-sm">
              👥 Parrainage
            </a>
            <a href="/withdraw" className="bg-zinc-900 border border-zinc-700 rounded-xl py-3 text-center text-sm">
              💸 Retrait
            </a>
            <a href="/history" className="bg-zinc-900 border border-zinc-700 rounded-xl py-3 text-center text-sm col-span-2">
              📜 Historique
            </a>
          </div>
        </>
      ) : (
        <p className="text-red-400">{message}</p>
      )}
    </main>
  );
}