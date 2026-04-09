"use client";

import { useEffect, useState, useCallback } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/components/Toast";
import dynamic from "next/dynamic";

const FlowEditor = dynamic(() => import("@/components/FlowEditor"), { ssr: false });

type Automation = {
  id: number; name: string; description: string | null; status: string;
  trigger: string; nodes: unknown[]; edges: unknown[];
  execCount: number; lastRunAt: string | null; createdAt: string;
};

export default function AutomacoesPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/automations");
    if (res.ok) setAutomations(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    const res = await fetch("/api/automations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nova Automação",
        trigger: "manual",
        nodes: [{ id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Gatilho", trigger: "manual" } }],
        edges: [],
      }),
    });
    if (res.ok) {
      const automation = await res.json();
      setEditing(automation);
      toast("Automação criada!");
      load();
    }
  }

  async function handleSave(automation: Automation) {
    await fetch(`/api/automations/${automation.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(automation),
    });
    toast("Automação salva!");
    load();
  }

  async function handleExecute(id: number) {
    toast("Executando automação...", "info");
    const res = await fetch(`/api/automations/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute" }),
    });
    const data = await res.json();
    if (data.ok) toast(`Automação executada! ${data.processed} ações processadas.`);
    else toast(data.error || "Erro", "error");
    load();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    toast("Automação deletada!");
    load();
  }

  async function handleToggleStatus(automation: Automation) {
    const newStatus = automation.status === "active" ? "paused" : "active";
    await fetch(`/api/automations/${automation.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...automation, status: newStatus }),
    });
    toast(newStatus === "active" ? "Automação ativada!" : "Automação pausada!");
    load();
  }

  // If editing, show flow editor full screen
  if (editing) {
    return <FlowEditor automation={editing as any} onSave={handleSave as any} onClose={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Automações</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crie fluxos visuais para automatizar WhatsApp e Email</p>
        </div>
        <button onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition">
          + Nova Automação
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {automations.map((a) => (
          <div key={a.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 hover:shadow-theme-sm transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{a.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    a.status === "active" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" :
                    a.status === "paused" ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>{a.status === "active" ? "Ativa" : a.status === "paused" ? "Pausada" : "Rascunho"}</span>
                </div>
                {a.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.description}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {a.trigger === "new_lead" ? "Novo Lead" : a.trigger === "new_message" ? "Nova Mensagem" : a.trigger === "manual" ? "Manual" : a.trigger}
              </span>
              <span>{(a.nodes as unknown[]).length} nós</span>
              <span>{a.execCount}x executada</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(a)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition">
                Editar Fluxo
              </button>
              <button onClick={() => handleExecute(a.id)}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-500 hover:bg-success-100 dark:hover:bg-success-500/20 transition">
                Executar
              </button>
              <button onClick={() => handleToggleStatus(a)}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                {a.status === "active" ? "Pausar" : "Ativar"}
              </button>
              <button onClick={() => setConfirmDelete({ id: a.id, name: a.name })}
                className="px-2 py-2 text-xs rounded-lg bg-error-50 dark:bg-error-500/10 text-error-500 hover:bg-error-100 dark:hover:bg-error-500/20 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}

        {automations.length === 0 && (
          <div className="col-span-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] py-16 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth={0.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crie sua primeira automação</p>
          </div>
        )}
      </div>

      {confirmDelete && <ConfirmModal title="Deletar automação" message={`Deletar "${confirmDelete.name}"?`} confirmText="Deletar" variant="danger" onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id)} />}
    </div>
  );
}
