import { prisma } from '@/lib/prisma';
import LeadForm from '@/components/LeadForm';
import LeadsTabs from '@/components/LeadsTabs';
import UpgradeBanner from '@/components/UpgradeBanner';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });

  // Serialize dates for client component
  const serialized = leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  return (
    <div>
      <UpgradeBanner resource="leads" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Leads</h2>
        <p className="text-text-muted text-sm mt-1">Gerencie todos os seus leads capturados</p>
      </div>

      <LeadForm />

      <LeadsTabs leads={serialized} />
    </div>
  );
}
