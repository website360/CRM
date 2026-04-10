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

  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="w-full max-w-2xl">
      {/* Steps */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? "bg-brand-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>{s}</div>
            <span className={`text-sm font-medium ${step >= s ? "text-gray-800 dark:text-white/90" : "text-gray-400"}`}>
              {s === 1 ? "Perfil da Empresa" : "Escolher Plano"}
            </span>
            {s < 2 && <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {/* Step 1: Company Profile */}
      {step === 1 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-1">Configure sua empresa</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Essas informações são opcionais, você pode preencher depois</p>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="(11) 99999-9999" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Website</label><input value={website} onChange={(e) => setWebsite(e.target.value)} className={inp} placeholder="https://meusite.com" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Endereço</label><input value={address} onChange={(e) => setAddress(e.target.value)} className={inp} placeholder="Rua, número, cidade" /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={saveProfile} className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 transition">Continuar</button>
            <button onClick={() => setStep(2)} className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">Pular</button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Plan */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Escolha seu plano</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comece grátis e faça upgrade quando precisar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`rounded-2xl border p-6 transition cursor-pointer hover:shadow-theme-sm ${plan.price === 0 ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}
                onClick={() => selectPlan(plan.id)}>
                {plan.price === 0 && <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Atual</span>}
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{plan.name}</h3>
                <p className="text-3xl font-bold text-gray-800 dark:text-white/90 mt-2">
                  {plan.price === 0 ? "Grátis" : `R$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-400">/mês</span>}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2"><Check />{plan.maxUsers} {plan.maxUsers === 1 ? "usuário" : plan.maxUsers >= 999 ? "ilimitados" : "usuários"}</li>
                  <li className="flex items-center gap-2"><Check />{plan.maxChannels >= 999 ? "Canais ilimitados" : `${plan.maxChannels} ${plan.maxChannels === 1 ? "canal" : "canais"}`}</li>
                  <li className="flex items-center gap-2"><Check />{plan.maxLeads >= 999999 ? "Leads ilimitados" : `Até ${plan.maxLeads.toLocaleString()} leads`}</li>
                  <li className="flex items-center gap-2">{plan.features?.whatsapp ? <Check /> : <X />}WhatsApp</li>
                  <li className="flex items-center gap-2">{plan.features?.email ? <Check /> : <X />}Email Marketing</li>
                  <li className="flex items-center gap-2">{plan.features?.automation ? <Check /> : <X />}Automações</li>
                  <li className="flex items-center gap-2">{plan.features?.crm ? <Check /> : <X />}CRM Kanban</li>
                </ul>
                <button className={`w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium transition ${plan.price === 0 ? "bg-brand-500 text-white hover:bg-brand-600" : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  {plan.price === 0 ? "Começar Grátis" : "Selecionar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Check() { return <svg className="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function X() { return <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
