"use client";

import { useCallback, useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AncoraLocalizacao, FaixaChance, Unidade } from "@/lib/recomendador/tipos";

/**
 * Mapa real do município do Rio, sobre tiles do OpenStreetMap.
 *
 * A família precisa reconhecer a própria rua para confiar no pino — silhueta
 * esquemática não serve. Cada creche entra na coordenada real que veio do
 * catálogo da SME; o pino de referência é arrastável e continua sendo a fonte
 * de verdade da localização.
 *
 * A câmera é presa ao município: fora dos limites do Rio não há dado nenhum
 * para mostrar, e deixar a família se perder no Atlântico é ruído.
 */

/** Bounding box do município do Rio de Janeiro (só cidade, não o estado). */
export const LIMITES_MUNICIPIO = {
  oeste: -43.796,
  sul: -23.083,
  leste: -43.099,
  norte: -22.746,
} as const;

const CENTRO: [number, number] = [-43.4, -22.92];

const LIMITES_CAMERA = new maplibregl.LngLatBounds(
  [LIMITES_MUNICIPIO.oeste - 0.06, LIMITES_MUNICIPIO.sul - 0.06],
  [LIMITES_MUNICIPIO.leste + 0.06, LIMITES_MUNICIPIO.norte + 0.06],
);

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

const ROTULO_FAIXA: Record<FaixaChance, string> = {
  alta: "chance alta",
  media: "chance média",
  baixa: "chance baixa",
  minima: "chance mínima",
};

/**
 * Estilo raster com tiles do OSM.
 *
 * Raster e não vetor de propósito: sem chave de API, sem servidor de estilo,
 * uma dependência a menos para a demo quebrar.
 */
const ESTILO: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/** Marcador de creche: bolinha colorida pela faixa, anel destacando a carteira. */
function elementoUnidade(p: PontoMapa, selecionada: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "mapa-unidade";
  el.dataset.carteira = String(p.naCarteira);
  el.dataset.selecionada = String(selecionada);
  el.style.setProperty("--cor", COR_FAIXA[p.faixa]);
  el.setAttribute(
    "aria-label",
    `${p.unidade.nome ?? "Creche"} — ${ROTULO_FAIXA[p.faixa]}${p.naCarteira ? ", na sua carteira" : ""}`,
  );
  el.title = `${p.unidade.nome ?? "Creche"} — ${ROTULO_FAIXA[p.faixa]}`;
  return el;
}

/** Pino de referência da família: arrastável, rotulado. */
function elementoAncora(a: AncoraLocalizacao, ativa: boolean, ordem: number) {
  const el = document.createElement("div");
  el.className = "mapa-ancora";
  el.dataset.ativa = String(ativa);
  el.innerHTML = `
    <svg viewBox="0 0 24 34" width="26" height="36" aria-hidden="true">
      <path d="M12 33 C4 20, 1 15, 1 11 A11 11 0 0 1 23 11 C23 15, 20 20, 12 33 Z"
            fill="var(--brand)" stroke="var(--bg)" stroke-width="2" />
      <circle cx="12" cy="11" r="4" fill="var(--bg)" />
    </svg>
    <span class="mapa-ancora-rotulo"></span>
  `;
  const rotulo = el.querySelector(".mapa-ancora-rotulo");
  if (rotulo) rotulo.textContent = a.rotulo;
  el.title = `${a.rotulo} — arraste para corrigir a posição (prioridade ${ordem})`;
  return el;
}

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
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const pronto = useRef(false);
  const marcasUnidade = useRef(new Map<string, maplibregl.Marker>());
  const marcasAncora = useRef(new Map<string, maplibregl.Marker>());

  /**
   * Callbacks em ref: os handlers do MapLibre vivem fora do ciclo do React e
   * não podem capturar uma closure velha.
   */
  const aoMover = useRef(onMoverAncora);
  const aoSelecionar = useRef(onSelecionarUnidade);
  aoMover.current = onMoverAncora;
  aoSelecionar.current = onSelecionarUnidade;

  useEffect(() => {
    if (!container.current || mapa.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      style: ESTILO,
      center: CENTRO,
      zoom: 9.4,
      maxBounds: LIMITES_CAMERA,
      minZoom: 8.5,
      maxZoom: 17,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    m.on("load", () => {
      pronto.current = true;
    });
    mapa.current = m;

    return () => {
      m.remove();
      mapa.current = null;
      pronto.current = false;
      marcasUnidade.current.clear();
      marcasAncora.current.clear();
    };
  }, []);

  /** Creches: reconcilia por código, sem recriar o mapa inteiro a cada render. */
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;

    const vistos = new Set<string>();
    for (const p of pontos) {
      if (p.unidade.lat === null || p.unidade.lng === null) continue;
      vistos.add(p.unidade.codigo);
      const anterior = marcasUnidade.current.get(p.unidade.codigo);
      anterior?.remove();

      const el = elementoUnidade(p, unidadeSelecionada === p.unidade.codigo);
      el.addEventListener("click", () => aoSelecionar.current?.(p.unidade.codigo));
      const marca = new maplibregl.Marker({ element: el })
        .setLngLat([p.unidade.lng, p.unidade.lat])
        .addTo(m);
      marcasUnidade.current.set(p.unidade.codigo, marca);
    }

    for (const [codigo, marca] of marcasUnidade.current) {
      if (!vistos.has(codigo)) {
        marca.remove();
        marcasUnidade.current.delete(codigo);
      }
    }
  }, [pontos, unidadeSelecionada]);

  /** Pinos de referência: arrastáveis, com a posição devolvida ao perfil. */
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;

    const vistos = new Set<string>();
    ancoras.forEach((a, i) => {
      vistos.add(a.id);
      const existente = marcasAncora.current.get(a.id);

      if (existente) {
        const atual = existente.getLngLat();
        if (atual.lat !== a.lat || atual.lng !== a.lng) existente.setLngLat([a.lng, a.lat]);
        const el = existente.getElement();
        el.dataset.ativa = String(ancoraAtiva === a.id);
        const rotulo = el.querySelector(".mapa-ancora-rotulo");
        if (rotulo) rotulo.textContent = a.rotulo;
        el.title = `${a.rotulo} — arraste para corrigir a posição (prioridade ${i + 1})`;
        return;
      }

      const marca = new maplibregl.Marker({
        element: elementoAncora(a, ancoraAtiva === a.id, i + 1),
        draggable: true,
        anchor: "bottom",
        offset: [0, 6],
      })
        .setLngLat([a.lng, a.lat])
        .addTo(m);

      marca.on("dragend", () => {
        const { lat, lng } = marca.getLngLat();
        aoMover.current?.(a.id, lat, lng);
      });

      marcasAncora.current.set(a.id, marca);
    });

    for (const [id, marca] of marcasAncora.current) {
      if (!vistos.has(id)) {
        marca.remove();
        marcasAncora.current.delete(id);
      }
    }
  }, [ancoras, ancoraAtiva]);

  /**
   * Enquadra o que importa: com carteira, as creches recomendadas mais os
   * pinos; sem carteira, o entorno do pino. Só quando o conjunto muda de
   * tamanho — reenquadrar a cada arrasto tira o mapa do controle da família.
   */
  const assinatura = pontos
    .filter((p) => p.naCarteira)
    .map((p) => p.unidade.codigo)
    .join(",");

  const enquadra = useCallback(() => {
    const m = mapa.current;
    if (!m) return;
    const alvos: Array<[number, number]> = [];
    for (const p of pontos) {
      if (p.naCarteira && p.unidade.lat !== null && p.unidade.lng !== null) {
        alvos.push([p.unidade.lng, p.unidade.lat]);
      }
    }
    for (const a of ancoras) alvos.push([a.lng, a.lat]);
    if (alvos.length === 0) return;

    if (alvos.length === 1) {
      m.easeTo({ center: alvos[0], zoom: 13, duration: 600 });
      return;
    }
    const caixa = alvos.reduce(
      (acc, c) => acc.extend(c),
      new maplibregl.LngLatBounds(alvos[0], alvos[0]),
    );
    m.fitBounds(caixa, { padding: 64, maxZoom: 14, duration: 600 });
    // `ancoras` fora das deps de propósito: arrastar um pino não reenquadra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura]);

  useEffect(() => {
    enquadra();
  }, [enquadra]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        ref={container}
        className="mapa-tela w-full"
        style={{ height: "clamp(300px, 46vw, 460px)" }}
        role="application"
        aria-label={
          pontos.length > 0
            ? `Mapa do Rio de Janeiro com ${pontos.length} creches no seu alcance e ${ancoras.length} ponto(s) de referência`
            : `Mapa do Rio de Janeiro com ${ancoras.length} ponto(s) de referência arrastável(is)`
        }
      />
      <p
        className="px-3 py-2 text-micro"
        style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
      >
        Mapa do município do Rio sobre OpenStreetMap. Arraste um pino para corrigir
        a posição — é ele, não o CEP, que define sua localização.
      </p>
    </div>
  );
}
