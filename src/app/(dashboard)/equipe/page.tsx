"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/components/Toast";
import UpgradeBanner from "@/components/UpgradeBanner";

type Member = { id: number; name: string; email: string; role: string; avatar: string | null; lastLogin: string | null; createdAt: string };
type OrgInfo = { plan: { name: string; maxUsers: number } | null; _count: { users: number } };

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: "Proprietário", color: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" },
  admin: { label: "Administrador", color: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400" },
  member: { label: "Membro", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export default function EquipePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  async function load() {
    const [teamRes, orgRes] = await Promise.all([fetch("/api/org/team"), fetch("/api/org")]);
    if (teamRes.ok) setMembers(await teamRes.json());
    if (orgRes.ok) setOrg(await orgRes.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(data: { name: string; email: string; password: string; role: string }) {
    const res = await fetch("/api/org/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await res.json();
    if (res.ok) { toast("Membro adicionado!"); setShowAdd(false); load(); }
    else toast(result.error || "Erro ao adicionar", "error");
  }

  async function handleRemove(userId: number) {
    const res = await fetch("/api/org/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (res.ok) { toast("Membro removido!"); setConfirmRemove(null); load(); }
    else { const d = await res.json(); toast(d.error || "Erro", "error"); setConfirmRemove(null); }
  }

  const maxUsers = org?.plan?.maxUsers || 1;
  const currentUsers = org?._count?.users || members.length;
  const canAdd = currentUsers < maxUsers;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <UpgradeBanner resource="users" />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Equipe</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {currentUsers} de {maxUsers >= 999 ? "ilimitados" : maxUsers} usuários · Plano {org?.plan?.name || "..."}
          </p>
        </div>
        <button onClick={() => canAdd ? setShowAdd(true) : toast(`Limite de ${maxUsers} usuários atingido. Faça upgrade do plano.`, "error")}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition">
          + Adicionar Membro
        </button>
      </div>

      {/* Usage bar */}
      {maxUsers < 999 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Usuários utilizados</span>
            <span className="font-medium">{currentUsers}/{maxUsers}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${currentUsers >= maxUsers ? "bg-error-500" : "bg-brand-500"}`} style={{ width: `${Math.min(100, (currentUsers / maxUsers) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((m) => {
            const r = roleLabels[m.role] || roleLabels.member;
            const initials = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-4">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
                      <span className="text-white text-sm font-bold">{initials}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:block">
                    {m.lastLogin ? `Último login: ${new Date(m.lastLogin).toLocaleDateString("pt-BR")}` : "Nunca logou"}
                  </span>
                  {m.role !== "owner" && (
                    <button onClick={() => setConfirmRemove(m)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition" title="Remover">
                      <svg className="w-4 h-4 text-gray-400 hover:text-error-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add member modal */}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {confirmRemove && <ConfirmModal title="Remover membro" message={`Remover "${confirmRemove.name}" da equipe? O acesso será revogado imediatamente.`} confirmText="Remover" variant="danger" onCancel={() => setConfirmRemove(null)} onConfirm={() => handleRemove(confirmRemove.id)} />}
    </div>
  );
}

function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: { name: string; email: string; password: string; role: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Adicionar Membro</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="João Silva" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="joao@empresa.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha inicial</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inp} placeholder="Mínimo 6 caracteres" />
            <p className="text-[11px] text-gray-400 mt-1">O membro poderá alterar a senha no perfil</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cargo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "admin", label: "Administrador", desc: "Acesso total, pode gerenciar equipe" },
                { value: "member", label: "Membro", desc: "Acesso às funcionalidades do CRM" },
              ].map((r) => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`text-left px-4 py-3 rounded-lg border transition ${role === r.value ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  <p className={`text-sm font-medium ${role === r.value ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"}`}>{r.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={() => { if (name && email && password) onAdd({ name, email, password, role }); }}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Adicionar
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
