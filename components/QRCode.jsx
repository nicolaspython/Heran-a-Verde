"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const especies = [
  { id: 1, nome: "Planta caricata", url: "https://herancaverde.vercel.app/especies/7a25d224-2a23-4959-b3f8-815fa7c8c9f3" },
  { id: 2, nome: "Mamoeiro", url: "https://herancaverde.vercel.app/especies/fdb4ee44-8ab4-4a62-83ea-e7fcf8e23cc2" },
  { id: 3, nome: "São jorge", url: "https://herancaverde.vercel.app/especies/392f60d5-7fcd-483f-b4d6-7c04bedac090" },
  { id: 4, nome: "São jose flor", url: "https://herancaverde.vercel.app/especies/d3fb5b33-5bc1-441e-9748-ba256cc60051" },
  { id: 5, nome: "Rosa do deserto", url: "https://herancaverde.vercel.app/especies/8e44364e-7db2-416f-bfd6-62f4115688fc" },
  { id: 6, nome: "Areca bambu", url: "https://herancaverde.vercel.app/especies/1a70b930-8a64-4839-92bf-f65fda57e4ae" },
  { id: 7, nome: "Palmeira de manila", url: "https://herancaverde.vercel.app/especies/7c47aae9-b7c3-40b9-b926-855b79675dcf" },
  { id: 8, nome: "Ixora casei", url: "https://herancaverde.vercel.app/especies/feb1a99e-fd11-4ff4-bd2a-5f5f5f5da538" },
  { id: 9, nome: "Buxinho", url: "https://herancaverde.vercel.app/especies/b7c307c5-8ab8-4287-aa35-31a33451060b" },
  { id: 10, nome: "abacaxi", url: "https://herancaverde.vercel.app/especies/84ef7fa1-3d88-4b0b-b633-63f9b5e0958e" },
  { id: 11, nome: "Hibisco", url: "https://herancaverde.vercel.app/especies/a4be0793-f64f-48ad-ace6-f346e94effe7" },
  { id: 12, nome: "Boldo", url: "https://herancaverde.vercel.app/especies/8b4914d8-68cb-4da3-98b1-a2ccb4f06c3a" },
  { id: 13, nome: "Jasmin", url: "https://herancaverde.vercel.app/especies/00703187-c4e8-4f81-9966-92a0695d43b9" },
  { id: 14, nome: "Tinhorão", url: "https://herancaverde.vercel.app/especies/dffd7f06-64cd-4ce8-8c75-fed6ccc6db3b" },
  { id: 15, nome: "Aroeira Vermelha", url: "https://herancaverde.vercel.app/especies/c618fbe6-f903-40d0-b250-e5d5f1feed81" },
  { id: 16, nome: "Milho", url: "https://herancaverde.vercel.app/especies/60c7a0e0-3ea0-43a9-8ebf-ca57e94cccdc" },
  { id: 17, nome: "Acerola", url: "https://herancaverde.vercel.app/especies/295aebaf-158d-4249-92bb-b87ae2d33ee8" },
  { id: 18, nome: "Dracena red", url: "https://herancaverde.vercel.app/especies/80e6d5ef-1f70-45ef-8ce2-f396fdfd4af1" },
  { id: 19, nome: "", url: "" },
  { id: 20, nome: "", url: "" },
  { id: 21, nome: "", url: "" },
  { id: 22, nome: "", url: "" },
  { id: 23, nome: "", url: "" },
  { id: 24, nome: "", url: "" },
  { id: 25, nome: "", url: "" },

];

export default function MultiQR() {
  const containersRef = useRef([]);
  const qrRefs = useRef([]);

  useEffect(() => {
    especies.forEach((item, index) => {
      const container = containersRef.current[index];

      if (!container) return;

      // evita duplicação
      container.innerHTML = "";

      const qr = new QRCodeStyling({
        width: 180,
        height: 180,
        data: item.url,

        image: "/plantinha.svg",

        dotsOptions: {
          color: "#111",
          type: "rounded",
        },

        backgroundOptions: {
          color: "#fff",
        },

        imageOptions: {
          crossOrigin: "anonymous",
          margin: 6,
        },
      });

      qr.append(container);

      // salva referência pra download
      qrRefs.current[index] = qr;
    });
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 20,
      }}
    >
      {especies.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            textAlign: "center",
            background: "#11e746",
          }}
        >
          {/* QR */}
          <div ref={(el) => (containersRef.current[index] = el)} />

          {/* nome */}
          <p style={{ marginTop: 10, fontWeight: 500 }}>
            {item.nome}
          </p>

          {/* botão download */}
          <button
            onClick={() => {
              qrRefs.current[index].download({
                name: item.nome,
                extension: "png",
              });
            }}
            style={{
              marginTop: 10,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "#0d8f13",
            }}
          >
            Baixar QR
          </button>
        </div>
      ))}
    </div>
  );
}