"use client";

import { useEffect, useState } from "react";

interface Claim {
  id: string;
  amount: number;
  createdAt: string;
}
interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}
interface Commission {
  id: string;
  amount: number;
  level: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<"claims" | "withdrawals" | "commissions">("claims");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setLoading(false);
      return;
    }
    tg.ready();

    fetch("/api/user/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims || []);
        setWithdrawals(data.withdrawals || []);
        setCommissions(data.commissions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function formatDate(d: string) {
    return new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const statusLabel: Record<string, string> = {
    PENDING: "⏳ En attente",
    COMPLETED: "✅ Complété",
    FAILED: "❌ Échoué",
    REJECTED: "🚫 Rejeté",
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <a href="/" className="text-green-400 text-sm mb-4 inline-block">← Retour</a>
      <h1 className="text-2xl font-bold text-green-400 mb-4">📜 Historique</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("claims")}
          className={`flex-1 py-2 rounded-lg text-sm ${tab === "claims" ? "bg-green-500 text-black" : "bg-zinc-900"}`}
        >
          Minages
        </button>
        <button
          onClick={() => setTab("withdrawals")}
          className={`flex-1 py-2 rounded-lg text-sm ${tab === "withdrawals" ? "bg-green-500 text-black" : "bg-zinc-900"}`}
        >
          Retraits
        </button>
        <button
          onClick={() => setTab("commissions")}
          className={`flex-1 py-2 rounded-lg text-sm ${tab === "commissions" ? "bg-green-500 text-black" : "bg-zinc-900"}`}
        >
          Parrainage
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center mt-8">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {tab === "claims" &&
            (claims.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">Aucun minage encore</p>
            ) : (
              claims.map((c) => (
                <div key={c.id} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">{formatDate(c.createdAt)}</span>
                  <span className="text-green-400 font-bold">+{c.amount} PEPE</span>
                </div>
              ))
            ))}

          {tab === "withdrawals" &&
            (withdrawals.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">Aucun retrait encore</p>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">{formatDate(w.createdAt)}</p>
                    <p className="text-xs text-gray-500">{statusLabel[w.status] || w.status}</p>
                  </div>
                  <span className="text-green-400 font-bold">-{w.amount} PEPE</span>
                </div>
              ))
            ))}

          {tab === "commissions" &&
            (commissions.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">Aucune commission encore</p>
            ) : (
              commissions.map((c) => (
                <div key={c.id} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">{formatDate(c.createdAt)}</p>
                    <p className="text-xs text-gray-500">Niveau {c.level}</p>
                  </div>
                  <span className="text-green-400 font-bold">+{c.amount.toFixed(2)} PEPE</span>
                </div>
              ))
            ))}
        </div>
      )}
    </main>
  );
}