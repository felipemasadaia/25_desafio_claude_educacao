import bruto from "@/data/creches.json";
import type { Catalogo } from "./recomendador/tipos";

/**
 * Catálogo pré-processado, gerado por scripts/build_catalogo.py.
 *
 * Importado estaticamente: a demo roda offline e nenhum caminho crítico
 * depende de rede ou banco.
 */
export const catalogo = bruto as unknown as Catalogo;

/** Só unidades com coordenada participam do alcance. */
export const unidadesComGeo = catalogo.unidades.filter(
  (u) => u.lat !== null && u.lng !== null,
);

export const ANO_ALVO = catalogo.ano_alvo;

/** Unidades sem coordenada: tratadas explicitamente, não omitidas em silêncio. */
export const semCoordenada = catalogo.unidades.length - unidadesComGeo.length;
