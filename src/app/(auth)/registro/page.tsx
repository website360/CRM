"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, companyName }) });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push("/onboarding");
    else setError(data.error || "Erro ao cadastrar");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur mb-8">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Comece a vender<br />mais hoje.</h1>
          <p className="text-lg text-white/70 max-w-md mb-8">14 dias grátis. Sem cartão de crédito. Cancele quando quiser.</p>
          <div className="space-y-4">
            {[
              "CRM com Kanban arrasta e solta",
              "WhatsApp, Instagram e Email integrados",
              "Automações e fluxos visuais",
              "Atendimento por IA (Claude)",
              "Widget de chat para seu site",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-white/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 mb-8">
            <span className="text-white font-bold text-xl">C</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-8">Teste grátis por 14 dias, sem cartão</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seu nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="João Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da empresa</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="Minha Empresa (opcional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="Mínimo 6 caracteres" />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-100 dark:border-error-500/20">
                <svg className="w-4 h-4 text-error-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/30 transition disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Criando...
                </span>
              ) : "Criar conta grátis"}
            </button>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
              Ao criar sua conta, você concorda com os Termos de Uso e Política de Privacidade.
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
            <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400">ou</span></div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Já tem conta?{" "}
            <a href="/login" className="text-brand-500 hover:text-brand-600 font-semibold">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
