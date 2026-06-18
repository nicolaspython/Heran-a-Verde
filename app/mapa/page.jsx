"use client";

import { useEffect, useState } from "react";
import CampusMap from "@/components/map/CampusMap";

export default function MapPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Busca todas as espécies da API
  useEffect(() => {
    fetch("/api/species")
      .then((r) => r.json())
      .then((data) => {
        // Filtra só as que já tem coordenadas definidas
        setSpecies(data.filter((s) => s.latitude && s.longitude));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Chamado ao clicar no mapa com o modo "adicionar" ativo
  // Abre um seletor para escolher qual espécie colocar nessa posição
  const handleAddSpecies = (lat, lng) => {
    // Busca todas as espécies (incluindo sem coordenadas) para exibir no seletor
    fetch("/api/species")
      .then((r) => r.json())
      .then((all) => {
        const name = prompt(
          `📍 Posição: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\nEspécies disponíveis:\n` +
          all.map((s, i) => `${i + 1}. ${s.scientificName} (${s.commonName || "sem nome popular"})`).join("\n") +
          "\n\nDigite o NÚMERO da espécie para fixar nessa posição:"
        );
        if (!name) return;
        const idx = parseInt(name, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= all.length) {
          alert("Número inválido.");
          return;
        }
        const chosen = all[idx];
        const token = localStorage.getItem("hv_token");
        if (!token) {
          alert("Você precisa estar logado como admin para definir coordenadas.");
          return;
        }
        // Salva latitude e longitude na espécie escolhida
        fetch(`/api/species/${chosen.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        })
          .then((r) => r.json())
          .then((updated) => {
            setSpecies((prev) => {
              const exists = prev.find((s) => s.id === updated.id);
              if (exists) return prev.map((s) => (s.id === updated.id ? updated : s));
              return [...prev, updated];
            });
            showToast(`✅ ${updated.scientificName} posicionada no mapa!`);
          })
          .catch(() => showToast("❌ Erro ao salvar posição."));
      });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <main className="min-h-screen bg-green-950 flex flex-col">
      {/* Cabeçalho */}
      <header className="px-6 py-4 border-b border-green-800/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <h1 className="text-green-100 font-bold text-xl leading-none">
                Herança Verde
              </h1>
              <p className="text-green-500 text-xs mt-0.5">
                Mapa Botânico — Liceu de Messejana
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-green-400 text-sm hover:text-green-200 transition-colors"
          >
            ← Voltar ao site
          </a>
        </div>
      </header>

      {/* Mapa */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
          {loading ? (
  <div className="w-full h-full flex flex-col items-center justify-center gap-6">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-20 h-20 rounded-full border-2 border-green-500/20 animate-ping" />
      <div className="w-16 h-16 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center shadow-lg shadow-green-950/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28" height="28"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-green-400 animate-pulse"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>
    </div>
    <div className="flex flex-col items-center gap-3">
      <p className="text-green-300 text-sm font-medium tracking-wide">
        Carregando espécies...
      </p>
      <div className="w-48 h-0.5 bg-green-900/60 rounded-full overflow-hidden">
        <div className="h-full bg-green-400/60 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  </div>
) : (
            <CampusMap
              species={species}
              center={[-3.823328842842737, -38.48170791235997]} // escola
              zoom={19}
              onViewDetails={(sp) => {
  window.location.href = `/especies/${sp.id}`;
}}
              onAddSpecies={handleAddSpecies}
            />
          )}
        </div>
      </div>

      {/* Toast de feedback */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-green-800 text-green-100 px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
