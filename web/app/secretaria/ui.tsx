"use client";

/**
 * Primitivas visuais da plataforma da Secretaria.
 *
 * Próprias, não compartilhadas com o app da família: aqui a tela otimiza
 * para comparação lado a lado e densidade — um gestor lendo 205 microáreas.
 * O que serve à decisão única da família engorda esta.
 */

import { useState } from "react";

export type Tom = "neutro" | "ok" | "aviso" | "critico" | "info";

const COR: Record<Tom, string> = {
  neutro: "var(--s-muted)",
  ok: "var(--s-ok)",
  aviso: "var(--s-aviso)",
  critico: "var(--s-critico)",
  info: "var(--s-info)",
};

const FUNDO: Record<Tom, string> = {
  neutro: "var(--s-surface)",
  ok: "var(--s-ok-fraco)",
  aviso: "var(--s-aviso-fraco)",
  critico: "var(--s-critico-fraco)",
  info: "var(--s-info-fraco)",
};

export function corDe(t: Tom) { return COR[t]; }
export function fundoDe(t: Tom) { return FUNDO[t]; }

/** Etiqueta curta. Sempre texto — cor é reforço, nunca o código sozinho. */
export function Tag({ children, tom = "neutro" }: { children: React.ReactNode; tom?: Tom }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-tight"
      style={{ color: COR[tom], background: FUNDO[tom], border: `1px solid ${COR[tom]}33` }}
    >
      {children}
    </span>
  );
}

/**
 * Número de topo com a leitura colada.
 *
 * A frase não é decoração: número sem interpretação obriga o gestor a
 * derivar a conclusão sozinho, e é aí que se lê magnitude onde o dado só
 * sustenta estrutura.
 */
export function Indicador({
  rotulo, valor, unidade, leitura, tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  leitura: React.ReactNode;
  tom?: Tom;
}) {
  return (
    <div
      className="relative flex flex-col rounded-xl p-4"
      style={{
        background: "var(--s-elevated)",
        border: "1px solid var(--s-border)",
      }}
    >
      <span className="absolute right-4 top-4 h-2 w-2 rounded-full" style={{ background: tom === "neutro" ? "var(--s-border-forte)" : COR[tom] }} aria-hidden />
      <p className="pr-5 text-[0.75rem] font-medium" style={{ color: "var(--s-muted)" }}>
        {rotulo}
      </p>
      <p className="tnum mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[1.75rem] font-bold leading-none" style={{ color: tom === "neutro" ? "var(--s-ink)" : COR[tom] }}>
          {valor}
        </span>
        {unidade && <span className="text-[0.8125rem] font-medium" style={{ color: "var(--s-muted)" }}>{unidade}</span>}
      </p>
      <p className="mt-2 text-[0.75rem] leading-snug" style={{ color: "var(--s-muted)" }}>{leitura}</p>
    </div>
  );
}

/** Barra proporcional inline. Sem lib de gráfico: em tabela densa custa mais do que entrega. */
export function Barra({ fracao, tom = "info", rotulo }: { fracao: number; tom?: Tom; rotulo?: string }) {
  const p = Math.max(0, Math.min(1, fracao)) * 100;
  return (
    <span
      className="block h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--s-border)" }}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${p}%`, background: COR[tom] }} />
    </span>
  );
}

/** Barra empilhada de composição: as partes de um todo no mesmo eixo. */
export function BarraComposta({ partes }: { partes: Array<{ valor: number; tom: Tom; rotulo: string }> }) {
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  return (
    <span
      className="flex h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--s-border)" }}
      role="img"
      aria-label={partes.map((p) => `${p.rotulo}: ${p.valor}`).join("; ")}
    >
      {partes.map((p, i) => (
        <span key={i} title={`${p.rotulo}: ${p.valor}`} style={{ width: `${(p.valor / total) * 100}%`, background: COR[p.tom] }} />
      ))}
    </span>
  );
}

/* --------------------------------------------------------------- tabela --- */

export function Tabela({ legenda, larguraMin = "44rem", altura, children }: {
  legenda: string; larguraMin?: string; altura?: string; children: React.ReactNode;
}) {
  return (
    <div className="overflow-auto rounded-xl" style={{ border: "1px solid var(--s-border)", maxHeight: altura, background: "var(--s-elevated)" }}>
      <table className="w-full border-collapse text-[0.8125rem]" style={{ minWidth: larguraMin }}>
        <caption className="sr-only">{legenda}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = "right", ordenavel, direcao, onOrdenar, dica }: {
  children: React.ReactNode;
  align?: "left" | "right";
  ordenavel?: boolean;
  direcao?: "asc" | "desc" | null;
  onOrdenar?: () => void;
  dica?: string;
}) {
  const ativo = direcao != null;
  return (
    <th
      scope="col"
      aria-sort={ordenavel ? (ativo ? (direcao === "asc" ? "ascending" : "descending") : "none") : undefined}
      title={dica}
      className={`sticky top-0 z-[1] whitespace-nowrap px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider ${align === "left" ? "text-left" : "text-right"}`}
      style={{ color: ativo ? "var(--s-ink)" : "var(--s-muted)", background: "var(--s-surface)", borderBottom: "1px solid var(--s-border-forte)" }}
    >
      {ordenavel ? (
        <button type="button" onClick={onOrdenar}
          className={`flex w-full items-center gap-1 uppercase tracking-wider ${align === "left" ? "justify-start" : "justify-end"}`}
          style={{ color: "inherit", font: "inherit", letterSpacing: "inherit" }}>
          <span>{children}</span>
          <span aria-hidden style={{ opacity: ativo ? 1 : 0.3 }}>{ativo ? (direcao === "asc" ? "▲" : "▼") : "▾"}</span>
        </button>
      ) : children}
    </th>
  );
}

export function Td({ children, align = "right", tom }: {
  children: React.ReactNode; align?: "left" | "right"; tom?: Tom;
}) {
  return (
    <td className={`tnum px-3 py-2 ${align === "left" ? "text-left" : "text-right"}`}
      style={{ color: tom ? COR[tom] : undefined, fontWeight: tom && tom !== "neutro" ? 600 : undefined }}>
      {children}
    </td>
  );
}

export function Tr({ children, indice, onClick, ativa }: {
  children: React.ReactNode; indice: number; onClick?: () => void; ativa?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={onClick ? "cursor-pointer transition-colors" : undefined}
      style={{
        background: ativa ? "var(--s-brand-fraco)" : indice % 2 === 1 ? "var(--s-surface)" : "transparent",
        borderTop: "1px solid var(--s-border)",
        boxShadow: ativa ? "inset 2px 0 0 var(--s-brand)" : undefined,
      }}
    >
      {children}
    </tr>
  );
}

/* ------------------------------------------------------------ ordenação --- */

export function useOrdenacao<K extends string>(inicial: { coluna: K; direcao: "asc" | "desc" }) {
  const [ordem, setOrdem] = useState(inicial);
  return {
    ordem,
    alterna(coluna: K, padrao: "asc" | "desc" = "desc") {
      setOrdem((a) => (a.coluna === coluna ? { coluna, direcao: a.direcao === "asc" ? "desc" : "asc" } : { coluna, direcao: padrao }));
    },
    direcaoDe(coluna: K) { return ordem.coluna === coluna ? ordem.direcao : null; },
  };
}

export function ordenaPor<T>(itens: T[], valor: (i: T) => string | number, direcao: "asc" | "desc"): T[] {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...itens].sort((a, b) => {
    const va = valor(a), vb = valor(b);
    if (typeof va === "string" || typeof vb === "string") return sinal * String(va).localeCompare(String(vb), "pt-BR");
    if (!Number.isFinite(va) || !Number.isFinite(vb)) return sinal * ((Number.isFinite(va) ? 0 : 1) - (Number.isFinite(vb) ? 0 : 1));
    return sinal * ((va as number) - (vb as number));
  });
}

/* --------------------------------------------------------------- painel --- */

export function Cartao({ titulo: t, chamada, acao, children }: {
  titulo: string; chamada?: React.ReactNode; acao?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl p-4 md:p-5" style={{ background: "var(--s-elevated)", border: "1px solid var(--s-border)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-semibold">{t}</h3>
          {chamada && <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>{chamada}</p>}
        </div>
        {acao}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Ressalva metodológica ou aviso de dado simulado. Nunca escondido. */
export function Ressalva({ children, tom = "neutro" }: { children: React.ReactNode; tom?: Tom }) {
  return (
    <p className="rounded-lg px-3 py-2 text-[0.75rem] leading-relaxed"
      style={{ background: FUNDO[tom], color: "var(--s-muted)", border: `1px solid ${COR[tom]}22` }}>
      {children}
    </p>
  );
}
