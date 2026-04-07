import { prisma } from '@/lib/prisma';
import LeadForm from '@/components/LeadForm';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Leads</h2>
        <p className="text-text-muted text-sm mt-1">Gerencie todos os seus leads capturados</p>
      </div>

      <LeadForm />

      <div className="bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-50">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-dark">Todos os Leads</h3>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary">{leads.length} registros</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Telefone</th>
                <th className="px-6 py-4 font-medium">Fonte</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-text-muted">Nenhum lead cadastrado ainda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
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
                    <td className="px-6 py-4 text-text-muted">{lead.phone ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-bg-body rounded-lg text-xs font-medium text-text-muted">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">{lead.createdAt.toLocaleString('pt-BR')}</td>
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
