"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/Toast";

type Plan = { id: number; name: string; maxUsers: number; maxChannels: number; maxLeads: number; price: number; features: Record<string, boolean> };
type Org = { id: number; planId: number | null; plan: Plan | null; _count: { users: number; leads: number; channels: number } };

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [org, setOrg] = useState<Org | null>(null);

  useEffect(() => {
    fetch("/api/org/plans").then((r) => r.json()).then(setPlans);
    fetch("/api/org").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setOrg(d); });
  }, []);

  async function handleSelectPlan(planId: number) {
    const res = await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    if (res.ok) {
      toast("Plano atualizado!");
      const d = await fetch("/api/org").then((r) => r.json());
      setOrg(d);
    }
  }

  const currentPlanId = org?.planId;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Planos e Preços</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Escolha o plano ideal para o seu negócio</p>
      </div>

      {/* Current usage */}
      {org?.plan && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Seu plano atual: <span className="text-brand-500">{org.plan.name}</span></h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {org.plan.price === 0 ? "Gratuito" : `R$${org.plan.price}/mês`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Usuários", used: org._count.users, max: org.plan.maxUsers },
              { label: "Leads", used: org._count.leads, max: org.plan.maxLeads },
              { label: "Canais", used: org._count.channels, max: org.plan.maxChannels },
            ].map((u) => {
              const pct = Math.min(100, (u.used / Math.max(u.max, 1)) * 100);
              const full = pct >= 100;
              return (
                <div key={u.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{u.label}</span>
                    <span className={`font-medium ${full ? "text-error-500" : "text-gray-800 dark:text-white/90"}`}>
                      {u.used}/{u.max >= 999 ? "∞" : u.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${full ? "bg-error-500" : pct >= 80 ? "bg-warning-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = i === 2;
          const isDowngrade = currentPlanId && plan.price < (org?.plan?.price || 0);
          return (
            <div key={plan.id} className={`rounded-2xl border p-6 transition relative flex flex-col ${
              isCurrent ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/5 ring-2 ring-brand-500" :
              isPopular ? "border-brand-300 dark:border-brand-500/40 shadow-lg" :
              "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] hover:shadow-theme-sm"
            }`}>
              {isCurrent && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">Atual</span>}
              {isPopular && !isCurrent && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider">Popular</span>}

              <h3 className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price === 0 ? "Grátis" : `R$${plan.price}`}</span>
                {plan.price > 0 && <span className="text-sm text-gray-400">/mês</span>}
              </div>

              <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400 flex-1">
                <Li ok>{plan.maxUsers >= 999 ? "Usuários ilimitados" : `${plan.maxUsers} ${plan.maxUsers === 1 ? "usuário" : "usuários"}`}</Li>
                <Li ok>{plan.maxChannels >= 999 ? "Canais ilimitados" : `${plan.maxChannels} ${plan.maxChannels === 1 ? "canal" : "canais"}`}</Li>
                <Li ok>{plan.maxLeads >= 999999 ? "Leads ilimitados" : `${plan.maxLeads.toLocaleString()} leads`}</Li>
                <Li ok={plan.features?.whatsapp}>WhatsApp</Li>
                <Li ok={plan.features?.email}>Email Marketing</Li>
                <Li ok={plan.features?.automation}>Automações</Li>
                <Li ok={plan.features?.crm}>CRM Kanban</Li>
              </ul>

              <button onClick={() => !isCurrent && handleSelectPlan(plan.id)} disabled={isCurrent}
                className={`w-full mt-5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isCurrent ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" :
                  isDowngrade ? "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5" :
                  "bg-brand-500 text-white hover:bg-brand-600"
                }`}>
                {isCurrent ? "Plano Atual" : isDowngrade ? "Downgrade" : plan.price === 0 ? "Selecionar" : "Fazer Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Precisa de um plano personalizado? <a href="mailto:contato@agenciamay.com.br" className="text-brand-500 hover:text-brand-600">Entre em contato</a>
      </p>
    </div>
  );
}

function Li({ ok = true, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <svg className="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
      <span className={ok ? "" : "text-gray-400 dark:text-gray-600"}>{children}</span>
    </li>
  );
}
