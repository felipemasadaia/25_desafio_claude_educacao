"use client";

import { useMemo, useState } from "react";
import { eSegura, hash, num, pct, titulo, UNIDADES } from "@/lib/secretaria/dados";
import {
  bairrosSemOferta, descompasso, porGrupamento, pressaoPorCre,
  type Descompasso, type Recorte,
} from "@/lib/secretaria/fases";
import { Barra, Cartao, Indicador, Ressalva, Tabela, Tag, Td, Th, Tr, ordenaPor, useOrdenacao } from "./ui";

/**
 * Fase 2 — Demanda das famílias contra a oferta da rede.
 *
 * O recorte é a MICROÁREA, não o bairro: é a unidade administrativa que de
 * fato aloca vaga, e é menor que o bairro — um bairro pode fechar equilibrado
 * escondendo uma microárea sem nenhuma vaga.
 *
 * Duas leituras que não se substituem:
 *   - PRESSÃO (procura por vaga) diz onde a fila aperta.
 *   - SEM APOSTA SEGURA é categoria própria, nunca um número grande. Sem
 *     nenhuma unidade que costume atender quem a pede, a razão não existe;
 *     forjar um denominador esconderia a diferença entre "disputado" e
 *     "não tem onde apostar".
 */

type Coluna = "microarea" | "procura" | "vagas" | "saldo" | "pressao" | "seguras";

type OpcaoInscricao = {
  codigo: string;
  nome: string;
  bairro: string;
  posicao: number;
  motivo: string;
  segura: boolean;
};

type InscricaoExemplo = {
  protocolo: string;
  bairro: string;
  cre: number | null;
  grupamento: string;
  opcoes: OpcaoInscricao[];
};

const MOTIVOS = [
  "É a unidade mais próxima da rotina informada pela família.",
  "Oferece horário integral e cabe no trajeto de trabalho.",
  "Foi indicada como preferência por vínculo com a comunidade.",
  "Tem histórico de atendimento mais favorável neste perfil.",
  "Amplia a chance sem sair do território prioritário.",
] as const;

/**
 * Amostra determinística para demonstrar a leitura das cinco escolhas.
 * A base publicada preserva cada opção, mas o catálogo local está agregado;
 * por isso protocolo, ordenação e motivo aparecem explicitamente como demo.
 */
function inscricoesExemplo(cre: Recorte["cre"]): InscricaoExemplo[] {
  const base = UNIDADES.filter((u) => u.nome && (cre === "todas" || u.cre === cre));
  const ancoras = [...base].sort((a, b) => b.opcoes_2025 - a.opcoes_2025).slice(0, 7);

  return ancoras.map((ancora, indice) => {
    const proximas = base
      .filter((u) => u.codigo !== ancora.codigo)
      .sort((a, b) => {
        const afinidadeA = Number(a.microarea === ancora.microarea) * 3 + Number(a.bairro === ancora.bairro) * 2 + Number(a.cre === ancora.cre);
        const afinidadeB = Number(b.microarea === ancora.microarea) * 3 + Number(b.bairro === ancora.bairro) * 2 + Number(b.cre === ancora.cre);
        return afinidadeB - afinidadeA || hash(`${ancora.codigo}|${a.codigo}`) - hash(`${ancora.codigo}|${b.codigo}`);
      });
    const escolhidas = [ancora, ...proximas].slice(0, 5);
    const alternativaSegura = base.find(
      (u) => u.cre === ancora.cre && eSegura(u) && !escolhidas.some((x) => x.codigo === u.codigo),
    );
    if (alternativaSegura) escolhidas[4] = alternativaSegura;

    return {
      protocolo: `2026-${String(hash(`inscricao|${ancora.codigo}`) % 100000).padStart(5, "0")}`,
      bairro: titulo(ancora.bairro),
      cre: ancora.cre,
      grupamento: indice % 3 === 0 ? "Berçário" : indice % 3 === 1 ? "Maternal I" : "Maternal II",
      opcoes: escolhidas.map((u, posicao) => ({
        codigo: u.codigo,
        nome: titulo(u.nome),
        bairro: titulo(u.bairro),
        posicao: posicao + 1,
        motivo: MOTIVOS[posicao],
        segura: eSegura(u),
      })),
    };
  });
}

export function FaseDemanda({ recorte }: { recorte: Recorte }) {
  const [soDeficit, setSoDeficit] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [inscricaoAberta, setInscricaoAberta] = useState<string | null>(null);
  const { ordem, alterna, direcaoDe } = useOrdenacao<Coluna>({ coluna: "pressao", direcao: "desc" });

  const areas = useMemo(() => descompasso(recorte), [recorte]);
  const cortes = useMemo(() => porGrupamento(recorte), [recorte]);
  const cres = useMemo(() => pressaoPorCre(), []);
  const semOferta = useMemo(() => bairrosSemOferta(), []);
  const inscricoes = useMemo(() => inscricoesExemplo(recorte.cre), [recorte.cre]);
  const inscricao = inscricoes.find((item) => item.protocolo === inscricaoAberta) ?? inscricoes[0] ?? null;

  const totalProcura = areas.reduce((s, a) => s + a.procura, 0);
  const totalVagas = areas.reduce((s, a) => s + a.vagas, 0);
  const deficitarias = areas.filter((a) => a.saldo < 0);
  const semAposta = areas.filter((a) => a.semAposta);
  const procuraEmDeficit = deficitarias.reduce((s, a) => s + a.procura, 0);

  const visiveis = useMemo(() => {
    const base = soDeficit ? deficitarias : areas;
    const extrai = (a: Descompasso): string | number =>
      ordem.coluna === "microarea" ? a.microarea : a[ordem.coluna];
    return ordenaPor(base, extrai, ordem.direcao);
  }, [areas, deficitarias, soDeficit, ordem]);

  const detalhe = areas.find((a) => a.microarea === selecionada) ?? null;
  const maxProcura = Math.max(1, ...cortes.map((c) => c.procura));

  return (
    <div className="entra flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Descompasso da rede"
          valor={(totalVagas > 0 ? totalProcura / totalVagas : 0).toFixed(2).replace(".", ",")}
          unidade="pedidos por vaga"
          leitura={<>{num(totalProcura)} pedidos disputando {num(totalVagas)} vagas. Pedido é fila, não criança: a mesma criança aparece em até 5 filas.</>}
          tom="info"
        />
        <Indicador
          rotulo="Microáreas em déficit"
          valor={num(deficitarias.length)}
          unidade={`de ${num(areas.length)}`}
          leitura={<>Concentram {pct(procuraEmDeficit / Math.max(1, totalProcura))} de toda a procura do recorte.</>}
          tom="critico"
        />
        <Indicador
          rotulo="Sem aposta segura"
          valor={num(semAposta.length)}
          unidade="microáreas"
          leitura={<>Nenhuma unidade que costume atender quem a pede. A família pode se inscrever e não ter onde apostar.</>}
          tom={semAposta.length > 0 ? "critico" : "ok"}
        />
        <Indicador
          rotulo="Bairros sem nenhuma oferta"
          valor={num(semOferta.length)}
          leitura={<>{num(semOferta.reduce((s, b) => s + b.inscricoes, 0))} inscrições em bairros sem uma única unidade no catálogo.</>}
          tom="critico"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Cartao
          titulo="Onde a demanda não encontra oferta"
          chamada={<>Por microárea — o recorte que de fato aloca vaga. Clique numa linha para abrir o detalhe.</>}
          acao={
            <label className="flex items-center gap-2 text-[0.8125rem]" style={{ color: "var(--s-muted)" }}>
              <input type="checkbox" checked={soDeficit} onChange={(e) => setSoDeficit(e.target.checked)} className="h-4 w-4" style={{ accentColor: "var(--s-brand)" }} />
              Só as em déficit
            </label>
          }
        >
          <Tabela legenda="Descompasso entre procura e oferta por microárea" altura="30rem" larguraMin="48rem">
            <thead>
              <tr>
                <Th align="left" ordenavel direcao={direcaoDe("microarea")} onOrdenar={() => alterna("microarea", "asc")}>Microárea</Th>
                <Th align="left">Bairros</Th>
                <Th ordenavel direcao={direcaoDe("procura")} onOrdenar={() => alterna("procura")} dica="Pedidos recebidos (real)">Procura</Th>
                <Th ordenavel direcao={direcaoDe("vagas")} onOrdenar={() => alterna("vagas")}>Vagas</Th>
                <Th ordenavel direcao={direcaoDe("saldo")} onOrdenar={() => alterna("saldo", "asc")}>Saldo</Th>
                <Th ordenavel direcao={direcaoDe("pressao")} onOrdenar={() => alterna("pressao")} dica="Procura dividida por vaga">Pressão</Th>
                <Th ordenavel direcao={direcaoDe("seguras")} onOrdenar={() => alterna("seguras", "asc")} dica="Unidades com chance histórica >= 50%">Apostas</Th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((a, i) => (
                <Tr key={a.microarea} indice={i} ativa={a.microarea === selecionada} onClick={() => setSelecionada(a.microarea === selecionada ? null : a.microarea)}>
                  <td className="px-3 py-2 text-left">
                    <span className="font-medium">µ{a.microarea}</span>
                    <span className="ml-1.5 text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>CRE {a.cre ?? "—"} · {a.unidades} un.</span>
                  </td>
                  <Td align="left"><span className="block max-w-[18ch] truncate" title={a.bairros.map(titulo).join(", ")}>{a.bairros.map(titulo).join(", ") || "—"}</span></Td>
                  <Td>{num(a.procura)}</Td>
                  <Td>{num(a.vagas)}</Td>
                  <Td tom={a.saldo < 0 ? "critico" : "ok"}>{a.saldo > 0 ? "+" : ""}{num(a.saldo)}</Td>
                  <Td tom={a.pressao > 2 ? "critico" : a.pressao > 1 ? "aviso" : "ok"}>
                    {Number.isFinite(a.pressao) ? `${a.pressao.toFixed(1).replace(".", ",")}×` : "sem vaga"}
                  </Td>
                  <td className="px-3 py-2 text-right">
                    {a.semAposta ? <Tag tom="critico">nenhuma</Tag> : <span className="tnum">{a.seguras}</span>}
                  </td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
        </Cartao>

        <div className="flex flex-col gap-4">
          {detalhe ? (
            <Cartao titulo={`Microárea ${detalhe.microarea}`} chamada={`CRE ${detalhe.cre ?? "—"} · ${detalhe.bairros.map(titulo).join(", ") || "sem bairro"}`}>
              <dl className="grid grid-cols-2 gap-3 text-[0.8125rem]">
                {([
                  ["Procura", num(detalhe.procura)],
                  ["Vagas", num(detalhe.vagas)],
                  ["Saldo", `${detalhe.saldo > 0 ? "+" : ""}${num(detalhe.saldo)}`],
                  ["Unidades", num(detalhe.unidades)],
                ] as const).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.6875rem] uppercase tracking-wide" style={{ color: "var(--s-muted)" }}>{k}</dt>
                    <dd className="tnum mt-0.5 text-[1.0625rem] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                {detalhe.semAposta ? (
                  <Ressalva tom="critico">
                    <strong>Nenhuma aposta segura.</strong> Nenhuma das {detalhe.unidades} unidades
                    desta microárea tem histórico de atender quem a pede com amostra confiável. Uma
                    família daqui se inscreve sem ter onde apostar — é o caso que exige unidade nova
                    ou ampliação, não realocação.
                  </Ressalva>
                ) : (
                  <Ressalva tom={detalhe.saldo < 0 ? "aviso" : "ok"}>
                    {detalhe.seguras} de {detalhe.unidades} unidades são aposta segura.{" "}
                    {detalhe.saldo < 0
                      ? `Ainda assim faltam ${num(-detalhe.saldo)} vagas para o que se pede aqui.`
                      : `A oferta cobre a procura registrada, com folga de ${num(detalhe.saldo)}.`}
                  </Ressalva>
                )}
              </div>
            </Cartao>
          ) : (
            <Cartao titulo="Pressão por CRE" chamada="A rede inteira, independente do recorte — para situar a CRE selecionada contra as outras.">
              <ul className="flex flex-col gap-2">
                {cres.map((c) => (
                  <li key={c.cre} className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 text-[0.75rem]">
                    <span className="font-medium" style={{ color: recorte.cre === c.cre ? "var(--s-brand)" : "var(--s-muted)" }}>CRE {c.cre}</span>
                    <Barra fracao={c.pressao / Math.max(...cres.map((x) => (Number.isFinite(x.pressao) ? x.pressao : 0)))} tom={c.pressao > 2 ? "critico" : c.pressao > 1 ? "aviso" : "ok"} rotulo={`CRE ${c.cre}: ${c.pressao.toFixed(1)} pedidos por vaga`} />
                    <span className="tnum text-right font-medium">{c.pressao.toFixed(1).replace(".", ",")}×</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.75rem]" style={{ color: "var(--s-muted)" }}>Selecione uma microárea na tabela para ver o detalhe dela aqui.</p>
            </Cartao>
          )}

          <Cartao titulo="Demanda por grupamento e horário" chamada="Uma CRE pode fechar com saldo positivo e ainda assim não ter uma vaga de Berçário Integral — que é onde a fila aperta.">
            <ul className="flex flex-col gap-2.5">
              {cortes.map((c) => (
                <li key={`${c.grupamento}|${c.horario}`}>
                  <div className="flex items-baseline justify-between gap-2 text-[0.75rem]">
                    <span className="font-medium">{c.grupamento} · {c.horario}</span>
                    <span className="tnum" style={{ color: c.pressao > 1.5 ? "var(--s-critico)" : "var(--s-muted)" }}>
                      {Number.isFinite(c.pressao) ? `${c.pressao.toFixed(1).replace(".", ",")}× ` : "sem vaga "}
                      <span style={{ color: "var(--s-muted)" }}>· {num(c.procura)} pedidos</span>
                    </span>
                  </div>
                  <div className="mt-1"><Barra fracao={c.procura / maxProcura} tom={c.pressao > 1.5 ? "critico" : c.pressao > 1 ? "aviso" : "ok"} rotulo={`${c.grupamento} ${c.horario}: ${num(c.procura)} pedidos, ${num(c.vagas)} vagas`} /></div>
                </li>
              ))}
            </ul>
          </Cartao>

          {semOferta.length > 0 && (
            <Cartao titulo="Bairros sem nenhuma unidade" chamada="Demanda registrada, oferta zero. Não é recorte da CRE — some-los da tela esconderia o caso mais grave.">
              <ul className="flex flex-col gap-1.5 text-[0.8125rem]">
                {semOferta.slice(0, 8).map((b) => (
                  <li key={b.bairro} className="flex items-center justify-between gap-2">
                    <span className="truncate">{titulo(b.bairro)}</span>
                    <span className="tnum shrink-0" style={{ color: "var(--s-critico)" }}>{num(b.inscricoes)} inscrições</span>
                  </li>
                ))}
              </ul>
              {semOferta.length > 8 && (
                <p className="mt-2 text-[0.75rem]" style={{ color: "var(--s-muted)" }}>
                  E mais {semOferta.length - 8} bairros, somando {num(semOferta.slice(8).reduce((s, b) => s + b.inscricoes, 0))} inscrições.
                </p>
              )}
            </Cartao>
          )}
        </div>
      </div>

      <Cartao
        titulo="Como as famílias montaram as cinco opções"
        chamada="A leitura individual explica a ordem das escolhas e revela se a família diversificou as chances ou concentrou tudo em unidades muito disputadas. Protocolos e motivos abaixo são simulados para a demonstração; unidades e sinais históricos vêm da base."
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--s-border)" }}>
            <div className="px-3 py-2 text-[0.75rem] font-medium" style={{ background: "var(--s-surface)", color: "var(--s-muted)", borderBottom: "1px solid var(--s-border)" }}>
              Inscrições recentes · demonstração
            </div>
            <ul>
              {inscricoes.map((item) => {
                const ativa = item.protocolo === inscricao?.protocolo;
                return (
                  <li key={item.protocolo} style={{ borderTop: "1px solid var(--s-border)" }}>
                    <button
                      type="button"
                      onClick={() => setInscricaoAberta(item.protocolo)}
                      aria-pressed={ativa}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors"
                      style={{ background: ativa ? "var(--s-brand-fraco)" : "var(--s-elevated)" }}
                    >
                      <span>
                        <span className="tnum block text-[0.8125rem] font-semibold">{item.protocolo}</span>
                        <span className="block text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>{item.bairro} · CRE {item.cre ?? "—"}</span>
                      </span>
                      <span className="text-[0.6875rem]" style={{ color: "var(--s-muted)" }}>5 opções</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {inscricao && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-[0.9375rem] font-semibold">Inscrição {inscricao.protocolo}</h4>
                  <p className="text-[0.75rem]" style={{ color: "var(--s-muted)" }}>{inscricao.grupamento} · {inscricao.bairro} · CRE {inscricao.cre ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Tag tom={inscricao.opcoes.some((opcao) => opcao.segura) ? "ok" : "critico"}>
                    {inscricao.opcoes.filter((opcao) => opcao.segura).length} de 5 com chance favorável
                  </Tag>
                  <Tag tom="info">dados pessoais ocultos</Tag>
                </div>
              </div>
              <ol className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--s-border)" }}>
                {inscricao.opcoes.map((opcao) => (
                  <li key={opcao.codigo} className="grid gap-2 px-3 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start" style={{ borderTop: opcao.posicao > 1 ? "1px solid var(--s-border)" : undefined }}>
                    <span className="tnum flex h-7 w-7 items-center justify-center rounded-full text-[0.75rem] font-semibold" style={{ background: opcao.posicao === 1 ? "var(--s-brand)" : "var(--s-surface)", color: opcao.posicao === 1 ? "var(--s-brand-ink)" : "var(--s-muted)", border: opcao.posicao === 1 ? "none" : "1px solid var(--s-border)" }}>{opcao.posicao}</span>
                    <span>
                      <span className="block text-[0.8125rem] font-semibold">{opcao.nome}</span>
                      <span className="mt-0.5 block text-[0.75rem] leading-relaxed" style={{ color: "var(--s-muted)" }}>{opcao.motivo}</span>
                    </span>
                    <Tag tom={opcao.segura ? "ok" : "aviso"}>{opcao.segura ? "chance favorável" : "disputada"}</Tag>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </Cartao>
    </div>
  );
}
