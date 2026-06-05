import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';

export const metadata = {
  title: 'Herança Verde — Liceu de Messejana',
  description: 'Inventário botânico do campus do Liceu de Messejana, Fortaleza/CE.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
