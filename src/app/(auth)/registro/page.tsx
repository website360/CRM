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

  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 mx-auto mb-4">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Criar Conta</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Teste grátis por 14 dias, sem cartão</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seu nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="João Silva" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="seu@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da empresa</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inp} placeholder="Minha Empresa" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inp} placeholder="Mínimo 6 caracteres" required minLength={6} />
        </div>
        {error && <p className="text-sm text-error-500">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
          {loading ? "Criando..." : "Criar conta grátis"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Já tem conta? <a href="/login" className="text-brand-500 hover:text-brand-600 font-medium">Entrar</a>
      </p>
    </div>
  );
}
