"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ConfirmModal from "@/components/ConfirmModal";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Channel = { name: string; type: string; config: unknown; aiEnabled?: boolean };
type ConvMessage = { content: string; sender: string };
type Conversation = {
  id: number; contactId: string; contactName: string | null; contactAvatar: string | null;
  mode: string; status: string; unread: number; updatedAt: string;
  channel: Channel; messages: ConvMessage[]; _count: { messages: number };
};
type Message = { id: number; sender: string; content: string; timestamp: string; mediaUrl?: string | null; mediaType?: string | null };
type ConversationDetail = {
  id: number; contactId: string; contactName: string | null; contactAvatar: string | null;
  mode: string; channel: Channel; messages: Message[];
};

const channelIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  whatsapp: {
    icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35" />,
    color: "text-success-500", bg: "bg-success-50 dark:bg-success-500/10",
  },
  instagram: {
    icon: <><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.8" fill="none" stroke="currentColor" /><circle cx="12" cy="12" r="5" strokeWidth="1.8" fill="none" stroke="currentColor" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></>,
    color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10",
  },
  webchat: {
    icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeWidth="1.8" fill="none" stroke="currentColor" />,
    color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/10",
  },
};

const filters = [
  { key: "all", label: "Todos" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "webchat", label: "Chat" },
];

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationDetail | null>(null);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmCloseId, setConfirmCloseId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("type", filter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/inbox?${params}`);
    if (res.ok) setConversations(await res.json());
  }, [filter, statusFilter]);

  const loadChat = useCallback(async (id: number) => {
    const res = await fetch(`/api/inbox/${id}`);
    if (res.ok) setActiveChat(await res.json());
  }, []);

  // Poll conversations list every 3s (real-time inbox)
  useEffect(() => {
    loadConversations();
    const i = setInterval(loadConversations, 3000);
    return () => clearInterval(i);
  }, [loadConversations]);

  // Poll active chat messages every 2s
  useEffect(() => {
    if (!activeChat) return;
    const i = setInterval(() => loadChat(activeChat.id), 2000);
    return () => clearInterval(i);
  }, [activeChat?.id, loadChat]);

  async function handleSend() {
    if (!newMessage.trim() || !activeChat) return;
    setSending(true);
    await fetch(`/api/inbox/${activeChat.id}/send`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newMessage }),
    });
    setNewMessage(""); setSending(false);
    loadChat(activeChat.id); loadConversations();
  }

  async function handleTakeover(mode: string) {
    if (!activeChat) return;
    await fetch(`/api/inbox/${activeChat.id}/takeover`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    loadChat(activeChat.id); loadConversations();
  }

  async function handleUploadImage(file: File) {
    if (!activeChat) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await uploadRes.json();
      if (url) {
        const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        await fetch(`/api/inbox/${activeChat.id}/send`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaUrl: fullUrl, mediaType: "image" }),
        });
        loadChat(activeChat.id); loadConversations();
      }
    } catch {} finally { setUploading(false); }
  }

  async function handleClose(conversationId: number) {
    await fetch(`/api/inbox/${conversationId}/takeover`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "human", status: "closed" }),
    });
    setConfirmCloseId(null);
    if (activeChat?.id === conversationId) setActiveChat(null);
    loadConversations();
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Caixa de Entrada</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Todas as mensagens de todos os canais integrados
          {totalUnread > 0 && <span className="ml-2 inline-flex items-center justify-center h-5 px-2 rounded-full bg-error-500 text-white text-xs font-bold">{totalUnread}</span>}
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="w-96 shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col">
          {/* Filters */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center gap-1">
              {filters.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === f.key ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "open", label: "Abertas" },
                { key: "closed", label: "Encerradas" },
                { key: "all", label: "Todas" },
              ].map((s) => (
                <button key={s.key} onClick={() => setStatusFilter(s.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${statusFilter === s.key ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const ch = channelIcons[conv.channel.type] || channelIcons.whatsapp;
              return (
                <button key={conv.id} onClick={() => loadChat(conv.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition ${activeChat?.id === conv.id ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.contactAvatar ? (
                        <img src={conv.contactAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ch.bg}`}>
                          <svg className={`w-5 h-5 ${ch.color}`} viewBox="0 0 24 24" fill="currentColor">{ch.icon}</svg>
                        </div>
                      )}
                      {/* Channel badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${ch.bg}`}>
                        <svg className={`w-2.5 h-2.5 ${ch.color}`} viewBox="0 0 24 24" fill="currentColor">{ch.icon}</svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                          {conv.contactName || (conv.contactId.startsWith('v_') ? 'Visitante' : conv.contactId)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                          {new Date(conv.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.messages[0]?.content || "Sem mensagens"}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${conv.mode === "ai" ? "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"}`}>
                            {conv.mode === "ai" ? "IA" : "H"}
                          </span>
                          {conv.unread > 0 && (
                            <span className="flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">{conv.unread}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{conv.channel.name}</span>
                    </div>
                  </div>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">Nenhuma conversa ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeChat ? (
          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const ch = channelIcons[activeChat.channel.type] || channelIcons.whatsapp;
                  return activeChat.contactAvatar ? (
                    <img src={activeChat.contactAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ch.bg}`}>
                      <svg className={`w-5 h-5 ${ch.color}`} viewBox="0 0 24 24" fill="currentColor">{ch.icon}</svg>
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {activeChat.contactName || (activeChat.contactId.startsWith('v_') ? 'Visitante' : activeChat.contactId)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeChat.channel.name}
                    {activeChat.channel.type === "whatsapp" && !activeChat.contactId.includes('@') && ` · +${activeChat.contactId}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  const res = await fetch("/api/pipelines");
                  const pipelines = await res.json();
                  if (pipelines.length > 0 && pipelines[0].stages?.length > 0) {
                    const firstStageId = pipelines[0].stages[0].id;
                    await fetch("/api/deals", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        stageId: firstStageId,
                        title: activeChat.contactName || "Novo Negócio",
                        contactName: activeChat.contactName,
                        contactPhone: activeChat.channel.type === "whatsapp" && !activeChat.contactId.includes('@') ? activeChat.contactId : null,
                      }),
                    });
                    alert("Contato enviado para o CRM!");
                  }
                }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/25 transition">
                  Enviar p/ CRM
                </button>
                <button onClick={() => handleTakeover(activeChat.mode === "ai" ? "human" : "ai")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeChat.mode === "ai" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25" : "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/25"}`}>
                  {activeChat.mode === "ai" ? "Assumir Conversa" : "Devolver p/ IA"}
                </button>
                <button onClick={() => setConfirmCloseId(activeChat.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 hover:bg-error-100 dark:hover:bg-error-500/25 transition">
                  Encerrar
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50 dark:bg-gray-900/50">
              {activeChat.messages.map((msg) => {
                const isContact = msg.sender === "contact";
                const isAi = msg.sender === "ai";
                const channelCfg = (activeChat.channel.config || {}) as Record<string, string>;
                const hasSignature = channelCfg.signatureEnabled === 'true' && channelCfg.signature;
                const humanLabel = hasSignature ? channelCfg.signature : "Atendente";
                const isImage = msg.content.startsWith("[imagem:") || msg.mediaUrl;
                const imageUrl = msg.mediaUrl || (msg.content.match(/\[imagem:\s*(.*?)\]/)?.[1]) || null;
                const isSticker = msg.content === "[Figurinha]" || msg.mediaType === "sticker";
                const isMedia = msg.content.startsWith("[Vídeo]") || msg.content.startsWith("[Áudio]") || msg.content.startsWith("[Documento");

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isContact ? "justify-start" : "justify-end"}`}>
                    {/* Agent avatar (left side for contact, right side for agent) */}
                    {isContact && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {(activeChat.contactName || "V").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm ${
                      isContact
                        ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 rounded-bl-md"
                        : isAi
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 rounded-br-md"
                          : "bg-brand-500 text-white rounded-br-md"
                    }`}>
                      {!isContact && (
                        <span className="text-[10px] font-bold opacity-80 block mb-0.5">
                          {isAi ? "IA" : humanLabel}
                        </span>
                      )}
                      {imageUrl ? (
                        <a href={imageUrl.startsWith('data:') ? undefined : imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={imageUrl} alt="" className={`rounded-lg max-w-full object-cover ${isSticker ? 'max-h-32 bg-transparent' : 'max-h-60'}`} />
                          {msg.content && !msg.content.startsWith('[imagem:') && !msg.content.startsWith('[Figurinha') && (
                            <p className="whitespace-pre-wrap mt-1">{msg.content}</p>
                          )}
                        </a>
                      ) : isMedia ? (
                        <p className="whitespace-pre-wrap italic opacity-70">{msg.content}</p>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <span className="text-[10px] opacity-50 block text-right mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!isContact && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 ${isAi ? "bg-purple-100 dark:bg-purple-900/30" : "bg-brand-500"}`}>
                        <span className="text-[10px] font-bold text-white">
                          {isAi ? "IA" : "A"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 relative">
              {/* Emoji Picker */}
              {showEmoji && (
                <div className="absolute bottom-16 left-4 z-50">
                  <div className="fixed inset-0" onClick={() => setShowEmoji(false)} />
                  <div className="relative">
                    <EmojiPicker
                      onEmojiClick={(e: { emoji: string }) => { setNewMessage((prev) => prev + e.emoji); setShowEmoji(false); }}
                      width={320}
                      height={400}
                      searchPlaceholder="Buscar emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Emoji button */}
                <button onClick={() => setShowEmoji(!showEmoji)} type="button"
                  className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {/* Upload button */}
                <button onClick={() => fileInputRef.current?.click()} type="button" disabled={uploading}
                  className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition disabled:opacity-50">
                  {uploading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); e.target.value = ''; }} />
                {/* Message input */}
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={activeChat.mode === "ai" ? "IA respondendo... digite para enviar como humano" : "Digite sua mensagem..."}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                {/* Send button */}
                <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth={0.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>

      {/* Close Confirmation Modal */}
      {confirmCloseId && (
        <ConfirmModal
          title="Encerrar conversa"
          message="Tem certeza que deseja encerrar esta conversa? Uma mensagem de despedida será enviada ao cliente."
          confirmText="Encerrar"
          variant="danger"
          onCancel={() => setConfirmCloseId(null)}
          onConfirm={() => handleClose(confirmCloseId)}
        />
      )}
    </div>
  );
}
