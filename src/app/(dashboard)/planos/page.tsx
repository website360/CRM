"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/Toast";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function PlanosPage() { return <Suspense fallback={null}><PlanosInner /></Suspense>; }

type Plan = { id: number; name: string; maxUsers: number; maxChannels: number; maxLeads: number; price: number; priceYearly: number | null; features: Record<string, boolean> };
type Org = { id: number; planId: number | null; stripeCustomerId: string | null; stripeSubscriptionId: string | null; plan: Plan | null; _count: { users: number; leads: number; channels: number } };

const allFeatures = [
  { key: "crm", label: "CRM Kanban" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "webchat", label: "Widget de Chat" },
  { key: "email", label: "Email Marketing" },
  { key: "automation", label: "Automações" },
  { key: "ai", label: "Agente de IA" },
  { key: "api", label: "API REST" },
];

function PlanosInner() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [org, setOrg] = useState<Org | null>(null);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [licenses, setLicenses] = useState(1);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/org/plans").then((r) => r.json()).then(setPlans);
    fetch("/api/org").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setOrg(d); });
  }, []);

  useEffect(() => {
    if (searchParams.get("success")) toast("Plano atualizado com sucesso!");
    if (searchParams.get("canceled")) toast("Pagamento cancelado", "info");
  }, [searchParams]);

  async function handleCheckout() {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: selectedPlan.id, interval, licenses }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Erro", "error");
    } catch { toast("Erro ao conectar com Stripe", "error"); }
    setLoading(false);
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast("Sem assinatura ativa", "info");
  }

  async function handleFreePlan(planId: number) {
    await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    toast("Plano atualizado!");
    const d = await fetch("/api/org").then((r) => r.json());
    setOrg(d); setSelectedPlan(null);
  }

  const currentPlanId = org?.planId;
  const getPrice = (plan: Plan) => interval === "yearly" ? (plan.priceYearly || plan.price * 10) : plan.price;
  const totalPrice = selectedPlan ? getPrice(selectedPlan) * licenses : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Planos e Faturamento</h2>
          {org?.plan && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Plano atual: <span className="font-semibold text-brand-500">{org.plan.name}</span>{org.stripeSubscriptionId && " · Assinatura ativa"}</p>}
        </div>
        <div className="flex items-center gap-3">
          {org?.stripeSubscriptionId && (
            <button onClick={handlePortal} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
              Gerenciar Assinatura
            </button>
          )}
          {/* Interval toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={() => setInterval("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${interval === "monthly" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setInterval("yearly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${interval === "yearly" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500"}`}>
              Anual <span className="text-[10px] text-success-500 font-bold ml-1">-17%</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Plan columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          const isSelected = selectedPlan?.id === plan.id;
          const isPopular = i === 2;
          const price = getPrice(plan);
          return (
            <div key={plan.id} onClick={() => plan.price > 0 ? setSelectedPlan(plan) : handleFreePlan(plan.id)}
              className={`rounded-2xl border p-6 cursor-pointer transition relative flex flex-col ${
                isSelected ? "border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/30 dark:bg-brand-500/5" :
                isCurrent ? "border-brand-300 dark:border-brand-500/40 bg-white dark:bg-white/[0.03]" :
                isPopular ? "border-purple-300 dark:border-purple-500/40 bg-white dark:bg-white/[0.03] shadow-lg" :
                "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] hover:border-gray-300"
              }`}>
              {isCurrent && <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded text-[10px] font-bold bg-brand-500 text-white uppercase tracking-wider">Atual</span>}
              {isPopular && !isCurrent && <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white uppercase tracking-wider">Popular</span>}

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {plan.maxUsers >= 999 ? "Usuários ilimitados" : `Até ${plan.maxUsers} ${plan.maxUsers === 1 ? "usuário" : "usuários"}`} ·{" "}
                {plan.maxLeads >= 999999 ? "Leads ilimitados" : `${plan.maxLeads.toLocaleString()} leads`}
              </p>

              <div className="mb-5">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{price === 0 ? "Grátis" : `R$${price}`}</span>
                {price > 0 && <span className="text-sm text-gray-400">/{interval === "yearly" ? "ano" : "mês"}</span>}
                {price > 0 && <p className="text-[11px] text-gray-400 mt-0.5">por licença</p>}
              </div>

              <div className="flex-1 space-y-2 mb-5">
                {allFeatures.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 text-sm">
                    {plan.features?.[f.key] ? (
                      <svg className="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    <span className={plan.features?.[f.key] ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600 line-through"}>{f.label}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isSelected ? "bg-brand-500 text-white" :
                isCurrent ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default" :
                isPopular ? "bg-purple-500 text-white hover:bg-purple-600" :
                plan.price === 0 ? "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50" :
                "bg-brand-500 text-white hover:bg-brand-600"
              }`}>
                {isCurrent ? "Plano Atual" : isSelected ? "Selecionado ✓" : plan.price === 0 ? "Continuar Grátis" : "Selecionar"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Order Summary - Full width below plans */}
      {selectedPlan && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/30 dark:bg-brand-500/5 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Plan details */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Plano {selectedPlan.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedPlan.maxUsers >= 999 ? "Ilimitados" : selectedPlan.maxUsers} usuários ·{" "}
                  {selectedPlan.maxLeads >= 999999 ? "Ilimitados" : selectedPlan.maxLeads.toLocaleString()} leads ·{" "}
                  {interval === "yearly" ? "Cobrança anual" : "Cobrança mensal"}
                </p>
              </div>
            </div>

            {/* Center: Licenses */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Licenças:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setLicenses(Math.max(1, licenses - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 12H4" /></svg>
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-white/90 w-10 text-center">{licenses}</span>
                <button onClick={() => setLicenses(licenses + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <span className="text-sm text-gray-400">× R${getPrice(selectedPlan)}</span>
            </div>

            {/* Right: Total + Checkout */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">R${totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}<span className="text-sm font-normal text-gray-400">/{interval === "yearly" ? "ano" : "mês"}</span></p>
              </div>
              <button onClick={handleCheckout} disabled={loading}
                className="rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50 whitespace-nowrap">
                {loading ? "Redirecionando..." : "Pagar"}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">Pagamento seguro via Stripe. Cancele quando quiser. Sem multa.</p>
        </div>
      )}

      {/* Current usage */}
      {org?.plan && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Uso atual</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Usuários", used: org._count.users, max: org.plan.maxUsers, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
              { label: "Leads", used: org._count.leads, max: org.plan.maxLeads, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
              { label: "Canais", used: org._count.channels, max: org.plan.maxChannels, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
            ].map((u) => {
              const pct = Math.min(100, (u.used / Math.max(u.max, 1)) * 100);
              return (
                <div key={u.label} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={u.icon} /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{u.label}</span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{u.used}/{u.max >= 999 ? "∞" : u.max.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full"><div className={`h-full rounded-full ${pct >= 100 ? "bg-error-500" : pct >= 80 ? "bg-warning-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">Precisa de um plano personalizado? <a href="mailto:contato@agenciamay.com.br" className="text-brand-500 hover:text-brand-600">Entre em contato</a></p>
    </div>
  );
}
