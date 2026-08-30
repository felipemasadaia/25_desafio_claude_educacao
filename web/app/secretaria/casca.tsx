"use client";

import { useState } from "react";
import { ANO_CICLO, CRES, FONTE } from "@/lib/secretaria/dados";
import type { Recorte } from "@/lib/secretaria/fases";

/**
 * Casca da plataforma: linha do tempo do ciclo + recorte territorial.
 *
 * A linha do tempo é a estrutura organizadora, não enfeite. O ciclo de
 * matrícula é sequencial e a Secretaria trabalha em uma fase por vez: a
 * pergunta de cada fase só faz sentido depois que a anterior fechou. Abas
 * soltas apagariam essa ordem e sugeririam que dá para atacar o contato
 * sem saber onde falta vaga.
 *
 * O recorte de CRE é global de propósito: um filtro por seção deixaria o
 * gestor lendo a rede inteira numa tela e a CRE 7 na de baixo, sem perceber.
 */

export type Fase = "pre" | "demanda" | "crm";

export const FASES: Array<{
  id: Fase;
  numero: string;
  rotulo: string;
  pergunta: string;
  periodo: string;
}> = [
  { id: "pre", numero: "1", rotulo: "Pré-inscrição", pergunta: "Quanta vaga a rede terá?", periodo: "Ago — Set" },
  { id: "demanda", numero: "2", rotulo: "Demanda", pergunta: "Onde ela não cobre o pedido?", periodo: "Out — Nov" },
  { id: "crm", numero: "3", rotulo: "Contato ativo", pergunta: "Como alcançar cada família?", periodo: "Dez — Fev" },
];

export function LinhaDoTempo({ fase, onFase }: { fase: Fase; onFase: (f: Fase) => void }) {
  const atual = FASES.findIndex((f) => f.id === fase);

  return (
    <nav aria-label="Fases do ciclo de matrícula" className="relative">
      <div className="absolute bottom-10 left-[1.08rem] top-5 w-px" style={{ background: "var(--s-border)" }} aria-hidden />
      <ol className="relative flex flex-col gap-1.5">
        {FASES.map((f, i) => {
          const ativa = f.id === fase;
          const passada = i < atual;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onFase(f.id)}
                aria-current={ativa ? "step" : undefined}
                className="group flex min-h-16 w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors"
                style={{ background: ativa ? "var(--s-brand-fraco)" : "transparent" }}
              >
                <span
                  className="relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-semibold transition-colors"
                  style={{
                    background: ativa ? "var(--s-brand)" : passada ? "var(--s-ok)" : "var(--s-elevated)",
                    color: ativa || passada ? "var(--s-brand-ink)" : "var(--s-muted)",
                    border: `2px solid ${ativa ? "var(--s-brand)" : passada ? "var(--s-ok)" : "var(--s-border-forte)"}`,
                  }}
                >
                  {passada ? "✓" : f.numero}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.875rem] font-semibold" style={{ color: ativa ? "var(--s-ink)" : "var(--s-muted)" }}>
                      {f.rotulo}
                    </span>
                    <span className="text-[0.6875rem] font-medium" style={{ color: "var(--s-muted)" }}>
                      {f.periodo}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug" style={{ color: "var(--s-muted)" }}>
                    {f.pergunta}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Recorte territorial. Vale para a plataforma inteira. */
export function SeletorCre({ recorte, onRecorte }: { recorte: Recorte; onRecorte: (r: Recorte) => void }) {
  return (
    <label className="flex items-center gap-2 text-[0.8125rem]">
      <span style={{ color: "var(--s-muted)" }}>CRE</span>
      <select
        value={String(recorte.cre)}
        onChange={(e) => onRecorte({ cre: e.target.value === "todas" ? "todas" : Number(e.target.value) })}
        className="h-9 rounded-lg px-2.5 text-[0.8125rem] font-medium"
        style={{ background: "var(--s-elevated)", color: "var(--s-ink)", border: "1px solid var(--s-border-forte)" }}
      >
        <option value="todas">Rede inteira</option>
        {CRES.map((c) => <option key={c} value={c}>CRE {c}</option>)}
      </select>
    </label>
  );
}

export function SeletorTema() {
  const [tema, setTema] = useState<"sistema" | "claro" | "escuro">("sistema");
  return (
    <div className="flex rounded-lg p-0.5" style={{ background: "var(--s-surface)", border: "1px solid var(--s-border)" }} role="group" aria-label="Tema">
      {(["claro", "sistema", "escuro"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={tema === t}
          onClick={() => {
            setTema(t);
            const el = document.querySelector(".secretaria") as HTMLElement | null;
            if (el) {
              if (t === "sistema") el.removeAttribute("data-tema");
              else el.setAttribute("data-tema", t);
            }
          }}
          className="rounded px-2 py-1 text-[0.6875rem] font-medium capitalize transition-colors"
          style={{
            background: tema === t ? "var(--s-elevated)" : "transparent",
            color: tema === t ? "var(--s-ink)" : "var(--s-muted)",
          }}
        >
          {t === "claro" ? "☀" : t === "escuro" ? "☾" : "auto"}
        </button>
      ))}
    </div>
  );
}

export function Rodape() {
  return (
    <footer className="mt-12 px-4 py-6 md:px-8" style={{ borderTop: "1px solid var(--s-border)", background: "var(--s-surface)" }}>
      <h2 className="text-[0.8125rem] font-semibold">Nota metodológica</h2>
      <div className="mt-2 grid max-w-[110ch] gap-3 text-[0.75rem] leading-relaxed md:grid-cols-2" style={{ color: "var(--s-muted)" }}>
        <p>
          <strong>Dado real</strong> — 872 unidades, 11 CREs, 205 microáreas: procura por
          unidade e por grupamento × horário, chance histórica de atendimento, série de
          inscrições 2021–2025 e a régua de pontuação oficial de 13 critérios.
          Fonte: <code>{FONTE}</code>.
        </p>
        <p>
          <strong>Dado simulado</strong> — cadastro individual (nome, telefone, situação de
          contato) e o estado administrativo do ciclo {ANO_CICLO}. A base é anonimizada e
          agregada: não traz criança, contato nem vaga ofertada em 798 das 872 unidades.
          Cada campo fictício é derivado de um sinal real, declarado no código, e é
          determinístico — a mesma tela reaparece igual a cada recarga.
        </p>
        <p className="md:col-span-2">
          O próprio material da SME avisa que os indicadores não representam a realidade
          exata. As leituras aqui são sobre a <strong>estrutura</strong> do problema — onde
          há pressão, onde falta aposta segura, quem a rede não consegue alcançar — nunca
          sobre magnitudes absolutas.
        </p>
      </div>
    </footer>
  );
}
