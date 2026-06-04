'use client';

import { Leaf, LogOut, Settings, Home as HomeIcon, MapPin, BookOpen, Users } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { G } from '@/lib/api';

export default function Navbar({ view, setView, user, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'catalog', label: 'Catálogo', icon: Leaf },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'about', label: 'Sobre', icon: BookOpen },
    { id: 'map', label: 'Mapa', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
      <div className={`${G.section} flex h-16 items-center justify-between gap-4`}>
        {/* Logo */}
        <button onClick={() => setView({ name: 'home' })} className="flex items-center gap-3 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col -gap-0.5">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-none">Herança Verde</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">Liceu de Messejana</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = view.name === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ name: item.id })}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user && (
            <>
              <button
                onClick={() => setView({ name: 'admin' })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={onLogout}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800/60">
        <div className={`${G.section} flex justify-around py-1`}>
          {navItems.map((item) => {
            const active = view.name === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ name: item.id })}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-xs font-medium ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
