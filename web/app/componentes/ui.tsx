"use client";

import { ROTULO_FAIXA } from "@/lib/recomendador/motor";
import type { FaixaChance } from "@/lib/recomendador/tipos";

/* ---------- Botão ---------- */

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "fantasma";
  tamanho?: "md" | "sm";
};

export function Botao({
  variante = "primario",
  tamanho = "md",
  className = "",
  style,
  ...props
}: BotaoProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-45 disabled:cursor-not-allowed";
  // Alvo de toque >=44px na face da família.
  const dim = tamanho === "sm" ? "min-h-[36px] px-3 text-sm" : "min-h-[44px] px-4";

  const estilos: Record<string, React.CSSProperties> = {
    primario: { background: "var(--brand)", color: "var(--brand-ink)" },
    secundario: {
      background: "var(--elevated)",
      color: "var(--ink)",
      border: "1px solid var(--border-controle)",
    },
    fantasma: { background: "transparent", color: "var(--muted)" },
  };

  return (
    <button
      className={`${base} ${dim} ${className}`}
      style={{ transitionDuration: "180ms", ...estilos[variante], ...style }}
      {...props}
    />
  );
}

/* ---------- Sinal de chance ---------- */

/**
 * A chance nunca é comunicada só por cor: cor + rótulo + forma.
 *
 * Um daltônico deuteranope distingue as quatro faixas pela forma do disco e
 * pelo texto; sob sol forte, pelo texto. A spec proíbe número pontual —
 * a simulação acerta a direção e erra a magnitude.
 */
export { ROTULO_FAIXA } from "@/lib/recomendador/motor";

const COR_FAIXA: Record<FaixaChance, { cor: string; fundo: string }> = {
  alta: { cor: "var(--chance-alta)", fundo: "var(--chance-alta-suave)" },
  media: { cor: "var(--chance-media)", fundo: "var(--chance-media-suave)" },
  baixa: { cor: "var(--chance-baixa)", fundo: "var(--chance-baixa-suave)" },
  minima: { cor: "var(--chance-minima)", fundo: "var(--chance-minima-suave)" },
};

/** Fração preenchida do disco: a forma carrega o sinal junto com a cor. */
const PREENCHIMENTO: Record<FaixaChance, number> = {
  alta: 1,
  media: 0.5,
  baixa: 0.25,
  minima: 0,
};

export function DiscoChance({ faixa, tamanho = 16 }: { faixa: FaixaChance; tamanho?: number }) {
  const { cor } = COR_FAIXA[faixa];
  const p = PREENCHIMENTO[faixa];
  const r = 7;
  const circunferencia = 2 * Math.PI * r;

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r={r} fill="none" stroke={cor} strokeWidth="2" opacity={0.35} />
      {p > 0 && (
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth="4"
          strokeDasharray={`${circunferencia * p} ${circunferencia}`}
          transform="rotate(-90 9 9)"
        />
      )}
    </svg>
  );
}

export function SinalChance({
  faixa,
  compacto = false,
}: {
  faixa: FaixaChance;
  compacto?: boolean;
}) {
  const { cor, fundo } = COR_FAIXA[faixa];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        compacto ? "px-2 py-0.5 text-micro" : "px-2.5 py-1 text-label"
      }`}
      style={{ background: fundo, color: cor }}
    >
      <DiscoChance faixa={faixa} tamanho={compacto ? 12 : 14} />
      {ROTULO_FAIXA[faixa]}
    </span>
  );
}

/* ---------- Barra de encaixe ---------- */

/**
 * Encaixe é o segundo eixo e nunca colapsa com a chance num número só —
 * é o que permite à família discordar de forma informada.
 */
export function BarraEncaixe({ valor }: { valor: number }) {
  const pct = Math.round(valor * 100);
  const rotulo = pct >= 75 ? "Ótimo" : pct >= 50 ? "Bom" : pct >= 30 ? "Razoável" : "Difícil";

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-14 overflow-hidden rounded-full"
        style={{ background: "var(--border)" }}
        role="img"
        aria-label={`Encaixe com a sua rotina: ${rotulo}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>
      <span className="text-label" style={{ color: "var(--muted)" }}>
        {rotulo}
      </span>
    </div>
  );
}

/* ---------- Papel na carteira ---------- */

export const ROTULO_PAPEL = {
  ancora: "Âncora",
  equilibrio: "Equilíbrio",
  sonho: "Sonho",
} as const;

const DESCRICAO_PAPEL = {
  ancora: "Sua aposta mais segura da carteira",
  equilibrio: "Equilibra chance de vaga e trajeto",
  sonho: "Muito disputada, mas é a que você quer",
} as const;

export function SeloPapel({ papel }: { papel: keyof typeof ROTULO_PAPEL }) {
  const ancora = papel === "ancora";
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-micro font-semibold uppercase tracking-wide"
      title={DESCRICAO_PAPEL[papel]}
      style={{
        background: ancora ? "var(--brand-suave)" : "transparent",
        color: ancora ? "var(--brand)" : "var(--muted)",
        border: ancora ? "none" : "1px solid var(--border)",
      }}
    >
      {ROTULO_PAPEL[papel]}
    </span>
  );
}

/* ---------- Campo de formulário ---------- */

export function Campo({
  rotulo,
  ajuda,
  children,
  id,
}: {
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      {ajuda && (
        <p className="text-label" style={{ color: "var(--muted)" }}>
          {ajuda}
        </p>
      )}
      {children}
    </div>
  );
}

/** Grupo de escolha única, com alvo de toque generoso. */
export function Opcoes<T extends string>({
  valor,
  opcoes,
  onChange,
  rotuloGrupo,
}: {
  valor: T;
  opcoes: Array<{ valor: T; rotulo: string; nota?: string }>;
  onChange: (v: T) => void;
  rotuloGrupo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotuloGrupo} className="grid gap-2">
      {opcoes.map((o) => {
        const ativo = valor === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
            style={{
              background: ativo ? "var(--brand-suave)" : "var(--elevated)",
              border: `1px solid ${ativo ? "var(--brand)" : "var(--border-controle)"}`,
              transitionDuration: "180ms",
            }}
          >
            <span
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full"
              style={{
                border: `2px solid ${ativo ? "var(--brand)" : "var(--border-controle)"}`,
              }}
            >
              {ativo && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
            </span>
            <span className="flex flex-col">
              <span className="text-body font-medium">{o.rotulo}</span>
              {o.nota && (
                <span className="text-label" style={{ color: "var(--muted)" }}>
                  {o.nota}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
