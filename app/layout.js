import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { AdminDataProvider } from '@/context/AdminDataContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Herança Verde — Liceu de Messejana',
  description: 'Inventário botânico do campus do Liceu de Messejana, Fortaleza/CE.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AdminDataProvider>  {/* ← adicionar */}
              <style>{`
                @keyframes fadeUp {
                  from { opacity: 0; transform: translateY(12px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Toaster richColors position="bottom-right" />
            </AdminDataProvider>  {/* ← fechar */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}