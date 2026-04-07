"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadForm() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [source, setSource] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [saving, setSaving] = useState(false); const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!name.trim() || !email.trim()) { setError("Nome e email são obrigatórios"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, source }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro"); }
      setSuccess("Lead criado!"); setName(""); setEmail(""); setPhone(""); setSource(""); setIsOpen(false); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro"); } finally { setSaving(false); }
  }

  const inputCls = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 shadow-theme-xs focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition placeholder:text-gray-400 dark:placeholder:text-gray-500";

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="mb-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Cadastrar novo Lead
    </button>
  );

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cadastrar novo Lead</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do lead" className={inputCls} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className={inputCls} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className={inputCls} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fonte</label><input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Landing page, campanha..." className={inputCls} /></div>
        <div className="md:col-span-2 flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">{saving ? "Salvando..." : "Salvar Lead"}</button>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">Cancelar</button>
          {error && <span className="text-sm text-error-500">{error}</span>}
          {success && <span className="text-sm text-success-500">{success}</span>}
        </div>
      </form>
    </div>
  );
}
