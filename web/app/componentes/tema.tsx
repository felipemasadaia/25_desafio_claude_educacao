"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Tema = "claro" | "escuro" | "sistema";

const CHAVE = "creches-tema";

/**
 * Script inline que roda antes da primeira pintura.
 *
 * Sem isso o tema salvo só é aplicado depois da hidratação, e quem escolheu
 * escuro leva um flash branco a cada carregamento — em celular lento, bem
 * visível. Precisa ser tolerante a falha: localStorage lança em janela
 * privada e em navegador com dados de site bloqueados.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE,
)});if(t==="claro"||t==="escuro"){document.documentElement.setAttribute("data-theme",t==="claro"?"light":"dark")}}catch(e){}})()`;

type Contexto = {
  tema: Tema;
  defineTema: (t: Tema) => void;
};

const TemaContext = createContext<Contexto | null>(null);

function aplica(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", tema === "claro" ? "light" : "dark");
}

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("sistema");

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo === "claro" || salvo === "escuro") setTema(salvo);
    } catch {
      // Janela privada ou dados de site bloqueados: segue no tema do sistema.
    }
  }, []);

  const defineTema = useCallback((t: Tema) => {
    setTema(t);
    aplica(t);
    try {
      if (t === "sistema") localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, t);
    } catch {
      // Preferência vale só para esta sessão; a interface segue correta.
    }
  }, []);

  return (
    <TemaContext.Provider value={{ tema, defineTema }}>{children}</TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema precisa estar dentro de ProvedorTema");
  return ctx;
}

const OPCOES: Array<{ valor: Tema; rotulo: string; icone: React.ReactNode }> = [
  {
    valor: "claro",
    rotulo: "Tema claro",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    valor: "sistema",
    rotulo: "Seguir o sistema",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    valor: "escuro",
    rotulo: "Tema escuro",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** Três estados explícitos: claro, sistema, escuro. */
export function SeletorTema() {
  const { tema, defineTema } = useTema();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="inline-flex items-center gap-0.5 rounded-full border p-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {OPCOES.map((o) => {
        const ativo = tema === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={o.rotulo}
            title={o.rotulo}
            onClick={() => defineTema(o.valor)}
            className="grid h-8 w-8 place-items-center rounded-full transition-colors"
            style={{
              background: ativo ? "var(--brand)" : "transparent",
              color: ativo ? "var(--brand-ink)" : "var(--muted)",
              transitionDuration: "180ms",
            }}
          >
            <span className="h-4 w-4">{o.icone}</span>
          </button>
        );
      })}
    </div>
  );
}
