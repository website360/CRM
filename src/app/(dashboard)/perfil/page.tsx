"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/components/Toast";

type User = { id: number; name: string; email: string; avatar: string | null; role: string };
type Org = { id: number; name: string; slug: string; logo: string | null; phone: string | null; website: string | null; address: string | null; plan: { name: string; maxUsers: number } | null; _count: { users: number; leads: number; channels: number } };

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.user) { setUser(d.user); setName(d.user.name); }
      }).catch(() => {});
    fetch("/api/org")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.id) { setOrg(d); setOrgName(d.name || ""); setOrgPhone(d.phone || ""); setOrgWebsite(d.website || ""); setOrgAddress(d.address || ""); }
      }).catch(() => {});
  }, []);

  async function handleUploadAvatar(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await uploadRes.json();
    if (url) {
      const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
      await fetch("/api/auth/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: fullUrl }) });
      setUser((u) => u ? { ...u, avatar: fullUrl } : u);
      toast("Foto atualizada!");
    }
    setUploading(false);
  }

  async function handleSaveProfile() {
    setSaving(true);
    await fetch("/api/auth/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setUser((u) => u ? { ...u, name } : u);
    toast("Perfil salvo!");
    setSaving(false);
  }

  async function handleSaveOrg() {
    setSaving(true);
    await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: orgName, phone: orgPhone, website: orgWebsite, address: orgAddress }) });
    toast("Empresa atualizada!");
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) { toast("Preencha ambos os campos", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/auth/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { toast("Senha alterada!"); setCurrentPassword(""); setNewPassword(""); }
    else toast(data.error || "Erro", "error");
  }

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meu Perfil</h2>

      {/* Avatar + Name */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-20 w-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 border-4 border-brand-400/30">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition">
              {uploading ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); }} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{user?.email} · {user?.role === 'owner' ? 'Proprietário' : user?.role === 'admin' ? 'Administrador' : 'Membro'}</p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveProfile} disabled={saving} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
            Salvar
          </button>
        </div>
      </div>

      {/* Company */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Empresa</h3>
            {org?.plan && <p className="text-xs text-gray-400 mt-0.5">Plano {org.plan.name} · {org._count.users}/{org.plan.maxUsers} usuários · {org._count.leads} leads · {org._count.channels} canais</p>}
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da empresa</label><input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inp} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label><input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className={inp} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Website</label><input value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} className={inp} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Endereço</label><input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className={inp} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button onClick={handleSaveOrg} disabled={saving} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
            Salvar Empresa
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Alterar Senha</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha atual</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inp} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inp} placeholder="Mínimo 6 caracteres" /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button onClick={handleChangePassword} disabled={saving} className="rounded-lg bg-gray-800 dark:bg-gray-700 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition disabled:opacity-50">
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}
