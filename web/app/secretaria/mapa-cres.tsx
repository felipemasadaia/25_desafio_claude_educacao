"use client";

import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, MultiPolygon } from "geojson";
import geo from "@/data/cres.geojson.json";

/**
 * Mapa das 11 CREs sobre a geometria real do município do Rio.
 *
 * Complementa o mapa de microáreas do painel, não o substitui: aquele
 * responde "onde, dentro da cidade, falta aposta segura"; este responde
 * "como as 11 coordenadorias se comparam entre si" — que é o recorte em
 * que a Secretaria de fato aloca professor e turma.
 *
 * SVG servido do próprio bundle, sem tile de mapa: a leitura é comparativa,
 * não geográfica, e o painel não deveria depender de rede externa.
 *
 * Fonte: shapefile oficial SME/IPP (233 microáreas com campo `cre`),
 * dissolvido por CRE e reprojetado para WGS84 em `etl/cres-geojson.js`.
 */

const W = 900;
const H = 471;

const fc = geo as FeatureCollection<MultiPolygon, { cre: string }>;

export type CelulaCre = {
  cre: string;
  valor: number;
  /** Rótulo curto desenhado sobre a CRE; sem ele, mostra o valor formatado. */
  rotulo?: string;
  /** Tooltip completo; sem ele, monta `valor + legenda`. */
  detalhe?: string;
};

const creCurto = (c: string) => `${Number(c)}ª CRE`;
const fmt = (n: number) => n.toLocaleString("pt-BR");

export function MapaCres({
  dados,
  selecionada,
  onSelect,
  legenda = "sem vaga",
}: {
  dados: CelulaCre[];
  /** Unidade do valor, usada no tooltip de cada CRE. */
  legenda?: string;
  selecionada: string | null;
  onSelect: (cre: string | null) => void;
}) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const valores = new Map(dados.map((d) => [d.cre, d.valor]));
  const rotulos = new Map(dados.map((d) => [d.cre, d.rotulo]));
  const detalhes = new Map(dados.map((d) => [d.cre, d.detalhe]));

  // fitSize ancora o município no viewBox; roda uma vez, não a cada render.
  const { path, centroides } = useMemo(() => {
    const proj = geoMercator().fitSize([W, H], fc);
    const p = geoPath(proj);
    return {
      path: p,
      // Arredonda: o centróide difere na última casa decimal entre servidor e
      // cliente, e o React trata isso como divergência de hidratação.
      centroides: new Map(
        fc.features.map((f) => {
          const [x, y] = p.centroid(f);
          return [
            f.properties.cre,
            [Math.round(x * 100) / 100, Math.round(y * 100) / 100],
          ] as [string, [number, number]];
        }),
      ),
    };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Mapa do município do Rio por Coordenadoria Regional de Educação"
    >
      {fc.features.map((f) => {
        const cre = f.properties.cre;
        const valor = valores.get(cre) ?? 0;
        const i = valor / max;
        const ativo = selecionada === cre;
        const apagado = selecionada !== null && !ativo;
        const d = path(f);
        if (!d) return null;

        return (
          <path
            key={cre}
            d={d}
            onClick={() => onSelect(ativo ? null : cre)}
            className="cursor-pointer"
            fill={`color-mix(in oklab, var(--s-critico) ${Math.round(6 + i * 80)}%, var(--s-bg))`}
            stroke={ativo ? "var(--s-ink)" : "var(--s-bg)"}
            strokeWidth={ativo ? 2 : 0.9}
            strokeLinejoin="round"
            style={{ opacity: apagado ? 0.35 : 1, transition: "opacity .18s" }}
          >
            <title>
              {`${creCurto(cre)} — ${detalhes.get(cre) ?? `${fmt(valor)} ${legenda}`}`}
            </title>
          </path>
        );
      })}

      {/* Rótulos por cima de todas as formas, para não ficarem sob a CRE vizinha */}
      {fc.features.map((f) => {
        const cre = f.properties.cre;
        const c = centroides.get(cre);
        if (!c || Number.isNaN(c[0])) return null;
        const valor = valores.get(cre) ?? 0;
        const escuro = valor / max > 0.45;
        const apagado = selecionada !== null && selecionada !== cre;

        return (
          <g
            key={`l-${cre}`}
            pointerEvents="none"
            style={{ opacity: apagado ? 0.35 : 1, transition: "opacity .18s" }}
          >
            <text
              x={c[0]}
              y={c[1] - 2}
              textAnchor="middle"
              className="font-semibold"
              style={{
                fontSize: 12,
                fill: escuro ? "var(--s-bg)" : "var(--s-ink)",
                paintOrder: "stroke",
                stroke: escuro ? "none" : "var(--s-bg)",
                strokeWidth: 2.5,
              }}
            >
              {Number(cre)}ª
            </text>
            <text
              x={c[0]}
              y={c[1] + 11}
              textAnchor="middle"
              style={{
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                fill: escuro ? "var(--s-bg)" : "var(--s-muted)",
                paintOrder: "stroke",
                stroke: escuro ? "none" : "var(--s-bg)",
                strokeWidth: 2.5,
              }}
            >
              {rotulos.get(cre) ?? fmt(valor)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
