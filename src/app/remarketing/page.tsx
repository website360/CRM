const stages = [
  { name: 'Visitou o site', count: 1240, color: 'bg-brand-500', width: 'w-full' },
  { name: 'Preencheu formulário', count: 320, color: 'bg-success-500', width: 'w-3/4' },
  { name: 'Recebeu remarketing', count: 180, color: 'bg-warning-500', width: 'w-1/2' },
  { name: 'Converteu', count: 45, color: 'bg-error-500', width: 'w-1/4' },
];

export default function RemarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Funil de Remarketing</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acompanhe a jornada de conversão dos seus leads</p>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-6">Visão do Funil</h3>
        <div className="space-y-4">
          {stages.map((s) => (
            <div key={s.name} className="flex items-center gap-4">
              <div className="w-44 text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">{s.name}</div>
              <div className="flex-1">
                <div className={`${s.width} ${s.color} h-10 rounded-lg flex items-center justify-end pr-4`}>
                  <span className="text-white text-sm font-bold">{s.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 hover:shadow-theme-sm transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          </div>
          <h3 className="mt-5 text-base font-semibold text-gray-800 dark:text-white/90">Segmentação</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crie listas com comportamento, origem e value props para as campanhas.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 hover:shadow-theme-sm transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
            <svg className="w-6 h-6 text-success-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
          <h3 className="mt-5 text-base font-semibold text-gray-800 dark:text-white/90">Automação</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Defina gatilhos de reengajamento para capturar leads inativos.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Em breve: visualização de jornada e taxa de conversão por etapa.</p>
      </div>
    </div>
  );
}
