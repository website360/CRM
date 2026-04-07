const features = [
  { title: 'Pipeline de Vendas', desc: 'Visualize status, oportunidades e próximo passo para cada lead.', bg: 'bg-brand-50 dark:bg-brand-500/10', color: 'text-brand-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  { title: 'Comunicação', desc: 'Envie notificações por email e SMS direto do painel.', bg: 'bg-success-50 dark:bg-success-500/10', color: 'text-success-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
  { title: 'Tarefas', desc: 'Organize follow-ups e atividades por lead e responsável.', bg: 'bg-warning-50 dark:bg-warning-500/10', color: 'text-warning-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
  { title: 'Relatórios', desc: 'Acompanhe métricas de conversão e desempenho da equipe.', bg: 'bg-error-50 dark:bg-error-500/10', color: 'text-error-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
];

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">CRM</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie o relacionamento com seus clientes</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 hover:shadow-theme-sm transition">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
              <svg className={`w-6 h-6 ${f.color}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">{f.icon}</svg>
            </div>
            <h3 className="mt-5 text-base font-semibold text-gray-800 dark:text-white/90">{f.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Este módulo está com base para ser expandido com workflow completo de atendimento.</p>
      </div>
    </div>
  );
}
