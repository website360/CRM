"use client";

import { useState } from "react";

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  status: string;
  notes: string | null;
  metadata: unknown;
  createdAt: string;
};

const tabs = [
  { key: "all", label: "Todos" },
  { key: "forms", label: "Formulários" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function LeadsTabs({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = leads.filter((lead) => {
    if (activeTab === "all") return true;
    if (activeTab === "whatsapp") return lead.status === "whatsapp";
    if (activeTab === "forms") return lead.status !== "whatsapp";
    return true;
  });

  const counts = {
    all: leads.length,
    forms: leads.filter((l) => l.status !== "whatsapp").length,
    whatsapp: leads.filter((l) => l.status === "whatsapp").length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
      {/* Tabs */}
      <div className="px-6 pt-5 pb-0 border-b border-gray-50">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-text-muted hover:text-text-dark hover:bg-gray-50"
              }`}
            >
              {tab.key === "whatsapp" && <WhatsAppIcon />}
              {tab.key === "forms" && <FormIcon />}
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-text-muted"
                }`}
              >
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Nome</th>
              <th className="px-6 py-4 font-medium">Email</th>
              {activeTab !== "whatsapp" && (
                <th className="px-6 py-4 font-medium">Telefone</th>
              )}
              <th className="px-6 py-4 font-medium">Fonte</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">
                {activeTab === "whatsapp" ? "Detalhes" : "Extras"}
              </th>
              <th className="px-6 py-4 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={activeTab === "whatsapp" ? 6 : 7}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                      {activeTab === "whatsapp" ? (
                        <WhatsAppIcon size={28} muted />
                      ) : (
                        <svg
                          className="w-7 h-7 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-text-muted">
                      {activeTab === "whatsapp"
                        ? "Nenhum clique no WhatsApp registrado."
                        : activeTab === "forms"
                          ? "Nenhum lead de formulário ainda."
                          : "Nenhum lead cadastrado ainda."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-gray-50 hover:bg-gray-50/50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          lead.status === "whatsapp"
                            ? "bg-green-50"
                            : "bg-primary/10"
                        }`}
                      >
                        {lead.status === "whatsapp" ? (
                          <WhatsAppIcon size={14} />
                        ) : (
                          <span className="text-primary text-xs font-bold">
                            {lead.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-text-dark">
                        {lead.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {lead.email.endsWith("@click.track") ? (
                      <span className="text-xs text-text-muted italic">
                        anônimo
                      </span>
                    ) : (
                      lead.email
                    )}
                  </td>
                  {activeTab !== "whatsapp" && (
                    <td className="px-6 py-4 text-text-muted">
                      {lead.phone ?? "-"}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-bg-body rounded-lg text-xs font-medium text-text-muted">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4">
                    <MetadataCell metadata={lead.metadata} notes={lead.notes} />
                  </td>
                  <td className="px-6 py-4 text-text-muted text-xs">
                    {new Date(lead.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetadataCell({
  metadata,
  notes,
}: {
  metadata: unknown;
  notes: string | null;
}) {
  const meta = metadata as Record<string, string> | null;
  const entries = meta ? Object.entries(meta) : [];
  const hasData = entries.length > 0 || notes;

  if (!hasData) return <span className="text-text-muted">-</span>;

  return (
    <div className="space-y-1 max-w-xs">
      {notes && (
        <div className="text-xs">
          <span className="font-medium text-text-dark">notas:</span>{" "}
          <span className="text-text-muted">{notes}</span>
        </div>
      )}
      {entries.map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium text-text-dark">{key}:</span>{" "}
          <span className="text-text-muted">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    whatsapp: "bg-green-50 text-green-600",
    contacted: "bg-blue-50 text-blue-600",
    qualified: "bg-orange-50 text-orange-600",
    converted: "bg-purple-50 text-purple-600",
  };

  const labels: Record<string, string> = {
    new: "Novo",
    whatsapp: "WhatsApp",
    contacted: "Contatado",
    qualified: "Qualificado",
    converted: "Convertido",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] || status}
    </span>
  );
}

function WhatsAppIcon({
  size = 14,
  muted = false,
}: {
  size?: number;
  muted?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={muted ? "text-gray-300" : "text-green-500"}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
