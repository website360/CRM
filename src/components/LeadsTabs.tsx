"use client";
import { useState } from "react";
import { toast } from "@/components/Toast";

type Lead = { id: number; name: string; email: string; phone: string | null; source: string; status: string; notes: string | null; metadata: unknown; createdAt: string; };

const tabs = [
  { key: "all", label: "Todos" },
  { key: "forms", label: "Formulários" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function LeadsTabs({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const filtered = leads.filter((l) => activeTab === "all" ? true : activeTab === "whatsapp" ? l.status === "whatsapp" : l.status !== "whatsapp");
  const counts = { all: leads.length, forms: leads.filter((l) => l.status !== "whatsapp").length, whatsapp: leads.filter((l) => l.status === "whatsapp").length };

  async function sendToCRM(lead: Lead) {
    const res = await fetch("/api/pipelines");
    const pps = await res.json();
    if (pps.length > 0 && pps[0].stages?.length > 0) {
      await fetch("/api/deals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: pps[0].stages[0].id,
          title: lead.name,
          contactName: lead.name,
          contactPhone: lead.phone,
          contactEmail: lead.email.endsWith("@click.track") || lead.email.endsWith("@whatsapp.contact") ? null : lead.email,
          notes: lead.notes,
          metadata: lead.metadata,
          leadId: lead.id,
        }),
      });
      toast("Enviado para o CRM!");
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 px-6 pt-4">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${activeTab === tab.key ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === tab.key ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="py-3 pl-6 pr-3 text-left w-[280px]"><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</p></th>
                <th className="py-3 px-3 text-left w-[140px]"><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fonte</p></th>
                <th className="py-3 px-3 text-left w-[100px]"><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p></th>
                <th className="py-3 px-3 text-left w-[130px]"><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</p></th>
                <th className="py-3 pl-3 pr-6 text-right w-[100px]"><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</p></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === "whatsapp" ? "Nenhum clique no WhatsApp." : activeTab === "forms" ? "Nenhum lead de formulário." : "Nenhum lead cadastrado."}
                </td></tr>
              ) : filtered.map((lead) => (
                <tr key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition cursor-pointer h-16">
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${lead.status === "whatsapp" ? "bg-success-50 dark:bg-success-500/10" : "bg-gray-100 dark:bg-gray-800"}`}>
                        {lead.status === "whatsapp" ? (
                          <svg className="fill-success-500" width="14" height="14" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35"/></svg>
                        ) : <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{lead.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{lead.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {lead.email.endsWith("@click.track") || lead.email.endsWith("@whatsapp.contact") ? (lead.phone ? `+${lead.phone}` : "anônimo") : lead.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{lead.source}</p>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</p>
                  </td>
                  <td className="py-3 pl-3 pr-6 text-right">
                    <button onClick={(e) => { e.stopPropagation(); sendToCRM(lead); }}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline transition">
                      CRM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onSendToCRM={() => { sendToCRM(selectedLead); }} />
      )}
    </>
  );
}

// === Slide-in Drawer ===
function LeadDrawer({ lead, onClose, onSendToCRM }: { lead: Lead; onClose: () => void; onSendToCRM: () => void }) {
  const meta = (lead.metadata || {}) as Record<string, string>;
  const metaEntries = Object.entries(meta);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[10000] h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-[slideInRight_0.3s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${lead.status === "whatsapp" ? "bg-success-50 dark:bg-success-500/10" : "bg-gray-100 dark:bg-gray-800"}`}>
              {lead.status === "whatsapp" ? (
                <svg className="fill-success-500" width="18" height="18" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35"/></svg>
              ) : <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{lead.name.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{lead.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lead #{lead.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] px-6 py-5 space-y-6">
          {/* Status */}
          <div>
            <StatusBadge status={lead.status} />
          </div>

          {/* Info Fields */}
          <div className="space-y-4">
            <InfoField icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
              label="Email" value={lead.email.endsWith("@click.track") || lead.email.endsWith("@whatsapp.contact") ? "-" : lead.email} />
            <InfoField icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
              label="Telefone" value={lead.phone ? `+${lead.phone}` : "-"} />
            <InfoField icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
              label="Fonte" value={lead.source} />
            <InfoField icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              label="Criado em" value={new Date(lead.createdAt).toLocaleString("pt-BR")} />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</h4>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          {metaEntries.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Dados extras</h4>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                {metaEntries.map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{key}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 text-right">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
          <button onClick={onSendToCRM}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Enviar para CRM
          </button>
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer"
              className="rounded-lg bg-success-50 dark:bg-success-500/10 px-4 py-2.5 text-sm font-medium text-success-600 dark:text-success-500 hover:bg-success-100 dark:hover:bg-success-500/20 transition flex items-center gap-2">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35"/></svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800 dark:text-white/90">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    new: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
    whatsapp: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    contacted: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    qualified: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    converted: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  };
  const l: Record<string, string> = { new: "Novo", whatsapp: "WhatsApp", contacted: "Contatado", qualified: "Qualificado", converted: "Convertido" };
  return <p className={`rounded-full px-2.5 py-1 text-xs font-medium inline-block ${s[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>{l[status] || status}</p>;
}
