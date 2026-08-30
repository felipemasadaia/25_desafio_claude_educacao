import { unidadesComGeo } from "./catalogo";
import { LIMIAR_ANCORA } from "./recomendador/motor";
import type { Unidade } from "./recomendador/tipos";

/**
 * Cobertura territorial de apostas seguras.
 *
 * Responde a pergunta do painel: onde uma família não encontraria nenhuma
 * âncora ao seu alcance. A varredura é feita sobre as próprias unidades
 * como proxy de onde as famílias moram — é onde a demanda de fato aparece.
 *
 * Não é o efeito medido de um recomendador em produção: é a fração do
 * território em que a regra da âncora simplesmente não tem o que oferecer.
 */

/** Alcance típico de quem depende de transporte público, em km. */
const RAIO_PADRAO_KM = 7;
/** Alcance de quem vai a pé — o caso mais restrito, e o mais comum. */
const RAIO_PE_KM = 2.5;

function distanciaKm(a: Unidade, b: Unidade): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat! - a.lat!) * rad;
  const dLng = (b.lng! - a.lng!) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat! * rad) * Math.cos(b.lat! * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type Cobertura = {
  /** Pontos avaliados (unidades com coordenada, como proxy de território). */
  total: number;
  /** Pontos com ao menos uma âncora dentro do raio. */
  comAncora: number;
  /** Pontos sem nenhuma âncora ao alcance: déficit territorial. */
  semAncora: number;
  /** Por CRE, a contagem sem âncora. */
  porCre: Array<{ cre: number; total: number; semAncora: number }>;
};

export function calculaCobertura(aPe: boolean): Cobertura {
  const raio = aPe ? RAIO_PE_KM : RAIO_PADRAO_KM;
  const ancoras = unidadesComGeo.filter(
    (u) => u.confiavel && (u.chance_hist ?? 0) >= LIMIAR_ANCORA,
  );

  const porCre = new Map<number, { total: number; semAncora: number }>();
  let comAncora = 0;

  for (const ponto of unidadesComGeo) {
    const alcanca = ancoras.some((a) => distanciaKm(ponto, a) <= raio);
    if (alcanca) comAncora++;

    if (ponto.cre !== null) {
      const atual = porCre.get(ponto.cre) ?? { total: 0, semAncora: 0 };
      atual.total++;
      if (!alcanca) atual.semAncora++;
      porCre.set(ponto.cre, atual);
    }
  }

  return {
    total: unidadesComGeo.length,
    comAncora,
    semAncora: unidadesComGeo.length - comAncora,
    // Ordena por proporção, não por contagem: uma CRE pequena com metade do
    // território descoberto é um problema maior que uma grande com um quinto.
    porCre: [...porCre.entries()]
      .map(([cre, v]) => ({ cre, ...v }))
      .sort((a, b) => b.semAncora / b.total - a.semAncora / a.total),
  };
}
