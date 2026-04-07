import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const totalLeads = await prisma.lead.count();
  const newLeads = await prisma.lead.count({ where: { status: 'new' } });
  const contactedLeads = await prisma.lead.count({ where: { status: 'contacted' } });
  const activeCampaigns = await prisma.campaign.count({ where: { status: 'active' } });

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const stats = [
    {
      title: 'Total de Leads',
      value: totalLeads,
      change: '+12%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Leads Novos',
      value: newLeads,
      change: '+8%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-500',
    },
    {
      title: 'Contatados',
      value: contactedLeads,
      change: '+5%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-orange-50 text-orange-500',
    },
    {
      title: 'Campanhas Ativas',
      value: activeCampaigns,
      change: '',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-dark">Dashboard</h2>
        <p className="text-text-muted text-sm mt-1">Visao geral do seu funil de leads</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
              {stat.change && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stat.positive ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-text-dark">{stat.value}</p>
            <p className="text-sm text-text-muted mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-dark">Leads Recentes</h3>
            <p className="text-sm text-text-muted">Ultimos leads capturados</p>
          </div>
          <a href="/leads" className="text-sm font-medium text-primary hover:text-primary-dark transition">
            Ver todos
          </a>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Fonte</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    Nenhum lead cadastrado ainda.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary text-xs font-bold">{lead.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-text-dark">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{lead.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-bg-body rounded-lg text-xs font-medium text-text-muted">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">{lead.createdAt.toLocaleDateString('pt-BR')}</td>
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
    new: 'bg-primary/10 text-primary',
    contacted: 'bg-blue-50 text-blue-600',
    qualified: 'bg-orange-50 text-orange-600',
    converted: 'bg-purple-50 text-purple-600',
  };

  const labels: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    converted: 'Convertido',
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
