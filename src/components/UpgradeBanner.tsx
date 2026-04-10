"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrgInfo = { plan: { name: string; maxUsers: number; maxChannels: number; maxLeads: number } | null; _count: { users: number; leads: number; channels: number } };

const resourceConfig: Record<string, { label: string; limitMsg: string; nearMsg: string }> = {
  users: { label: "usuários", limitMsg: "Limite de usuários atingido!", nearMsg: "Você está próximo do limite de usuários" },
  leads: { label: "leads", limitMsg: "Limite de leads atingido!", nearMsg: "Você está próximo do limite de leads" },
  channels: { label: "canais", limitMsg: "Limite de canais atingido!", nearMsg: "Você está próximo do limite de canais" },
};

export default function UpgradeBanner({ resource }: { resource: "users" | "leads" | "channels" }) {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/org").then((r) => r.ok ? r.json() : null).then((d) => { if (d?.plan) setOrg(d); }).catch(() => {});
  }, []);

  if (!org?.plan || dismissed) return null;

  const maxMap: Record<string, number> = { users: org.plan.maxUsers, leads: org.plan.maxLeads, channels: org.plan.maxChannels };
  const usedMap: Record<string, number> = { users: org._count.users, leads: org._count.leads, channels: org._count.channels };

  const max = maxMap[resource] || 1;
  const used = usedMap[resource] || 0;
  const pct = (used / max) * 100;

  if (pct < 80) return null;

  const atLimit = pct >= 100;
  const cfg = resourceConfig[resource];

  return (
    <div className={`rounded-xl px-4 py-3 mb-5 flex items-center justify-between ${atLimit ? "bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20" : "bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20"}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${atLimit ? "bg-error-100 dark:bg-error-500/20" : "bg-warning-100 dark:bg-warning-500/20"}`}>
          <svg className={`w-4 h-4 ${atLimit ? "text-error-500" : "text-warning-500"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={atLimit ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
        </div>
        <div>
          <p className={`text-sm font-medium ${atLimit ? "text-error-700 dark:text-error-400" : "text-warning-700 dark:text-warning-400"}`}>
            {atLimit ? cfg.limitMsg : cfg.nearMsg}
          </p>
          <p className={`text-xs ${atLimit ? "text-error-600/70 dark:text-error-400/70" : "text-warning-600/70 dark:text-warning-400/70"}`}>
            {used}/{max >= 999 ? "∞" : max.toLocaleString()} {cfg.label} utilizados no plano {org.plan.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/planos" className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition ${atLimit ? "bg-error-500 hover:bg-error-600" : "bg-warning-500 hover:bg-warning-600"}`}>
          Fazer Upgrade
        </Link>
        <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
