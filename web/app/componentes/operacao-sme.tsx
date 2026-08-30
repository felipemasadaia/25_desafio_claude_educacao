"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { catalogo } from "@/lib/catalogo";
import { normalizaBairro, type Recorte } from "@/lib/territorio";
import { tituloCase } from "@/lib/formato";
import {
  ETAPAS,
  filaDoRecorte,
  resumoOperacao,
  unidadesOperacionais,
  type Etapa,
  type Inscricao,
  type SituacaoContato,
} from "@/lib/operacao";
import { Etiqueta, Leitura, Tabela, Td, Th, ThLinha, Tr, pct, razao } from "./painel-ui";

/** O mapa depende de `window`; carrega só no cliente. */
const MapaVagas = dynamic(() => import("./mapa-vagas").then((m) => m.MapaVagas), {
  ssr: false,
  loading: () => (
    <div
      className="h-[26rem] w-full rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    />
  ),
});

/**
 * Ambiente operacional da SME.
 *
 * Três telas, na ordem em que a decisão acontece: onde tem vaga (mapa),
 * quem está esperando (fila) e como o convite anda (trilha). O painel
 * analítico responde "onde falta"; aqui a pergunta é "quem eu chamo agora".
 *
 * A camada é simulada — o catálogo não traz vaga ofertada, criança nem
 * contato — e o aviso de topo diz isso em todas as abas, não só na primeira.
 */

type Aba = "mapa" | "fila" | "convites";

const ABAS: Array<{ id: Aba; rotulo: string; descricao: string }> = [
  { id: "mapa", rotulo: "Vagas", descricao: "Onde há vaga agora" },
  { id: "fila", rotulo: "Fila", descricao: "Quem está esperando" },
  { id: "convites", rotulo: "Convites", descricao: "Trilha de contato e aceite" },
];

const ROTULO_CONTATO: Record<SituacaoContato, string> = {
  ativo: "WhatsApp ativo",
  inativo: "Número morto",
  nao_verificado: "Não verificado",
};

const TOM_CONTATO: Record<SituacaoContato, "ok" | "critico" | "neutro"> = {
  ativo: "ok",
  inativo: "critico",
  nao_verificado: "neutro",
};

export function OperacaoSme() {
  const [aba, setAba] = useState<Aba>("mapa");
  const [cre, setCre] = useState<Recorte>("todas");
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const cres = useMemo(
    () =>
      [...new Set(catalogo.unidades.map((u) => u.cre).filter((c): c is number => c !== null))].sort(
        (a, b) => a - b,
      ),
    [],
  );

  /** `so_uma_opcao` real por bairro: é o gradiente da taxa de contato ativo. */
  const soUmaOpcao = useMemo(
    () => new Map(catalogo.bairros.map((b) => [normalizaBairro(b.bairro), b.so_uma_opcao])),
    [],
  );

  const unidades = useMemo(() => unidadesOperacionais(cre), [cre]);
  const fila = useMemo(
    () =>
      filaDoRecorte(
        unidades,
        new Map([...soUmaOpcao].map(([k, v]) => [k, v])),
      ),
    [unidades, soUmaOpcao],
  );
  const resumo = useMemo(() => resumoOperacao(fila, unidades), [fila, unidades]);

  const taxaAtivos = razao(resumo.contatos.ativo, fila.length);

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 pb-20 pt-6 xl:px-8">
      <Aviso />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold">Operação de vagas</h1>
          <p className="mt-1.5 max-w-[70ch] text-md" style={{ color: "var(--muted)" }}>
            Da vaga vacante ao aceite da família. O convite só sai depois que o número
            responde — chamar quem não se alcança queima a vaga e o prazo.
          </p>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-label font-medium" style={{ color: "var(--muted)" }}>
            CRE
          </span>
          <select
            value={cre}
            onChange={(e) => setCre(e.target.value === "todas" ? "todas" : Number(e.target.value))}
            className="min-h-[36px] rounded-lg px-3 text-body"
            style={{
              background: "var(--elevated)",
              color: "var(--ink)",
              border: "1px solid var(--border-controle)",
            }}
          >
            <option value="todas">Todas as CREs</option>
            {cres.map((c) => (
              <option key={c} value={c}>
                {c}ª CRE
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Leitura
          rotulo="Vagas vacantes"
          valor={resumo.vagas.toLocaleString("pt-BR")}
          leitura={`Em ${resumo.unidadesComVaga} unidades do recorte`}
        />
        <Leitura
          rotulo="Famílias na fila"
          valor={resumo.fila.toLocaleString("pt-BR")}
          leitura="Pedidos que historicamente não são atendidos"
        />
        <Leitura
          rotulo="Números ativos"
          valor={pct(taxaAtivos)}
          leitura={`${resumo.contatos.ativo} de ${fila.length} responderam ao ping de verificação`}
          tom={taxaAtivos < 0.7 ? "alerta" : "neutro"}
        />
        <Leitura
          rotulo="Aceites confirmados"
          valor={resumo.porEtapa.aceito.toLocaleString("pt-BR")}
          leitura={`${pct(razao(resumo.porEtapa.aceito, Math.max(1, resumo.vagas)))} das vagas preenchidas`}
        />
      </section>

      <nav aria-label="Telas da operação" className="mt-6 flex gap-1 overflow-x-auto">
        {ABAS.map((a) => {
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              aria-current={ativa ? "page" : undefined}
              onClick={() => setAba(a.id)}
              className="min-h-[44px] shrink-0 rounded-lg px-4 py-2 text-left transition-colors"
              style={{
                background: ativa ? "var(--surface)" : "transparent",
                borderBottom: `2px solid ${ativa ? "var(--brand)" : "transparent"}`,
              }}
            >
              <span
                className="block text-sm font-semibold"
                style={{ color: ativa ? "var(--ink)" : "var(--muted)" }}
              >
                {a.rotulo}
              </span>
              <span className="block text-micro" style={{ color: "var(--muted)" }}>
                {a.descricao}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-5">
        {aba === "mapa" && (
          <TelaVagas
            unidades={unidades}
            selecionada={selecionada}
            onSelecionar={setSelecionada}
          />
        )}
        {aba === "fila" && <TelaFila fila={fila} />}
        {aba === "convites" && <TelaConvites fila={fila} resumo={resumo} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- aviso ---- */

function Aviso() {
  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{
        background: "var(--chance-baixa-suave)",
        border: "1px solid var(--chance-baixa)",
      }}
    >
      <p className="text-label font-semibold" style={{ color: "var(--chance-baixa)" }}>
        Ambiente de demonstração · registros individuais simulados
      </p>
      <p className="mt-1 max-w-[86ch] text-label leading-relaxed" style={{ color: "var(--muted)" }}>
        As bases da SME são <strong>agregadas e anonimizadas</strong>: não trazem vaga
        ofertada por unidade, criança identificada nem telefone. Nome, protocolo, contato e
        etapa do convite nesta tela são <strong>fictícios</strong>. O que é real: unidade,
        endereço, CRE, microárea, procura por grupamento e chance histórica — e as vagas e
        filas são derivadas desses números. Serve para desenhar o fluxo e definir o que a
        SME precisaria passar a coletar, não para decidir chamada nominal.
      </p>
    </div>
  );
}

/* ----------------------------------------------------------- tela: vagas --- */

function TelaVagas({
  unidades,
  selecionada,
  onSelecionar,
}: {
  unidades: ReturnType<typeof unidadesOperacionais>;
  selecionada: string | null;
  onSelecionar: (codigo: string) => void;
}) {
  const comVaga = unidades.filter((u) => u.vagas > 0);
  const detalhe = comVaga.find((u) => u.codigo === selecionada) ?? comVaga[0];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div>
        <MapaVagas unidades={unidades} selecionada={detalhe?.codigo ?? null} onSelecionar={onSelecionar} />
      </div>

      <div>
        <h2 className="text-h2 font-semibold">Unidades com vaga</h2>
        <p className="mt-1 text-body" style={{ color: "var(--muted)" }}>
          Clique na linha ou no mapa para ver o detalhe por grupamento.
        </p>

        <div className="mt-3">
          <Tabela legenda="Unidades com vaga vacante" larguraMin="26rem" altura="18rem">
            <thead>
              <tr>
                <Th align="left" larguraMin="14rem">
                  Unidade
                </Th>
                <Th>Vagas</Th>
                <Th>Fila</Th>
              </tr>
            </thead>
            <tbody>
              {comVaga.slice(0, 40).map((u, i) => (
                <Tr key={u.codigo} indice={i}>
                  <td className="px-2.5 py-1.5 text-left">
                    <button
                      type="button"
                      onClick={() => onSelecionar(u.codigo)}
                      className="text-left text-sm font-medium"
                      style={{
                        color: detalhe?.codigo === u.codigo ? "var(--brand)" : "var(--ink)",
                      }}
                    >
                      {tituloCase(u.nome)}
                    </button>
                    <span className="block text-micro" style={{ color: "var(--muted)" }}>
                      {tituloCase(u.bairro)}
                      {u.cre ? ` · ${u.cre}ª CRE` : ""}
                    </span>
                  </td>
                  <Td>{u.vagas}</Td>
                  <Td destaque={u.fila < 30}>{u.fila.toLocaleString("pt-BR")}</Td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
        </div>

        {detalhe && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold">{tituloCase(detalhe.nome)}</h3>
            <p className="mt-0.5 text-label" style={{ color: "var(--muted)" }}>
              {tituloCase(detalhe.bairro)}
              {detalhe.cre ? ` · ${detalhe.cre}ª CRE` : ""}
              {detalhe.microarea ? ` · microárea ${detalhe.microarea}` : ""}
            </p>

            <ul className="mt-3 flex flex-col gap-1.5">
              {detalhe.porRecorte.map((r) => (
                <li
                  key={`${r.grupamento}|${r.horario}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: "var(--elevated)" }}
                >
                  <span className="text-sm">
                    {r.grupamento}
                    <span style={{ color: "var(--muted)" }}> · {r.horario}</span>
                  </span>
                  <span className="tnum text-sm font-semibold">{r.vagas} vagas</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-label" style={{ color: "var(--muted)" }}>
              {detalhe.fila < 30 ? (
                <>
                  Fila de {detalhe.fila} famílias para {detalhe.vagas} vagas.{" "}
                  <strong style={{ color: "var(--chance-baixa)" }}>
                    Vaga sem fila é sintoma de acesso
                  </strong>{" "}
                  — antes de tratar como excesso de oferta, checar se a família consegue
                  chegar até aqui.
                </>
              ) : (
                <>
                  Fila de {detalhe.fila.toLocaleString("pt-BR")} famílias para {detalhe.vagas}{" "}
                  vagas. Procura real em {catalogo.ano_alvo}:{" "}
                  {detalhe.procura.toLocaleString("pt-BR")} pedidos.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ tela: fila --- */

function TelaFila({ fila }: { fila: Inscricao[] }) {
  const [busca, setBusca] = useState("");
  const [soAtivos, setSoAtivos] = useState(false);

  const filtrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return fila
      .filter((i) => !soAtivos || i.contato === "ativo")
      .filter(
        (i) =>
          !termo ||
          i.nome.toLowerCase().includes(termo) ||
          i.protocolo.includes(termo) ||
          i.unidadeNome.toLowerCase().includes(termo) ||
          i.bairro.toLowerCase().includes(termo),
      )
      // Mais pontos primeiro, e desempate por espera: é a régua vigente.
      .sort((a, b) => b.pontos - a.pontos || b.diasNaFila - a.diasNaFila);
  }, [fila, busca, soAtivos]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h2 font-semibold">Fila de espera</h2>
          <p className="mt-1 max-w-[70ch] text-body" style={{ color: "var(--muted)" }}>
            Ordenada por pontuação da régua vigente, com desempate por tempo de espera. É
            desta lista que sai o convite.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="sr-only">Buscar na fila</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, protocolo, unidade…"
              className="min-h-[36px] w-56 rounded-lg px-3 text-body"
              style={{
                background: "var(--elevated)",
                color: "var(--ink)",
                border: "1px solid var(--border-controle)",
              }}
            />
          </label>
          <button
            type="button"
            aria-pressed={soAtivos}
            onClick={() => setSoAtivos((v) => !v)}
            className="min-h-[36px] rounded-lg px-3 text-sm font-medium"
            style={{
              background: soAtivos ? "var(--brand)" : "var(--surface)",
              color: soAtivos ? "var(--brand-ink)" : "var(--muted)",
              border: `1px solid ${soAtivos ? "var(--brand)" : "var(--border-controle)"}`,
            }}
          >
            Só contato ativo
          </button>
        </div>
      </div>

      <p className="mt-3 text-label" style={{ color: "var(--muted)" }}>
        {filtrada.length.toLocaleString("pt-BR")} de {fila.length.toLocaleString("pt-BR")}{" "}
        registros na amostra.
      </p>

      <div className="mt-3">
        <Tabela legenda="Famílias na fila de espera" larguraMin="62rem" altura="32rem">
          <thead>
            <tr>
              <Th align="left" larguraMin="12rem">
                Família
              </Th>
              <Th align="left">Protocolo</Th>
              <Th align="left">Contato</Th>
              <Th align="left" larguraMin="14rem">
                Unidade pretendida
              </Th>
              <Th align="left">Grupamento</Th>
              <Th dica="Pontuação pela régua vigente">Pontos</Th>
              <Th>Dias na fila</Th>
            </tr>
          </thead>
          <tbody>
            {filtrada.slice(0, 120).map((i, idx) => (
              <Tr key={i.protocolo} indice={idx}>
                <ThLinha>{i.nome}</ThLinha>
                <Td align="left" atenuado>
                  {i.protocolo}
                </Td>
                <td className="px-2.5 py-1.5 text-left">
                  <span className="flex flex-col gap-0.5">
                    <Etiqueta tom={TOM_CONTATO[i.contato]}>{ROTULO_CONTATO[i.contato]}</Etiqueta>
                    <span className="tnum text-micro" style={{ color: "var(--muted)" }}>
                      {i.telefone}
                    </span>
                  </span>
                </td>
                <Td align="left">{tituloCase(i.unidadeNome)}</Td>
                <Td align="left" atenuado>
                  {i.grupamento} · {i.horario}
                </Td>
                <Td>{i.pontos}</Td>
                <Td destaque={i.diasNaFila > 90}>{i.diasNaFila}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- tela: convites --- */

function TelaConvites({
  fila,
  resumo,
}: {
  fila: Inscricao[];
  resumo: ReturnType<typeof resumoOperacao>;
}) {
  const [etapa, setEtapa] = useState<Etapa | "todas">("todas");

  const travados = fila.filter((i) => i.contato !== "ativo").length;
  const taxaAtivos = razao(resumo.contatos.ativo, fila.length);

  const listada = useMemo(
    () =>
      fila
        .filter((i) => etapa === "todas" || i.etapa === etapa)
        .sort((a, b) => b.pontos - a.pontos || b.diasNaFila - a.diasNaFila),
    [fila, etapa],
  );

  return (
    <div>
      <h2 className="text-h2 font-semibold">Trilha de convites</h2>
      <p className="mt-1 max-w-[78ch] text-body" style={{ color: "var(--muted)" }}>
        A verificação de contato vem <strong style={{ color: "var(--ink)" }}>antes</strong> do
        convite de propósito. Um convite disparado para número morto não volta como erro: ele
        ocupa a vaga até o prazo vencer, e só então ela volta ao pool — tarde demais para ser
        reofertada no mesmo ciclo.
      </p>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Leitura
          rotulo="Números ativos"
          valor={pct(taxaAtivos)}
          leitura={`${resumo.contatos.ativo} de ${fila.length} responderam ao ping de WhatsApp`}
          tom={taxaAtivos < 0.7 ? "alerta" : "neutro"}
        />
        <Leitura
          rotulo="Travados na verificação"
          valor={travados.toLocaleString("pt-BR")}
          leitura={`${resumo.contatos.inativo} números mortos e ${resumo.contatos.nao_verificado} por verificar`}
          tom="critico"
        />
        <Leitura
          rotulo="Convite → aceite"
          valor={pct(
            razao(resumo.porEtapa.aceito, resumo.porEtapa.aceito + resumo.porEtapa.perdido),
          )}
          leitura={`${resumo.porEtapa.aceito} aceites e ${resumo.porEtapa.perdido} sem resposta`}
        />
      </section>

      <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ETAPAS.map((e) => {
          const n = resumo.porEtapa[e.id];
          const ativa = etapa === e.id;
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={ativa}
              onClick={() => setEtapa(ativa ? "todas" : e.id)}
              className="rounded-xl p-3.5 text-left transition-colors"
              // Propriedades separadas, nunca `border` + `borderLeft`: o React
              // avisa que misturar shorthand e longhand no mesmo valor produz
              // estilo instável entre renders.
              style={{
                background: "var(--surface)",
                borderStyle: "solid",
                borderWidth: "1px 1px 1px 3px",
                borderTopColor: ativa ? "var(--brand)" : "var(--border)",
                borderRightColor: ativa ? "var(--brand)" : "var(--border)",
                borderBottomColor: ativa ? "var(--brand)" : "var(--border)",
                borderLeftColor:
                  e.id === "aceito"
                    ? "var(--chance-alta)"
                    : e.id === "perdido"
                      ? "var(--chance-minima)"
                      : e.id === "elegivel"
                        ? "var(--chance-baixa)"
                        : "var(--accent)",
              }}
            >
              <p className="text-label font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {e.rotulo}
              </p>
              <p className="tnum mt-1 text-h2 font-semibold">{n.toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-micro leading-snug" style={{ color: "var(--muted)" }}>
                {e.descricao}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-label" style={{ color: "var(--muted)" }}>
        {etapa === "todas"
          ? "Clique numa etapa para filtrar a lista."
          : `Filtrando por “${ETAPAS.find((e) => e.id === etapa)?.rotulo}”. Clique de novo para limpar.`}
      </p>

      <div className="mt-3">
        <Tabela legenda="Famílias por etapa da trilha de convite" larguraMin="58rem" altura="26rem">
          <thead>
            <tr>
              <Th align="left" larguraMin="12rem">
                Família
              </Th>
              <Th align="left">Contato</Th>
              <Th align="left">Etapa</Th>
              <Th align="left" larguraMin="14rem">
                Unidade
              </Th>
              <Th>Pontos</Th>
              <Th>Dias na fila</Th>
            </tr>
          </thead>
          <tbody>
            {listada.slice(0, 120).map((i, idx) => (
              <Tr key={i.protocolo} indice={idx}>
                <ThLinha>{i.nome}</ThLinha>
                <td className="px-2.5 py-1.5 text-left">
                  <span className="flex flex-col gap-0.5">
                    <Etiqueta tom={TOM_CONTATO[i.contato]}>{ROTULO_CONTATO[i.contato]}</Etiqueta>
                    <span className="tnum text-micro" style={{ color: "var(--muted)" }}>
                      {i.telefone}
                    </span>
                  </span>
                </td>
                <td className="px-2.5 py-1.5 text-left">
                  <Etiqueta
                    tom={
                      i.etapa === "aceito"
                        ? "ok"
                        : i.etapa === "perdido"
                          ? "critico"
                          : i.etapa === "elegivel"
                            ? "alerta"
                            : "neutro"
                    }
                  >
                    {ETAPAS.find((e) => e.id === i.etapa)?.rotulo}
                  </Etiqueta>
                </td>
                <Td align="left">{tituloCase(i.unidadeNome)}</Td>
                <Td>{i.pontos}</Td>
                <Td destaque={i.diasNaFila > 90}>{i.diasNaFila}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      </div>
    </div>
  );
}
