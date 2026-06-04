'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import HomeView from '@/components/views/HomeView';
import CatalogView from '@/components/views/CatalogView';
import SpeciesDetailView from '@/components/views/SpeciesDetailView';
import TeamView from '@/components/views/TeamView';
import AboutView from '@/components/views/AboutView';
import AdminLoginView from '@/components/views/AdminLoginView';
import AdminDashboard from '@/components/views/AdminDashboard';

function MapRedirect() {
  useEffect(() => { window.location.href = '/mapa'; }, []);
  return null;
}

export default function App() {
  const [view, setView] = useState({ name: 'home' });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    const id = params.get('id');
    if (v === 'species' && id) {
      window.location.replace(`/especies/${id}`);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('hv_token');
    if (token) {
      api('/auth/me')
        .then((r) => setUser(r.user))
        .catch(() => localStorage.removeItem('hv_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const onLogout = () => {
    localStorage.removeItem('hv_token');
    setUser(null);
    setView({ name: 'home' });
    toast.success('Você saiu');
  };

  useEffect(() => {
    if (view.name === 'admin' && authChecked && !user) setView({ name: 'admin-login' });
  }, [view.name, user, authChecked]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar view={view} setView={setView} user={user} onLogout={onLogout} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.name + (view.id || '')}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.01, filter: 'blur(8px)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center' }}
          >
            {view.name === 'home'        && <HomeView setView={setView} />}
            {view.name === 'catalog'     && <CatalogView setView={setView} />}
            {view.name === 'map'         && <MapRedirect />}
            {view.name === 'species'     && <SpeciesDetailView id={view.id} setView={setView} />}
            {view.name === 'team'        && <TeamView />}
            {view.name === 'about'       && <AboutView />}
            {view.name === 'admin-login' && (
              <AdminLoginView onLogin={(u) => { setUser(u); setView({ name: 'admin' }); }} />
            )}
            {view.name === 'admin' && user && (
              <AdminDashboard user={user} setView={setView} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
