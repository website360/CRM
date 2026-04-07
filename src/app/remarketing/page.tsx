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
        <h2 className="text-lg font-semibold text-gray-800">Funil de Remarketing</h2>
        <p className="text-sm text-gray-500 mt-1">Acompanhe a jornada de conversão dos seus leads</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-6">Visão do Funil</h3>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-4">
              <div className="w-44 text-sm text-gray-500 text-right shrink-0">{stage.name}</div>
              <div className="flex-1">
                <div className={`${stage.width} ${stage.color} h-10 rounded-lg flex items-center justify-end pr-4 transition-all`}>
                  <span className="text-white text-sm font-bold">{stage.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:shadow-theme-sm transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <svg className="fill-gray-800" width="24" height="24" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M3.75 4.5C3.75 4.09 4.09 3.75 4.5 3.75H19.5C19.91 3.75 20.25 4.09 20.25 4.5V6.59C20.25 6.79 20.17 6.98 20.03 7.12L14.25 12.9V18.64C14.25 19.22 13.63 19.58 13.14 19.28L10.14 17.48C9.9 17.33 9.75 17.07 9.75 16.79V12.9L3.97 7.12C3.83 6.98 3.75 6.79 3.75 6.59V4.5Z" /></svg>
          </div>
          <h3 className="mt-5 text-base font-semibold text-gray-800">Segmentação</h3>
          <p className="mt-1 text-sm text-gray-500">Crie listas com comportamento, origem e value props para as campanhas.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:shadow-theme-sm transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <svg className="fill-gray-800" width="24" height="24" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 16.83 7.17 20.75 12 20.75C16.83 20.75 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25ZM4.75 12C4.75 7.99 7.99 4.75 12 4.75C16.01 4.75 19.25 7.99 19.25 12C19.25 16.01 16.01 19.25 12 19.25C7.99 19.25 4.75 16.01 4.75 12ZM12.75 8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V12C11.25 12.22 11.34 12.42 11.5 12.56L14.5 15.06C14.81 15.32 15.28 15.28 15.56 14.97C15.83 14.66 15.79 14.19 15.48 13.91L12.75 11.64V8Z" /></svg>
          </div>
          <h3 className="mt-5 text-base font-semibold text-gray-800">Automação</h3>
          <p className="mt-1 text-sm text-gray-500">Defina gatilhos de reengajamento para capturar leads inativos.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        <p className="text-sm text-gray-500">Em breve: visualização de jornada e taxa de conversão por etapa.</p>
      </div>
    </div>
  );
}
