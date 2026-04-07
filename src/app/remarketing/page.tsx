export default function RemarketingPage() {
  const stages = [
    { name: 'Visitou o site', count: 1240, color: 'bg-blue-500', width: 'w-full' },
    { name: 'Preencheu formulario', count: 320, color: 'bg-primary', width: 'w-3/4' },
    { name: 'Recebeu remarketing', count: 180, color: 'bg-orange-400', width: 'w-1/2' },
    { name: 'Converteu', count: 45, color: 'bg-purple-500', width: 'w-1/4' },
  ];

  const features = [
    {
      title: 'Segmentacao',
      desc: 'Crie listas com comportamento, origem e value props para as campanhas.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Automacao',
      desc: 'Defina gatilhos de reengajamento para capturar leads inativos.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-dark">Funil de Remarketing</h2>
        <p className="text-text-muted text-sm mt-1">Acompanhe a jornada de conversao dos seus leads</p>
      </div>

      {/* Funnel visualization */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 mb-6">
        <h3 className="text-lg font-semibold text-text-dark mb-6">Visao do Funil</h3>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-4">
              <div className="w-40 text-sm text-text-muted text-right shrink-0">{stage.name}</div>
              <div className="flex-1">
                <div className={`${stage.width} ${stage.color} h-10 rounded-xl flex items-center justify-end pr-4 transition-all`}>
                  <span className="text-white text-sm font-bold">{stage.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-md transition">
            <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-text-dark mb-1">{f.title}</h3>
            <p className="text-sm text-text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <p className="text-sm text-text-muted">Em breve: visualizacao de jornada e taxa de conversao por etapa.</p>
      </div>
    </div>
  );
}
