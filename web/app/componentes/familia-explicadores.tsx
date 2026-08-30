"use client";

import { useId, useState } from "react";

/**
 * Peças didáticas da face da família.
 *
 * A usuária típica abre isso no celular, possivelmente na fila, e não conhece
 * o vocabulário do processo seletivo. Cada termo do domínio — carteira,
 * âncora, papel, faixa de chance — precisa se explicar no lugar onde aparece,
 * não num glossário que ninguém vai procurar.
 *
 * O padrão é o mesmo em todo lugar: o texto essencial fica sempre visível, e
 * o aprofundamento fica atrás de um toque. Esconder o essencial atrás de um
 * acordeão seria o mesmo que não explicar.
 */

/**
 * Caixa de orientação no topo da etapa: por que estamos perguntando isso e o
 * que vai acontecer com a resposta. Vem antes de qualquer campo — a pessoa
 * precisa saber o motivo antes de digitar.
 */
export function CaixaOrientacao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{
        background: "var(--brand-suave)",
        border: "1px solid var(--brand)",
      }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
        {titulo}
      </p>
      <div className="mt-1.5 flex flex-col gap-2 text-body leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/**
 * Aprofundamento opcional — "o que isso quer dizer?".
 *
 * `<details>` nativo em vez de estado no React: funciona sem JavaScript, o
 * leitor de tela já anuncia aberto/fechado, e a busca do navegador acha o
 * texto de dentro.
 */
export function Explicador({
  pergunta,
  children,
}: {
  pergunta: string;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-lg"
      style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
    >
      <summary
        className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3.5 text-sm font-medium"
        style={{ color: "var(--brand)" }}
      >
        <span
          aria-hidden="true"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-micro font-bold transition-transform group-open:rotate-45"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
        >
          +
        </span>
        {pergunta}
      </summary>
      <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-1 text-body leading-relaxed">
        {children}
      </div>
    </details>
  );
}

/**
 * Ressalva honesta: um limite conhecido do método, dito sem assustar.
 *
 * Tom neutro de propósito — os limites do CONTEXT.md precisam estar visíveis,
 * mas em cor de alerta eles parariam a leitura e a família concluiria que o
 * resultado inteiro é inválido, o que não é o caso.
 */
export function Ressalva({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-lg px-3.5 py-2.5 text-sm leading-relaxed"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--muted)",
      }}
    >
      {children}
    </p>
  );
}

/**
 * Lista de itens curtos com marcador desenhado, para "o que você vai fazer".
 * `<ol>`/`<ul>` de verdade: a contagem importa para quem usa leitor de tela.
 */
export function ListaPassos({
  itens,
}: {
  itens: Array<{ titulo: string; texto: string }>;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {itens.map((item, i) => (
        <li key={item.titulo} className="flex gap-3">
          <span
            aria-hidden="true"
            className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold"
            style={{ background: "var(--brand-suave)", color: "var(--brand)" }}
          >
            {i + 1}
          </span>
          <span className="flex-1">
            <span className="block text-body font-semibold">{item.titulo}</span>
            <span className="block text-body" style={{ color: "var(--muted)" }}>
              {item.texto}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Glossário dos três papéis da carteira.
 *
 * Fica na entrega final, aberto por padrão na primeira visita: sem entender o
 * que é sonho, equilíbrio e âncora, a ordem das cinco opções vira arbitrária
 * e a família perde justamente o que o produto tem a oferecer.
 */
export function GlossarioPapeis() {
  const papeis = [
    {
      nome: "Âncora",
      texto:
        "É a sua aposta mais segura: uma creche que, historicamente, costuma ter vaga para a maioria de quem se inscreve nela. Ela existe para você não terminar o processo sem nenhuma vaga.",
      destaque: true,
    },
    {
      nome: "Equilíbrio",
      texto:
        "Fica no meio do caminho: tem chance real de vaga e ainda encaixa bem na sua rotina de deslocamento.",
      destaque: false,
    },
    {
      nome: "Sonho",
      texto:
        "É a creche que você quer de verdade, mesmo sendo disputada. Vale ocupar uma das cinco vagas com ela — desde que as outras quatro protejam você.",
      destaque: false,
    },
  ];

  return (
    <dl className="flex flex-col gap-3">
      {papeis.map((p) => (
        <div key={p.nome}>
          <dt>
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-micro font-semibold uppercase tracking-wide"
              style={{
                background: p.destaque ? "var(--brand-suave)" : "transparent",
                color: p.destaque ? "var(--brand)" : "var(--muted)",
                border: p.destaque ? "none" : "1px solid var(--border)",
              }}
            >
              {p.nome}
            </span>
          </dt>
          <dd className="mt-1 text-body leading-relaxed">{p.texto}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Aviso dispensável que a família pode fechar.
 *
 * Usado para o cartão de "como ler esta página" na entrega: útil na primeira
 * leitura, ruído na quinta. Quem fechou não vê de novo na mesma sessão.
 */
export function CartaoDispensavel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const [visivel, setVisivel] = useState(true);
  const idConteudo = useId();

  if (!visivel) return null;

  return (
    <section
      aria-labelledby={`${idConteudo}-titulo`}
      className="rounded-xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${idConteudo}-titulo`} className="text-h3 font-semibold">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={() => setVisivel(false)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-body"
          style={{ color: "var(--muted)" }}
          aria-label={`Fechar explicação: ${titulo}`}
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </section>
  );
}
