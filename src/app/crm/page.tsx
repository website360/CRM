export default function CRMPage() {
  const features = [
    {
      title: 'Pipeline de Vendas',
      desc: 'Visualize status, oportunidades e proximo passo para cada lead.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Comunicacao',
      desc: 'Envie notificacoes por email e SMS direto do painel.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-500',
    },
    {
      title: 'Tarefas',
      desc: 'Organize follow-ups e atividades por lead e responsavel.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-orange-50 text-orange-500',
    },
    {
      title: 'Relatorios',
      desc: 'Acompanhe metricas de conversao e desempenho da equipe.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-dark">CRM</h2>
        <p className="text-text-muted text-sm mt-1">Gerencie o relacionamento com seus clientes</p>
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
        <p className="text-sm text-text-muted">Este modulo esta com base para ser expandido com workflow completo de atendimento.</p>
      </div>
    </div>
  );
}
