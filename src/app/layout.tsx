import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import ThemeProvider from "../components/ThemeProvider";
import HeaderClient from "../components/HeaderClient";

export const metadata: Metadata = {
  title: "CRM LP",
  description: "Sistema de CRM e Funil de Remarketing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <HeaderClient />
              <main>
                <div className="mx-auto max-w-[1536px] p-4 md:p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
