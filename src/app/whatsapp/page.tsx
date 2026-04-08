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
    const res = await fetch("/api/channels");
    if (res.ok) setInstances(await res.json());
  }, []);

  const loadConversations = useCallback(async (channelId?: number | null) => {
    const url = channelId
      ? `/api/inbox?channelId=${channelId}`
      : "/api/inbox";
    const res = await fetch(url);
    if (res.ok) setConversations(await res.json());
  }, []);

  const loadChat = useCallback(async (conversationId: number) => {
    const res = await fetch(`/api/inbox/${conversationId}`);
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
    await fetch(`/api/inbox/${activeConversation.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newMessage }),
    });
    setNewMessage("");
    setSending(false);
    await loadChat(activeConversation.id);
  }

  async function handleTakeover(conversationId: number, mode: string) {
    await fetch(`/api/inbox/${conversationId}/takeover`, {
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
      const res = await fetch(`/api/channels/${id}`, {
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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Canais</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie WhatsApp, Instagram e outros canais de atendimento
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView("instances"); loadInstances(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === "instances" ? "bg-brand-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 dark:hover:bg-white/[0.03]"}`}
          >
            Instâncias
          </button>
          <button
            onClick={() => { setView("conversations"); loadConversations(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === "conversations" || view === "chat" ? "bg-brand-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 dark:hover:bg-white/[0.03]"}`}
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
            className="mb-5 flex items-center gap-2 bg-brand-500 hover:bg-brand-500-dark text-white font-semibold px-5 py-3 rounded-xl transition"
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
              <div key={inst.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{inst.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {inst.phone || "Não conectado"} · <span className="font-mono select-all">ID: {inst.id}</span>
                    </p>
                  </div>
                  <StatusDot status={inst.status} />
                </div>

                {/* QR Code */}
                {inst.status === "qr_code" && inst.qrCode && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Escaneie o QR Code no WhatsApp</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inst.qrCode)}`}
                      alt="QR Code"
                      className="mx-auto rounded"
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
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
                      className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-500/10 text-primary hover:bg-brand-100 dark:hover:bg-brand-500/20 transition disabled:opacity-50"
                    >
                      {actionLoading === inst.id ? "Conectando..." : "Conectar"}
                    </button>
                  )}
                  {inst.status === "qr_code" && (
                    <button
                      onClick={() => handleInstanceAction(inst.id, "disconnect")}
                      className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition"
                    >
                      Cancelar
                    </button>
                  )}
                  {inst.status === "connected" && (
                    <>
                      <button
                        onClick={() => { setFilterInstanceId(inst.id); setView("conversations"); loadConversations(inst.id); }}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-500/10 text-primary hover:bg-brand-100 dark:hover:bg-brand-500/20 transition"
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
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Config
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Deletar canal "${inst.name}"? Todas as conversas serão perdidas.`)) return;
                      await fetch(`/api/channels/${inst.id}`, { method: 'DELETE' });
                      loadInstances();
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-error-50 dark:bg-error-500/10 text-error-500 hover:bg-error-100 dark:hover:bg-error-500/20 transition"
                    title="Deletar canal"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}

            {instances.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
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
          <div className="w-96 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white/90 text-sm">Conversas</h3>
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
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition ${activeConversation?.id === conv.id ? "bg-brand-500/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800 dark:text-white/90">
                      {conv.contactName || conv.contactPhone}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${conv.mode === "ai" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {conv.mode === "ai" ? "IA" : "Humano"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {conv.messages[0]?.content || "Sem mensagens"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{conv.instance.name}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(conv.updatedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Nenhuma conversa ainda.</p>
              )}
            </div>
          </div>

          {/* Empty state */}
          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Selecione uma conversa para visualizar</p>
          </div>
        </div>
      )}

      {/* === CHAT VIEW === */}
      {view === "chat" && activeConversation && (
        <div className="flex gap-5 h-[calc(100vh-220px)]">
          {/* Conversation list (sidebar) */}
          <div className="w-80 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-800 dark:text-white/90 text-sm">Conversas</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadChat(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition ${activeConversation.id === conv.id ? "bg-brand-500/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-gray-800 dark:text-white/90 truncate">
                      {conv.contactName || conv.contactPhone}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${conv.mode === "ai" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {conv.mode === "ai" ? "IA" : "H"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {conv.messages[0]?.content || ""}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">
                  {activeConversation.contactName || activeConversation.contactPhone}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                        ? "bg-white text-gray-800 dark:text-white/90 rounded-bl-md"
                        : msg.sender === "ai"
                          ? "bg-purple-100 text-purple-900 rounded-br-md"
                          : "bg-brand-500 text-white rounded-br-md"
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
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
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
                  className="px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-500-dark transition disabled:opacity-50"
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
      <span className="text-xs text-gray-500 dark:text-gray-400">{labels[status] || status}</span>
    </div>
  );
}

function CreateInstanceForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState("whatsapp");
  const [name, setName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [widgetColor, setWidgetColor] = useState("#465FFF");
  const [widgetTitle, setWidgetTitle] = useState("Suporte");
  const [widgetSubtitle, setWidgetSubtitle] = useState("Estamos online");
  const [agentName, setAgentName] = useState("Atendente");
  const [agentAvatar, setAgentAvatar] = useState("");
  const [closeMessage, setCloseMessage] = useState("Obrigado pelo contato! Até a próxima.");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    let config: Record<string, unknown> | undefined;
    if (type === "instagram") config = { accessToken, pageId };
    if (type === "webchat") config = { color: widgetColor, title: widgetTitle, subtitle: widgetSubtitle, agentName, agentAvatar: agentAvatar || null, closeMessage };
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, welcomeMessage: welcomeMessage || null, config }),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="mb-5 bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">Novo Canal</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de canal</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10">
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="webchat">Chat para Site (Widget)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do canal</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            placeholder={type === "whatsapp" ? "Ex: Atendimento Principal" : "Ex: Instagram @empresa"} />
        </div>
        {type === "webchat" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cor do widget</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} className="w-10 h-10 rounded border-0 cursor-pointer" />
                  <input value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 font-mono focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do atendente</label>
                <input value={agentName} onChange={(e) => setAgentName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                  placeholder="Atendente" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título do chat</label>
                <input value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                  placeholder="Suporte" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subtítulo</label>
                <input value={widgetSubtitle} onChange={(e) => setWidgetSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                  placeholder="Estamos online" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Foto do atendente (URL)</label>
              <input value={agentAvatar} onChange={(e) => setAgentAvatar(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                placeholder="https://exemplo.com/foto.jpg (opcional)" />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Aparece ao lado das mensagens do atendente/IA no widget</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensagem de encerramento</label>
              <input value={closeMessage} onChange={(e) => setCloseMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                placeholder="Obrigado pelo contato! Até a próxima." />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Enviada ao cliente quando o atendente encerra a conversa</p>
            </div>
          </>
        )}
        {type === "instagram" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Page/IG User ID</label>
              <input value={pageId} onChange={(e) => setPageId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                placeholder="ID da página do Instagram" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Access Token (Meta Graph API)</label>
              <input value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 font-mono focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                placeholder="EAAxxxxxxx..." />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Obtenha em developers.facebook.com &gt; seu app &gt; Instagram Messaging</p>
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensagem de boas-vindas (opcional)</label>
          <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 resize-none"
            placeholder="Olá! Bem-vindo, como posso ajudar?" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
            {saving ? "Criando..." : "Criar Canal"}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">
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
    await fetch(`/api/channels/${instance.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, welcomeMessage, aiEnabled, aiPrompt, aiModel }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="mb-5 bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">Configurar: {instance.name}</h3>
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-white/90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mensagem de boas-vindas</label>
          <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        {/* AI Config */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-white/90">Agente de IA</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {aiEnabled && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Modelo</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (rápido)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (mais rápido)</option>
                  <option value="claude-opus-4-6">Claude Opus 4.6 (mais inteligente)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Prompt de treinamento
                  <span className="text-gray-500 dark:text-gray-400 font-normal"> — instrua a IA sobre como responder</span>
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
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-500-dark transition disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-500 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-200 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
