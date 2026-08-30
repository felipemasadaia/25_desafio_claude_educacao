"use client";

import { useMemo, useState } from "react";
import { num, pct, titulo, UNIDADES } from "@/lib/secretaria/dados";
import type { Recorte } from "@/lib/secretaria/fases";
import {
  ESTAGIOS, QUALIFICACOES, filaDoRecorte, pontosCriterio, resumoCrm, textoCriterio,
  type Contato, type Estagio, type Qualificacao,
} from "@/lib/secretaria/crm";
import { BarraComposta, Cartao, Indicador, Ressalva, Tabela, Tag, Td, Th, Tr, ordenaPor, useOrdenacao, type Tom } from "./ui";

/**
 * Fase 3 — CRM de contato ativo.
 *
 * A tela é organizada pela decisão, não pelo dado: primeiro a
 * PRÉ-QUALIFICAÇÃO do número, porque é ela que define por qual canal a
 * família será alcançada. Convite disparado para número morto consome o
 * prazo e devolve a vaga tarde demais para reofertar no mesmo ciclo — o
 * custo do contato mal endereçado é uma vaga ociosa com fila cheia.
 *
 * Quem não passa na pré-qualificação não é descartado: cai numa das duas
 * estratégias de resgate, que a tela trata como trabalho a fazer, com fila
 * própria e responsável — push no aparelho, ou agente na porta.
 */

const TOM_QUAL: Record<Qualificacao, Tom> = { valido: "ok", push: "aviso", sem_canal: "critico", pendente: "neutro" };
const TOM_ESTAGIO: Record<Estagio, Tom> = {
  fila: "neutro", qualificar: "info", contatar: "aviso", aguardando: "info", aceito: "ok", perdido: "critico",
};

type Coluna = "responsavel" | "unidadeNome" | "bairro" | "pontos" | "diasNaFila" | "qualificacao" | "estagio";

export function FaseCrm({ recorte }: { recorte: Recorte }) {
  const [qual, setQual] = useState<Qualificacao | "todos">("todos");
  const [estagio, setEstagio] = useState<Estagio | "todos">("todos");
  const [unidade, setUnidade] = useState<string | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const { ordem, alterna, direcaoDe } = useOrdenacao<Coluna>({ coluna: "pontos", direcao: "desc" });

  const fila = useMemo(() => filaDoRecorte(recorte), [recorte]);
  const contatos = fila.contatos;
  const resumo = useMemo(() => resumoCrm(contatos), [contatos]);

  /** Unidades do recorte que têm fila, para o filtro por escola. */
  const unidadesDaFila = useMemo(() => {
    const mapa = new Map<string, { codigo: string; nome: string; n: number }>();
    for (const c of contatos) {
      const a = mapa.get(c.unidade) ?? { codigo: c.unidade, nome: c.unidadeNome, n: 0 };
      a.n++;
      mapa.set(c.unidade, a);
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [contatos]);

  const visiveis = useMemo(() => {
    const b = busca.trim().toLowerCase();
    const f = contatos.filter(
      (c) =>
        (qual === "todos" || c.qualificacao === qual) &&
        (estagio === "todos" || c.estagio === estagio) &&
        (unidade === "todas" || c.unidade === unidade) &&
        (b === "" ||
          c.responsavel.toLowerCase().includes(b) ||
          c.crianca.toLowerCase().includes(b) ||
          c.protocolo.includes(b) ||
          c.telefone.includes(b)),
    );
    return ordenaPor(f, (c) => c[ordem.coluna], ordem.direcao);
  }, [contatos, qual, estagio, unidade, busca, ordem]);

  const detalhe = contatos.find((c) => c.protocolo === aberto) ?? null;
  const resumoFiltrado = useMemo(() => resumoCrm(visiveis), [visiveis]);

  return (
    <div className="entra flex flex-col gap-5">
      <Ressalva tom="aviso">
        <strong>Cadastro individual simulado.</strong> A base da SME é anonimizada e agregada — não
        traz criança, nome, telefone nem endereço, e sem isso não existe CRM. O <em>tamanho</em> de
        cada fila vem de dado real (procura da unidade × o que ela historicamente não atende), e a
        proporção de números válidos por bairro segue o sinal real de famílias que preenchem uma
        única opção. Os registros são determinísticos: a mesma tela reaparece igual a cada recarga.
      </Ressalva>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Famílias na fila"
          valor={num(resumo.total)}
          leitura={
            <>
              Amostra das {num(fila.unidadesAmostradas)} unidades de maior procura, de{" "}
              {num(fila.unidadesTotal)} com fila no recorte. O corte é da tela, não do dado.
            </>
          }
        />
        <Indicador
          rotulo="Alcançáveis por telefone"
          valor={pct(resumo.alcancaveis / Math.max(1, resumo.total))}
          unidade={`${num(resumo.alcancaveis)} famílias`}
          leitura={<>Número validado: a ligação ou o WhatsApp chega. É o caminho barato.</>}
          tom="ok"
        />
        <Indicador
          rotulo="Exigem resgate"
          valor={num(resumo.resgate)}
          unidade="famílias"
          leitura={<>{num(resumo.porQualificacao.push)} só por push no aparelho, {num(resumo.porQualificacao.sem_canal)} só batendo na porta.</>}
          tom="critico"
        />
        <Indicador
          rotulo="A qualificar"
          valor={num(resumo.porQualificacao.pendente)}
          unidade="números"
          leitura={<>Backlog de validação. Enquanto não roda, não se sabe por qual canal chamar.</>}
          tom="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Cartao titulo="1. Pré-qualificação do número" chamada="Antes de convidar, valida a linha. Convite para número morto consome o prazo e devolve a vaga tarde demais para reofertar no ciclo.">
          <BarraComposta
            partes={QUALIFICACOES.map((q) => ({ valor: resumo.porQualificacao[q.id], tom: TOM_QUAL[q.id], rotulo: q.rotulo }))}
          />
          <ul className="mt-3 flex flex-col gap-2">
            {QUALIFICACOES.map((q) => {
              const v = resumo.porQualificacao[q.id];
              const ativo = qual === q.id;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setQual(ativo ? "todos" : q.id)}
                    aria-pressed={ativo}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
                    style={{ background: ativo ? "var(--s-brand-fraco)" : "transparent" }}
                  >
                    <span className="min-w-0">
                      <Tag tom={TOM_QUAL[q.id]}>{q.rotulo}</Tag>
                      <span className="mt-0.5 block text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>→ {q.acao}</span>
                    </span>
                    <span className="tnum shrink-0 text-[0.8125rem] font-semibold">{num(v)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Cartao>

        <Cartao titulo="2. Estratégia de resgate" chamada="Quem não passa na validação não some da fila. Cada rota tem custo e alcance diferentes.">
          <ol className="flex flex-col gap-3">
            {[
              {
                n: "A", titulo: "Notificação no aparelho", tom: "aviso" as Tom,
                q: resumo.porQualificacao.push,
                texto: "Chega mesmo quando a linha mudou de titular ou o plano virou pré-pago sem crédito — basta o app estar instalado. Custo marginal quase zero, alcance parcial.",
              },
              {
                n: "B", titulo: "Busca ativa domiciliar", tom: "critico" as Tom,
                q: resumo.porQualificacao.sem_canal,
                texto: "Agente vai ao endereço da inscrição. É a única rota que alcança quem não tem nenhum canal digital, e a mais cara: exige equipe, roteiro e tempo.",
              },
            ].map((e) => (
              <li key={e.n} className="rounded-lg p-3" style={{ background: "var(--s-surface)", border: "1px solid var(--s-border)" }}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-[0.8125rem] font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ background: e.tom === "aviso" ? "var(--s-aviso)" : "var(--s-critico)" }} aria-hidden />
                    {e.n}. {e.titulo}
                  </span>
                  <span className="tnum text-[0.8125rem] font-semibold" style={{ color: e.tom === "aviso" ? "var(--s-aviso)" : "var(--s-critico)" }}>{num(e.q)}</span>
                </div>
                <p className="mt-1 text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>{e.texto}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
            Se todo o grupo de resgate fosse tratado só por telefone, {num(resumo.resgate)} famílias
            ({pct(resumo.resgate / Math.max(1, resumo.total))} da fila) ficariam sem ser alcançadas — e
            a vaga delas voltaria ao pool depois do prazo.
          </p>
        </Cartao>

        <Cartao titulo="3. Funil de contato" chamada="Onde cada família está. Clique para filtrar a lista.">
          <ul className="flex flex-col gap-1.5">
            {ESTAGIOS.map((e) => {
              const v = resumo.porEstagio[e.id];
              const ativo = estagio === e.id;
              const frac = v / Math.max(1, resumo.total);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setEstagio(ativo ? "todos" : e.id)}
                    aria-pressed={ativo}
                    className="w-full rounded-lg px-2 py-1.5 text-left transition-colors"
                    style={{ background: ativo ? "var(--s-brand-fraco)" : "transparent" }}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                      <span className="font-medium">{e.rotulo}</span>
                      <span className="tnum shrink-0" style={{ color: "var(--s-muted)" }}>{num(v)} · {pct(frac)}</span>
                    </span>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--s-border)" }} aria-hidden>
                      <span className="block h-full rounded-full" style={{ width: `${frac * 100}%`, background: `var(--s-${TOM_ESTAGIO[e.id] === "neutro" ? "muted" : TOM_ESTAGIO[e.id]})` }} />
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>{e.descricao}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Cartao>
      </div>

      <Cartao
        titulo="Fila de contato"
        chamada={
          <>
            {num(visiveis.length)} de {num(contatos.length)} registros.
            {(qual !== "todos" || estagio !== "todos" || unidade !== "todas") && (
              <> Filtros ativos — {num(resumoFiltrado.alcancaveis)} alcançáveis por telefone neste recorte.</>
            )}
          </>
        }
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              aria-label="Filtrar por escola"
              className="h-9 max-w-[15rem] rounded-lg px-2.5 text-[0.8125rem]"
              style={{ background: "var(--s-elevated)", color: "var(--s-ink)", border: "1px solid var(--s-border-forte)" }}
            >
              <option value="todas">Todas as escolas</option>
              {unidadesDaFila.map((u) => <option key={u.codigo} value={u.codigo}>{u.nome} ({u.n})</option>)}
            </select>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, protocolo ou telefone"
              aria-label="Buscar na fila"
              className="h-9 w-52 rounded-lg px-2.5 text-[0.8125rem]"
              style={{ background: "var(--s-elevated)", color: "var(--s-ink)", border: "1px solid var(--s-border-forte)" }}
            />
            {(qual !== "todos" || estagio !== "todos" || unidade !== "todas" || busca !== "") && (
              <button
                type="button"
                onClick={() => { setQual("todos"); setEstagio("todos"); setUnidade("todas"); setBusca(""); }}
                className="h-9 rounded-lg px-2.5 text-[0.75rem] font-medium"
                style={{ background: "var(--s-surface)", color: "var(--s-muted)", border: "1px solid var(--s-border)" }}
              >
                Limpar
              </button>
            )}
          </div>
        }
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Tabela legenda="Famílias na fila de contato" altura="32rem" larguraMin="54rem">
            <thead>
              <tr>
                <Th align="left" ordenavel direcao={direcaoDe("responsavel")} onOrdenar={() => alterna("responsavel", "asc")}>Responsável</Th>
                <Th align="left" ordenavel direcao={direcaoDe("qualificacao")} onOrdenar={() => alterna("qualificacao", "asc")} dica="Resultado da validação do número">Canal</Th>
                <Th align="left" ordenavel direcao={direcaoDe("unidadeNome")} onOrdenar={() => alterna("unidadeNome", "asc")}>Escola pretendida</Th>
                <Th ordenavel direcao={direcaoDe("pontos")} onOrdenar={() => alterna("pontos")} dica="Régua oficial de 13 critérios, 100 pontos">Pontos</Th>
                <Th ordenavel direcao={direcaoDe("diasNaFila")} onOrdenar={() => alterna("diasNaFila")}>Dias</Th>
                <Th align="left" ordenavel direcao={direcaoDe("estagio")} onOrdenar={() => alterna("estagio", "asc")}>Estágio</Th>
              </tr>
            </thead>
            <tbody>
              {visiveis.slice(0, 300).map((c, i) => (
                <Tr key={c.protocolo} indice={i} ativa={c.protocolo === aberto} onClick={() => setAberto(c.protocolo === aberto ? null : c.protocolo)}>
                  <td className="px-3 py-2 text-left">
                    <span className="block font-medium">{c.responsavel}</span>
                    <span className="text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>{c.crianca} · {c.grupamento} {c.horario}</span>
                  </td>
                  <td className="px-3 py-2 text-left">
                    <Tag tom={TOM_QUAL[c.qualificacao]}>{QUALIFICACOES.find((q) => q.id === c.qualificacao)!.rotulo}</Tag>
                    <span className="tnum mt-0.5 block whitespace-nowrap text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>{c.telefone}</span>
                  </td>
                  <td className="px-3 py-2 text-left">
                    <span className="block max-w-[22ch] truncate" title={c.unidadeNome}>{c.unidadeNome}</span>
                    <span className="text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>{titulo(c.bairro)} · CRE {c.cre ?? "—"}</span>
                  </td>
                  <Td>{c.pontos}</Td>
                  <Td tom={c.diasNaFila > 90 ? "critico" : undefined}>{c.diasNaFila}</Td>
                  <td className="px-3 py-2 text-left"><Tag tom={TOM_ESTAGIO[c.estagio]}>{ESTAGIOS.find((e) => e.id === c.estagio)!.rotulo}</Tag></td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
          {visiveis.length === 0 && (
            <p className="mt-3 rounded-lg px-3 py-4 text-center text-[0.8125rem]" style={{ background: "var(--s-surface)", color: "var(--s-muted)", border: "1px dashed var(--s-border-forte)" }}>
              Nenhuma família com esta combinação de filtros. Limpe um deles para voltar a ver a fila.
            </p>
          )}

          {detalhe ? <FichaContato c={detalhe} onFechar={() => setAberto(null)} /> : (
            <div className="flex flex-col justify-center rounded-xl p-5 text-center" style={{ background: "var(--s-surface)", border: "1px dashed var(--s-border-forte)" }}>
              <p className="text-[0.8125rem] font-medium">Nenhuma família aberta</p>
              <p className="mt-1 text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
                Clique numa linha para ver o canal indicado, a pontuação item a item pela régua
                oficial e a próxima ação de contato.
              </p>
            </div>
          )}
        </div>
        {visiveis.length > 300 && (
          <p className="mt-2 text-[0.75rem]" style={{ color: "var(--s-muted)" }}>
            Mostrando 300 de {num(visiveis.length)}. Use o filtro por escola ou CRE para reduzir.
          </p>
        )}
      </Cartao>
    </div>
  );
}

/** Ficha de uma família: o que o operador precisa antes de discar. */
function FichaContato({ c, onFechar }: { c: Contato; onFechar: () => void }) {
  const q = QUALIFICACOES.find((x) => x.id === c.qualificacao)!;
  const unidade = UNIDADES.find((u) => u.codigo === c.unidade);

  const proximaAcao =
    c.qualificacao === "pendente" ? "Disparar validação do número antes de qualquer convite."
    : c.qualificacao === "valido" ? "Ligar ou enviar WhatsApp. O canal está confirmado."
    : c.qualificacao === "push" ? "Enviar notificação no aparelho — a linha não responde, mas o app está instalado."
    : "Encaminhar para busca ativa domiciliar: nenhum canal digital responde.";

  return (
    <aside className="flex flex-col gap-4 rounded-xl p-4" style={{ background: "var(--s-elevated)", border: "1px solid var(--s-border)", borderTop: `3px solid var(--s-${q.tom === "ok" ? "ok" : q.tom === "aviso" ? "aviso" : q.tom === "critico" ? "critico" : "info"})` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[0.9375rem] font-semibold">{c.responsavel}</h4>
          <p className="text-[0.75rem]" style={{ color: "var(--s-muted)" }}>Protocolo {c.protocolo} · {c.diasNaFila} dias na fila</p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar ficha" className="shrink-0 rounded px-1.5 text-[0.9375rem]" style={{ color: "var(--s-muted)" }}>✕</button>
      </div>

      <div className="rounded-lg p-3" style={{ background: "var(--s-surface)" }}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wide" style={{ color: "var(--s-muted)" }}>Próxima ação</p>
        <div className="mt-1.5 flex items-center gap-2"><Tag tom={TOM_QUAL[c.qualificacao]}>{q.rotulo}</Tag><span className="tnum text-[0.8125rem]">{c.telefone}</span></div>
        <p className="mt-1.5 text-[0.75rem] leading-relaxed">{proximaAcao}</p>
        {c.tentativas > 0 && (
          <p className="mt-1 text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>
            {c.tentativas} tentativa{c.tentativas > 1 ? "s" : ""} já registrada{c.tentativas > 1 ? "s" : ""}.
          </p>
        )}
      </div>

      <dl className="grid gap-2 text-[0.8125rem]">
        {([
          ["Criança", c.crianca],
          ["Grupamento", `${c.grupamento} · ${c.horario}`],
          ["Escola pretendida", c.unidadeNome],
          ["Território", `${titulo(c.bairro)} · CRE ${c.cre ?? "—"} · µ${c.microarea ?? "—"}`],
        ] as const).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="text-[0.6875rem] uppercase tracking-wide" style={{ color: "var(--s-muted)" }}>{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>

      {unidade && (
        <p className="text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
          A escola recebeu <strong>{num(unidade.opcoes_2025)}</strong> pedidos no último processo e
          historicamente atende <strong>{pct(unidade.chance_hist ?? 0)}</strong> de quem a pede
          {unidade.confiavel && (unidade.chance_hist ?? 0) >= 0.5 ? " — é aposta segura." : "."}
        </p>
      )}

      <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wide" style={{ color: "var(--s-muted)" }}>
          Pontuação: {c.pontos} de 100
        </p>
        {c.criterios.length === 0 ? (
          <p className="mt-1.5 text-[0.75rem]" style={{ color: "var(--s-muted)" }}>Nenhum critério da régua marcado.</p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1">
            {c.criterios.map((id) => (
              <li key={id} className="flex items-start justify-between gap-2 text-[0.75rem]">
                <span className="leading-snug" style={{ color: "var(--s-muted)" }}>{textoCriterio(id)}</span>
                <span className="tnum shrink-0 font-semibold">+{pontosCriterio(id)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[0.6875rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>
          Critérios e pesos são a régua oficial da SME. A marcação desta família é fictícia.
        </p>
      </div>
    </aside>
  );
}
