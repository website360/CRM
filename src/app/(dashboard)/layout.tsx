import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";
import HeaderClient from "@/components/HeaderClient";
import ToastProvider from "@/components/Toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <HeaderClient />
          <main>
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ToastProvider />
    </ThemeProvider>
  );
}
