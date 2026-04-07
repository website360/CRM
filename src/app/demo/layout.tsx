import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Consultoria Digital | Transforme seu Negócio",
  description: "Página de demonstração - site do cliente",
};

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ background: "#fff", color: "#1a1a2e" }}>
        {children}
      </body>
    </html>
  );
}
