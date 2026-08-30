"use client";

import { useMemo, useState } from "react";
import { catalogo, semCoordenada, unidadesComGeo } from "@/lib/catalogo";
import { calculaCobertura } from "@/lib/cobertura";
import { tituloCase } from "@/lib/formato";
import { LIMIAR_ANCORA } from "@/lib/recomendador/motor";

/**
 * Painel da SME.
 *
 * Lê os mesmos agregados do catálogo pelo outro lado: onde está o
 * descasamento entre oferta e demanda, quais unidades têm vacância crônica,
 * e onde faltam apostas seguras ao alcance das famílias.
 */
export function PainelSme() {
  const [cre, setCre] = useState<number | "todas">("todas");

  const cres = useMemo(
    () =>
      [...new Set(catalogo.unidades.map((u) => u.cre).filter((c): c is number => c !== null))].sort(
        (a, b) => a - b,
      ),
    [],
  );

  const unidades = useMemo(
    () => (cre === "todas" ? unidadesComGeo : unidadesComGeo.filter((u) => u.cre === cre)),
    [cre],
  );

  const ancoras = unidades.filter((u) => u.confiavel && (u.chance_hist ?? 0) >= LIMIAR_ANCORA);

  /**
   * Vacância crônica: histórico de folga, mas pouca gente pede.
   * Fila baixa numa unidade pode ser "sobra vaga" ou "ninguém consegue
   * chegar" — por isso a lista mostra as duas colunas juntas.
   */
  const vacancia = useMemo(
    () =>
      [...unidades]
        .filter((u) => u.confiavel && (u.chance_hist ?? 0) >= 0.7 && u.opcoes_2025 < 40)
        .sort((a, b) => a.opcoes_2025 - b.opcoes_2025)
        .slice(0, 12),
    [unidades],
  );

  /** Bairros com pior combinação de escolha ruim e sucesso baixo. */
  const bairrosCriticos = useMemo(
    () =>
      [...catalogo.bairros]
        .filter((b) => b.inscricoes >= 200)
        .sort((a, b) => b.so_uma_opcao - a.so_uma_opcao)
        .slice(0, 12),
    [],
  );

  /**
   * Quanto do território não tem aposta segura ao alcance. Calculado nos
   * dois modais porque a diferença é a própria política: quem depende do pé
   * enfrenta um mapa muito menor.
   */
  const [aPe, setAPe] = useState(true);
  const cobertura = useMemo(() => calculaCobertura(aPe), [aPe]);

  const serie = catalogo.serie_anual;
  const ultimo = serie[serie.length - 1];
  const primeiro = serie[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-semibold">Planejamento da rede</h1>
          <p className="mt-1.5 max-w-[65ch] text-[0.9375rem]" style={{ color: "var(--muted)" }}>
            A fila registra escolhas, não necessidade. Uma unidade com fila zero pode
            significar que sobra vaga — ou que ninguém consegue chegar até ela.
          </p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[0.75rem] font-medium" style={{ color: "var(--muted)" }}>
            CRE
          </span>
          <select
            value={cre}
            onChange={(e) => setCre(e.target.value === "todas" ? "todas" : Number(e.target.value))}
            className="min-h-[36px] rounded-lg px-3 text-[0.875rem]"
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

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Unidades no recorte"
          valor={unidades.length.toString()}
          nota={`${semCoordenada} sem coordenada no catálogo`}
        />
        <Indicador
          rotulo="Apostas seguras disponíveis"
          valor={ancoras.length.toString()}
          nota={`Chance histórica ≥ ${Math.round(LIMIAR_ANCORA * 100)}% e amostra confiável`}
          destaque={ancoras.length / Math.max(1, unidades.length) < 0.2}
        />
        <Indicador
          rotulo="Preenchem uma só opção"
          valor={`${Math.round(ultimo.so_uma_opcao * 100)}%`}
          nota={`Era ${Math.round(primeiro.so_uma_opcao * 100)}% em ${primeiro.ano}`}
          destaque
        />
        <Indicador
          rotulo="Média de opções"
          valor={ultimo.media_opcoes.toFixed(2)}
          nota={`Era ${primeiro.media_opcoes.toFixed(2)} em ${primeiro.ano}`}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-[1.375rem] font-semibold">Como o comportamento evoluiu</h2>
        <p className="mt-1 max-w-[65ch] text-[0.875rem]" style={{ color: "var(--muted)" }}>
          A proporção de famílias que preenche uma única opção sobe todo ano, enquanto a
          média de opções cai. A taxa de sucesso subiu — mas por mais oferta, não por
          escolha melhor.
        </p>
        <SerieAnual />
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.375rem] font-semibold">Déficit territorial</h2>
            <p className="mt-1 max-w-[65ch] text-[0.875rem]" style={{ color: "var(--muted)" }}>
              Onde uma família não encontraria nenhuma aposta segura ao alcance. Não é falha
              silenciosa do recomendador: é exatamente o dado que distingue déficit real de
              problema de informação.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Modal de deslocamento considerado"
            className="flex gap-0.5 rounded-lg p-0.5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {[
              { v: true, r: "A pé" },
              { v: false, r: "Transporte" },
            ].map((o) => (
              <button
                key={o.r}
                type="button"
                role="radio"
                aria-checked={aPe === o.v}
                onClick={() => setAPe(o.v)}
                className="min-h-[36px] rounded-md px-3 text-[0.8125rem] font-medium transition-colors"
                style={{
                  background: aPe === o.v ? "var(--brand)" : "transparent",
                  color: aPe === o.v ? "var(--brand-ink)" : "var(--muted)",
                }}
              >
                {o.r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Indicador
            rotulo="Território sem aposta segura"
            valor={`${Math.round((cobertura.semAncora / Math.max(1, cobertura.total)) * 100)}%`}
            nota={`${cobertura.semAncora} de ${cobertura.total} pontos avaliados`}
            destaque={cobertura.semAncora / Math.max(1, cobertura.total) > 0.2}
          />
          <Indicador
            rotulo="Território coberto"
            valor={cobertura.comAncora.toString()}
            nota={`Com ao menos uma âncora em até ${aPe ? "2,5" : "7"} km`}
          />
          <Indicador
            rotulo="CRE mais afetada"
            valor={cobertura.porCre[0] ? `${cobertura.porCre[0].cre}ª` : "—"}
            nota={
              cobertura.porCre[0]
                ? `${Math.round(
                    (cobertura.porCre[0].semAncora / cobertura.porCre[0].total) * 100,
                  )}% do território sem âncora ao alcance`
                : undefined
            }
            destaque
          />
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-[0.8125rem]">
              <caption className="sr-only">
                Déficit territorial por CRE: pontos avaliados e quantos ficam sem âncora ao
                alcance
              </caption>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <Th align="left">CRE</Th>
                <Th>Pontos avaliados</Th>
                <Th>Sem âncora ao alcance</Th>
                <Th>Proporção</Th>
              </tr>
            </thead>
            <tbody>
              {cobertura.porCre.map((c) => {
                const prop = c.semAncora / Math.max(1, c.total);
                return (
                  <tr key={c.cre} style={{ borderTop: "1px solid var(--border)" }}>
                    <Td align="left">{c.cre}ª CRE</Td>
                    <Td>{c.total}</Td>
                    <Td destaque={prop > 0.3}>{c.semAncora}</Td>
                    <Td destaque={prop > 0.3}>{Math.round(prop * 100)}%</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[1.375rem] font-semibold">Onde a escolha falha mais</h2>
        <p className="mt-1 max-w-[65ch] text-[0.875rem]" style={{ color: "var(--muted)" }}>
          Bairros ordenados pela proporção de inscrições com uma única opção — onde a
          comunicação rende mais.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-[0.8125rem]">
              <caption className="sr-only">
                Bairros ordenados pela proporção de inscrições com uma única opção
              </caption>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <Th align="left">Bairro</Th>
                <Th>Inscrições</Th>
                <Th>Só uma opção</Th>
                <Th>Média de opções</Th>
                <Th>Taxa de sucesso</Th>
              </tr>
            </thead>
            <tbody>
              {bairrosCriticos.map((b) => (
                <tr key={b.bairro} style={{ borderTop: "1px solid var(--border)" }}>
                  <Td align="left">{tituloCase(b.bairro)}</Td>
                  <Td>{b.inscricoes.toLocaleString("pt-BR")}</Td>
                  <Td destaque={b.so_uma_opcao > 0.5}>{Math.round(b.so_uma_opcao * 100)}%</Td>
                  <Td>{b.media_opcoes.toFixed(2)}</Td>
                  <Td destaque={b.taxa_sucesso < 0.6}>{Math.round(b.taxa_sucesso * 100)}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[1.375rem] font-semibold">Vacância crônica</h2>
        <p className="mt-1 max-w-[65ch] text-[0.875rem]" style={{ color: "var(--muted)" }}>
          Unidades com folga histórica que quase ninguém escolhe. Antes de tratar como
          excesso de oferta, vale checar acesso: alta vacância também é sintoma de unidade
          que a família não consegue alcançar.
        </p>
        {vacancia.length === 0 ? (
          <p
            className="mt-3 rounded-lg p-4 text-[0.875rem]"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            Nenhuma unidade nesse padrão no recorte selecionado.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-[0.8125rem]">
                <caption className="sr-only">
                  Unidades com folga histórica e baixa procura
                </caption>
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <Th align="left">Unidade</Th>
                  <Th align="left">Bairro</Th>
                  <Th>CRE</Th>
                  <Th>Chance histórica</Th>
                  <Th>Procura em {catalogo.ano_alvo}</Th>
                </tr>
              </thead>
              <tbody>
                {vacancia.map((u) => (
                  <tr key={u.codigo} style={{ borderTop: "1px solid var(--border)" }}>
                    <Td align="left">{tituloCase(u.nome)}</Td>
                    <Td align="left">{tituloCase(u.bairro) || "—"}</Td>
                    <Td>{u.cre ?? "—"}</Td>
                    <Td>{Math.round((u.chance_hist ?? 0) * 100)}%</Td>
                    <Td destaque={u.opcoes_2025 < 15}>{u.opcoes_2025} pedidos</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[1.375rem] font-semibold">Régua de pontuação vigente</h2>
        <p className="mt-1 max-w-[65ch] text-[0.875rem]" style={{ color: "var(--muted)" }}>
          O que governa a classificação em {catalogo.ano_alvo}. Nos dados, a pontuação é
          ortogonal à qualidade da carteira: a prioridade existe no papel e se perde no
          formulário.
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {catalogo.regua_pontuacao.map((c) => (
            <li
              key={c.perg_id}
              className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
              style={{ background: "var(--surface)" }}
            >
              <span className="text-[0.8125rem]">{c.texto}</span>
              <span
                className="tnum shrink-0 text-[0.8125rem] font-semibold"
                style={{ color: c.pontos > 0 ? "var(--brand)" : "var(--muted)" }}
              >
                {c.pontos} pts
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SerieAnual() {
  const serie = catalogo.serie_anual;
  const max = Math.max(...serie.map((s) => s.inscricoes));

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-[0.8125rem]">
          <caption className="sr-only">
            Indicadores do processo seletivo por ano
          </caption>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <Th align="left">Ano</Th>
            <Th align="left">Inscrições</Th>
            <Th>Média de opções</Th>
            <Th>Só uma opção</Th>
            <Th>Taxa de sucesso</Th>
          </tr>
        </thead>
        <tbody>
          {serie.map((s) => (
            <tr key={s.ano} style={{ borderTop: "1px solid var(--border)" }}>
              <Td align="left">{s.ano}</Td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(s.inscricoes / max) * 100}%`,
                      minWidth: "1.5rem",
                      background: "var(--accent)",
                    }}
                  />
                  <span className="tnum" style={{ color: "var(--muted)" }}>
                    {s.inscricoes.toLocaleString("pt-BR")}
                  </span>
                </div>
              </td>
              <Td>{s.media_opcoes.toFixed(2)}</Td>
              <Td destaque={s.so_uma_opcao > 0.45}>{Math.round(s.so_uma_opcao * 100)}%</Td>
              <Td>{Math.round(s.taxa_sucesso * 100)}%</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-[0.75rem] font-medium" style={{ color: "var(--muted)" }}>
        {rotulo}
      </p>
      <p
        className="tnum mt-1 text-[1.5rem] font-semibold"
        style={{ color: destaque ? "var(--chance-baixa)" : "var(--ink)" }}
      >
        {valor}
      </p>
      {nota && (
        <p className="mt-0.5 text-[0.75rem]" style={{ color: "var(--muted)" }}>
          {nota}
        </p>
      )}
    </div>
  );
}

function Th({
  children,
  align = "right",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`pb-2 pr-3 text-[0.6875rem] font-medium uppercase tracking-wide ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "right",
  destaque,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  destaque?: boolean;
}) {
  return (
    <td
      className={`tnum py-2 pr-3 ${align === "left" ? "text-left" : "text-right"}`}
      style={destaque ? { color: "var(--chance-baixa)", fontWeight: 600 } : undefined}
    >
      {children}
    </td>
  );
}
