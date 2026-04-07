import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM LP",
  description: "Sistema de CRM e Funil de Remarketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistMono.variable} h-full antialiased`}>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-99 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3.5 md:px-6">
              <div className="lg:hidden w-8" />
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-500 shadow-theme-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Buscar...</span>
              </div>
              <div className="flex items-center gap-4">
                {/* Notification */}
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition">
                  <svg className="fill-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">3</span>
                </button>
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-800">Admin</p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main>
              <div className="mx-auto max-w-[1536px] p-4 md:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
