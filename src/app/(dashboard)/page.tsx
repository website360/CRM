import { prisma } from '@/lib/prisma';
import DashboardCharts from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const totalLeads = await prisma.lead.count();
  const newLeads = await prisma.lead.count({ where: { status: 'new' } });
  const whatsappClicks = await prisma.lead.count({ where: { status: 'whatsapp' } });
  const contactedLeads = await prisma.lead.count({ where: { status: 'contacted' } });

  const recentLeads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });

  const stats = [
    { title: 'Total de Leads', value: totalLeads, change: '+11.01%', positive: true, bg: 'bg-brand-50 dark:bg-brand-500/10', iconColor: 'text-brand-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { title: 'Leads Novos', value: newLeads, change: '+8.2%', positive: true, bg: 'bg-success-50 dark:bg-success-500/10', iconColor: 'text-success-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> },
    { title: 'Cliques WhatsApp', value: whatsappClicks, change: '', positive: true, bg: 'bg-success-50 dark:bg-success-500/10', iconColor: 'text-success-600', icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35" /> },
    { title: 'Contatados', value: contactedLeads, change: '', positive: true, bg: 'bg-warning-50 dark:bg-warning-500/10', iconColor: 'text-warning-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {stats.map((s) => (
          <div key={s.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
              <svg className={`w-6 h-6 ${s.iconColor}`} fill={s.title === 'Cliques WhatsApp' ? 'currentColor' : 'none'} stroke={s.title === 'Cliques WhatsApp' ? 'none' : 'currentColor'} strokeWidth={1.8} viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{s.title}</span>
                <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">{s.value}</h4>
              </div>
              {s.change && (
                <span className={`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium ${s.positive ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'}`}>
                  <svg className="fill-current" width="12" height="12" viewBox="0 0 12 12"><path fillRule="evenodd" clipRule="evenodd" d="M5.56 1.62C5.7 1.47 5.9 1.37 6.12 1.37h.01c.19 0 .38.07.53.22l3 2.99c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L7.37 3.93V10.13c0 .41-.34.75-.75.75s-.75-.34-.75-.75V3.94L4.59 5.65c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06l2.97-2.97z" /></svg>
                  {s.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Recent Leads */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] px-4 pb-3 pt-4 sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Leads Recentes</h3>
          <a href="/leads" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 shadow-theme-xs hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">Ver todos</a>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800">
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Nome</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fonte</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Data</p></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentLeads.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum lead cadastrado ainda.</td></tr>
              ) : recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{lead.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{lead.name}</p>
                    </div>
                  </td>
                  <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.email}</p></td>
                  <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.source}</p></td>
                  <td className="py-3"><StatusBadge status={lead.status} /></td>
                  <td className="py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{lead.createdAt.toLocaleDateString('pt-BR')}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    new: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
    whatsapp: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
    contacted: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    qualified: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
    converted: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  };
  const l: Record<string, string> = { new: 'Novo', whatsapp: 'WhatsApp', contacted: 'Contatado', qualified: 'Qualificado', converted: 'Convertido' };
  return <p className={`rounded-full px-2 py-0.5 text-xs font-medium inline-block ${s[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{l[status] || status}</p>;
}
