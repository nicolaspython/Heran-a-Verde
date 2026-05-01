"use client";

import CampusMap from "@/components/map/CampusMap";


const EXAMPLE_SPECIES = [
  {
    id: "sp-001",
    scientificName: "Mangifera indica",
    commonName: "Mangueira",
    latitude: -3.7170,
    longitude: -38.5430,
  },
  {
    id: "sp-002",
    scientificName: "Delonix regia",
    commonName: "Flamboyant",
    latitude: -3.7175,
    longitude: -38.5438,
  },
  {
    id: "sp-003",
    scientificName: "Tabebuia aurea",
    commonName: "Ipê-amarelo",
    latitude: -3.7168,
    longitude: -38.5425,
  },
  {
    id: "sp-004",
    scientificName: "Roystonea oleracea",
    commonName: "Palmeira-imperial",
    latitude: -3.7180,
    longitude: -38.5445,
  },
];

export default function MapPage() {
  return (
    <main className="min-h-screen bg-green-950 flex flex-col">
      {/* Cabeçalho */}
      <header className="px-6 py-4 border-b border-green-800/40">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="text-green-100 font-bold text-xl leading-none">
              Herança Verde
            </h1>
            <p className="text-green-500 text-xs mt-0.5">
              Catálogo Botânico Escolar — Mapa do Campus
            </p>
          </div>
        </div>
      </header>

      {/* Mapa */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
          <CampusMap
            species={EXAMPLE_SPECIES}
            center={[-3.7174, -38.5436]}   // Centro do campus
            zoom={18}
            onViewDetails={(sp) => {
              // Aqui você navega para a página de detalhes
              // Ex.: router.push(`/especies/${sp.id}`)
              console.log("Ver detalhes:", sp);
            }}
            onAddSpecies={(lat, lng) => {
              // Aqui você pode abrir um modal para preencher os dados
              // e depois salvar no banco com a posição clicada
              console.log("Nova planta em:", lat, lng);
            }}
          />
        </div>
      </div>
    </main>
  );
}
