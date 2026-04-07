"use client";
import { useState } from "react";

type Lead = { id: number; name: string; email: string; phone: string | null; source: string; status: string; notes: string | null; metadata: unknown; createdAt: string; };

const tabs = [
  { key: "all", label: "Todos" },
  { key: "forms", label: "Formulários" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function LeadsTabs({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const filtered = leads.filter((l) => activeTab === "all" ? true : activeTab === "whatsapp" ? l.status === "whatsapp" : l.status !== "whatsapp");
  const counts = { all: leads.length, forms: leads.filter((l) => l.status !== "whatsapp").length, whatsapp: leads.filter((l) => l.status === "whatsapp").length };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 px-4 pt-4 sm:px-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${activeTab === tab.key ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}>
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === tab.key ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>
      <div className="w-full overflow-x-auto px-4 pb-3 sm:px-6">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Nome</p></th>
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p></th>
              {activeTab !== "whatsapp" && <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Telefone</p></th>}
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fonte</p></th>
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p></th>
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">{activeTab === "whatsapp" ? "Detalhes" : "Extras"}</p></th>
              <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Data</p></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={activeTab === "whatsapp" ? 6 : 7} className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                {activeTab === "whatsapp" ? "Nenhum clique no WhatsApp registrado." : activeTab === "forms" ? "Nenhum lead de formulário ainda." : "Nenhum lead cadastrado ainda."}
              </td></tr>
            ) : filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${lead.status === "whatsapp" ? "bg-success-50 dark:bg-success-500/10" : "bg-gray-100 dark:bg-gray-800"}`}>
                      {lead.status === "whatsapp" ? (
                        <svg className="fill-success-500" width="16" height="16" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35"/></svg>
                      ) : <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{lead.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{lead.name}</p>
                  </div>
                </td>
                <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.email.endsWith("@click.track") ? <span className="italic">anônimo</span> : lead.email}</p></td>
                {activeTab !== "whatsapp" && <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.phone ?? "-"}</p></td>}
                <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.source}</p></td>
                <td className="py-3"><StatusBadge status={lead.status} /></td>
                <td className="py-3"><MetadataCell metadata={lead.metadata} notes={lead.notes} /></td>
                <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{new Date(lead.createdAt).toLocaleString("pt-BR")}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetadataCell({ metadata, notes }: { metadata: unknown; notes: string | null }) {
  const meta = metadata as Record<string, string> | null;
  const entries = meta ? Object.entries(meta) : [];
  if (!entries.length && !notes) return <span className="text-sm text-gray-400 dark:text-gray-500">-</span>;
  return (
    <div className="space-y-0.5 max-w-xs">
      {notes && <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-700 dark:text-gray-300">notas:</span> {notes}</p>}
      {entries.map(([k, v]) => <p key={k} className="text-xs text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-700 dark:text-gray-300">{k}:</span> {String(v)}</p>)}
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
  return <p className={`rounded-full px-2 py-0.5 text-xs font-medium inline-block ${s[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>{l[status] || status}</p>;
}
