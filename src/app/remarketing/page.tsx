"use client";

import { useEffect, useState, useCallback } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/components/Toast";

type Audience = { id: number; name: string; description: string | null; filters: Record<string, string[]>; matchCount: number; _count: { campaigns: number } };
type Campaign = { id: number; name: string; description: string | null; type: string; status: string; audienceId: number | null; channelType: string | null; channelId: number | null; message: string | null; sentCount: number; replyCount: number; createdAt: string; audience: { name: string; matchCount: number } | null; _count: { actions: number } };
type Channel = { id: number; name: string; type: string };

export default function RemarketingPage() {
  const [tab, setTab] = useState<"campaigns" | "audiences">("campaigns");
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAudienceForm, setShowAudienceForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editAudience, setEditAudience] = useState<Audience | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number; name: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [aRes, cRes, chRes] = await Promise.all([fetch("/api/audiences"), fetch("/api/campaigns"), fetch("/api/channels")]);
    if (aRes.ok) setAudiences(await aRes.json());
    if (cRes.ok) setCampaigns(await cRes.json());
    if (chRes.ok) setChannels(await chRes.json());
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleDelete(type: string, id: number) {
    await fetch(`/api/${type === "audience" ? "audiences" : "campaigns"}/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    toast("Deletado!");
    loadAll();
  }

  async function handleDuplicateAudience(audience: Audience) {
    await fetch("/api/audiences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${audience.name} (cópia)`, description: audience.description, filters: audience.filters }),
    });
    toast("Audiência duplicada!");
    loadAll();
  }

  async function handleDuplicateCampaign(campaign: Campaign) {
    await fetch("/api/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${campaign.name} (cópia)`, description: campaign.description, type: campaign.type, audienceId: campaign.audienceId, channelType: campaign.channelType, channelId: campaign.channelId, message: campaign.message }),
    });
    toast("Campanha duplicada!");
    loadAll();
  }

  async function handleSendCampaign(campaignId: number) {
    toast("Enviando campanha...", "info");
    const res = await fetch("/api/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", id: campaignId }),
    });
    const data = await res.json();
    if (data.ok) toast(`Campanha enviada para ${data.sentCount} contatos!`);
    else toast(data.error || "Erro ao enviar", "error");
    loadAll();
  }

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.replyCount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Campanhas", value: campaigns.length, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/10", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /> },
          { label: "Audiências", value: audiences.length, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
          { label: "Mensagens Enviadas", value: totalSent, color: "text-success-500", bg: "bg-success-50 dark:bg-success-500/10", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
          { label: "Respostas", value: totalReplies, color: "text-warning-500", bg: "bg-warning-50 dark:bg-warning-500/10", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
              <svg className={`w-5 h-5 ${s.color}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-800 dark:text-white/90">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[{ key: "campaigns", label: "Campanhas" }, { key: "audiences", label: "Audiências" }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${tab === t.key ? "bg-brand-500 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => tab === "campaigns" ? setShowCampaignForm(true) : setShowAudienceForm(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition">
          + {tab === "campaigns" ? "Nova Campanha" : "Nova Audiência"}
        </button>
      </div>

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] py-16 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma campanha criada ainda</p>
            </div>
          ) : campaigns.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{c.name}</h3>
                    <CampaignStatusBadge status={c.status} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase">{c.type}</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    {c.audience && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {c.audience.name} ({c.audience.matchCount})
                    </span>}
                    <span className="text-xs text-gray-400">Enviados: {c.sentCount}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleSendCampaign(c.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 hover:bg-success-100 dark:hover:bg-success-500/25 transition">
                    {c.status === "completed" ? "Reenviar" : "Enviar"}
                  </button>
                  <button onClick={() => setEditCampaign(c)} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDuplicateCampaign(c)} title="Duplicar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button onClick={() => setConfirmDelete({ type: "campaign", id: c.id, name: c.name })} title="Deletar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              {c.sentCount > 0 && c.audience && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span>{c.sentCount} de {c.audience.matchCount} enviados</span>
                    <span>{Math.round((c.sentCount / c.audience.matchCount) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(100, (c.sentCount / c.audience.matchCount) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audiences Tab */}
      {tab === "audiences" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {audiences.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] py-16 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma audiência criada ainda</p>
            </div>
          ) : audiences.map((a) => (
            <div key={a.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{a.name}</h3>
                  {a.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditAudience(a)} title="Editar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDuplicateAudience(a)} title="Duplicar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button onClick={() => setConfirmDelete({ type: "audience", id: a.id, name: a.name })} title="Deletar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-500">{a.matchCount}</p>
                    <p className="text-[10px] text-gray-400">contatos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-white/90">{a._count.campaigns}</p>
                    <p className="text-[10px] text-gray-400">campanhas</p>
                  </div>
                </div>
              </div>
              {/* Filter tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {a.filters?.sources?.map((s: string) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-500/10 text-brand-500 dark:text-brand-400">{s}</span>)}
                {a.filters?.statuses?.map((s: string) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAudienceForm && <AudienceFormModal onClose={() => setShowAudienceForm(false)} onSave={() => { setShowAudienceForm(false); loadAll(); }} />}
      {editAudience && <AudienceFormModal audience={editAudience} onClose={() => setEditAudience(null)} onSave={() => { setEditAudience(null); loadAll(); }} />}
      {showCampaignForm && <CampaignFormModal audiences={audiences} channels={channels} onClose={() => setShowCampaignForm(false)} onSave={() => { setShowCampaignForm(false); loadAll(); }} />}
      {editCampaign && <CampaignFormModal campaign={editCampaign} audiences={audiences} channels={channels} onClose={() => setEditCampaign(null)} onSave={() => { setEditCampaign(null); loadAll(); }} />}
      {confirmDelete && <ConfirmModal title="Deletar" message={`Tem certeza que deseja deletar "${confirmDelete.name}"?`} confirmText="Deletar" variant="danger" onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.type, confirmDelete.id)} />}
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    active: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
    paused: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    completed: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  };
  const l: Record<string, string> = { draft: "Rascunho", active: "Ativa", paused: "Pausada", completed: "Concluída" };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s[status] || s.draft}`}>{l[status] || status}</span>;
}

// === Audience Form ===
function AudienceFormModal({ audience, onClose, onSave }: { audience?: Audience; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(audience?.name || "");
  const [description, setDescription] = useState(audience?.description || "");
  const [selectedSources, setSelectedSources] = useState<string[]>(audience?.filters?.sources || []);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(audience?.filters?.statuses || []);
  const af = (audience?.filters || {}) as Record<string, unknown>;
  const [selectedStages, setSelectedStages] = useState<number[]>((af.stageIds as number[] | undefined) || []);
  const [selectedTags, setSelectedTags] = useState<string[]>((af.tags as string[] | undefined) || []);
  const [filterMode, setFilterMode] = useState<"crm" | "leads">((af.stageIds as unknown[] | undefined)?.length ? "crm" : "leads");
  const [stats, setStats] = useState<{ total: number; totalDeals: number; sources: { value: string; count: number }[]; statuses: { value: string; count: number; label: string }[]; stages: { id: number; name: string; color: string; pipelineName: string; count: number }[]; tags: { value: string; count: number }[] }>({ total: 0, totalDeals: 0, sources: [], statuses: [], stages: [], tags: [] });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  useEffect(() => { fetch("/api/leads/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);

  // Live preview count
  useEffect(() => {
    if (filterMode === "crm") {
      if (selectedStages.length === 0 && selectedTags.length === 0) { setPreviewCount(stats.totalDeals); return; }
      let count = 0;
      if (selectedStages.length > 0) count = selectedStages.reduce((s, id) => s + (stats.stages.find((x) => x.id === id)?.count || 0), 0);
      else count = stats.totalDeals;
      setPreviewCount(count);
    } else {
      if (selectedSources.length === 0 && selectedStatuses.length === 0) { setPreviewCount(stats.total); return; }
      let count = stats.total;
      if (selectedSources.length > 0) count = selectedSources.reduce((s, v) => s + (stats.sources.find((x) => x.value === v)?.count || 0), 0);
      setPreviewCount(count);
    }
  }, [selectedSources, selectedStatuses, selectedStages, selectedTags, stats, filterMode]);

  function toggleSource(source: string) { setSelectedSources((p) => p.includes(source) ? p.filter((s) => s !== source) : [...p, source]); }
  function toggleStatus(status: string) { setSelectedStatuses((p) => p.includes(status) ? p.filter((s) => s !== status) : [...p, status]); }
  function toggleStage(id: number) { setSelectedStages((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]); }
  function toggleTag(tag: string) { setSelectedTags((p) => p.includes(tag) ? p.filter((s) => s !== tag) : [...p, tag]); }

  async function handleSubmit() {
    if (!name.trim()) return;
    const filters = filterMode === "crm"
      ? { stageIds: selectedStages, tags: selectedTags }
      : { sources: selectedSources, statuses: selectedStatuses };
    const method = audience ? "PUT" : "POST";
    const url = audience ? `/api/audiences/${audience.id}` : "/api/audiences";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, filters }) });
    toast(audience ? "Audiência atualizada!" : "Audiência criada!");
    onSave();
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{audience ? "Editar Audiência" : "Nova Audiência"}</h3>
          {previewCount !== null && (
            <span className="text-sm font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full">
              {previewCount} contatos
            </span>
          )}
        </div>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Ex: Leads quentes do site" /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} className={inp} placeholder="Descrição opcional" /></div>

          {/* Mode toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Filtrar a partir de</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFilterMode("crm")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition ${filterMode === "crm" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                CRM (Pipeline)
                <span className="block text-[10px] opacity-60 mt-0.5">{stats.totalDeals} deals</span>
              </button>
              <button type="button" onClick={() => setFilterMode("leads")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition ${filterMode === "leads" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                Leads
                <span className="block text-[10px] opacity-60 mt-0.5">{stats.total} leads</span>
              </button>
            </div>
          </div>

          {/* CRM Stage filters */}
          {filterMode === "crm" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Etapas do Pipeline</label>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">Selecione as etapas para incluir na audiência</p>
                <div className="flex flex-wrap gap-2">
                  {stats.stages.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleStage(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                        selectedStages.includes(s.id)
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} <span className="opacity-60">({s.count})</span>
                    </button>
                  ))}
                  {stats.stages.length === 0 && <p className="text-xs text-gray-400">Nenhuma etapa no CRM</p>}
                </div>
              </div>
              {stats.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tags dos Deals</label>
                  <div className="flex flex-wrap gap-2">
                    {stats.tags.map((t) => (
                      <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          selectedTags.includes(t.value)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-500"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        }`}>
                        {t.value} <span className="opacity-60">({t.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Lead Source filters */}
          {filterMode === "leads" && (<>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Filtrar por Fonte</label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">De onde o lead veio (nenhum selecionado = todos)</p>
            <div className="flex flex-wrap gap-2">
              {stats.sources.map((s) => (
                <button key={s.value} type="button" onClick={() => toggleSource(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedSources.includes(s.value)
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}>
                  {s.value} <span className="opacity-60">({s.count})</span>
                </button>
              ))}
              {stats.sources.length === 0 && <p className="text-xs text-gray-400">Nenhum lead cadastrado ainda</p>}
            </div>
          </div>

          {/* Statuses */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Filtrar por Status</label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">Em que etapa o lead está (nenhum = todos)</p>
            <div className="flex flex-wrap gap-2">
              {stats.statuses.map((s) => {
                const statusColors: Record<string, string> = {
                  new: "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500",
                  whatsapp: "border-success-500 bg-success-50 dark:bg-success-500/10 text-success-600",
                  contacted: "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600",
                  qualified: "border-warning-500 bg-warning-50 dark:bg-warning-500/10 text-warning-600",
                  converted: "border-success-500 bg-success-50 dark:bg-success-500/10 text-success-600",
                };
                return (
                  <button key={s.value} type="button" onClick={() => toggleStatus(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      selectedStatuses.includes(s.value)
                        ? (statusColors[s.value] || "border-brand-500 bg-brand-50 text-brand-500")
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}>
                    {s.label} <span className="opacity-60">({s.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
          </>)}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handleSubmit} className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">{audience ? "Salvar" : "Criar Audiência"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// === Campaign Form ===
function CampaignFormModal({ campaign, audiences, channels, onClose, onSave }: { campaign?: Campaign; audiences: Audience[]; channels: Channel[]; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(campaign?.name || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [type, setType] = useState(campaign?.type || "manual");
  const [audienceId, setAudienceId] = useState<string>(campaign?.audienceId?.toString() || "");
  const [channelId, setChannelId] = useState<string>(campaign?.channelId?.toString() || "");
  const [message, setMessage] = useState(campaign?.message || "");
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  async function handleSubmit() {
    if (!name.trim()) return;
    const selectedChannel = channels.find((c) => c.id === parseInt(channelId));
    const payload = {
      name, description, type,
      audienceId: audienceId ? parseInt(audienceId) : null,
      channelId: channelId ? parseInt(channelId) : null,
      channelType: selectedChannel?.type || null,
      message,
    };
    if (campaign) {
      await fetch(`/api/campaigns/${campaign.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast("Campanha atualizada!");
    } else {
      await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast("Campanha criada!");
    }
    onSave();
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">{campaign ? "Editar Campanha" : "Nova Campanha"}</h3>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Nome da campanha" /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
                <option value="manual">Manual</option>
                <option value="automated">Automatizada</option>
                <option value="drip">Drip (sequência)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Audiência</label>
              <select value={audienceId} onChange={(e) => setAudienceId(e.target.value)} className={inp}>
                <option value="">Selecione...</option>
                {audiences.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.matchCount})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Canal de envio</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inp}>
              <option value="">Selecione...</option>
              {channels.filter((c) => c.type === 'whatsapp').map((c) => <option key={c.id} value={c.id}>{c.name} (WhatsApp)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mensagem</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={inp + " resize-none"} placeholder="Olá {nome}! Temos uma novidade..." />
            <p className="text-[11px] text-gray-400 mt-1">Use <code className="text-brand-500">{'{nome}'}</code> e <code className="text-brand-500">{'{telefone}'}</code> para personalizar</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handleSubmit} className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">{campaign ? "Salvar" : "Criar Campanha"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
