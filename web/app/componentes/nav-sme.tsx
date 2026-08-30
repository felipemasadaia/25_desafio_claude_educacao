"use client";

import { useEffect, useState } from "react";

/**
 * Navegação lateral do painel.
 *
 * Os três eixos do trabalho da SME, na ordem em que a pergunta aparece:
 * onde falta (território), o que a rede oferece (oferta), e como a família
 * escolhe (escolha). A régua fecha como referência, não como eixo.
 *
 * Âncora e não rota: o painel é uma leitura contínua e o gestor compara
 * seções entre si. Quebrar em páginas obrigaria a recarregar o recorte de
 * CRE a cada troca.
 */

export const EIXOS = [
  {
    id: "territorio",
    rotulo: "Território",
    descricao: "Onde falta aposta segura",
  },
  {
    id: "oferta",
    rotulo: "Oferta",
    descricao: "O que a rede tem e ninguém pede",
  },
  {
    id: "escolha",
    rotulo: "Escolha",
    descricao: "Como a família preenche",
  },
  {
    id: "regua",
    rotulo: "Régua de pontuação",
    descricao: "O que governa a classificação",
  },
] as const;

export function NavSme() {
  const [ativo, setAtivo] = useState<string>(EIXOS[0].id);

  /**
   * Marca o eixo visível pelo topo do viewport. `rootMargin` negativo em
   * baixo evita que a seção seguinte assuma o destaque cedo demais.
   */
  useEffect(() => {
    const alvos = EIXOS.map((e) => document.getElementById(e.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtivo(visivel.target.id);
      },
      { rootMargin: "-72px 0px -60% 0px", threshold: 0 },
    );

    for (const alvo of alvos) obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Eixos do painel"
      className="hidden lg:block lg:w-56 lg:shrink-0"
    >
      <div className="sticky top-20 flex flex-col gap-0.5">
        {EIXOS.map((e) => {
          const atual = ativo === e.id;
          return (
            <a
              key={e.id}
              href={`#${e.id}`}
              aria-current={atual ? "true" : undefined}
              className="rounded-lg px-3 py-2 transition-colors"
              style={{
                background: atual ? "var(--surface)" : "transparent",
                borderLeft: `2px solid ${atual ? "var(--brand)" : "transparent"}`,
              }}
            >
              <span
                className="block text-sm font-medium"
                style={{ color: atual ? "var(--ink)" : "var(--muted)" }}
              >
                {e.rotulo}
              </span>
              <span className="mt-0.5 block text-micro" style={{ color: "var(--muted)" }}>
                {e.descricao}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
