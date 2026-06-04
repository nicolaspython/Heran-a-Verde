'use client';

import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function AdminLoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('hv_token', r.token);
      onLogin(r.user);
      toast.success('Bem-vindo(a) de volta!');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Painel Administrativo</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Acesse para gerenciar o Herança Verde</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-7 shadow-xl shadow-zinc-200/60 dark:shadow-none space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            {loading ? (
              <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Entrando…</>
            ) : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
