"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre os serviços.";

export default function DemoClientSite() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Nome e email são obrigatórios.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: "demo-landing-page",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }

      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar formulário");
    } finally {
      setSending(false);
    }
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Consultoria Digital</h1>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#sobre" className="hover:text-blue-200 transition">Sobre</a>
            <a href="#servicos" className="hover:text-blue-200 transition">Serviços</a>
            <a href="#contato" className="hover:text-blue-200 transition">Contato</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Transforme seu Negócio com Marketing Digital
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Aumente suas vendas, capture mais leads e escale sua operação com estratégias comprovadas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contato"
              className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-lg shadow hover:shadow-lg hover:bg-blue-50 transition"
            >
              Solicitar Orçamento
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-green-600 transition"
            >
              <WhatsAppIcon />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-10 text-slate-800">
            Por que nos escolher?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Resultados Reais", desc: "Estratégias baseadas em dados para maximizar seu ROI." },
              { title: "Suporte Dedicado", desc: "Equipe disponível para atender suas necessidades." },
              { title: "Experiência", desc: "+500 empresas atendidas em todo o Brasil." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                <h4 className="text-xl font-semibold text-blue-700 mb-2">{item.title}</h4>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-10 text-slate-800">
            Nossos Serviços
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Gestão de Tráfego Pago (Google Ads, Meta Ads)",
              "Criação de Landing Pages de Alta Conversão",
              "Automação de Marketing e CRM",
              "SEO e Marketing de Conteúdo",
            ].map((s) => (
              <div key={s} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                <span className="text-green-500 mt-1 text-lg">&#10003;</span>
                <p className="text-slate-700 font-medium">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário de Contato */}
      <section id="contato" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-2 text-slate-800">
            Entre em Contato
          </h3>
          <p className="text-center text-slate-500 mb-8">
            Preencha o formulário abaixo e retornaremos em até 24h.
          </p>

          {sent ? (
            <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-700 text-xl font-semibold mb-2">Mensagem enviada!</p>
              <p className="text-green-600">Entraremos em contato em breve.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-blue-600 underline hover:text-blue-800"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Como podemos ajudar?"
                />
              </div>

              {error && <p className="text-rose-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>Consultoria Digital - Todos os direitos reservados.</p>
        <p className="mt-1 text-slate-500">Página de demonstração para testes do CRM.</p>
      </footer>

      {/* Botão flutuante WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title="Falar no WhatsApp"
      >
        <WhatsAppIcon size={28} />
      </a>
    </div>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
