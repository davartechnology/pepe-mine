"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-900 border border-green-500/30 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold text-green-400 mb-1 text-center">
          🐸 PEPE MINE
        </h1>
        <p className="text-sm text-gray-400 mb-6 text-center">Administration</p>

        <label className="text-sm text-gray-400 block mb-1">Telegram ID</label>
        <input
          type="text"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 mb-4 text-white"
          placeholder="123456789"
          required
        />

        <label className="text-sm text-gray-400 block mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 mb-4 text-white"
          required
        />

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-black font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}