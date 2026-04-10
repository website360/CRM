export default function AjudaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Central de Ajuda</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Guias de configuração para todos os canais e integrações</p>
      </div>

      {/* Widget de Chat */}
      <Section id="widget" title="Widget de Chat para Sites" icon="chat" description="Adicione um chat de atendimento em qualquer site. As mensagens chegam na Caixa de Entrada junto com WhatsApp e Instagram.">
        <Step n={1} title="Criar o Canal Webchat">
          <p>Vá em <b>Canais</b> e clique em <b>Nova Instância</b>. Selecione o tipo <code>webchat</code> (ou crie via API):</p>
          <CodeBlock>{`POST /api/channels
{
  "type": "webchat",
  "name": "Chat do Site Principal",
  "welcomeMessage": "Olá! Como posso ajudar?",
  "aiEnabled": true
}`}</CodeBlock>
          <p className="mt-2">Anote o <b>ID do canal</b> retornado (ex: <code>5</code>).</p>
        </Step>

        <Step n={2} title="Instalar no site do cliente">
          <p>Cole este script antes do <code>{'</body>'}</code> no HTML do site:</p>
          <CodeBlock>{`<script
  src="https://SEU-DOMINIO/widget.js"
  data-api="https://SEU-DOMINIO"
  data-channel="ID_DO_CANAL"
  data-color="#465FFF"
  data-title="Suporte"
  data-subtitle="Estamos online"
  data-position="right"
></script>`}</CodeBlock>
          <Alert>Substitua <code>SEU-DOMINIO</code> pelo endereço do CRM (ex: <code>http://24.144.86.152</code>) e <code>ID_DO_CANAL</code> pelo ID do canal webchat criado.</Alert>
        </Step>

        <Step n={3} title="Parâmetros disponíveis">
          <table className="w-full text-sm mt-2">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Atributo</th>
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Obrigatório</th>
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Descrição</th>
            </tr></thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>data-api</code></td><td className="pr-4">Sim</td><td>URL base do CRM</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>data-channel</code></td><td className="pr-4">Sim</td><td>ID do canal webchat</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>data-color</code></td><td className="pr-4">Não</td><td>Cor principal do widget (hex). Padrão: <code>#465FFF</code></td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>data-title</code></td><td className="pr-4">Não</td><td>Título no header. Padrão: "Chat"</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>data-subtitle</code></td><td className="pr-4">Não</td><td>Subtítulo. Padrão: "Estamos online"</td></tr>
              <tr><td className="py-2 pr-4"><code>data-position</code></td><td className="pr-4">Não</td><td><code>right</code> ou <code>left</code>. Padrão: <code>right</code></td></tr>
            </tbody>
          </table>
        </Step>

        <Step n={4} title="Como funciona">
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>O visitante abre o chat e digita seu nome</li>
            <li>Cada mensagem é enviada para a API do CRM via <code>POST /api/widget</code></li>
            <li>Se a IA estiver ativa, responde automaticamente</li>
            <li>As mensagens aparecem na <b>Caixa de Entrada</b> com o ícone do canal webchat</li>
            <li>O atendente pode assumir a conversa clicando em "Assumir Conversa"</li>
            <li>O widget faz polling a cada 3s para receber respostas (da IA ou do humano)</li>
          </ul>
        </Step>
      </Section>

      {/* WhatsApp */}
      <Section id="whatsapp" title="Integração WhatsApp" icon="whatsapp" description="Conecte números de WhatsApp via QR Code para receber e enviar mensagens.">
        <Step n={1} title="Criar o Canal">
          <p>Vá em <b>Canais</b> → <b>Nova Instância</b> → selecione <b>WhatsApp</b> → defina um nome.</p>
        </Step>
        <Step n={2} title="Conectar via QR Code">
          <p>Clique em <b>Conectar</b>. Um QR Code aparecerá no card. Abra o WhatsApp no celular → <b>Dispositivos Conectados</b> → <b>Conectar Dispositivo</b> → escaneie o QR.</p>
          <Alert>O servidor precisa manter a conexão ativa. Se o servidor reiniciar, reconecte o QR.</Alert>
        </Step>
        <Step n={3} title="Configurar IA">
          <p>Clique em <b>Config</b> na instância → ative o <b>Agente de IA</b> → escreva o prompt de treinamento com informações da empresa.</p>
        </Step>
        <Step n={4} title="Takeover humano">
          <p>Na <b>Caixa de Entrada</b>, clique em <b>"Assumir Conversa"</b> para parar a IA e responder manualmente. Clique em <b>"Devolver p/ IA"</b> para reativar.</p>
        </Step>
      </Section>

      {/* Instagram */}
      <Section id="instagram" title="Integração Instagram" icon="instagram" description="Receba mensagens do Instagram Direct na Caixa de Entrada.">
        <Step n={1} title="Criar App no Meta Developer Portal">
          <ol className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Acesse <b>developers.facebook.com</b> → Criar App → Tipo: Business</li>
            <li>Adicione o produto <b>Instagram Messaging</b> (ou Messenger)</li>
            <li>Na seção <b>Instagram Settings</b>, conecte sua conta do Instagram Business</li>
            <li>Gere um <b>Access Token</b> com permissão <code>instagram_manage_messages</code></li>
            <li>Anote o <b>Instagram User ID</b> (ou Page ID)</li>
          </ol>
        </Step>
        <Step n={2} title="Criar o Canal no CRM">
          <p>Vá em <b>Canais</b> → <b>Nova Instância</b> → selecione <b>Instagram</b></p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 mt-1">
            <li><b>Page/IG User ID:</b> o ID copiado do Meta Developer Portal</li>
            <li><b>Access Token:</b> o token gerado</li>
          </ul>
        </Step>
        <Step n={3} title="Configurar Webhook no Meta">
          <p>No Meta Developer Portal → <b>Webhooks</b> → Adicionar:</p>
          <CodeBlock>{`Callback URL: https://SEU-DOMINIO/api/webhook/instagram
Verify Token: crm-lp-instagram-verify`}</CodeBlock>
          <p className="mt-1">Assine os campos: <code>messages</code>, <code>messaging_postbacks</code></p>
          <Alert>O webhook precisa ser HTTPS. Configure um domínio com SSL ou use um serviço como ngrok para testes.</Alert>
        </Step>
        <Step n={4} title="Testar">
          <p>Envie uma mensagem para o Instagram Business conectado. Ela deve aparecer na <b>Caixa de Entrada</b> com o ícone rosa do Instagram.</p>
        </Step>
      </Section>

      {/* Plugin WordPress */}
      <Section id="wordpress" title="Plugin WordPress" icon="wordpress" description="Capture leads de formulários WordPress automaticamente.">
        <Step n={1} title="Instalar o plugin">
          <p>Faça upload da pasta <code>crm-lp-wordpress-plugin</code> para <code>wp-content/plugins/</code> e ative.</p>
        </Step>
        <Step n={2} title="Configurar">
          <p>Vá em <b>Configurações → CRM LP</b> no WordPress:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 mt-1">
            <li><b>URL da API:</b> <code>https://SEU-DOMINIO/api/leads</code></li>
            <li><b>API Key:</b> a chave do <code>.env</code> do CRM</li>
            <li><b>Source:</b> identificador do site (ex: <code>site-principal</code>)</li>
          </ul>
        </Step>
        <Step n={3} title="Mapear campos">
          <p>Mapeie os campos do formulário (CF7, WPForms, Elementor, Gravity Forms) para os campos do CRM. Campos personalizados vão para <b>metadata</b>.</p>
        </Step>
        <Step n={4} title="Rastreamento de WhatsApp">
          <p>Links de WhatsApp no site são rastreados automaticamente. Cada clique é registrado na aba <b>WhatsApp</b> dos Leads.</p>
        </Step>
      </Section>

      {/* API */}
      <Section id="api" title="API REST" icon="api" description="Use a API para integrar com qualquer sistema externo.">
        <Step n={1} title="Autenticação">
          <p>Envie o header <code>X-API-Key</code> com a chave configurada no <code>.env</code>:</p>
          <CodeBlock>{`curl -X GET https://SEU-DOMINIO/api/leads \\
  -H "X-API-Key: sua-chave-aqui"`}</CodeBlock>
        </Step>
        <Step n={2} title="Endpoints">
          <table className="w-full text-sm mt-2">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Método</th>
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Rota</th>
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Descrição</th>
            </tr></thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>GET</code></td><td className="pr-4"><code>/api/leads</code></td><td>Listar leads</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>POST</code></td><td className="pr-4"><code>/api/leads</code></td><td>Criar lead</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>GET</code></td><td className="pr-4"><code>/api/channels</code></td><td>Listar canais</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>POST</code></td><td className="pr-4"><code>/api/channels</code></td><td>Criar canal</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>GET</code></td><td className="pr-4"><code>/api/inbox</code></td><td>Listar conversas</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>GET</code></td><td className="pr-4"><code>/api/inbox/:id</code></td><td>Mensagens de uma conversa</td></tr>
              <tr className="border-b border-gray-100 dark:border-gray-800"><td className="py-2 pr-4"><code>POST</code></td><td className="pr-4"><code>/api/inbox/:id/send</code></td><td>Enviar mensagem</td></tr>
              <tr><td className="py-2 pr-4"><code>POST</code></td><td className="pr-4"><code>/api/widget</code></td><td>Widget: enviar mensagem</td></tr>
            </tbody>
          </table>
        </Step>
      </Section>
    </div>
  );
}

function Section({ id, title, icon, description, children }: { id: string; title: string; icon: string; description: string; children: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    whatsapp: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35" />,
    instagram: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></>,
    wordpress: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
    api: <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
  };
  const isStroke = icon === 'chat' || icon === 'api';

  return (
    <section id={id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <svg className={`w-6 h-6 ${isStroke ? 'text-brand-500' : 'fill-brand-500'}`}
            fill={isStroke ? 'none' : 'currentColor'}
            stroke={isStroke ? 'currentColor' : 'none'}
            strokeWidth={isStroke ? 1.8 : undefined}
            viewBox="0 0 24 24">{icons[icon]}</svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-6">{children}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-bold">{n}</div>
      <div className="flex-1">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-2">{title}</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 rounded-lg bg-gray-900 dark:bg-black p-4 text-sm text-gray-100 overflow-x-auto font-mono">
      <code>{children}</code>
    </pre>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning-50 bg-warning-50 dark:bg-warning-500/10 dark:border-warning-500/20 p-3">
      <svg className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p className="text-sm text-warning-600 dark:text-warning-500">{children}</p>
    </div>
  );
}
