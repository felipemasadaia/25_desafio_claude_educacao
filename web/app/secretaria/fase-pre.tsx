"use client";

import { useMemo, useState } from "react";
import { ANO_ALVO, ANO_CICLO, num, pct, titulo, SERIE } from "@/lib/secretaria/dados";
import { preInscricao, projecao, resumoPre, type LinhaPre, type Recorte, type StatusPre } from "@/lib/secretaria/fases";
import { Barra, BarraComposta, Cartao, Indicador, Ressalva, Tabela, Tag, Td, Th, Tr, ordenaPor, useOrdenacao, type Tom } from "./ui";

/**
 * Fase 1 — Pré-inscrição.
 *
 * Duas perguntas, nesta ordem: quanta vaga a rede vai ter no ciclo que vem,
 * e quais unidades ainda não responderam. A segunda é o trabalho concreto
 * da fase — sem o formulário preenchido, a Fase 2 compara a demanda contra
 * uma oferta que ninguém confirmou.
 */

const ROTULO_STATUS: Record<StatusPre, { texto: string; tom: Tom }> = {
  confirmada: { texto: "Confirmada", tom: "ok" },
  parcial: { texto: "Parcial", tom: "aviso" },
  pendente: { texto: "Pendente", tom: "critico" },
};

type Coluna = "nome" | "bairro" | "status" | "vagas" | "procura" | "saldo";

export function FasePre({ recorte }: { recorte: Recorte }) {
  const [filtro, setFiltro] = useState<StatusPre | "todos">("todos");
  const [busca, setBusca] = useState("");
  const { ordem, alterna, direcaoDe } = useOrdenacao<Coluna>({ coluna: "saldo", direcao: "asc" });

  const linhas = useMemo(() => preInscricao(recorte), [recorte]);
  const resumo = useMemo(() => resumoPre(linhas), [linhas]);
  const proj = useMemo(() => projecao(), []);

  const visiveis = useMemo(() => {
    const b = busca.trim().toLowerCase();
    const filtradas = linhas.filter(
      (l) =>
        (filtro === "todos" || l.status === filtro) &&
        (b === "" || titulo(l.nome).toLowerCase().includes(b) || titulo(l.bairro).toLowerCase().includes(b)),
    );
    const extrai = (l: LinhaPre): string | number =>
      ordem.coluna === "nome" ? titulo(l.nome)
      : ordem.coluna === "bairro" ? titulo(l.bairro)
      : ordem.coluna === "status" ? l.status
      : l[ordem.coluna];
    return ordenaPor(filtradas, extrai, ordem.direcao);
  }, [linhas, filtro, busca, ordem]);

  /** Cobertura da declaração: quanto da vaga informada é dado real, não estimativa. */
  const fracaoDeclarada = resumo.vagas > 0 ? resumo.vagasDeclaradas / resumo.vagas : 0;
  const prontas = resumo.unidades > 0 ? resumo.confirmadas / resumo.unidades : 0;

  return (
    <div className="entra flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo={`Vagas para ${ANO_CICLO}`}
          valor={num(resumo.vagas)}
          leitura={<>Em {num(resumo.unidades)} unidades. {pct(fracaoDeclarada)} vem de capacidade declarada; o resto é estimado pela absorção histórica.</>}
        />
        <Indicador
          rotulo="Formulário preenchido"
          valor={pct(prontas)}
          leitura={<>{num(resumo.confirmadas)} confirmadas, {num(resumo.parciais)} parciais, <strong>{num(resumo.pendentes)} sem resposta</strong>.</>}
          tom={prontas < 0.7 ? "aviso" : "ok"}
        />
        <Indicador
          rotulo="Unidades sobrecarregadas"
          valor={num(resumo.sobrecarregadas)}
          unidade={`de ${num(resumo.unidades)}`}
          leitura={<>A procura histórica supera a capacidade do próximo ciclo. É onde a fila se forma antes do processo abrir.</>}
          tom="critico"
        />
        <Indicador
          rotulo={`Inscrições previstas ${ANO_CICLO}`}
          valor={num(proj.inscricoes)}
          leitura={<>Média dos três últimos ciclos ({proj.base.map(num).join(" · ")}). {proj.variacao >= 0 ? "+" : ""}{pct(proj.variacao, 1)} sobre {ANO_ALVO}.</>}
          tom="info"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Cartao
          titulo="Onde a rede precisa alocar gente"
          chamada={<>Ordenado pelo saldo — capacidade do próximo ciclo menos a procura do último. Saldo negativo é unidade que já não dá conta do que pedem hoje.</>}
          acao={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Unidade ou bairro"
                aria-label="Buscar unidade ou bairro"
                className="h-9 w-44 rounded-lg px-2.5 text-[0.8125rem]"
                style={{ background: "var(--s-elevated)", color: "var(--s-ink)", border: "1px solid var(--s-border-forte)" }}
              />
              <div className="flex rounded-lg p-0.5" style={{ background: "var(--s-surface)", border: "1px solid var(--s-border)" }} role="group" aria-label="Filtrar por status">
                {(["todos", "pendente", "parcial", "confirmada"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setFiltro(f)} aria-pressed={filtro === f}
                    className="rounded px-2 py-1 text-[0.6875rem] font-medium capitalize transition-colors"
                    style={{ background: filtro === f ? "var(--s-elevated)" : "transparent", color: filtro === f ? "var(--s-ink)" : "var(--s-muted)" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <Tabela legenda="Unidades e capacidade declarada para o próximo ciclo" altura="30rem" larguraMin="52rem">
            <thead>
              <tr>
                <Th align="left" ordenavel direcao={direcaoDe("nome")} onOrdenar={() => alterna("nome", "asc")}>Unidade</Th>
                <Th align="left" ordenavel direcao={direcaoDe("bairro")} onOrdenar={() => alterna("bairro", "asc")}>Bairro</Th>
                <Th align="left" ordenavel direcao={direcaoDe("status")} onOrdenar={() => alterna("status", "asc")} dica="Estado do formulário de capacidade (simulado)">Formulário</Th>
                <Th ordenavel direcao={direcaoDe("vagas")} onOrdenar={() => alterna("vagas")} dica="Capacidade declarada ou estimada">Vagas</Th>
                <Th ordenavel direcao={direcaoDe("procura")} onOrdenar={() => alterna("procura")} dica="Pedidos recebidos no último processo (real)">Procura</Th>
                <Th ordenavel direcao={direcaoDe("saldo")} onOrdenar={() => alterna("saldo", "asc")} dica="Vagas menos procura">Saldo</Th>
              </tr>
            </thead>
            <tbody>
              {visiveis.slice(0, 250).map((l, i) => {
                const st = ROTULO_STATUS[l.status];
                return (
                  <Tr key={l.codigo} indice={i}>
                    <td className="px-3 py-2 text-left">
                      <span className="block max-w-[26ch] truncate font-medium" title={titulo(l.nome)}>{titulo(l.nome)}</span>
                      <span className="text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>
                        {l.tipo ?? "—"} · CRE {l.cre ?? "—"} · µ{l.microarea ?? "—"}
                        {l.segura && <> · <span style={{ color: "var(--s-ok)" }}>aposta segura</span></>}
                      </span>
                    </td>
                    <Td align="left">{titulo(l.bairro)}</Td>
                    <td className="px-3 py-2 text-left"><Tag tom={st.tom}>{st.texto}</Tag></td>
                    <Td>{num(l.vagas)}{l.vagasDeclaradas > 0 && <span title="Capacidade declarada pela unidade" style={{ color: "var(--s-ok)" }}> ✓</span>}</Td>
                    <Td>{num(l.procura)}</Td>
                    <Td tom={l.saldo < 0 ? "critico" : "ok"}>{l.saldo > 0 ? "+" : ""}{num(l.saldo)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tabela>
          {visiveis.length === 0 && (
            <p className="mt-3 rounded-lg px-3 py-4 text-center text-[0.8125rem]" style={{ background: "var(--s-surface)", color: "var(--s-muted)", border: "1px dashed var(--s-border-forte)" }}>
              Nenhuma unidade com este filtro no recorte selecionado.
            </p>
          )}
          {visiveis.length > 250 && (
            <p className="mt-2 text-[0.75rem]" style={{ color: "var(--s-muted)" }}>
              Mostrando 250 de {num(visiveis.length)} unidades. Refine pela busca ou pelo recorte de CRE.
            </p>
          )}
        </Cartao>

        <div className="flex flex-col gap-4">
          <Cartao titulo={`Visibilidade do ciclo ${ANO_CICLO}`} chamada="Série real de inscrições. A projeção é a média dos três últimos anos — com cinco pontos e uma pandemia no meio, tendência seria overfitting apresentado como previsão.">
            <ul className="flex flex-col gap-2.5">
              {SERIE.map((a) => {
                const max = Math.max(...SERIE.map((s) => s.inscricoes), proj.inscricoes);
                return (
                  <li key={a.ano} className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-2 text-[0.75rem]">
                    <span className="tnum font-medium" style={{ color: "var(--s-muted)" }}>{a.ano}</span>
                    <Barra fracao={a.inscricoes / max} tom="info" rotulo={`${a.ano}: ${num(a.inscricoes)} inscrições`} />
                    <span className="tnum text-right font-medium">{num(a.inscricoes)}</span>
                  </li>
                );
              })}
              <li className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-2 text-[0.75rem]">
                <span className="tnum font-semibold" style={{ color: "var(--s-brand)" }}>{ANO_CICLO}</span>
                <Barra fracao={proj.inscricoes / Math.max(...SERIE.map((s) => s.inscricoes), proj.inscricoes)} tom="ok" rotulo={`${ANO_CICLO} previsto: ${num(proj.inscricoes)}`} />
                <span className="tnum text-right font-semibold" style={{ color: "var(--s-brand)" }}>{num(proj.inscricoes)}</span>
              </li>
            </ul>
            <p className="mt-3 text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
              A média de opções por família caiu de {SERIE[0].media_opcoes.toFixed(2).replace(".", ",")} para {SERIE[SERIE.length - 1].media_opcoes.toFixed(2).replace(".", ",")} e a fatia que
              preenche uma opção só subiu de {pct(SERIE[0].so_uma_opcao)} para {pct(SERIE[SERIE.length - 1].so_uma_opcao)}. Menos opção por
              família concentra a fila e é o mesmo sinal que a Fase 3 usa para prever cadastro precário.
            </p>
          </Cartao>

          <Cartao titulo="Estado do preenchimento" chamada="Quantas unidades já responderam ao formulário de capacidade.">
            <BarraComposta
              partes={[
                { valor: resumo.confirmadas, tom: "ok", rotulo: "Confirmada" },
                { valor: resumo.parciais, tom: "aviso", rotulo: "Parcial" },
                { valor: resumo.pendentes, tom: "critico", rotulo: "Pendente" },
              ]}
            />
            <ul className="mt-3 flex flex-col gap-1.5 text-[0.8125rem]">
              {([["confirmada", resumo.confirmadas], ["parcial", resumo.parciais], ["pendente", resumo.pendentes]] as const).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-2">
                  <Tag tom={ROTULO_STATUS[k as StatusPre].tom}>{ROTULO_STATUS[k as StatusPre].texto}</Tag>
                  <span className="tnum" style={{ color: "var(--s-muted)" }}>{num(v)} · {pct(v / Math.max(1, resumo.unidades))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Ressalva tom="aviso">
                O estado do formulário é <strong>simulado</strong>: a base não registra o ciclo
                administrativo. As vagas de {num(resumo.unidades)} unidades saem de capacidade real
                onde ela existe (74 unidades) e da absorção histórica no resto.
              </Ressalva>
            </div>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
