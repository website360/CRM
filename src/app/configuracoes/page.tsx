"use client";

import { useEffect, useState } from "react";

type SettingsGroup = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string; help?: string }[];
};

const groups: SettingsGroup[] = [
  {
    title: "Evolution API",
    description: "WhatsApp via QR Code - provedor padrão do sistema",
    icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35" />,
    color: "bg-success-50 dark:bg-success-500/10 text-success-500",
    fields: [
      { key: "EVOLUTION_API_URL", label: "URL do Servidor", placeholder: "https://evolution.seudominio.com", help: "Endereço da sua Evolution API" },
      { key: "EVOLUTION_API_KEY", label: "API Key Global", placeholder: "sua-api-key", type: "password", help: "Chave de autenticação da Evolution API" },
    ],
  },
  {
    title: "Inteligência Artificial",
    description: "Claude AI para atendimento automático nos canais",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.136A18.078 18.078 0 0112 21a18.078 18.078 0 01-7.362-1.55l-.772-.137c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />,
    color: "bg-purple-50 dark:bg-purple-500/10 text-purple-500",
    fields: [
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", placeholder: "sk-ant-api03-...", type: "password", help: "Chave da API do Claude para respostas automáticas" },
    ],
  },
  {
    title: "API do CRM",
    description: "Autenticação para integrações externas (WordPress, etc.)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />,
    color: "bg-brand-50 dark:bg-brand-500/10 text-brand-500",
    fields: [
      { key: "API_KEY", label: "API Key", placeholder: "crm-lp-sk-...", type: "password", help: "Chave de autenticação para a API REST do CRM" },
    ],
  },
  {
    title: "WhatsApp Webhook",
    description: "Token de verificação dos webhooks do WhatsApp e Instagram",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l4.5 4.5a4.5 4.5 0 010 6.364l-4.5 4.5a4.5 4.5 0 01-6.364 0l-1.757-1.757" />,
    color: "bg-warning-50 dark:bg-warning-500/10 text-warning-500",
    fields: [
      { key: "WHATSAPP_VERIFY_TOKEN", label: "WhatsApp Verify Token", placeholder: "crm-lp-whatsapp-verify", help: "Token usado na verificação do webhook do Meta" },
      { key: "INSTAGRAM_VERIFY_TOKEN", label: "Instagram Verify Token", placeholder: "crm-lp-instagram-verify", help: "Token usado na verificação do webhook do Instagram" },
    ],
  },
  {
    title: "Email",
    description: "Envio de emails via API (recomendado) ou SMTP",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    color: "bg-error-50 dark:bg-error-500/10 text-error-500",
    fields: [
      { key: "EMAIL_API_PROVIDER", label: "Provedor (API)", placeholder: "brevo", help: "brevo, sendgrid ou resend - Recomendado (não precisa de porta SMTP)" },
      { key: "EMAIL_API_KEY", label: "API Key do Provedor", placeholder: "xkeysib-...", type: "password", help: "Chave de API do provedor de email" },
      { key: "EMAIL_FROM_NAME", label: "Nome do Remetente", placeholder: "CRM - Empresa" },
      { key: "SMTP_FROM", label: "Email do Remetente", placeholder: "contato@dominio.com" },
      { key: "SMTP_HOST", label: "Servidor SMTP (alternativo)", placeholder: "smtp.gmail.com", help: "Só necessário se não usar provedor API" },
      { key: "SMTP_PORT", label: "Porta SMTP", placeholder: "587" },
      { key: "SMTP_USER", label: "Usuário SMTP", placeholder: "email@dominio.com" },
      { key: "SMTP_PASS", label: "Senha SMTP", placeholder: "senha", type: "password" },
      { key: "SMTP_FROM", label: "Remetente (From)", placeholder: "Empresa <noreply@dominio.com>", help: "Nome e email que aparece como remetente" },
    ],
  },
];

export default function ConfiguracoesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [masked, setMasked] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setValues(d.settings);
      setMasked(d.masked);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    // Only send fields that are being edited
    const toSave: Record<string, string> = {};
    for (const key of editing) {
      if (values[key]) toSave[key] = values[key];
    }
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    setSaving(false);
    setSaved(true);
    setEditing(new Set());
    // Reload masked values
    const res = await fetch("/api/settings");
    const d = await res.json();
    setValues(d.settings);
    setMasked(d.masked);
    setTimeout(() => setSaved(false), 3000);
  }

  function startEditing(key: string) {
    setEditing((prev) => new Set(prev).add(key));
  }

  const inputCls = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Configurações</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Credenciais e integrações do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-success-500 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Salvo
            </span>
          )}
          <button onClick={handleSave} disabled={saving || editing.size === 0}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.color}`}>
              <svg className="w-5 h-5" fill={group.title === "Evolution API" ? "currentColor" : "none"} stroke={group.title === "Evolution API" ? "none" : "currentColor"} strokeWidth={1.8} viewBox="0 0 24 24">
                {group.icon}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{group.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{group.description}</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {group.fields.map((field) => {
              const isEditing = editing.has(field.key);
              const displayValue = isEditing ? (values[field.key] || '') : (masked[field.key] || '');

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                  <div className="flex gap-2">
                    <input
                      type={field.type === "password" && !isEditing ? "text" : (field.type || "text")}
                      value={displayValue}
                      onChange={(e) => { startEditing(field.key); setValues({ ...values, [field.key]: e.target.value }); }}
                      onFocus={() => { if (!isEditing && values[field.key]) startEditing(field.key); }}
                      placeholder={field.placeholder}
                      className={inputCls + (field.type === "password" ? " font-mono" : "")}
                      readOnly={!isEditing && !!masked[field.key]}
                    />
                    {!isEditing && masked[field.key] && (
                      <button onClick={() => startEditing(field.key)}
                        className="shrink-0 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                        Editar
                      </button>
                    )}
                  </div>
                  {field.help && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{field.help}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Test Email */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Testar Email</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Envie um email de teste para verificar a configuração SMTP</p>
          </div>
          <div className="flex items-center gap-2">
            <input id="test-email-input" type="email" placeholder="seu@email.com"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 w-56 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
            <button onClick={async () => {
              const input = document.getElementById('test-email-input') as HTMLInputElement;
              if (!input.value) return;
              const res = await fetch('/api/settings/test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: input.value }) });
              const data = await res.json();
              if (data.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
              else { alert(data.error || 'Erro no envio'); }
            }} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
              Enviar Teste
            </button>
          </div>
        </div>
      </div>

      {/* Webhook URLs info */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">URLs dos Webhooks</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Configure estes endpoints nos provedores</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Meta WhatsApp", url: "/api/webhook/whatsapp" },
            { label: "Instagram", url: "/api/webhook/instagram" },
            { label: "Z-API", url: "/api/webhook/zapi" },
            { label: "Evolution API", url: "/api/webhook/evolution" },
            { label: "Widget Chat", url: "/api/widget" },
            { label: "Leads (WordPress)", url: "/api/leads" },
          ].map((wh) => (
            <div key={wh.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{wh.label}</span>
              <code className="text-xs font-mono text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded select-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}{wh.url}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
