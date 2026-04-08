import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ContatosPage() {
  const contacts = await prisma.lead.findMany({
    where: { phone: { not: null } },
    orderBy: { createdAt: 'desc' },
  });

  // Get conversation info for each contact
  const conversations = await prisma.conversation.findMany({
    where: { contactId: { in: contacts.map((c) => c.phone!).filter(Boolean) } },
    include: { channel: { select: { name: true, type: true } }, _count: { select: { messages: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const convMap = new Map(conversations.map((c) => [c.contactId, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Contatos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Todos os contatos capturados automaticamente ({contacts.length})
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Contato</p></th>
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Telefone</p></th>
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Origem</p></th>
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Canal</p></th>
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mensagens</p></th>
                <th className="px-6 py-3 text-left"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Data</p></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum contato ainda. Os contatos são adicionados automaticamente quando enviam mensagem.
                  </td>
                </tr>
              ) : contacts.map((contact) => {
                const conv = convMap.get(contact.phone!);
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{contact.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{contact.email.endsWith('@whatsapp.contact') ? '' : contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">+{contact.phone}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{contact.source}</span>
                    </td>
                    <td className="px-6 py-3">
                      {conv ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          conv.channel.type === 'whatsapp' ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' :
                          conv.channel.type === 'instagram' ? 'bg-pink-50 text-pink-500 dark:bg-pink-500/15 dark:text-pink-400' :
                          'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
                        }`}>{conv.channel.name}</span>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{conv?._count.messages || 0}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{contact.createdAt.toLocaleDateString('pt-BR')}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
