'use client';

import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { G } from '@/lib/api';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
      <div className={`${G.section} py-10 flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Herança Verde</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Liceu de Messejana · Fortaleza/CE</p>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()} — Inventário Botânico do Campus
          </p>
          <Link
            href="/admin"
            className="mt-1 text-[10px] opacity-30 hover:opacity-80 transition-opacity"
          >
            yasmin linda perfeita maravilhosa
          </Link>
        </div>
      </div>
    </footer>
  );
}
