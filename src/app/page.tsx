import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const totalLeads = await prisma.lead.count();
  const newLeads = await prisma.lead.count({ where: { status: 'new' } });
  const whatsappClicks = await prisma.lead.count({ where: { status: 'whatsapp' } });
  const contactedLeads = await prisma.lead.count({ where: { status: 'contacted' } });

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const stats = [
    {
      title: 'Total de Leads',
      value: totalLeads,
      change: '+11.01%',
      positive: true,
      icon: <path fillRule="evenodd" clipRule="evenodd" d="M8.8 5.6C7.59 5.6 6.61 6.59 6.61 7.8C6.61 9.01 7.59 10 8.8 10C10.02 10 11 9.01 11 7.8C11 6.59 10.02 5.6 8.8 5.6ZM5.11 7.8C5.11 5.76 6.76 4.1 8.8 4.1C10.85 4.1 12.5 5.76 12.5 7.8C12.5 9.84 10.85 11.5 8.8 11.5C6.76 11.5 5.11 9.84 5.11 7.8ZM15.3 11.5C14.47 11.5 13.7 11.22 13.08 10.75C13.37 10.33 13.61 9.86 13.76 9.36C14.16 9.75 14.7 10 15.3 10C16.52 10 17.5 9.01 17.5 7.8C17.5 6.59 16.52 5.6 15.3 5.6C14.7 5.6 14.16 5.84 13.76 6.23C13.61 5.73 13.37 5.27 13.08 4.84C13.7 4.38 14.47 4.1 15.3 4.1C17.35 4.1 19 5.76 19 7.8C19 9.84 17.35 11.5 15.3 11.5Z" />,
    },
    {
      title: 'Leads Novos',
      value: newLeads,
      change: '',
      positive: true,
      icon: <path fillRule="evenodd" clipRule="evenodd" d="M12 3.25L18.78 6.98L12 10.71L5.22 6.98L12 3.25ZM4.29 8.19V16.09C4.29 16.38 4.45 16.64 4.71 16.77L11.25 20.04V11.65L4.29 8.19ZM12.75 20.04L19.29 16.77C19.55 16.64 19.71 16.38 19.71 16.09V8.19L12.75 11.65V20.04Z" />,
    },
    {
      title: 'Cliques WhatsApp',
      value: whatsappClicks,
      change: '',
      positive: true,
      icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h0a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26C.16 5.34 4.44.89 9.89.89c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 012.89 6.99c0 5.45-4.44 9.88-9.89 9.88" />,
    },
    {
      title: 'Contatados',
      value: contactedLeads,
      change: '',
      positive: true,
      icon: <path fillRule="evenodd" clipRule="evenodd" d="M3.25 7C3.25 5.76 4.26 4.75 5.5 4.75H18.5C19.74 4.75 20.75 5.76 20.75 7V17C20.75 18.24 19.74 19.25 18.5 19.25H5.5C4.26 19.25 3.25 18.24 3.25 17V7ZM5.5 6.25C5.09 6.25 4.75 6.59 4.75 7V7.15L12 11.85L19.25 7.15V7C19.25 6.59 18.91 6.25 18.5 6.25H5.5ZM19.25 8.9L12.42 13.32C12.16 13.49 11.84 13.49 11.58 13.32L4.75 8.9V17C4.75 17.41 5.09 17.75 5.5 17.75H18.5C18.91 17.75 19.25 17.41 19.25 17V8.9Z" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="fill-gray-800" width="24" height="24" viewBox="0 0 24 24" fill="none">
                {stat.icon}
              </svg>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500">{stat.title}</span>
                <h4 className="mt-2 text-3xl font-bold text-gray-800">{stat.value}</h4>
              </div>
              {stat.change && (
                <span className={`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium ${
                  stat.positive
                    ? 'bg-success-50 text-success-600'
                    : 'bg-error-50 text-error-600'
                }`}>
                  <svg className="fill-current" width="12" height="12" viewBox="0 0 12 12">
                    <path fillRule="evenodd" clipRule="evenodd" d={stat.positive
                      ? "M5.56 1.62C5.7 1.47 5.9 1.37 6.12 1.37h.01c.19 0 .38.07.53.22l3 2.99c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L7.37 3.93V10.13c0 .41-.34.75-.75.75s-.75-.34-.75-.75V3.94L4.59 5.65c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06l2.97-2.97z"
                      : "M5.31 10.38C5.45 10.53 5.65 10.63 5.87 10.63h.01c.19 0 .38-.07.53-.22l3-2.99c.29-.29.29-.77 0-1.06-.29-.29-.77-.29-1.06 0L7.12 8.07V1.88c0-.41-.34-.75-.75-.75s-.75.34-.75.75v6.19L4.34 6.35c-.29-.29-.77-.29-1.06 0-.29.29-.29.77 0 1.06l2.03 2.97z"
                    } />
                  </svg>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Leads Recentes</h3>
          <a href="/leads" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 transition">
            Ver todos
          </a>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-y border-gray-100">
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500">Nome</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500">Email</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500">Fonte</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500">Status</p></th>
                <th className="py-3 text-left"><p className="text-xs font-medium text-gray-500">Data</p></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                    Nenhum lead cadastrado ainda.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                          <span className="text-sm font-semibold text-gray-700">{lead.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{lead.name}</p>
                      </div>
                    </td>
                    <td className="py-3"><p className="text-sm text-gray-500">{lead.email}</p></td>
                    <td className="py-3"><p className="text-sm text-gray-500">{lead.source}</p></td>
                    <td className="py-3"><StatusBadge status={lead.status} /></td>
                    <td className="py-3"><p className="text-sm text-gray-500">{lead.createdAt.toLocaleDateString('pt-BR')}</p></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-brand-50 text-brand-500',
    whatsapp: 'bg-success-50 text-success-600',
    contacted: 'bg-blue-50 text-blue-600',
    qualified: 'bg-warning-50 text-warning-600',
    converted: 'bg-success-50 text-success-600',
  };

  const labels: Record<string, string> = {
    new: 'Novo',
    whatsapp: 'WhatsApp',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    converted: 'Convertido',
  };

  return (
    <p className={`rounded-full px-2 py-0.5 text-xs font-medium inline-block ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </p>
  );
}
