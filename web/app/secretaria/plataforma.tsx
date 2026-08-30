"use client";

import { useState } from "react";
import { ANO_CICLO } from "@/lib/secretaria/dados";
import type { Recorte } from "@/lib/secretaria/fases";
import { FASES, LinhaDoTempo, Rodape, SeletorCre, SeletorTema, type Fase } from "./casca";
import { FasePre } from "./fase-pre";
import { FaseDemanda } from "./fase-demanda";
import { FaseCrm } from "./fase-crm";
import "./secretaria.css";

/**
 * Plataforma da Secretaria Municipal de Educação.
 *
 * Uma tela por fase do ciclo, com o recorte de CRE valendo para todas: o
 * gestor não deveria ler a rede inteira numa fase e a CRE 7 na seguinte sem
 * perceber a troca.
 */
export function Plataforma() {
  const [fase, setFase] = useState<Fase>("pre");
  const [recorte, setRecorte] = useState<Recorte>({ cre: "todas" });
  const atual = FASES.find((f) => f.id === fase)!;

  return (
    <div className="secretaria min-h-dvh md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="secretaria-sidebar border-b px-3 py-4 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r" style={{ borderColor: "var(--s-border)" }}>
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[0.8125rem] font-bold" style={{ background: "var(--s-brand)", color: "var(--s-brand-ink)" }}>SME</span>
          <div className="min-w-0">
            <h1 className="truncate text-[0.9375rem] font-semibold">Gestão de Matrículas</h1>
            <p className="text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>Educação Infantil · {ANO_CICLO}</p>
          </div>
        </div>

        <div className="mt-6 px-2">
          <p className="mb-2 text-[0.75rem] font-medium" style={{ color: "var(--s-muted)" }}>Ciclo de matrícula</p>
          <LinhaDoTempo fase={fase} onFase={setFase} />
        </div>

        <div className="mt-6 hidden px-2 md:absolute md:bottom-4 md:left-3 md:right-3 md:block">
          <div className="rounded-lg p-3" style={{ background: "var(--s-brand-fraco)" }}>
            <p className="text-[0.75rem] font-semibold">Protótipo para demonstração</p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>Dados históricos anonimizados e cadastros individuais simulados.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-7" style={{ background: "color-mix(in oklch, var(--s-bg) 94%, transparent)", borderBottom: "1px solid var(--s-border)", backdropFilter: "blur(10px)" }}>
          <div>
            <p className="text-[0.75rem]" style={{ color: "var(--s-muted)" }}>Ciclo {ANO_CICLO} / {atual.rotulo}</p>
            <p className="text-[0.875rem] font-medium">Visão da rede municipal</p>
          </div>
          <div className="flex items-center gap-3">
            <SeletorCre recorte={recorte} onRecorte={setRecorte} />
            <SeletorTema />
          </div>
        </header>

        <main id="conteudo-principal" className="mx-auto w-full max-w-[94rem] px-4 py-7 md:px-7 md:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[1.5rem] font-semibold tracking-[-0.025em]">{atual.rotulo}</h2>
              <p className="mt-1 max-w-[78ch] text-[0.875rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
                {DESCRICAO[fase]}
              </p>
            </div>
            <span className="rounded-md px-2.5 py-1 text-[0.75rem] font-medium" style={{ background: "var(--s-surface)", color: "var(--s-muted)", border: "1px solid var(--s-border)" }}>Atualizado agora</span>
          </div>

          {fase === "pre" && <FasePre recorte={recorte} />}
          {fase === "demanda" && <FaseDemanda recorte={recorte} />}
          {fase === "crm" && <FaseCrm recorte={recorte} />}

          <nav className="mt-8 flex justify-between gap-3" aria-label="Navegação entre fases">
          {FASES.map((f, i) => {
            const idx = FASES.findIndex((x) => x.id === fase);
            if (i !== idx - 1 && i !== idx + 1) return null;
            const anterior = i < idx;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFase(f.id)}
                className={`rounded-lg px-4 py-2.5 text-left text-[0.8125rem] transition-colors ${anterior ? "" : "ml-auto text-right"}`}
                style={{ background: "var(--s-elevated)", border: "1px solid var(--s-border-forte)" }}
              >
                <span className="block text-[0.6875rem] uppercase tracking-wide" style={{ color: "var(--s-muted)" }}>
                  {anterior ? "← Fase anterior" : "Próxima fase →"}
                </span>
                <span className="font-semibold">{f.numero}. {f.rotulo}</span>
              </button>
            );
          })}
          </nav>
        </main>

        <Rodape />
      </div>
    </div>
  );
}

const DESCRICAO: Record<Fase, string> = {
  pre: "As unidades declaram quanta vaga terão no próximo ciclo. A Secretaria precisa de duas coisas ao mesmo tempo: quem ainda não respondeu ao formulário, e onde a capacidade já nasce menor que a procura conhecida — porque é ali que a alocação de professor e turma tem que começar, antes do processo abrir.",
  demanda: "Com a inscrição aberta, a pergunta vira: onde o que as famílias pedem não encontra o que a rede oferece. O recorte é a microárea, que é o que de fato aloca vaga — um bairro pode fechar equilibrado escondendo uma microárea sem uma única aposta segura.",
  crm: "A vaga só vira matrícula se a família for alcançada. O fluxo valida o número antes de convidar, e quem não passa entra numa das duas rotas de resgate: notificação no aparelho, ou agente na porta.",
};
