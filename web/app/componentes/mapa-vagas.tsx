"use client";

import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { tituloCase } from "@/lib/formato";
import type { UnidadeOperacional } from "@/lib/operacao";

/**
 * Mapa de vagas vacantes.
 *
 * Diferente do mapa analítico (`mapa-sme.tsx`), que agrega microárea e
 * responde "onde falta": aqui cada ponto é uma unidade concreta com vaga
 * agora, porque a ação é ligar para família e preencher aquela vaga.
 *
 * Duas cores, dois problemas distintos: vaga com fila é operação (chamar
 * gente), vaga sem fila é acesso (ninguém consegue chegar até lá).
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

/** Fila baixa o bastante para a vaga ser problema de acesso, não de operação. */
const FILA_BAIXA = 30;

export function MapaVagas({
  unidades,
  selecionada,
  onSelecionar,
}: {
  unidades: UnidadeOperacional[];
  selecionada: string | null;
  onSelecionar: (codigo: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const marcas = useRef<maplibregl.Marker[]>([]);
  /** Callback num ref: o efeito das marcas não deve reexecutar a cada render. */
  const aoSelecionar = useRef(onSelecionar);
  aoSelecionar.current = onSelecionar;

  const comVaga = useMemo(() => unidades.filter((u) => u.vagas > 0), [unidades]);
  const maxVagas = useMemo(() => Math.max(...comVaga.map((u) => u.vagas), 1), [comVaga]);

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

    // Maiores por baixo: a unidade pequena não some sob a grande.
    const ordenadas = [...comVaga].sort((a, b) => b.vagas - a.vagas);

    for (const u of ordenadas) {
      const semFila = u.fila < FILA_BAIXA;
      const raio = 10 + Math.sqrt(u.vagas / maxVagas) * 26;
      const ativa = selecionada === u.codigo;
      const cor = semFila ? "var(--chance-baixa)" : "var(--chance-alta)";

      const el = document.createElement("button");
      el.type = "button";
      el.style.cssText = `
        width:${raio}px;height:${raio}px;border-radius:9999px;cursor:pointer;padding:0;
        background:${cor};
        opacity:${ativa ? 0.95 : 0.55};
        border:${ativa ? 3 : 2}px solid ${ativa ? "var(--ink)" : cor};
      `;
      el.setAttribute(
        "aria-label",
        `${tituloCase(u.nome)}, ${u.vagas} vagas, ${u.fila} famílias na fila`,
      );
      el.addEventListener("click", () => aoSelecionar.current(u.codigo));

      const popup = new maplibregl.Popup({ offset: raio / 2, closeButton: false }).setHTML(
        `<div style="font-size:12px;line-height:1.5">
           <strong>${tituloCase(u.nome)}</strong><br/>
           ${tituloCase(u.bairro)}${u.cre ? ` · ${u.cre}ª CRE` : ""}<br/>
           <strong>${u.vagas} vagas</strong> · ${u.fila.toLocaleString("pt-BR")} na fila<br/>
           ${
             semFila
               ? '<span style="color:#c0392b">vaga sem fila — checar acesso</span>'
               : "vaga com fila — pronta para convite"
           }
         </div>`,
      );

      marcas.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([u.lng, u.lat]).setPopup(popup).addTo(m),
      );
    }
  }, [comVaga, maxVagas, selecionada]);

  const semFila = comVaga.filter((u) => u.fila < FILA_BAIXA).length;

  return (
    <div>
      <div
        ref={container}
        className="h-[26rem] w-full overflow-hidden rounded-xl"
        style={{ border: "1px solid var(--border)" }}
        role="application"
        aria-label="Mapa de vagas vacantes por unidade"
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-label">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: "var(--chance-alta)", opacity: 0.55 }}
          />
          Vaga com fila — convidar ({comVaga.length - semFila})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: "var(--chance-baixa)", opacity: 0.55 }}
          />
          Vaga sem fila — checar acesso ({semFila})
        </span>
        <span style={{ color: "var(--muted)" }}>O tamanho é o número de vagas.</span>
      </div>
    </div>
  );
}
