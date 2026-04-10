import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM LP",
  description: "Sistema de CRM e Funil de Remarketing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
