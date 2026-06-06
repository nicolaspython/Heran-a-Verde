'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const AdminDataContext = createContext(null);

const _cache = {
  species: null,
  categories: null,
  team: null,
  promise: null,
};

export function AdminDataProvider({ children }) {
  const { user } = useAuth();
  const [species, setSpecies] = useState(_cache.species);
  const [categories, setCategories] = useState(_cache.categories);
  const [team, setTeam] = useState(_cache.team);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const fetchAll = useCallback(async () => {
    if (_cache.species && _cache.categories && _cache.team) {
      setSpecies(_cache.species);
      setCategories(_cache.categories);
      setTeam(_cache.team);
      setLoading(false);
      return;
    }

    if (_cache.promise) {
      setLoading(true);
      await _cache.promise;
      setSpecies(_cache.species);
      setCategories(_cache.categories);
      setTeam(_cache.team);
      setLoading(false);
      return;
    }

    setLoading(true);
    _cache.promise = Promise.all([
      api('/species').then((d) => { _cache.species = d; setSpecies(d); }),
      api('/categories').then((d) => { _cache.categories = d; setCategories(d); }),
      api('/team').then((d) => { _cache.team = d; setTeam(d); }),
    ])
      .catch(() => {})
      .finally(() => {
        _cache.promise = null;
        setLoading(false);
      });

    await _cache.promise;
  }, []);

  // Só faz fetch quando há um usuário admin logado
  useEffect(() => {
    if (!user) return;
    if (started.current) return;
    started.current = true;
    fetchAll();
  }, [user, fetchAll]);

  // Reseta quando faz logout
  useEffect(() => {
    if (!user) {
      started.current = false;
      _cache.species = null;
      _cache.categories = null;
      _cache.team = null;
      _cache.promise = null;
    }
  }, [user]);

  const invalidate = useCallback((key) => {
    if (key === 'species' || !key) {
      _cache.species = null;
      api('/species').then((d) => { _cache.species = d; setSpecies(d); }).catch(() => {});
    }
    if (key === 'categories' || !key) {
      _cache.categories = null;
      api('/categories').then((d) => { _cache.categories = d; setCategories(d); }).catch(() => {});
    }
    if (key === 'team' || !key) {
      _cache.team = null;
      api('/team').then((d) => { _cache.team = d; setTeam(d); }).catch(() => {});
    }
  }, []);

  return (
    <AdminDataContext.Provider value={{ species, categories, team, loading, invalidate }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used inside AdminDataProvider');
  return ctx;
}
