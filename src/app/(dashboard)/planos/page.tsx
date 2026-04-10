"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/Toast";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function PlanosPage() {
  return <Suspense fallback={null}><PlanosInner /></Suspense>;
}

type Plan = { id: number; name: string; maxUsers: number; maxChannels: number; maxLeads: number; price: number; priceYearly: number | null; features: Record<string, boolean> };
type Org = { id: number; planId: number | null; stripeCustomerId: string | null; stripeSubscriptionId: string | null; plan: Plan | null; _count: { users: number; leads: number; channels: number } };

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
      const res = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, interval, licenses }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Erro ao iniciar pagamento", "error");
    } catch { toast("Erro ao conectar com Stripe", "error"); }
    setLoading(false);
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast("Sem assinatura ativa para gerenciar", "info");
  }

  async function handleFreePlan(planId: number) {
    await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    toast("Plano atualizado!");
    const d = await fetch("/api/org").then((r) => r.json());
    setOrg(d);
    setSelectedPlan(null);
  }

  const currentPlanId = org?.planId;
  const getPrice = (plan: Plan) => interval === "yearly" ? (plan.priceYearly || plan.price * 10) : plan.price;
  const totalPrice = selectedPlan ? getPrice(selectedPlan) * licenses : 0;

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Planos e Faturamento</h2>
          {org?.plan && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Plano atual: <span className="font-semibold text-brand-500">{org.plan.name}</span>
              {org.stripeSubscriptionId && " · Assinatura ativa"}
            </p>
          )}
        </div>
        {org?.stripeSubscriptionId && (
          <button onClick={handlePortal} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
            Gerenciar Assinatura
          </button>
        )}
      </div>

      {/* Current usage */}
      {org?.plan && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Uso atual do plano {org.plan.name}</h3>
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Plans */}
        <div className="flex-1 space-y-6">
          {/* Interval toggle */}
          <div className="flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 max-w-xs mx-auto">
            <button onClick={() => setInterval("monthly")} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${interval === "monthly" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setInterval("yearly")} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${interval === "yearly" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500"}`}>
              Anual <span className="text-[10px] text-success-500 font-bold ml-1">-17%</span>
            </button>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan, i) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlan?.id === plan.id;
              const isPopular = i === 2;
              const price = getPrice(plan);
              return (
                <div key={plan.id} onClick={() => plan.price > 0 ? setSelectedPlan(plan) : handleFreePlan(plan.id)}
                  className={`rounded-2xl border p-5 cursor-pointer transition relative ${
                    isSelected ? "border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/30 dark:bg-brand-500/5" :
                    isCurrent ? "border-brand-300 dark:border-brand-500/40" :
                    "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  } bg-white dark:bg-white/[0.03]`}>
                  {isCurrent && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500 text-white">ATUAL</span>}
                  {isPopular && !isCurrent && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white">POPULAR</span>}

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.maxUsers >= 999 ? "Ilimitados" : `${plan.maxUsers} ${plan.maxUsers === 1 ? "usuário" : "usuários"}`} ·
                    {plan.maxLeads >= 999999 ? " Leads ilimitados" : ` ${plan.maxLeads.toLocaleString()} leads`}
                  </p>

                  <div className="mt-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {price === 0 ? "Grátis" : `R$${price}`}
                    </span>
                    {price > 0 && <span className="text-xs text-gray-400">/{interval === "yearly" ? "ano" : "mês"}</span>}
                    {price > 0 && <span className="text-xs text-gray-400 block">por licença</span>}
                  </div>

                  <div className="mt-3 space-y-1">
                    {allFeatures.map((f) => (
                      <div key={f.key} className="flex items-center gap-1.5 text-xs">
                        {plan.features?.[f.key] ? (
                          <svg className="w-3.5 h-3.5 text-success-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        <span className={plan.features?.[f.key] ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-5">Resumo do pedido</h3>

            {selectedPlan ? (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Plano</span><span className="font-medium text-gray-800 dark:text-white/90">{selectedPlan.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Preço</span><span className="font-medium">R${getPrice(selectedPlan)}/{interval === "yearly" ? "ano" : "mês"}</span></div>

                  {/* Licenses */}
                  <div>
                    <span className="text-gray-500 text-xs block mb-2">Licenças (usuários)</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setLicenses(Math.max(1, licenses - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="text-lg font-bold text-gray-800 dark:text-white/90 w-8 text-center">{licenses}</span>
                      <button onClick={() => setLicenses(licenses + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between"><span className="text-gray-500">Período</span><span className="font-medium">{interval === "yearly" ? "Anual" : "Mensal"}</span></div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 mt-5 pt-5">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white/90">R${totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-gray-400 block">/{interval === "yearly" ? "ano" : "mês"}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleCheckout} disabled={loading}
                  className="w-full mt-5 rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50">
                  {loading ? "Redirecionando..." : "Pagar com Stripe"}
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">Pagamento seguro via Stripe. Cancele quando quiser.</p>
              </>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth={0.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <p className="text-sm text-gray-400 dark:text-gray-500">Selecione um plano para ver o resumo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Precisa de um plano personalizado? <a href="mailto:contato@agenciamay.com.br" className="text-brand-500 hover:text-brand-600">Entre em contato</a>
      </p>
    </div>
  );
}
