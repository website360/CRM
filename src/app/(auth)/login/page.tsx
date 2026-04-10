"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push("/");
    else setError(data.error || "Erro ao entrar");
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
          <h1 className="text-4xl font-bold leading-tight mb-4">Gerencie seus leads,<br />conversas e vendas<br />em um só lugar.</h1>
          <p className="text-lg text-white/70 max-w-md">CRM completo com WhatsApp, Instagram, Email, automações e muito mais.</p>
          <div className="flex items-center gap-6 mt-12">
            {[
              { n: "500+", l: "Empresas" },
              { n: "50k+", l: "Leads gerenciados" },
              { n: "99.9%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-bold">{s.n}</p>
                <p className="text-sm text-white/60">{s.l}</p>
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

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-8">Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="seu@email.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                <a href="#" className="text-xs text-brand-500 hover:text-brand-600">Esqueceu?</a>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                placeholder="••••••••" />
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
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
            <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400">ou</span></div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem conta?{" "}
            <a href="/registro" className="text-brand-500 hover:text-brand-600 font-semibold">Criar conta grátis</a>
          </p>
        </div>
      </div>
    </div>
  );
}
