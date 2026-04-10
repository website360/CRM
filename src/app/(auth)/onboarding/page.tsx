"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = { id: number; name: string; maxUsers: number; maxChannels: number; maxLeads: number; price: number; features: Record<string, boolean> };

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();

  useEffect(() => { fetch("/api/org/plans").then((r) => r.json()).then(setPlans); }, []);

  async function saveProfile() {
    await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, website, address }) });
    setStep(2);
  }

  async function selectPlan(planId: number) {
    await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    router.push("/");
  }

  const inp = "w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">CRM LP</span>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${step >= s ? "bg-brand-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>{s}</div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>
                  {s === 1 ? "Empresa" : "Plano"}
                </span>
                {s < 2 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {/* Step 1 */}
        {step === 1 && (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configure sua empresa</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Informações opcionais, pode preencher depois</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="(11) 99999-9999" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Website</label><input value={website} onChange={(e) => setWebsite(e.target.value)} className={inp} placeholder="https://meusite.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Endereço</label><input value={address} onChange={(e) => setAddress(e.target.value)} className={inp} placeholder="Rua, número, cidade" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveProfile} className="flex-1 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition">Continuar</button>
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 transition">Pular</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Escolha seu plano</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comece grátis, faça upgrade quando precisar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan, i) => {
                const popular = i === 2;
                return (
                  <div key={plan.id} className={`rounded-2xl border p-6 transition relative ${popular ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/5 shadow-lg ring-1 ring-brand-500" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] hover:shadow-theme-sm"}`}>
                    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">Popular</span>}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <div className="mt-3 mb-5">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price === 0 ? "Grátis" : `R$${plan.price}`}</span>
                      {plan.price > 0 && <span className="text-sm text-gray-400">/mês</span>}
                    </div>
                    <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400 mb-6">
                      <Li ok>{plan.maxUsers >= 999 ? "Usuários ilimitados" : `${plan.maxUsers} ${plan.maxUsers === 1 ? "usuário" : "usuários"}`}</Li>
                      <Li ok>{plan.maxChannels >= 999 ? "Canais ilimitados" : `${plan.maxChannels} ${plan.maxChannels === 1 ? "canal" : "canais"}`}</Li>
                      <Li ok>{plan.maxLeads >= 999999 ? "Leads ilimitados" : `${plan.maxLeads.toLocaleString()} leads`}</Li>
                      <Li ok={plan.features?.whatsapp}>WhatsApp</Li>
                      <Li ok={plan.features?.email}>Email Marketing</Li>
                      <Li ok={plan.features?.automation}>Automações</Li>
                    </ul>
                    <button onClick={() => selectPlan(plan.id)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${popular ? "bg-brand-500 text-white hover:bg-brand-600" : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                      {plan.price === 0 ? "Começar Grátis" : "Selecionar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Li({ ok = true, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <svg className="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span className={ok ? "" : "text-gray-400 dark:text-gray-600"}>{children}</span>
    </li>
  );
}
