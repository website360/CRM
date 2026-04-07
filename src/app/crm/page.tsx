const features = [
  { title: 'Pipeline de Vendas', desc: 'Visualize status, oportunidades e próximo passo para cada lead.', icon: <path fillRule="evenodd" clipRule="evenodd" d="M3.25 5.5C3.25 4.26 4.26 3.25 5.5 3.25H18.5C19.74 3.25 20.75 4.26 20.75 5.5V18.5C20.75 19.74 19.74 20.75 18.5 20.75H5.5C4.26 20.75 3.25 19.74 3.25 18.5V5.5ZM9 4.75V19.25H18.5C18.91 19.25 19.25 18.91 19.25 18.5V5.5C19.25 5.09 18.91 4.75 18.5 4.75H9Z" /> },
  { title: 'Comunicação', desc: 'Envie notificações por email e SMS direto do painel.', icon: <path fillRule="evenodd" clipRule="evenodd" d="M3.25 7C3.25 5.76 4.26 4.75 5.5 4.75H18.5C19.74 4.75 20.75 5.76 20.75 7V17C20.75 18.24 19.74 19.25 18.5 19.25H5.5C4.26 19.25 3.25 18.24 3.25 17V7ZM5.5 6.25C5.09 6.25 4.75 6.59 4.75 7V7.15L12 11.85L19.25 7.15V7C19.25 6.59 18.91 6.25 18.5 6.25H5.5ZM19.25 8.9L12.42 13.32C12.16 13.49 11.84 13.49 11.58 13.32L4.75 8.9V17C4.75 17.41 5.09 17.75 5.5 17.75H18.5C18.91 17.75 19.25 17.41 19.25 17V8.9Z" /> },
  { title: 'Tarefas', desc: 'Organize follow-ups e atividades por lead e responsável.', icon: <path fillRule="evenodd" clipRule="evenodd" d="M6.75 3.25C6.75 2.84 7.09 2.5 7.5 2.5H16.5C16.91 2.5 17.25 2.84 17.25 3.25V4.75H18C19.24 4.75 20.25 5.76 20.25 7V19C20.25 20.24 19.24 21.25 18 21.25H6C4.76 21.25 3.75 20.24 3.75 19V7C3.75 5.76 4.76 4.75 6 4.75H6.75V3.25ZM8.25 4.75H15.75V4H8.25V4.75ZM5.25 7C5.25 6.59 5.59 6.25 6 6.25H18C18.41 6.25 18.75 6.59 18.75 7V19C18.75 19.41 18.41 19.75 18 19.75H6C5.59 19.75 5.25 19.41 5.25 19V7ZM15.53 10.47C15.82 10.76 15.82 11.24 15.53 11.53L11.53 15.53C11.24 15.82 10.76 15.82 10.47 15.53L8.47 13.53C8.18 13.24 8.18 12.76 8.47 12.47C8.76 12.18 9.24 12.18 9.53 12.47L11 13.94L14.47 10.47C14.76 10.18 15.24 10.18 15.53 10.47Z" /> },
  { title: 'Relatórios', desc: 'Acompanhe métricas de conversão e desempenho da equipe.', icon: <path fillRule="evenodd" clipRule="evenodd" d="M3.25 4C3.25 3.59 3.59 3.25 4 3.25H4.01C4.42 3.25 4.76 3.59 4.76 4V18.5C4.76 18.91 5.09 19.25 5.5 19.25H20C20.41 19.25 20.75 19.59 20.75 20C20.75 20.41 20.41 20.75 20 20.75H5.5C4.26 20.75 3.25 19.74 3.25 18.5V4ZM7.25 14C7.25 13.59 7.59 13.25 8 13.25H9C9.41 13.25 9.75 13.59 9.75 14V17C9.75 17.41 9.41 17.75 9 17.75H8C7.59 17.75 7.25 17.41 7.25 17V14ZM12 9.25C11.59 9.25 11.25 9.59 11.25 10V17C11.25 17.41 11.59 17.75 12 17.75H13C13.41 17.75 13.75 17.41 13.75 17V10C13.75 9.59 13.41 9.25 13 9.25H12ZM15.25 12C15.25 11.59 15.59 11.25 16 11.25H17C17.41 11.25 17.75 11.59 17.75 12V17C17.75 17.41 17.41 17.75 17 17.75H16C15.59 17.75 15.25 17.41 15.25 17V12Z" /> },
];

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">CRM</h2>
        <p className="text-sm text-gray-500 mt-1">Gerencie o relacionamento com seus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:shadow-theme-sm transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="fill-gray-800" width="24" height="24" viewBox="0 0 24 24" fill="none">{f.icon}</svg>
            </div>
            <h3 className="mt-5 text-base font-semibold text-gray-800">{f.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        <p className="text-sm text-gray-500">Este módulo está com base para ser expandido com workflow completo de atendimento.</p>
      </div>
    </div>
  );
}
