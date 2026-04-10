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

const triggerLabels: Record<string, { label: string; desc: string; icon: string }> = {
  manual: { label: "Manual", desc: "Executada manualmente pelo operador", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" },
  new_lead: { label: "Novo Lead", desc: "Dispara quando um novo lead é capturado", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
  new_message: { label: "Nova Mensagem", desc: "Dispara quando uma mensagem chega no Inbox", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  deal_stage_changed: { label: "Deal mudou de etapa", desc: "Dispara quando um card é movido no CRM", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
};

export default function AutomacoesPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/automations");
    if (res.ok) setAutomations(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(name: string, trigger: string, description: string) {
    const res = await fetch("/api/automations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, trigger, description,
        nodes: [{ id: "trigger-1", type: "trigger", position: { x: 300, y: 50 }, data: { label: triggerLabels[trigger]?.label || "Gatilho", trigger } }],
        edges: [],
      }),
    });
    if (res.ok) {
      const automation = await res.json();
      setShowCreate(false);
      setEditing(automation);
      toast("Automação criada! Monte o fluxo.");
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
    toast("Executando...", "info");
    const res = await fetch(`/api/automations/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute" }),
    });
    const data = await res.json();
    if (data.ok) toast(`Executada! ${data.processed} ações.`);
    else toast(data.error || "Erro", "error");
    load();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    toast("Deletada!");
    load();
  }

  async function handleToggle(a: Automation) {
    const newStatus = a.status === "active" ? "paused" : "active";
    await fetch(`/api/automations/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, status: newStatus }),
    });
    toast(newStatus === "active" ? "Ativada!" : "Pausada!");
    load();
  }

  if (editing) {
    return <FlowEditor automation={editing as any} onSave={handleSave as any} onClose={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Automações</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crie fluxos para automatizar ações de WhatsApp, Email e CRM</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition">
          + Nova Automação
        </button>
      </div>

      {/* How it works */}
      {automations.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Escolha o gatilho", desc: "O que inicia a automação: novo lead, nova mensagem, ou execução manual.", color: "bg-brand-50 dark:bg-brand-500/10 text-brand-500" },
              { step: "2", title: "Monte o fluxo", desc: "Arraste ações como Enviar WhatsApp, Enviar Email, Filtrar, Aguardar, e conecte-as.", color: "bg-success-50 dark:bg-success-500/10 text-success-500" },
              { step: "3", title: "Ative ou execute", desc: "Ative para rodar automaticamente ou execute manualmente quando quiser.", color: "bg-warning-50 dark:bg-warning-500/10 text-warning-500" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color} text-sm font-bold`}>{s.step}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automations list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {automations.map((a) => {
          const t = triggerLabels[a.trigger] || triggerLabels.manual;
          return (
            <div key={a.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 hover:shadow-theme-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{a.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    a.status === "active" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" :
                    a.status === "paused" ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>{a.status === "active" ? "Ativa" : a.status === "paused" ? "Pausada" : "Rascunho"}</span>
                </div>
              </div>

              {a.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{a.description}</p>}

              {/* Trigger info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-3">
                <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                </svg>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4">
                <span>{(a.nodes as unknown[]).length} nós</span>
                <span>{(a.edges as unknown[]).length} conexões</span>
                <span>{a.execCount}x executada</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(a)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition">
                  Editar Fluxo
                </button>
                <button onClick={() => handleExecute(a.id)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-500 hover:bg-success-100 transition" title="Executar agora">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                </button>
                <button onClick={() => handleToggle(a)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition" title={a.status === "active" ? "Pausar" : "Ativar"}>
                  {a.status === "active" ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </button>
                <button onClick={() => setConfirmDelete({ id: a.id, name: a.name })}
                  className="px-2 py-2 text-xs rounded-lg bg-error-50 dark:bg-error-500/10 text-error-500 hover:bg-error-100 transition" title="Deletar">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && <CreateAutomationModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {confirmDelete && <ConfirmModal title="Deletar automação" message={`Deletar "${confirmDelete.name}"?`} confirmText="Deletar" variant="danger" onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id)} />}
    </div>
  );
}

function CreateAutomationModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, trigger: string, description: string) => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("manual");
  const [description, setDescription] = useState("");
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Nova Automação</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Ex: Boas-vindas automática" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inp} placeholder="O que essa automação faz?" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Gatilho - O que inicia a automação?</label>
            <div className="space-y-2">
              {Object.entries(triggerLabels).map(([key, t]) => (
                <button key={key} type="button" onClick={() => setTrigger(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center gap-3 ${
                    trigger === key ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}>
                  <svg className={`w-5 h-5 shrink-0 ${trigger === key ? "text-brand-500" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${trigger === key ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"}`}>{t.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => { if (name.trim()) onCreate(name, trigger, description); }}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">Criar e Montar Fluxo</button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
