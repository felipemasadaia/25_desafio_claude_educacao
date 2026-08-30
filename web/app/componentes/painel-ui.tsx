"use client";

import { useState } from "react";

/**
 * Primitivas visuais da face da SME.
 *
 * Ficam separadas de `ui.tsx` de propósito: a face da família otimiza para
 * uma decisão por vez, esta otimiza para comparação lado a lado. O que serve
 * a uma engorda a outra.
 */

/* ---------------------------------------------------------------- tabela --- */

export type Alinhamento = "left" | "right";

export function Th({
  children,
  align = "right",
  larguraMin,
  ordenavel,
  direcao,
  onOrdenar,
  dica,
}: {
  children: React.ReactNode;
  align?: Alinhamento;
  larguraMin?: string;
  /** Habilita o cabeçalho como botão de ordenação. */
  ordenavel?: boolean;
  /** Direção vigente, quando esta é a coluna ordenada. */
  direcao?: "asc" | "desc" | null;
  onOrdenar?: () => void;
  /** Explica a coluna para quem não tem o glossário na cabeça. */
  dica?: string;
}) {
  const ativo = direcao != null;
  return (
    <th
      scope="col"
      // aria-sort no <th> é o que o leitor de tela anuncia; o botão dentro só
      // carrega a ação. Anunciar no botão deixaria a tabela muda.
      aria-sort={ordenavel ? (ativo ? (direcao === "asc" ? "ascending" : "descending") : "none") : undefined}
      className={`sticky top-0 whitespace-nowrap px-2.5 py-2 text-micro font-semibold uppercase tracking-wide ${
        align === "left" ? "text-left" : "text-right"
      }`}
      style={{
        minWidth: larguraMin,
        color: ativo ? "var(--ink)" : "var(--muted)",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-forte)",
        zIndex: 1,
      }}
      title={dica}
    >
      {ordenavel ? (
        <button
          type="button"
          onClick={onOrdenar}
          className={`flex w-full items-center gap-1 uppercase tracking-wide ${
            align === "left" ? "justify-start" : "justify-end"
          }`}
          style={{ color: "inherit", font: "inherit", letterSpacing: "inherit" }}
        >
          <span>{children}</span>
          <span aria-hidden="true" style={{ opacity: ativo ? 1 : 0.35 }}>
            {ativo ? (direcao === "asc" ? "▲" : "▼") : "▾"}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

/** Cabeçalho de linha: identifica a entidade da linha para o leitor de tela. */
export function ThLinha({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="row"
      className="px-2.5 py-1.5 text-left font-medium"
      style={{ color: "var(--ink)" }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "right",
  destaque,
  atenuado,
}: {
  children: React.ReactNode;
  align?: Alinhamento;
  /** Marca o valor como fora da faixa aceitável. Nunca é o único sinal. */
  destaque?: boolean;
  atenuado?: boolean;
}) {
  return (
    <td
      className={`tnum px-2.5 py-1.5 ${align === "left" ? "text-left" : "text-right"}`}
      style={{
        color: destaque ? "var(--chance-baixa)" : atenuado ? "var(--muted)" : undefined,
        fontWeight: destaque ? 600 : undefined,
      }}
    >
      {children}
    </td>
  );
}

/** Casca de tabela densa: rolagem própria, sem estourar a página na horizontal. */
export function Tabela({
  legenda,
  larguraMin = "48rem",
  altura,
  children,
}: {
  legenda: string;
  larguraMin?: string;
  /** Trava a altura e rola por dentro, para a tabela não empurrar o resto. */
  altura?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-auto rounded-lg"
      style={{ border: "1px solid var(--border)", maxHeight: altura }}
    >
      <table className="w-full border-collapse text-sm" style={{ minWidth: larguraMin }}>
        <caption className="sr-only">{legenda}</caption>
        {children}
      </table>
    </div>
  );
}

/** Linha zebrada: em tabela densa, a listra é o que sustenta a leitura horizontal. */
export function Tr({ children, indice }: { children: React.ReactNode; indice: number }) {
  return (
    <tr
      style={{
        background: indice % 2 === 1 ? "var(--surface)" : "transparent",
        borderTop: "1px solid var(--border)",
      }}
    >
      {children}
    </tr>
  );
}

/* -------------------------------------------------------------- ordenação --- */

export type Ordenacao<K extends string> = { coluna: K; direcao: "asc" | "desc" };

/**
 * Ordenação de tabela com direção padrão por coluna.
 *
 * Clicar numa coluna nova não deve começar sempre em ascendente: em "% sem
 * âncora" o gestor quer o pior primeiro, em "bairro" quer alfabético.
 */
export function useOrdenacao<K extends string>(inicial: Ordenacao<K>) {
  const [ordem, setOrdem] = useState<Ordenacao<K>>(inicial);

  function alterna(coluna: K, padrao: "asc" | "desc" = "desc") {
    setOrdem((atual) =>
      atual.coluna === coluna
        ? { coluna, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { coluna, direcao: padrao },
    );
  }

  function direcaoDe(coluna: K) {
    return ordem.coluna === coluna ? ordem.direcao : null;
  }

  return { ordem, alterna, direcaoDe };
}

/** Ordena por um extrator, respeitando texto e número. */
export function ordenaPor<T>(
  itens: T[],
  valor: (item: T) => string | number,
  direcao: "asc" | "desc",
): T[] {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...itens].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (typeof va === "string" || typeof vb === "string") {
      return sinal * String(va).localeCompare(String(vb), "pt-BR");
    }
    return sinal * (va - vb);
  });
}

/* -------------------------------------------------------------- leitura ---- */

/**
 * Número de topo com a sua interpretação colada.
 *
 * O `leitura` não é decoração: um número sem a frase que diz o que ele
 * significa obriga o gestor a derivar a conclusão sozinho, e é aí que ele
 * lê magnitude onde o dado só sustenta estrutura.
 */
export function Leitura({
  rotulo,
  valor,
  unidade,
  leitura,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  leitura: React.ReactNode;
  tom?: "neutro" | "alerta" | "critico";
}) {
  const cor =
    tom === "critico" ? "var(--chance-minima)" : tom === "alerta" ? "var(--chance-baixa)" : "var(--ink)";
  return (
    <div
      className="flex flex-col rounded-lg p-3.5"
      style={{
        background: "var(--surface)",
        // Lados separados em vez de `border` + `borderLeft`: misturar shorthand
        // e longhand no mesmo valor gera estilo instável entre renders, e o
        // React avisa em runtime.
        borderStyle: "solid",
        borderWidth: "1px 1px 1px 3px",
        borderTopColor: "var(--border)",
        borderRightColor: "var(--border)",
        borderBottomColor: "var(--border)",
        // A barra lateral repete o tom em forma, para o sinal não depender só da cor.
        borderLeftColor: tom === "neutro" ? "var(--border-forte)" : cor,
      }}
    >
      <p className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {rotulo}
      </p>
      <p className="tnum mt-1 flex items-baseline gap-1 font-semibold" style={{ color: cor }}>
        <span className="text-display">{valor}</span>
        {unidade && (
          <span className="text-body font-medium" style={{ color: "var(--muted)" }}>
            {unidade}
          </span>
        )}
      </p>
      <p className="mt-1.5 text-label leading-snug" style={{ color: "var(--muted)" }}>
        {leitura}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- barras --- */

/**
 * Barra proporcional inline.
 *
 * Sem biblioteca de gráfico: em tabela densa, a barra dentro da célula é o
 * que deixa a coluna comparável de relance, e um SVG por linha custaria mais
 * do que entrega.
 */
export function Barra({
  fracao,
  cor = "var(--accent)",
  rotulo,
}: {
  fracao: number;
  cor?: string;
  /** Texto acessível: a barra é redundante com o número ao lado. */
  rotulo?: string;
}) {
  const pct = Math.max(0, Math.min(1, fracao)) * 100;
  return (
    <span
      className="block h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--border)" }}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
    </span>
  );
}

/**
 * Barra dupla: dois modais no mesmo eixo, empilhados.
 *
 * A comparação a pé × transporte é a política em si — mostrar as duas no
 * mesmo eixo é o que faz a diferença saltar, em vez de exigir que o gestor
 * segure um número na cabeça enquanto lê o outro.
 */
export function BarraDupla({
  fracaoA,
  fracaoB,
  rotuloA,
  rotuloB,
}: {
  fracaoA: number;
  fracaoB: number;
  rotuloA: string;
  rotuloB: string;
}) {
  return (
    <span className="flex flex-col gap-1" role="img" aria-label={`${rotuloA}; ${rotuloB}`}>
      <Barra fracao={fracaoA} cor="var(--chance-minima)" />
      <Barra fracao={fracaoB} cor="var(--accent)" />
    </span>
  );
}

/* --------------------------------------------------------------- seções ---- */

export function Secao({
  id,
  titulo,
  chamada,
  acao,
  children,
}: {
  id: string;
  titulo: string;
  chamada: React.ReactNode;
  /** Controle que pertence a esta seção (recorte, modal). */
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-h2 font-semibold">
            {titulo}
          </h2>
          <p className="mt-1 max-w-[78ch] text-body" style={{ color: "var(--muted)" }}>
            {chamada}
          </p>
        </div>
        {acao}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Etiqueta curta de classificação. Sempre texto — cor é reforço, não código. */
export function Etiqueta({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "alerta" | "critico" | "ok";
}) {
  const cor = {
    neutro: "var(--muted)",
    ok: "var(--chance-alta)",
    alerta: "var(--chance-baixa)",
    critico: "var(--chance-minima)",
  }[tom];
  const fundo = {
    neutro: "var(--surface)",
    ok: "var(--chance-alta-suave)",
    alerta: "var(--chance-baixa-suave)",
    critico: "var(--chance-minima-suave)",
  }[tom];
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-micro font-semibold"
      style={{ color: cor, background: fundo, border: `1px solid ${cor}` }}
    >
      {children}
    </span>
  );
}

/** Formata proporção 0..1 como inteiro por cento. */
export function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/** Divisão que não estoura quando o recorte fica vazio. */
export function razao(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

/** Mediana — referência relativa, resistente aos extremos da cauda de procura. */
export function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const ordenado = [...valores].sort((a, b) => a - b);
  return ordenado[Math.floor(ordenado.length / 2)];
}
