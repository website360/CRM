import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "CRM LP - Entrar",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-screen bg-gray-900">
        {children}
      </body>
    </html>
  );
}
