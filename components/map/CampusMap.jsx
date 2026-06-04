"use client";

import dynamic from "next/dynamic";

// ssr: false é a chave ~ impede que o Leaflet rode no servidor e quebre
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-green-950/50 rounded-2xl border border-green-800/30">
      <div className="flex flex-col items-center gap-3 text-green-400">
        {/* Spinner */}
        <svg
          className="animate-spin w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2C6.5 2 2 9 2 14c0 4.4 4 8 10 8s10-3.6 10-8C22 9 17.5 2 12 2z" />
        </svg>
        <span className="text-sm font-medium tracking-wide">
          Carregando mapa…
        </span>
      </div>
    </div>
  ),
});

// Re-exporta com as mesmas props, transparente para quem usa
export default function CampusMap(props) {
  return <MapView {...props} />;
}
