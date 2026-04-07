"use client";

import { useEffect, useState, useCallback } from "react";

type Instance = {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  qrCode: string | null;
  aiEnabled: boolean;
  aiPrompt: string | null;
  aiModel: string;
  welcomeMessage: string | null;
  _count: { conversations: number };
};

type Conversation = {
  id: number;
  contactPhone: string;
  contactName: string | null;
  mode: string;
  status: string;
  updatedAt: string;
  instance: { name: string; phone: string | null };
  messages: { content: string; sender: string }[];
  _count: { messages: number };
};

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

type ConversationDetail = {
  id: number;
  contactPhone: string;
  contactName: string | null;
  mode: string;
  instance: { name: string; aiEnabled: boolean };
  messages: Message[];
};

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [view, setView] = useState<"instances" | "conversations" | "chat">("instances");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Instance | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [filterInstanceId, setFilterInstanceId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadInstances = useCallback(async () => {
    const res = await fetch("/api/whatsapp/instances");
    if (res.ok) setInstances(await res.json());
  }, []);

  const loadConversations = useCallback(async (instanceId?: number | null) => {
    const url = instanceId
      ? `/api/whatsapp/conversations?instanceId=${instanceId}`
      : "/api/whatsapp/conversations";
    const res = await fetch(url);
    setConversations(await res.json());
  }, []);

  const loadChat = useCallback(async (conversationId: number) => {
    const res = await fetch(`/api/whatsapp/conversations/${conversationId}`);
    setActiveConversation(await res.json());
  }, []);

  useEffect(() => {
    loadInstances();
    loadConversations();
  }, [loadInstances, loadConversations]);

  // Poll for new messages when in chat view
  useEffect(() => {
    if (view !== "chat" || !activeConversation) return;
    const interval = setInterval(() => loadChat(activeConversation.id), 3000);
    return () => clearInterval(interval);
  }, [view, activeConversation?.id, loadChat]);

  // Poll for QR code updates
  useEffect(() => {
    if (view !== "instances") return;
    const interval = setInterval(loadInstances, 5000);
    return () => clearInterval(interval);
  }, [view, loadInstances]);

  async function handleSendMessage() {
    if (!newMessage.trim() || !activeConversation) return;
    setSending(true);
    await fetch(`/api/whatsapp/conversations/${activeConversation.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newMessage }),
    });
    setNewMessage("");
    setSending(false);
    await loadChat(activeConversation.id);
  }

  async function handleTakeover(conversationId: number, mode: string) {
    await fetch(`/api/whatsapp/conversations/${conversationId}/takeover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (activeConversation?.id === conversationId) {
      await loadChat(conversationId);
    }
    await loadConversations(filterInstanceId);
  }

  async function handleInstanceAction(id: number, action: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/whatsapp/instances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      console.log(`[WA Action] ${action}:`, data);
    } catch (e) {
      console.error(`[WA Action] ${action} failed:`, e);
    }
    // Poll aggressively for QR code
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      await loadInstances();
    }
    setActionLoading(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-dark">WhatsApp</h2>
          <p className="text-text-muted text-sm mt-1">
            Gerencie instâncias, conversas e atendimento por IA
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView("instances"); loadInstances(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${view === "instances" ? "bg-primary text-white" : "bg-white text-text-muted border border-gray-200 hover:bg-gray-50"}`}
          >
            Instâncias
          </button>
          <button
            onClick={() => { setView("conversations"); loadConversations(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${view === "conversations" || view === "chat" ? "bg-primary text-white" : "bg-white text-text-muted border border-gray-200 hover:bg-gray-50"}`}
          >
            Conversas
          </button>
        </div>
      </div>

      {/* === INSTANCES VIEW === */}
      {view === "instances" && (
        <div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-5 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-3 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova Instância
          </button>

          {showCreateForm && (
            <CreateInstanceForm
              onClose={() => setShowCreateForm(false)}
              onCreated={() => { setShowCreateForm(false); loadInstances(); }}
            />
          )}

          {showEditForm && (
            <EditInstanceForm
              instance={showEditForm}
              onClose={() => setShowEditForm(null)}
              onSaved={() => { setShowEditForm(null); loadInstances(); }}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {instances.map((inst) => (
              <div key={inst.id} className="bg-white rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-text-dark">{inst.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {inst.phone || "Não conectado"}
                    </p>
                  </div>
                  <StatusDot status={inst.status} />
                </div>

                {/* QR Code */}
                {inst.status === "qr_code" && inst.qrCode && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-text-muted mb-2">Escaneie o QR Code no WhatsApp</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inst.qrCode)}`}
                      alt="QR Code"
                      className="mx-auto rounded"
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                  <span className={`px-2 py-0.5 rounded-full ${inst.aiEnabled ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                    {inst.aiEnabled ? "IA Ativa" : "IA Desligada"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {inst._count.conversations} conversas
                  </span>
                </div>

                <div className="flex gap-2">
                  {inst.status === "disconnected" && (
                    <button
                      onClick={() => handleInstanceAction(inst.id, "connect")}
                      disabled={actionLoading === inst.id}
                      className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50"
                    >
                      {actionLoading === inst.id ? "Conectando..." : "Conectar"}
                    </button>
                  )}
                  {inst.status === "qr_code" && (
                    <button
                      onClick={() => handleInstanceAction(inst.id, "disconnect")}
                      className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 text-text-muted hover:bg-gray-200 transition"
                    >
                      Cancelar
                    </button>
                  )}
                  {inst.status === "connected" && (
                    <>
                      <button
                        onClick={() => { setFilterInstanceId(inst.id); setView("conversations"); loadConversations(inst.id); }}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                      >
                        Ver Conversas
                      </button>
                      <button
                        onClick={() => handleInstanceAction(inst.id, "disconnect")}
                        className="px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        Desconectar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowEditForm(inst)}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 text-text-muted hover:bg-gray-200 transition"
                  >
                    Config
                  </button>
                </div>
              </div>
            ))}

            {instances.length === 0 && (
              <div className="col-span-full text-center py-16 text-text-muted">
                Nenhuma instância criada. Clique em "Nova Instância" para começar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* === CONVERSATIONS VIEW === */}
      {view === "conversations" && (
        <div className="flex gap-5 h-[calc(100vh-220px)]">
          {/* Conversation list */}
          <div className="w-96 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-text-dark text-sm">Conversas</h3>
              {filterInstanceId && (
                <button onClick={() => { setFilterInstanceId(null); loadConversations(); }} className="text-xs text-primary">
                  Ver todas
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { loadChat(conv.id); setView("chat"); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${activeConversation?.id === conv.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-text-dark">
                      {conv.contactName || conv.contactPhone}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${conv.mode === "ai" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {conv.mode === "ai" ? "IA" : "Humano"}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {conv.messages[0]?.content || "Sem mensagens"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-text-muted">{conv.instance.name}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(conv.updatedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="p-4 text-center text-text-muted text-sm">Nenhuma conversa ainda.</p>
              )}
            </div>
          </div>

          {/* Empty state */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 flex items-center justify-center">
            <p className="text-text-muted">Selecione uma conversa para visualizar</p>
          </div>
        </div>
      )}

      {/* === CHAT VIEW === */}
      {view === "chat" && activeConversation && (
        <div className="flex gap-5 h-[calc(100vh-220px)]">
          {/* Conversation list (sidebar) */}
          <div className="w-80 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-text-dark text-sm">Conversas</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadChat(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${activeConversation.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-text-dark truncate">
                      {conv.contactName || conv.contactPhone}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${conv.mode === "ai" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {conv.mode === "ai" ? "IA" : "H"}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {conv.messages[0]?.content || ""}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-dark">
                  {activeConversation.contactName || activeConversation.contactPhone}
                </h3>
                <p className="text-xs text-text-muted">
                  +{activeConversation.contactPhone} · {activeConversation.instance.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTakeover(activeConversation.id, activeConversation.mode === "ai" ? "human" : "ai")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeConversation.mode === "ai"
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  {activeConversation.mode === "ai" ? "Assumir Conversa" : "Devolver p/ IA"}
                </button>
                <button
                  onClick={() => setView("conversations")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: "#f0f2f5" }}>
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "contact" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "contact"
                        ? "bg-white text-text-dark rounded-bl-md"
                        : msg.sender === "ai"
                          ? "bg-purple-100 text-purple-900 rounded-br-md"
                          : "bg-primary text-white rounded-br-md"
                    }`}
                  >
                    {msg.sender !== "contact" && (
                      <span className="text-[10px] font-semibold opacity-70 block mb-0.5">
                        {msg.sender === "ai" ? "IA" : "Atendente"}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[10px] opacity-50 block text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-gray-50">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={activeConversation.mode === "ai" ? "IA respondendo... digite para enviar como humano" : "Digite sua mensagem..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Sub-components ===

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: "bg-green-400",
    qr_code: "bg-yellow-400 animate-pulse",
    disconnected: "bg-gray-300",
  };

  const labels: Record<string, string> = {
    connected: "Conectado",
    qr_code: "Aguardando QR",
    disconnected: "Desconectado",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-gray-300"}`} />
      <span className="text-xs text-text-muted">{labels[status] || status}</span>
    </div>
  );
}

function CreateInstanceForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/whatsapp/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, welcomeMessage: welcomeMessage || null }),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="mb-5 bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-dark">Nova Instância WhatsApp</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-dark">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Nome da instância</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex: Atendimento Principal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Mensagem de boas-vindas (opcional)</label>
          <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Olá! Bem-vindo, como posso ajudar?" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-50">
            {saving ? "Criando..." : "Criar Instância"}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-text-muted rounded-xl text-sm hover:bg-gray-200 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function EditInstanceForm({ instance, onClose, onSaved }: { instance: Instance; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(instance.name);
  const [welcomeMessage, setWelcomeMessage] = useState(instance.welcomeMessage || "");
  const [aiEnabled, setAiEnabled] = useState(instance.aiEnabled);
  const [aiPrompt, setAiPrompt] = useState(instance.aiPrompt || "");
  const [aiModel, setAiModel] = useState(instance.aiModel);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/whatsapp/instances/${instance.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, welcomeMessage, aiEnabled, aiPrompt, aiModel }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="mb-5 bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-dark">Configurar: {instance.name}</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-dark">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Mensagem de boas-vindas</label>
          <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        {/* AI Config */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-text-dark">Agente de IA</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {aiEnabled && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-text-muted mb-1">Modelo</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (rápido)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (mais rápido)</option>
                  <option value="claude-opus-4-6">Claude Opus 4.6 (mais inteligente)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Prompt de treinamento
                  <span className="text-text-muted font-normal"> — instrua a IA sobre como responder</span>
                </label>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                  placeholder={`Você é um assistente da empresa "Nome".
Responda de forma educada e objetiva.
Nossos serviços são: ...
Nosso horário é: ...
Se não souber, transfira para um humano.`} />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-text-muted rounded-xl text-sm hover:bg-gray-200 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
