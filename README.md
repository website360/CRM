This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Capturar leads de sites externos (HTML/WordPress)

1. Verifique que o endpoint do CRM está rodando: `POST /api/leads`.
2. Ele aceita JSON com: `name`, `email`, `phone`, `source`.
3. Habilitamos CORS no servidor para funcionar de qualquer domínio.

### Snippet para cola na página HTML qualquer:

```html
<script>
function sendLeadToCRM(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.querySelector('[name="name"]')?.value || '',
    email: form.querySelector('[name="email"]')?.value || '',
    phone: form.querySelector('[name="phone"]')?.value || '',
    source: form.querySelector('[name="source"]')?.value || window.location.href,
  };
  if (!payload.name || !payload.email) {
    alert('Nome e email são obrigatórios');
    return;
  }

  fetch('https://SEU-DOMINIO.com/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Falha ao enviar lead');
      alert('Lead enviado com sucesso');
      form.reset();
    })
    .catch(() => alert('Erro ao enviar lead'));
}

const forms = document.querySelectorAll('form');
forms.forEach((f) => f.addEventListener('submit', sendLeadToCRM));
</script>
```

### WordPress
- Colar esse mesmo script em plugin de cabeçalho/rodapé como "Insert Headers and Footers".
- Garantir campos `name`, `email`, `phone`, `source` no form.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
