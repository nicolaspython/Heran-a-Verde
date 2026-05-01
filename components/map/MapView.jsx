"use client";

import { useEffect, useRef, useState } from "react";

// ─── Estilos do popup personalizado ───────────────────────────────────────────
const POPUP_STYLE = `
  .heranca-popup .leaflet-popup-content-wrapper {
    background: #1a2e1a;
    border: 1px solid #4a7c59;
    border-radius: 12px;
    color: #e8f5e9;
    padding: 0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .heranca-popup .leaflet-popup-tip {
    background: #4a7c59;
  }
  .heranca-popup .leaflet-popup-content {
    margin: 0;
    min-width: 200px;
  }
`;

// ─── Ícone SVG da folha como marcador ─────────────────────────────────────────
function createLeafIcon(L) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px; height:36px;
        background:#2d5a27;
        border: 2px solid #7cb87a;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display:flex; align-items:center; justify-content:center;
      ">
        <svg style="transform:rotate(45deg)" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.5 2 2 9 2 14c0 4.4 4 8 10 8s10-3.6 10-8C22 9 17.5 2 12 2z" fill="#a8d5a2"/>
          <path d="M12 2 Q12 12 12 22" stroke="#2d5a27" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// ─── Ícone para localização do usuário ────────────────────────────────────────
function createUserIcon(L) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:20px; height:20px;
        background:#3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// Props:
//   species        – array de espécies (obrigatório)
//   center         – [lat, lng] centro inicial do mapa
//   zoom           – zoom inicial
//   onAddSpecies   – callback(lat, lng) chamado ao clicar no mapa (opcional)
//   onViewDetails  – callback(species) ao clicar em "Ver detalhes" (opcional)
// ─────────────────────────────────────────────────────────────────────────────
export default function MapView({
  species = [],
  center = [-3.7172, -38.5433], // Fortaleza como padrão
  zoom = 17,
  onAddSpecies,
  onViewDetails,
}) {
  const mapRef = useRef(null);       // referência ao elemento <div>
  const mapInstanceRef = useRef(null); // instância do mapa Leaflet
  const [userPos, setUserPos] = useState(null);
  const [addingMarker, setAddingMarker] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState(null);

  // ── Injeta CSS do Leaflet + estilos do popup ──────────────────────────────
  useEffect(() => {
    // CSS do Leaflet
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Estilos do popup
    if (!document.getElementById("heranca-popup-style")) {
      const style = document.createElement("style");
      style.id = "heranca-popup-style";
      style.textContent = POPUP_STYLE;
      document.head.appendChild(style);
    }
  }, []);

  // ── Inicializa o mapa ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) return; // evita dupla inicialização

    let L;
    let map;

    const init = async () => {
      // Import dinâmico resolve o erro "window is not defined" no SSR
      L = (await import("leaflet")).default;

      map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: false, // vamos posicionar manualmente
      });
      mapInstanceRef.current = map;

      // Tiles OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 22,
      }).addTo(map);

      // Controle de zoom no canto inferior direito
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // ── Marcadores das espécies ──────────────────────────────────────────
      const leafIcon = createLeafIcon(L);

      species.forEach((sp) => {
        if (!sp.latitude || !sp.longitude) return;

        const marker = L.marker([sp.latitude, sp.longitude], {
          icon: leafIcon,
        }).addTo(map);

        marker.bindPopup(buildPopupHTML(sp), {
          className: "heranca-popup",
          maxWidth: 260,
        });

        // Botão "Ver detalhes" dentro do popup
        marker.on("popupopen", () => {
          const btn = document.getElementById(`detail-btn-${sp.id}`);
          if (btn && onViewDetails) {
            btn.onclick = () => onViewDetails(sp);
          }
        });
      });

      // ── Clique no mapa para adicionar marcador ───────────────────────────
      if (onAddSpecies) {
        map.on("click", (e) => {
          if (!addingMarkerRef.current) return;
          const { lat, lng } = e.latlng;
          setNewMarkerPos({ lat, lng });
          onAddSpecies(lat, lng);
        });
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref para o modo de adição (evita closure stale no event handler)
  const addingMarkerRef = useRef(false);
  useEffect(() => {
    addingMarkerRef.current = addingMarker;
  }, [addingMarker]);

  // ── Localização do usuário ────────────────────────────────────────────────
  const handleLocate = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setUserPos({ lat: latitude, lng: longitude });

      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      L.marker([latitude, longitude], { icon: createUserIcon(L) })
        .addTo(map)
        .bindPopup("📍 Você está aqui")
        .openPopup();

      map.setView([latitude, longitude], 18);
    });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-green-800/40">
      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full" />

      {/* ── Painel de controles ───────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Badge do site */}
        <div className="bg-green-950/90 backdrop-blur border border-green-700/50 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-green-400 text-lg">🌿</span>
          <span className="text-green-100 text-sm font-semibold tracking-wide">
            Herança Verde
          </span>
        </div>

        {/* Contador de espécies */}
        <div className="bg-green-950/80 backdrop-blur border border-green-800/40 rounded-lg px-3 py-1.5">
          <span className="text-green-300 text-xs">
            {species.length} espécie{species.length !== 1 ? "s" : ""} no mapa
          </span>
        </div>
      </div>

      {/* ── Botões de ação ───────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-4 z-[1000] flex flex-col gap-2">
        {/* Localização */}
        <button
          onClick={handleLocate}
          title="Minha localização"
          className="w-10 h-10 bg-green-950/90 backdrop-blur border border-green-700/50 rounded-xl text-green-300 hover:text-white hover:bg-green-800/90 transition-all flex items-center justify-center shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" strokeDasharray="2 2"/>
          </svg>
        </button>

        {/* Adicionar marcador */}
        {onAddSpecies && (
          <button
            onClick={() => setAddingMarker((v) => !v)}
            title={addingMarker ? "Cancelar" : "Adicionar planta"}
            className={`w-10 h-10 backdrop-blur border rounded-xl transition-all flex items-center justify-center shadow-lg
              ${addingMarker
                ? "bg-amber-600/90 border-amber-400/60 text-white"
                : "bg-green-950/90 border-green-700/50 text-green-300 hover:text-white hover:bg-green-800/90"
              }`}
          >
            {addingMarker ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Aviso modo de adição */}
      {addingMarker && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-600/90 backdrop-blur border border-amber-400/60 rounded-xl px-4 py-2 text-white text-sm font-medium shadow-lg pointer-events-none">
          Clique no mapa para marcar a planta
        </div>
      )}
    </div>
  );
}

// ─── Gera o HTML do popup ─────────────────────────────────────────────────────
function buildPopupHTML(sp) {
  return `
    <div style="padding:14px 16px; font-family: system-ui, sans-serif;">
      <p style="margin:0 0 2px; font-size:11px; color:#7cb87a; text-transform:uppercase; letter-spacing:.08em;">
        ${sp.commonName}
      </p>
      <p style="margin:0 0 12px; font-size:15px; font-style:italic; color:#e8f5e9; font-weight:600; line-height:1.3;">
        ${sp.scientificName}
      </p>
      <button
        id="detail-btn-${sp.id}"
        style="
          width:100%;
          background:#2d5a27;
          border:1px solid #4a7c59;
          color:#a8d5a2;
          border-radius:8px;
          padding:8px 12px;
          font-size:13px;
          font-weight:600;
          cursor:pointer;
          transition:background .15s;
        "
        onmouseover="this.style.background='#3d7a37'"
        onmouseout="this.style.background='#2d5a27'"
      >
        Ver detalhes →
      </button>
    </div>
  `;
}
