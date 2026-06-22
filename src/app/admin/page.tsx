"use client";

import { useEffect, useState, useCallback } from "react";

interface Settings {
  claimAmount: number;
  claimCooldownMinutes: number;
  refLevel1Percent: number;
  refLevel2Percent: number;
  refLevel3Percent: number;
  minWithdrawal: number;
}

interface UserRow {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  balance: number;
  totalMined: number;
  totalWithdrawn: number;
  isBlocked: boolean;
  isDeleted: boolean;
}

interface AdminRow {
  id: string;
  telegramId: string;
  username?: string;
  role: "SUPER_ADMIN" | "CO_ADMIN";
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"settings" | "users" | "admins">("settings");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  // Vérifie l'auth au chargement
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    const r = localStorage.getItem("admin_role");
    if (!t) {
      window.location.href = "/admin/login";
      return;
    }
    setToken(t);
    setRole(r);
  }, []);

  // Helper pour les requêtes API avec token
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const t = localStorage.getItem("admin_token");
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": t || "",
          ...(options.headers || {}),
        },
      });
      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/admin/login";
        throw new Error("Session expirée");
      }
      return res;
    },
    []
  );

  useEffect(() => {
    if (!token) return;
    loadSettings();
    loadUsers();
    loadAdmins();
  }, [token]);

  async function loadSettings() {
    const res = await apiFetch("/api/admin/settings");
    const data = await res.json();
    if (res.ok) setSettings(data.settings);
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setSettingsMsg("");
    const res = await apiFetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSavingSettings(false);
    setSettingsMsg(res.ok ? "✅ Paramètres sauvegardés" : `❌ ${data.error}`);
  }

  async function loadUsers(searchQuery = "") {
    const res = await apiFetch(
      `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
    );
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users);
      setTotalUsers(data.total);
    }
  }

  async function toggleBlock(user: UserRow) {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    loadUsers(search);
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Supprimer ${user.firstName || user.telegramId} ?`)) return;
    await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    loadUsers(search);
  }

  async function loadAdmins() {
    const res = await apiFetch("/api/admin/admins");
    const data = await res.json();
    if (res.ok) setAdmins(data.admins);
  }

  async function addAdmin() {
    if (!newAdminId) return;
    setAdminMsg("");
    const res = await apiFetch("/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ telegramId: newAdminId, username: newAdminUsername }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewAdminId("");
      setNewAdminUsername("");
      loadAdmins();
      setAdminMsg("✅ Co-admin ajouté");
    } else {
      setAdminMsg(`❌ ${data.error}`);
    }
  }

  async function removeAdmin(admin: AdminRow) {
    if (admin.role === "SUPER_ADMIN") return;
    if (!confirm(`Retirer ${admin.username || admin.telegramId} ?`)) return;
    await apiFetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    loadAdmins();
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    window.location.href = "/admin/login";
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-green-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">🐸 Admin PEPE MINE</h1>
          <p className="text-xs text-gray-500">
            {role === "SUPER_ADMIN" ? "👑 Super Admin" : "Co-admin"}
          </p>
        </div>
        <button onClick={logout} className="text-sm text-red-400 border border-red-900 px-3 py-1 rounded-lg">
          Déconnexion
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(["settings", "users", "admins"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
              tab === t ? "bg-green-500 text-black font-bold" : "bg-zinc-900"
            }`}
          >
            {t === "settings" ? "⚙️ Paramètres" : t === "users" ? `👥 Users (${totalUsers})` : "🛡️ Co-admins"}
          </button>
        ))}
      </div>

      {/* ONGLET PARAMÈTRES */}
      {tab === "settings" && settings && (
        <div className="max-w-md space-y-4">
          {[
            { key: "claimAmount", label: "💰 Montant par réclamation (PEPE)" },
            { key: "claimCooldownMinutes", label: "⏱ Cooldown (minutes)" },
            { key: "refLevel1Percent", label: "% Parrainage niveau 1" },
            { key: "refLevel2Percent", label: "% Parrainage niveau 2" },
            { key: "refLevel3Percent", label: "% Parrainage niveau 3" },
            { key: "minWithdrawal", label: "💸 Minimum de retrait (PEPE)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input
                type="number"
                value={(settings as any)[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          ))}
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="bg-green-500 text-black font-bold px-6 py-3 rounded-lg w-full"
          >
            {savingSettings ? "Sauvegarde..." : "💾 Sauvegarder les paramètres"}
          </button>
          {settingsMsg && <p className="text-sm text-center">{settingsMsg}</p>}
        </div>
      )}

      {/* ONGLET UTILISATEURS */}
      {tab === "users" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
              placeholder="Chercher par ID, username, prénom..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={() => loadUsers(search)}
              className="bg-green-500 text-black px-4 rounded-lg text-sm font-bold"
            >
              🔍
            </button>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="bg-zinc-900 rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-bold text-sm">
                      {u.firstName || u.username || "Sans nom"}{" "}
                      {u.isBlocked && <span className="text-red-400 text-xs">[BLOQUÉ]</span>}
                      {u.isDeleted && <span className="text-gray-500 text-xs">[SUPPRIMÉ]</span>}
                    </p>
                    <p className="text-xs text-gray-500">ID: {u.telegramId}</p>
                  </div>
                  <p className="text-green-400 font-bold text-sm">{u.balance.toFixed(0)} PEPE</p>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Miné: {u.totalMined.toFixed(0)} | Retiré: {u.totalWithdrawn.toFixed(0)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBlock(u)}
                    className={`text-xs px-3 py-1 rounded-lg ${
                      u.isBlocked ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"
                    }`}
                  >
                    {u.isBlocked ? "✅ Débloquer" : "🚫 Bloquer"}
                  </button>
                  <button
                    onClick={() => deleteUser(u)}
                    className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded-lg"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucun utilisateur trouvé</p>
            )}
          </div>
        </div>
      )}

      {/* ONGLET CO-ADMINS */}
      {tab === "admins" && (
        <div className="max-w-md">
          <div className="bg-zinc-900 rounded-xl p-4 mb-4 space-y-2">
            <p className="text-sm text-gray-400 mb-2">Ajouter un co-admin</p>
            <input
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              placeholder="Telegram ID *"
              className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <input
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              placeholder="Username (optionnel)"
              className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={addAdmin}
              className="w-full bg-green-500 text-black font-bold py-2 rounded-lg text-sm"
            >
              ➕ Ajouter
            </button>
            {adminMsg && <p className="text-sm text-center">{adminMsg}</p>}
          </div>

          <div className="space-y-2">
            {admins.map((a) => (
              <div
                key={a.id}
                className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-sm">{a.username || a.telegramId}</p>
                  <p className="text-xs text-gray-500">
                    {a.role === "SUPER_ADMIN" ? "👑 Super Admin" : "🛡️ Co-admin"} • {a.telegramId}
                  </p>
                </div>
                {a.role !== "SUPER_ADMIN" && (
                  <button
                    onClick={() => removeAdmin(a)}
                    className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded-lg"
                  >
                    Retirer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}