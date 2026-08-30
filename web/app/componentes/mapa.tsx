"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { AncoraLocalizacao, FaixaChance, Unidade } from "@/lib/recomendador/tipos";
import { DiscoChance } from "./ui";

/**
 * Mapa em SVG, sem tiles remotos.
 *
 * A demo precisa funcionar offline: sem API de geocodificação, sem API de
 * rotas, sem tile server. A referência espacial vem das próprias unidades
 * (852 com coordenada) mais os contornos do município — o suficiente para a
 * família reconhecer onde está e arrastar o pin.
 */

/** Limites do município do Rio, com folga. */
const LIMITES = { norte: -22.74, sul: -23.09, oeste: -43.8, leste: -43.1 };

export type PontoMapa = {
  unidade: Unidade;
  faixa: FaixaChance;
  naCarteira: boolean;
};

const COR_FAIXA: Record<FaixaChance, string> = {
  alta: "var(--chance-alta)",
  media: "var(--chance-media)",
  baixa: "var(--chance-baixa)",
  minima: "var(--chance-minima)",
};

function projeta(lat: number, lng: number, largura: number, altura: number) {
  const x = ((lng - LIMITES.oeste) / (LIMITES.leste - LIMITES.oeste)) * largura;
  const y = ((LIMITES.norte - lat) / (LIMITES.norte - LIMITES.sul)) * altura;
  return { x, y };
}

function desprojeta(x: number, y: number, largura: number, altura: number) {
  const lng = LIMITES.oeste + (x / largura) * (LIMITES.leste - LIMITES.oeste);
  const lat = LIMITES.norte - (y / altura) * (LIMITES.norte - LIMITES.sul);
  return { lat, lng };
}

const L = 800;
const A = 460;

export function Mapa({
  pontos,
  ancoras,
  ancoraAtiva,
  onMoverAncora,
  onSelecionarUnidade,
  unidadeSelecionada,
}: {
  pontos: PontoMapa[];
  ancoras: AncoraLocalizacao[];
  ancoraAtiva?: string | null;
  onMoverAncora?: (id: string, lat: number, lng: number) => void;
  onSelecionarUnidade?: (codigo: string) => void;
  unidadeSelecionada?: string | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);

  /** Silhueta aproximada do município, desenhada a partir dos limites. */
  const contorno = useMemo(() => {
    // Pontos costeiros aproximados (lng, lat) — referência visual, não cartografia.
    const costa: Array<[number, number]> = [
      [-43.79, -22.88], [-43.7, -22.93], [-43.63, -23.0], [-43.55, -23.05],
      [-43.47, -23.03], [-43.4, -23.0], [-43.35, -22.99], [-43.28, -23.01],
      [-43.22, -23.02], [-43.17, -22.98], [-43.14, -22.95], [-43.11, -22.91],
      [-43.15, -22.88], [-43.2, -22.87], [-43.24, -22.85], [-43.3, -22.83],
      [-43.36, -22.81], [-43.45, -22.8], [-43.55, -22.82], [-43.65, -22.85],
      [-43.75, -22.86],
    ];
    return costa
      .map(([lng, lat]) => {
        const p = projeta(lat, lng, L, A);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  }, []);

  const posicaoDoEvento = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const caixa = svg.getBoundingClientRect();
    const x = ((clientX - caixa.left) / caixa.width) * L;
    const y = ((clientY - caixa.top) / caixa.height) * A;
    return desprojeta(
      Math.max(0, Math.min(L, x)),
      Math.max(0, Math.min(A, y)),
      L,
      A,
    );
  }, []);

  const mover = useCallback(
    (clientX: number, clientY: number) => {
      if (!arrastando || !onMoverAncora) return;
      const pos = posicaoDoEvento(clientX, clientY);
      if (pos) onMoverAncora(arrastando, pos.lat, pos.lng);
    },
    [arrastando, onMoverAncora, posicaoDoEvento],
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${L} ${A}`}
        className="w-full touch-none"
        style={{ aspectRatio: `${L} / ${A}` }}
        role="img"
        aria-label={`Mapa do Rio de Janeiro com ${pontos.length} creches no seu alcance`}
        onPointerMove={(e) => arrastando && mover(e.clientX, e.clientY)}
        onPointerUp={() => setArrastando(null)}
        onPointerLeave={() => setArrastando(null)}
      >
        <polygon
          points={contorno}
          fill="var(--elevated)"
          stroke="var(--border-forte)"
          strokeWidth="1.5"
        />

        {/* Unidades: fora da carteira primeiro, para não cobrir as escolhidas. */}
        {pontos
          .filter((p) => !p.naCarteira)
          .map((p) => {
            const { x, y } = projeta(p.unidade.lat!, p.unidade.lng!, L, A);
            return (
              <circle
                key={p.unidade.codigo}
                cx={x}
                cy={y}
                r={unidadeSelecionada === p.unidade.codigo ? 6 : 3.5}
                fill={COR_FAIXA[p.faixa]}
                opacity={0.55}
                className="cursor-pointer"
                onClick={() => onSelecionarUnidade?.(p.unidade.codigo)}
              >
                <title>{p.unidade.nome}</title>
              </circle>
            );
          })}

        {pontos
          .filter((p) => p.naCarteira)
          .map((p) => {
            const { x, y } = projeta(p.unidade.lat!, p.unidade.lng!, L, A);
            return (
              <g
                key={p.unidade.codigo}
                className="cursor-pointer"
                onClick={() => onSelecionarUnidade?.(p.unidade.codigo)}
              >
                <circle cx={x} cy={y} r="9" fill="var(--bg)" opacity={0.9} />
                <circle
                  cx={x}
                  cy={y}
                  r="6.5"
                  fill={COR_FAIXA[p.faixa]}
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
                <title>{p.unidade.nome}</title>
              </g>
            );
          })}

        {/* Âncoras de localização: pino arrastável por ponto de referência. */}
        {ancoras.map((a, i) => {
          const { x, y } = projeta(a.lat, a.lng, L, A);
          const ativa = ancoraAtiva === a.id;
          return (
            <g
              key={a.id}
              transform={`translate(${x} ${y})`}
              className="cursor-grab"
              onPointerDown={(e) => {
                e.preventDefault();
                setArrastando(a.id);
              }}
            >
              <path
                d="M0 2 C -7 -6, -11 -11, 0 -22 C 11 -11, 7 -6, 0 2 Z"
                fill="var(--brand)"
                stroke="var(--bg)"
                strokeWidth="2"
                opacity={ativa ? 1 : 0.85}
              />
              <circle cy="-13" r="3.5" fill="var(--bg)" />
              <text
                y="16"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--ink)"
                stroke="var(--bg)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {a.rotulo}
              </text>
              <title>{`${a.rotulo} — arraste para reposicionar (prioridade ${i + 1})`}</title>
            </g>
          );
        })}
      </svg>

      <p
        className="px-3 py-2 text-[0.6875rem]"
        style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
      >
        Mapa esquemático, sem escala cartográfica. Arraste um pino para corrigir a
        posição — é ele, não o CEP, que define sua localização.
      </p>
    </div>
  );
}
