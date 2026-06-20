"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [tab, setTab] = useState<"settings" | "users" | "admins">("settings");

  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newAdminId, setNewAdminId] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  useEffect(() => {
    loadSettings();
    loadUsers();
    loadAdmins();
  }, []);

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    if (res.ok) setSettings(data.settings);
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSavingSettings(false);
    setSettingsMsg(res.ok ? "✅ Paramètres sauvegardés" : `❌ ${data.error}`);
  }

  async function loadUsers(searchQuery = "") {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  }

  async function toggleBlock(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    loadUsers(search);
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Supprimer ${user.firstName || user.telegramId} ? (soft delete)`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    loadUsers(search);
  }

  async function loadAdmins() {
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    if (res.ok) setAdmins(data.admins);
  }

  async function addAdmin() {
    if (!newAdminId) return;
    setAdminMsg("");
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: newAdminId }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewAdminId("");
      loadAdmins();
    } else {
      setAdminMsg(`❌ ${data.error}`);
    }
  }

  async function removeAdmin(admin: AdminRow) {
    if (admin.role === "SUPER_ADMIN") return;
    if (!confirm(`Retirer ${admin.telegramId} des admins ?`)) return;
    await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    loadAdmins();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-400">🐸 Admin PEPE MINE</h1>
        <button onClick={logout} className="text-sm text-red-400">
          Déconnexion
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(["settings", "users", "admins"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm ${
              tab === t ? "bg-green-500 text-black" : "bg-zinc-900"
            }`}
          >
            {t === "settings" ? "Paramètres" : t === "users" ? "Utilisateurs" : "Co-admins"}
          </button>
        ))}
      </div>

      {/* ONGLET PARAMÈTRES */}
      {tab === "settings" && settings && (
        <div className="max-w-md space-y-4">
          {[
            { key: "claimAmount", label: "Montant par réclamation (PEPE)" },
            { key: "claimCooldownMinutes", label: "Cooldown (minutes)" },
            { key: "refLevel1Percent", label: "% Parrainage niveau 1" },
            { key: "refLevel2Percent", label: "% Parrainage niveau 2" },
            { key: "refLevel3Percent", label: "% Parrainage niveau 3" },
            { key: "minWithdrawal", label: "Minimum de retrait (PEPE)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input
                type="number"
                value={(settings as any)[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </div>
          ))}
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="bg-green-500 text-black font-bold px-6 py-2 rounded-lg"
          >
            {savingSettings ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          {settingsMsg && <p className="text-sm">{settingsMsg}</p>}
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
              placeholder="Rechercher par ID, username..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
            />
            <button
              onClick={() => loadUsers(search)}
              className="bg-zinc-800 px-4 rounded-lg text-sm"
            >
              Chercher
            </button>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="bg-zinc-900 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">
                      {u.firstName || u.username || "Sans nom"}{" "}
                      {u.isBlocked && <span className="text-red-400 text-xs">[BLOQUÉ]</span>}
                      {u.isDeleted && <span className="text-gray-500 text-xs">[SUPPRIMÉ]</span>}
                    </p>
                    <p className="text-xs text-gray-500">{u.telegramId}</p>
                  </div>
                  <p className="text-green-400 font-bold">{u.balance.toFixed(0)} PEPE</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Miné: {u.totalMined.toFixed(0)} | Retiré: {u.totalWithdrawn.toFixed(0)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBlock(u)}
                    className="text-xs bg-zinc-800 px-3 py-1 rounded-lg"
                  >
                    {u.isBlocked ? "Débloquer" : "Bloquer"}
                  </button>
                  <button
                    onClick={() => deleteUser(u)}
                    className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded-lg"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET CO-ADMINS */}
      {tab === "admins" && (
        <div className="max-w-md">
          <div className="flex gap-2 mb-4">
            <input
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              placeholder="Telegram ID du nouveau co-admin"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
            />
            <button
              onClick={addAdmin}
              className="bg-green-500 text-black font-bold px-4 rounded-lg text-sm"
            >
              Ajouter
            </button>
          </div>
          {adminMsg && <p className="text-sm mb-4">{adminMsg}</p>}

          <div className="space-y-2">
            {admins.map((a) => (
              <div
                key={a.id}
                className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{a.username || a.telegramId}</p>
                  <p className="text-xs text-gray-500">
                    {a.role === "SUPER_ADMIN" ? "👑 Super Admin" : "Co-admin"}
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