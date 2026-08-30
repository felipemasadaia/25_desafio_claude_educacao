"use client";

import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { unidadesComGeo } from "@/lib/catalogo";
import { LIMIAR_ANCORA } from "@/lib/recomendador/motor";
import type { Recorte } from "@/lib/territorio";

/**
 * Mapa de descasamento da SME.
 *
 * Não é o mapa da família: aqui não há pino arrastável nem faixa de chance
 * pessoal. Cada microárea vira um círculo dimensionado pela procura e
 * colorido pela existência (ou não) de aposta segura — a leitura de
 * planejamento é "onde muita gente disputa sem ter para onde ir".
 */

const CENTRO: [number, number] = [-43.45, -22.92];

const LIMITES = new maplibregl.LngLatBounds([-43.86, -23.14], [-43.04, -22.69]);

const ESTILO: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

type Bolha = {
  microarea: string;
  cre: number | null;
  lat: number;
  lng: number;
  procura: number;
  ancoras: number;
  unidades: number;
};

/**
 * Uma bolha por microárea, posicionada no centróide das suas unidades.
 * O catálogo não traz polígono de microárea; o centróide é a aproximação
 * honesta — e a bolha comunica área de influência, não fronteira.
 */
function agregaBolhas(cre: Recorte): Bolha[] {
  const mapa = new Map<string, { lat: number; lng: number; n: number } & Omit<Bolha, "lat" | "lng">>();

  for (const u of unidadesComGeo) {
    if (!u.microarea) continue;
    if (cre !== "todas" && u.cre !== cre) continue;

    const atual =
      mapa.get(u.microarea) ??
      {
        microarea: u.microarea,
        cre: u.cre,
        lat: 0,
        lng: 0,
        n: 0,
        procura: 0,
        ancoras: 0,
        unidades: 0,
      };

    atual.lat += u.lat as number;
    atual.lng += u.lng as number;
    atual.n++;
    atual.unidades++;
    atual.procura += u.opcoes_2025;
    if (u.confiavel && (u.chance_hist ?? 0) >= LIMIAR_ANCORA) atual.ancoras++;
    mapa.set(u.microarea, atual);
  }

  return [...mapa.values()].map((m) => ({
    microarea: m.microarea,
    cre: m.cre,
    lat: m.lat / m.n,
    lng: m.lng / m.n,
    procura: m.procura,
    ancoras: m.ancoras,
    unidades: m.unidades,
  }));
}

export function MapaSme({ cre }: { cre: Recorte }) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const marcas = useRef<maplibregl.Marker[]>([]);

  const bolhas = useMemo(() => agregaBolhas(cre), [cre]);
  const maxProcura = useMemo(
    () => Math.max(...bolhas.map((b) => b.procura), 1),
    [bolhas],
  );

  useEffect(() => {
    if (!container.current || mapa.current) return;

    mapa.current = new maplibregl.Map({
      container: container.current,
      style: ESTILO,
      center: CENTRO,
      zoom: 9.4,
      maxBounds: LIMITES,
      attributionControl: { compact: true },
    });
    mapa.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;

    for (const marca of marcas.current) marca.remove();
    marcas.current = [];

    // Maiores por baixo: a bolha pequena e crítica não some sob a grande.
    const ordenadas = [...bolhas].sort((a, b) => b.procura - a.procura);

    for (const b of ordenadas) {
      const semAposta = b.ancoras === 0;
      // Raiz quadrada: a área do círculo fica proporcional à procura, que é
      // como o olho de fato compara bolhas.
      const raio = 8 + Math.sqrt(b.procura / maxProcura) * 34;

      const el = document.createElement("button");
      el.type = "button";
      el.className = "mapa-bolha";
      el.style.cssText = `
        width:${raio}px;height:${raio}px;border-radius:9999px;cursor:pointer;
        background:${semAposta ? "var(--chance-baixa)" : "var(--accent)"};
        opacity:${semAposta ? 0.62 : 0.42};
        border:2px solid ${semAposta ? "var(--chance-baixa)" : "var(--accent)"};
        padding:0;
      `;
      el.setAttribute(
        "aria-label",
        `Microárea ${b.microarea}, ${b.procura} pedidos, ${
          semAposta ? "sem aposta segura" : `${b.ancoras} aposta(s) segura(s)`
        }`,
      );

      const popup = new maplibregl.Popup({ offset: raio / 2, closeButton: false }).setHTML(
        `<div style="font-size:12px;line-height:1.5">
           <strong>Microárea ${b.microarea}</strong><br/>
           ${b.cre ? `${b.cre}ª CRE · ` : ""}${b.unidades} unidades<br/>
           ${b.procura.toLocaleString("pt-BR")} pedidos<br/>
           ${
             semAposta
               ? '<span style="color:#c0392b"><strong>sem aposta segura</strong></span>'
               : `${b.ancoras} aposta(s) segura(s) · ${Math.round(
                   b.procura / b.ancoras,
                 ).toLocaleString("pt-BR")} por âncora`
           }
         </div>`,
      );

      marcas.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([b.lng, b.lat]).setPopup(popup).addTo(m),
      );
    }
  }, [bolhas, maxProcura]);

  const semAposta = bolhas.filter((b) => b.ancoras === 0).length;

  return (
    <div>
      <div
        ref={container}
        className="h-[30rem] w-full overflow-hidden rounded-xl"
        style={{ border: "1px solid var(--border)" }}
        role="application"
        aria-label="Mapa de descasamento por microárea"
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-label">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: "var(--chance-baixa)", opacity: 0.62 }}
          />
          Sem aposta segura ({semAposta} de {bolhas.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: "var(--accent)", opacity: 0.42 }}
          />
          Tem ao menos uma
        </span>
        <span style={{ color: "var(--muted)" }}>
          O tamanho é a procura. Centróide das unidades, não fronteira da microárea.
        </span>
      </div>
    </div>
  );
}
