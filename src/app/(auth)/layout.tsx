import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        {children}
      </body>
    </html>
  );
}
