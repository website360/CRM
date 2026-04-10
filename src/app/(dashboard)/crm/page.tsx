"use client";

import { useEffect, useState, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/components/Toast";

type Deal = {
  id: number; stageId: number; title: string; value: number | null;
  contactName: string | null; contactPhone: string | null; contactEmail: string | null;
  notes: string | null; tags: string | null; metadata: Record<string, string> | null;
  position: number; createdAt: string; updatedAt: string;
};

type Stage = { id: number; name: string; color: string; position: number; deals: Deal[]; _count: { deals: number } };
type Pipeline = { id: number; name: string; stages: Stage[] };

export default function CRMPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<number>(0);
  const [dragDeal, setDragDeal] = useState<Deal | null>(null);
  const [showAddDeal, setShowAddDeal] = useState<number | null>(null);
  const [showEditDeal, setShowEditDeal] = useState<Deal | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [showEditStage, setShowEditStage] = useState<Stage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number; name: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = useCallback(async () => {
    const res = await fetch("/api/pipelines");
    if (res.ok) {
      const data = await res.json();
      setPipelines(data);
      if (data.length > 0 && activePipeline === 0) setActivePipeline(data[0].id);
    }
  }, [activePipeline]);

  useEffect(() => { load(); }, [load]);

  const pipeline = pipelines.find((p) => p.id === activePipeline);

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as number;
    const deal = pipeline?.stages.flatMap((s) => s.deals).find((d) => d.id === id);
    setDragDeal(deal || null);
  }

  function handleDragOver(_event: DragOverEvent) {
    // Visual feedback handled by useDroppable isOver
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragDeal(null);
    if (!over || !pipeline) return;

    const dealId = active.id as number;
    const overId = over.id as string;

    // The droppable IDs are "stage-{id}"
    let targetStageId: number | null = null;

    if (typeof overId === 'string' && overId.startsWith('stage-')) {
      targetStageId = parseInt(overId.replace('stage-', ''));
    } else {
      // Dropped on a deal card - find its stage
      const overIdNum = typeof overId === 'string' ? parseInt(overId) : overId;
      const overDeal = pipeline.stages.flatMap((s) => s.deals).find((d) => d.id === overIdNum);
      if (overDeal) targetStageId = overDeal.stageId;
    }

    if (!targetStageId) return;

    // Check if deal is already in this stage
    const deal = pipeline.stages.flatMap((s) => s.deals).find((d) => d.id === dealId);
    if (deal && deal.stageId === targetStageId) return;

    // Optimistic update
    setPipelines((prev) => prev.map((p) => {
      if (p.id !== activePipeline) return p;
      return {
        ...p,
        stages: p.stages.map((s) => ({
          ...s,
          deals: s.id === targetStageId
            ? [...s.deals.filter((d) => d.id !== dealId), { ...deal!, stageId: targetStageId! }]
            : s.deals.filter((d) => d.id !== dealId),
        })),
      };
    }));

    await fetch(`/api/deals/${dealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", stageId: targetStageId, position: 0 }),
    });
    load();
  }

  async function handleAddDeal(stageId: number, data: Record<string, unknown>) {
    await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId, ...data }) });
    setShowAddDeal(null);
    toast("Negócio criado!");
    load();
  }

  async function handleUpdateDeal(dealId: number, data: Record<string, unknown>) {
    await fetch(`/api/deals/${dealId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setShowEditDeal(null);
    toast("Negócio atualizado!");
    load();
  }

  async function handleDelete(type: string, id: number) {
    if (type === "deal") await fetch(`/api/deals/${id}`, { method: "DELETE" });
    if (type === "stage") await fetch(`/api/pipelines/${activePipeline}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteStage", stageId: id }) });
    setConfirmDelete(null);
    toast("Deletado!");
    load();
  }

  async function handleAddStage(name: string, color: string) {
    await fetch(`/api/pipelines/${activePipeline}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "addStage", name, color }) });
    setShowAddStage(false);
    toast("Etapa criada!");
    load();
  }

  async function handleUpdateStage(stageId: number, name: string, color: string) {
    await fetch(`/api/pipelines/${activePipeline}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateStage", stageId, name, color }) });
    setShowEditStage(null);
    load();
  }

  const totalValue = pipeline?.stages.flatMap((s) => s.deals).reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const totalDeals = pipeline?.stages.flatMap((s) => s.deals).length || 0;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">CRM</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalDeals} negócios · R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button onClick={() => setShowAddStage(true)}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          + Etapa
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {pipeline?.stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage}
                onAddDeal={() => setShowAddDeal(stage.id)}
                onEditDeal={setShowEditDeal}
                onEditStage={() => setShowEditStage(stage)}
                onDeleteStage={() => setConfirmDelete({ type: "stage", id: stage.id, name: stage.name })}
                onDeleteDeal={(d) => setConfirmDelete({ type: "deal", id: d.id, name: d.title })}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragDeal && (
            <div className="rounded-xl border border-brand-300 bg-white dark:bg-gray-800 p-3 shadow-xl w-72 rotate-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{dragDeal.title}</p>
              {dragDeal.contactName && <p className="text-xs text-gray-500 mt-0.5">{dragDeal.contactName}</p>}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showAddDeal !== null && <DealFormModal stageId={showAddDeal} onSave={(data) => handleAddDeal(showAddDeal, data)} onClose={() => setShowAddDeal(null)} />}
      {showEditDeal && <DealFormModal deal={showEditDeal} stageId={showEditDeal.stageId} onSave={(data) => handleUpdateDeal(showEditDeal.id, data)} onClose={() => setShowEditDeal(null)} onDelete={() => { setShowEditDeal(null); setConfirmDelete({ type: "deal", id: showEditDeal.id, name: showEditDeal.title }); }} />}
      {showAddStage && <StageFormModal onSave={handleAddStage} onClose={() => setShowAddStage(false)} />}
      {showEditStage && <StageFormModal stage={showEditStage} onSave={(name, color) => handleUpdateStage(showEditStage.id, name, color)} onClose={() => setShowEditStage(null)} />}
      {confirmDelete && <ConfirmModal title={`Deletar ${confirmDelete.type === "deal" ? "negócio" : "etapa"}`} message={`Tem certeza que deseja deletar "${confirmDelete.name}"?`} confirmText="Deletar" variant="danger" onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.type, confirmDelete.id)} />}
    </div>
  );
}

// === Stage Column with Droppable ===
function StageColumn({ stage, onAddDeal, onEditDeal, onEditStage, onDeleteStage, onDeleteDeal }: {
  stage: Stage; onAddDeal: () => void; onEditDeal: (d: Deal) => void;
  onEditStage: () => void; onDeleteStage: () => void; onDeleteDeal: (d: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });

  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{stage.name}</span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{stage.deals.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEditStage} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={onDeleteStage} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[100px] rounded-xl p-2 transition-colors ${isOver ? 'bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-300 dark:ring-brand-500/30' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
        {stage.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} stageColor={stage.color} onClick={() => onEditDeal(deal)} onDelete={() => onDeleteDeal(deal)} />
        ))}
        {stage.deals.length === 0 && !isOver && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-8">Arraste um negócio aqui</p>
        )}
      </div>

      <button onClick={onAddDeal}
        className="mt-2 w-full py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition flex items-center justify-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Adicionar
      </button>
    </div>
  );
}

// === Deal Card (Draggable) ===
function DealCard({ deal, stageColor, onClick, onDelete }: { deal: Deal; stageColor: string; onClick: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-3 cursor-grab active:cursor-grabbing hover:shadow-theme-sm transition group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{deal.title}</p>
          {deal.contactName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{deal.contactName}</p>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {deal.value != null && deal.value > 0 && (
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90">R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        )}
        {deal.tags && deal.tags.split(",").map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: stageColor + '20', color: stageColor }}>
            {tag.trim()}
          </span>
        ))}
      </div>
      {deal.contactPhone && (
        <div className="flex items-center gap-1 mt-2">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          <span className="text-[11px] text-gray-400">{deal.contactPhone}</span>
        </div>
      )}
      {deal.notes && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">{deal.notes}</p>}
      {deal.metadata && Object.keys(deal.metadata).length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[11px] text-gray-400">{Object.keys(deal.metadata).length} campos extras</span>
        </div>
      )}
    </div>
  );
}

// === Deal Form Modal ===
function DealFormModal({ deal, stageId, onSave, onClose, onDelete }: { deal?: Deal; stageId: number; onSave: (data: Record<string, unknown>) => void; onClose: () => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(deal?.title || "");
  const [value, setValue] = useState(deal?.value?.toString() || "");
  const [contactName, setContactName] = useState(deal?.contactName || "");
  const [contactPhone, setContactPhone] = useState(deal?.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(deal?.contactEmail || "");
  const [notes, setNotes] = useState(deal?.notes || "");
  const [tags, setTags] = useState(deal?.tags || "");
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{deal ? "Editar Negócio" : "Novo Negócio"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Título *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="Nome do negócio" /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor (R$)</label><input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="0.01" className={inp} placeholder="0.00" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contato</label><input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inp} placeholder="Nome" /></div>
            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Telefone</label><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inp} placeholder="+55..." /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label><input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inp} placeholder="email@..." /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags (separadas por vírgula)</label><input value={tags} onChange={(e) => setTags(e.target.value)} className={inp} placeholder="quente, urgente" /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Observações</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inp + " resize-none"} /></div>

          {/* Metadata (read-only from lead) */}
          {deal?.metadata && Object.keys(deal.metadata).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Dados do formulário</label>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-1.5">
                {Object.entries(deal.metadata).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{key}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 text-right break-words">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button onClick={() => { if (!title.trim()) return; onSave({ title, value: value ? parseFloat(value) : null, contactName, contactPhone, contactEmail, notes, tags }); }}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">{deal ? "Salvar" : "Criar Negócio"}</button>
          {onDelete && <button onClick={onDelete} className="px-4 py-2.5 rounded-lg bg-error-50 dark:bg-error-500/10 text-error-500 text-sm font-medium hover:bg-error-100 dark:hover:bg-error-500/20 transition">Deletar</button>}
        </div>
      </div>
    </div>
  );
}

// === Stage Form Modal ===
function StageFormModal({ stage, onSave, onClose }: { stage?: Stage; onSave: (name: string, color: string) => void; onClose: () => void }) {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || "#465FFF");
  const colors = ["#465FFF", "#0BA5EC", "#12B76A", "#F79009", "#7A5AF8", "#EE46BC", "#F04438", "#344054"];
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">{stage ? "Editar Etapa" : "Nova Etapa"}</h3>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Nome da etapa" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-lg transition ${color === c ? "ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-gray-900" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => { if (!name.trim()) return; onSave(name, color); }} className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">{stage ? "Salvar" : "Criar Etapa"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
