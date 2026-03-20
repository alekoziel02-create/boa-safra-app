"use client";

import { useEffect, useRef } from "react";
import type { Campo } from "@/types";

interface CamposMapProps {
  campos: Campo[];
}

const SITUACAO_COLORS: Record<string, string> = {
  "MATURAÇÃO": "#ca8a04",
  "COLHIDO": "#16a34a",
  "EM CAMPO": "#2563eb",
  "DESCARTADO": "#dc2626",
};

export default function CamposMap({ campos }: CamposMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);

  const withCoords = campos.filter(c => c.latitude && c.longitude);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current!).setView([-15.7801, -47.9292], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      withCoords.forEach((campo) => {
        const color = SITUACAO_COLORS[campo.situacao ?? ""] ?? "#6b7280";

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([campo.latitude!, campo.longitude!], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;line-height:1.5">
            <strong>${campo.produtor ?? "Sem nome"}</strong><br/>
            ${campo.propriedade ?? ""}<br/>
            <span style="color:#6b7280">${campo.municipio ?? ""} ${campo.uf ?? ""}</span><br/>
            Cultivar: ${campo.cultivar ?? "—"}<br/>
            Área: ${campo.area_ha != null ? campo.area_ha.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + " ha" : "—"}<br/>
            ${campo.situacao ? `<span style="background:#f3f4f6;padding:1px 6px;border-radius:9999px">${campo.situacao}</span>` : ""}
          </div>
        `);
      });

      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map(c => [c.latitude!, c.longitude!]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campos]);

  if (withCoords.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
        <p className="text-sm font-medium">Nenhum campo com coordenadas cadastradas</p>
        <p className="text-xs mt-1">Adicione latitude e longitude aos campos para visualizá-los no mapa</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      <div className="flex items-center gap-4 px-4 py-2 bg-white border-b text-xs text-gray-500">
        <span className="font-medium">{withCoords.length} campos com coordenadas</span>
        <div className="flex items-center gap-3">
          {Object.entries(SITUACAO_COLORS).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div ref={mapRef} style={{ height: "480px" }} />
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
    </div>
  );
}
