import { catalogo, unidadesComGeo } from "./catalogo";
import { LIMIAR_ANCORA } from "./recomendador/motor";
import type { Bairro } from "./recomendador/tipos";

/**
 * Recortes territoriais do painel da SME.
 *
 * Existe para que o filtro de CRE valha para o painel inteiro. Antes, três
 * seções liam o catálogo direto e continuavam mostrando o Rio inteiro com
 * uma CRE selecionada — num painel de gestor, isso é erro de confiança.
 */

/** Recorte ativo: uma CRE ou a rede toda. */
export type Recorte = number | "todas";

/**
 * Nome de bairro comparável entre as duas bases.
 *
 * As bases trazem `RAMOS` e `Ramos` como chaves distintas; sem normalizar,
 * o mesmo bairro vira dois e o vínculo com a CRE se perde.
 */
export function normalizaBairro(nome: string | null): string {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/**
 * Bairro -> CREs que o atendem.
 *
 * Conjunto e não valor único: 6 bairros (Ramos, Bonsucesso, Benfica, Rio
 * Comprido, Vila da Penha, Santíssimo) têm unidades em duas CREs. Forçar um
 * dono só faria o bairro desaparecer do recorte da outra.
 */
const bairroParaCres = new Map<string, Set<number>>();
for (const u of catalogo.unidades) {
  if (u.cre === null) continue;
  const chave = normalizaBairro(u.bairro);
  if (!chave) continue;
  const atual = bairroParaCres.get(chave) ?? new Set<number>();
  atual.add(u.cre);
  bairroParaCres.set(chave, atual);
}

/**
 * Bairros com demanda mas sem nenhuma unidade no catálogo: 32 bairros, 6,2%
 * das inscrições. Não têm CRE derivável, e some-los do recorte esconderia
 * justamente o caso mais grave — demanda sem oferta nenhuma.
 */
export const bairrosSemUnidade = catalogo.bairros.filter(
  (b) => !bairroParaCres.has(normalizaBairro(b.bairro)),
).length;

export function bairrosDoRecorte(cre: Recorte): Bairro[] {
  if (cre === "todas") return catalogo.bairros;
  return catalogo.bairros.filter((b) =>
    bairroParaCres.get(normalizaBairro(b.bairro))?.has(cre) ?? false,
  );
}

/** Uma microárea agregada, com a leitura de descasamento. */
export type Microarea = {
  microarea: string;
  cre: number | null;
  unidades: number;
  /** Pedidos recebidos no ano-alvo. Fila, não criança. */
  procura: number;
  /** Âncoras da carteira disponíveis na microárea. */
  ancoras: number;
  /**
   * Procura por âncora. `null` quando não há âncora nenhuma — categoria
   * própria, nunca um número grande: sem denominador a razão não existe, e
   * inventar um esconde a diferença entre "disputado" e "não tem".
   */
  descasamento: number | null;
};

export function microareas(cre: Recorte): Microarea[] {
  const porArea = new Map<string, Microarea>();

  for (const u of unidadesComGeo) {
    if (!u.microarea) continue;
    if (cre !== "todas" && u.cre !== cre) continue;

    const atual =
      porArea.get(u.microarea) ??
      ({
        microarea: u.microarea,
        cre: u.cre,
        unidades: 0,
        procura: 0,
        ancoras: 0,
        descasamento: null,
      } satisfies Microarea);

    atual.unidades++;
    atual.procura += u.opcoes_2025;
    if (u.confiavel && (u.chance_hist ?? 0) >= LIMIAR_ANCORA) atual.ancoras++;
    porArea.set(u.microarea, atual);
  }

  const lista = [...porArea.values()].map((m) => ({
    ...m,
    descasamento: m.ancoras > 0 ? m.procura / m.ancoras : null,
  }));

  /**
   * Sem âncora primeiro, e dentro de cada grupo pela procura: a microárea
   * mais grave é a que tem muita gente disputando e nenhuma aposta segura.
   */
  return lista.sort((a, b) => {
    if ((a.descasamento === null) !== (b.descasamento === null)) {
      return a.descasamento === null ? -1 : 1;
    }
    if (a.descasamento === null) return b.procura - a.procura;
    return (b.descasamento ?? 0) - (a.descasamento ?? 0);
  });
}
