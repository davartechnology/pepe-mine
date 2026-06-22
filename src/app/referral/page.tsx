"use client";

import { useEffect, useState } from "react";

interface ReferralData {
  telegramId: string;
  counts: { level1: number; level2: number; level3: number };
  earnings: { level1: number; level2: number; level3: number; total: number };
  percents: { level1: number; level2: number; level3: number };
  directReferrals: { id: string; username?: string; firstName?: string; createdAt: string }[];
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "votre_bot";

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setLoading(false);
      return;
    }
    tg.ready();

    fetch("/api/user/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

 const inviteLink = data
  ? `https://t.me/${botUsername}/${process.env.NEXT_PUBLIC_APP_SHORT_NAME || "pepemine"}?startapp=${data.telegramId}`
  : "";

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    const tg = (window as any).Telegram?.WebApp;
    const text = "🐸 Rejoins PEPE MINE et gagne des PEPE gratuitement !";
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    if (tg) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
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
      <h1 className="text-2xl font-bold text-green-400 mb-4">👥 Parrainage</h1>

      <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-4 mb-4 text-center">
        <p className="text-gray-400 text-sm mb-1">Total gagné en commissions</p>
        <p className="text-3xl font-bold text-green-400">
          {data?.earnings.total.toFixed(2)} PEPE
        </p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
        <p className="text-sm text-gray-400 mb-2">Ton lien de parrainage</p>
        <p className="text-xs text-green-300 break-all bg-black rounded-lg p-2 mb-3">
          {inviteLink}
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm"
          >
            {copied ? "✅ Copié" : "📋 Copier"}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 bg-green-500 text-black rounded-lg py-2 text-sm font-bold"
          >
            📤 Partager
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Niveau 1</p>
          <p className="text-lg font-bold text-green-400">{data?.counts.level1}</p>
          <p className="text-xs text-gray-500">{data?.percents.level1}%</p>
          <p className="text-xs text-green-300 mt-1">{data?.earnings.level1.toFixed(1)} PEPE</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Niveau 2</p>
          <p className="text-lg font-bold text-green-400">{data?.counts.level2}</p>
          <p className="text-xs text-gray-500">{data?.percents.level2}%</p>
          <p className="text-xs text-green-300 mt-1">{data?.earnings.level2.toFixed(1)} PEPE</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Niveau 3</p>
          <p className="text-lg font-bold text-green-400">{data?.counts.level3}</p>
          <p className="text-xs text-gray-500">{data?.percents.level3}%</p>
          <p className="text-xs text-green-300 mt-1">{data?.earnings.level3.toFixed(1)} PEPE</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">Tes filleuls directs</p>
        {data?.directReferrals.length === 0 ? (
          <p className="text-gray-500 text-center mt-4 text-sm">
            Aucun filleul pour l'instant. Partage ton lien !
          </p>
        ) : (
          <div className="space-y-2">
            {data?.directReferrals.map((r) => (
              <div key={r.id} className="bg-zinc-900 rounded-xl p-3 text-sm">
                {r.firstName || r.username || "Utilisateur"}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}