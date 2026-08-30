"use client";

import { useCallback, useMemo, useState } from "react";
import { catalogo, unidadesComGeo } from "@/lib/catalogo";
import { tituloCase } from "@/lib/formato";
import { PERSONAS } from "@/lib/personas";
import {
  faixaDe,
  probabilidadeAgregada,
  recomendar,
  TETO_AGREGADO,
} from "@/lib/recomendador/motor";
import type {
  AncoraLocalizacao,
  Grupamento,
  Horario,
  ItemCarteira,
  Modal,
  Perfil,
} from "@/lib/recomendador/tipos";
import { reavalia } from "@/lib/recomendador/edicao";
import { CartaoUnidade } from "./cartao-unidade";
import { Mapa, type PontoMapa } from "./mapa";
import { BuscaEndereco } from "./busca-endereco";
import { Botao, Campo, Opcoes, SinalChance } from "./ui";
import { BoasVindas } from "./familia-boas-vindas";
import {
  CaixaOrientacao,
  CartaoDispensavel,
  Explicador,
  GlossarioPapeis,
  ListaPassos,
  Ressalva,
} from "./familia-explicadores";

type Etapa = "boas-vindas" | "local" | "deslocamento" | "questionario" | "carteira";

/**
 * As etapas numeradas para a família — só as três em que ela preenche algo.
 *
 * Boas-vindas e carteira ficam de fora de propósito: "passo 1 de 3" tem que
 * contar o trabalho que a pessoa ainda tem pela frente. Contar a tela de
 * acolhimento como passo faria a barra começar já andada, e contar a entrega
 * faria parecer que ainda falta preencher algo depois do resultado.
 */
const ETAPAS: Array<{ id: Etapa; rotulo: string; curto: string }> = [
  { id: "local", rotulo: "Onde você está", curto: "Lugares" },
  { id: "deslocamento", rotulo: "Como se desloca", curto: "Trajeto" },
  { id: "questionario", rotulo: "Sua situação", curto: "Situação" },
];

const CENTRO_RIO = { lat: -22.9068, lng: -43.1861 };

const PERFIL_INICIAL: Perfil = {
  ancoras: [{ id: "casa", rotulo: "Casa", ...CENTRO_RIO }],
  modal: "transporte",
  grupamento: "Maternal I",
  horario: "Integral",
  criterios: [],
  precisaAcessibilidade: false,
};

const ROTULOS_DISPONIVEIS = ["Casa", "Trabalho", "Avó", "Outro ponto"];

export function FluxoFamilia() {
  const [etapa, setEtapa] = useState<Etapa>("boas-vindas");
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [ancoraAtiva, setAncoraAtiva] = useState<string | null>("casa");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  /** Trocas manuais da família: substituem itens da carteira sugerida. */
  const [manual, setManual] = useState<string[] | null>(null);
  /**
   * O que a família já tinha escolhido sozinha, antes de ver a recomendação.
   * É a comparação que mostra a diferença — e o motivo do produto existir.
   */
  const [propria, setPropria] = useState<string[]>([]);

  const carteira = useMemo(
    () => recomendar(perfil, unidadesComGeo, catalogo.regua_pontuacao),
    [perfil],
  );

  /**
   * A carteira exibida: a sugerida, ou a versão que a família editou.
   *
   * Depois de uma troca os papéis vêm defasados do motor — a família pode
   * ter removido a própria âncora sem que nada na tela mudasse. A
   * reavaliação recalcula os papéis e devolve o aviso.
   */
  const { itens, perdeuAncora }: { itens: ItemCarteira[]; perdeuAncora: boolean } =
    useMemo(() => {
      if (!manual) return { itens: carteira.itens, perdeuAncora: false };
      const porCodigo = new Map(
        [...carteira.itens, ...carteira.alternativas].map((i) => [i.unidade.codigo, i]),
      );
      const escolhidos = manual
        .map((c) => porCodigo.get(c))
        .filter((i): i is ItemCarteira => !!i);
      const tinhaAncora = carteira.itens.some((i) => i.papel === "ancora");
      return reavalia(escolhidos, tinhaAncora);
    }, [carteira, manual]);

  /**
   * Probabilidade da carteira que está na tela. Quando a família edita, o
   * número precisa acompanhar — é o custo (ou o ganho) da mudança dela.
   */
  const probabilidadeExibida = useMemo(
    () => (manual ? probabilidadeAgregada(itens.map((i) => i.chance)) : carteira.probabilidadeAgregada),
    [manual, itens, carteira.probabilidadeAgregada],
  );

  const pontos: PontoMapa[] = useMemo(() => {
    const naCarteira = new Set(itens.map((i) => i.unidade.codigo));
    // Uma unidade trocada pela família está em `itens` e continua em
    // `alternativas` — sem deduplicar, ela é desenhada duas vezes no mapa e
    // o React reclama de chave repetida.
    const vistos = new Set<string>();
    const pontosUnicos: PontoMapa[] = [];
    for (const i of [...itens, ...carteira.alternativas]) {
      if (vistos.has(i.unidade.codigo)) continue;
      vistos.add(i.unidade.codigo);
      pontosUnicos.push({
        unidade: i.unidade,
        faixa: i.faixa,
        naCarteira: naCarteira.has(i.unidade.codigo),
      });
    }
    return pontosUnicos;
  }, [itens, carteira.alternativas]);

  /**
   * O ponto que a busca de endereço reposiciona: o ativo, ou o primeiro.
   * Sem isso a família buscaria "Trabalho" e o pino de "Casa" pularia.
   */
  const ancoraEditada =
    perfil.ancoras.find((a) => a.id === ancoraAtiva) ?? perfil.ancoras[0];

  const moverAncora = useCallback((id: string, lat: number, lng: number) => {
    setPerfil((p) => ({
      ...p,
      ancoras: p.ancoras.map((a) => (a.id === id ? { ...a, lat, lng } : a)),
    }));
    setManual(null);
  }, []);

  const adicionaAncora = () => {
    const usados = new Set(perfil.ancoras.map((a) => a.rotulo));
    const rotulo = ROTULOS_DISPONIVEIS.find((r) => !usados.has(r)) ?? "Outro ponto";
    const nova: AncoraLocalizacao = {
      id: `ponto-${Date.now()}`,
      rotulo,
      lat: perfil.ancoras[0]?.lat ?? CENTRO_RIO.lat,
      lng: (perfil.ancoras[0]?.lng ?? CENTRO_RIO.lng) + 0.02,
    };
    setPerfil((p) => ({ ...p, ancoras: [...p.ancoras, nova] }));
    setAncoraAtiva(nova.id);
    setManual(null);
  };

  const removeAncora = (id: string) => {
    setPerfil((p) => ({ ...p, ancoras: p.ancoras.filter((a) => a.id !== id) }));
    setManual(null);
  };

  const movePrioridade = (i: number, dir: -1 | 1) => {
    setPerfil((p) => {
      const a = [...p.ancoras];
      const j = i + dir;
      if (j < 0 || j >= a.length) return p;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...p, ancoras: a };
    });
    setManual(null);
  };

  const alternaCriterio = (id: number) => {
    setPerfil((p) => ({
      ...p,
      criterios: p.criterios.includes(id)
        ? p.criterios.filter((c) => c !== id)
        : [...p.criterios, id],
    }));
    setManual(null);
  };

  /**
   * Troca de etapa sempre volta ao topo.
   *
   * No celular a pessoa toca em "Continuar" no fim de uma tela longa; sem
   * isso ela cai no meio da próxima e não vê o cabeçalho que explica o que
   * está sendo pedido — justamente a explicação que o fluxo existe para dar.
   */
  const irPara = useCallback((destino: Etapa) => {
    setEtapa(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20">
      <h1 className="sr-only">Monte sua carteira de creches</h1>
      {etapa !== "boas-vindas" && <Passos etapa={etapa} onIr={irPara} />}

      {etapa === "boas-vindas" && <BoasVindas aoComecar={() => irPara("local")} />}

      {etapa === "local" && (
        <section className="mt-5 flex flex-col gap-5">
          <Cabecalho
            titulo="Onde você está no dia a dia"
            texto="Marque os lugares de onde você sai para levar a criança: sua casa, seu trabalho, a casa de quem ajuda."
          />
          <CaixaOrientacao titulo="Por que estamos perguntando isso">
            <p>
              Uma creche longe demais de todos os seus pontos não adianta, por
              melhor que ela seja. Com esses lugares no mapa, a gente só sugere
              creches que você consegue frequentar de verdade.
            </p>
            <p>
              <strong>A ordem importa:</strong> o primeiro ponto da lista pesa
              mais na recomendação. Coloque primeiro o lugar de onde você sai
              na maioria dos dias.
            </p>
          </CaixaOrientacao>
          <BuscaEndereco
            rotuloAncora={ancoraEditada.rotulo}
            aoEscolher={(lat, lng) => moverAncora(ancoraEditada.id, lat, lng)}
          />
          <div className="flex flex-col gap-2">
            <p className="text-body leading-relaxed">
              <strong>Arraste o pino no mapa</strong> até o ponto certo. É o
              pino que vale, não o endereço digitado — se você mora em
              comunidade ou em rua sem número, arrastar é o jeito mais preciso.
            </p>
            <Mapa
              pontos={[]}
              ancoras={perfil.ancoras}
              ancoraAtiva={ancoraAtiva}
              onMoverAncora={moverAncora}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-semibold">
              Seus lugares, do mais importante para o menos
            </h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Toque no nome para trocar. Use as setas para mudar a ordem — o
              número 1 é o que mais pesa.
            </p>
            <ul className="mt-1 flex flex-col gap-2">
              {perfil.ancoras.map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: "var(--elevated)",
                    border: `1px solid ${ancoraAtiva === a.id ? "var(--brand)" : "var(--border)"}`,
                  }}
                >
                  <span
                    className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-md text-label font-semibold"
                    style={{ background: "var(--brand-suave)", color: "var(--brand)" }}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={a.rotulo}
                    onChange={(e) =>
                      setPerfil((p) => ({
                        ...p,
                        ancoras: p.ancoras.map((x) =>
                          x.id === a.id ? { ...x, rotulo: e.target.value } : x,
                        ),
                      }))
                    }
                    onFocus={() => setAncoraAtiva(a.id)}
                    aria-label={`Nome do ponto ${i + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-body font-medium outline-none"
                  />
                  <Botao
                    variante="fantasma"
                    onClick={() => movePrioridade(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir prioridade de ${a.rotulo}`}
                    className="!px-2"
                  >
                    ↑
                  </Botao>
                  <Botao
                    variante="fantasma"
                    onClick={() => movePrioridade(i, 1)}
                    disabled={i === perfil.ancoras.length - 1}
                    aria-label={`Descer prioridade de ${a.rotulo}`}
                    className="!px-2"
                  >
                    ↓
                  </Botao>
                  {perfil.ancoras.length > 1 && (
                    <Botao
                      variante="fantasma"
                      onClick={() => removeAncora(a.id)}
                      aria-label={`Remover ${a.rotulo}`}
                      className="!px-2"
                    >
                      ✕
                    </Botao>
                  )}
                </li>
              ))}
            </ul>
            {perfil.ancoras.length < 4 && (
              <Botao variante="secundario" onClick={adicionaAncora} className="self-start">
                + Adicionar outro lugar
              </Botao>
            )}
            {perfil.ancoras.length === 1 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Só a casa já funciona. Mas se alguém ajuda a levar a criança,
                ou se você sai do trabalho para buscar, vale marcar esse lugar
                também: abre mais creches possíveis para você.
              </p>
            )}
          </div>
          <Navegacao proximo={() => irPara("deslocamento")} />
        </section>
      )}

      {etapa === "deslocamento" && (
        <section className="mt-5 flex flex-col gap-6">
          <Cabecalho
            titulo="Como você leva a criança"
            texto="Agora precisamos saber até onde dá para ir, a idade da criança e o horário de que você precisa."
          />
          <CaixaOrientacao titulo="Por que estamos perguntando isso">
            <p>
              Essas três respostas definem quais creches entram na conta. Uma
              creche que fica longe demais para o seu transporte, ou que não
              tem a turma da idade da sua criança, não vai aparecer na lista.
            </p>
            <p>
              Não adianta gastar uma das suas cinco opções com uma vaga que
              você não conseguiria frequentar no dia a dia.
            </p>
          </CaixaOrientacao>
          <Campo
            rotulo="Como você se desloca"
            ajuda="Escolha o transporte que você usaria na maioria dos dias para levar e buscar."
          >
            <Opcoes<Modal>
              rotuloGrupo="Como você se desloca"
              valor={perfil.modal}
              onChange={(v) => {
                setPerfil((p) => ({ ...p, modal: v }));
                setManual(null);
              }}
              opcoes={[
                { valor: "pe", rotulo: "A pé", nota: "Até cerca de 2,5 km" },
                { valor: "transporte", rotulo: "Ônibus ou BRT", nota: "Até cerca de 7 km" },
                { valor: "carro", rotulo: "Carro", nota: "Até cerca de 15 km" },
              ]}
            />
          </Campo>
          <Campo
            rotulo="Idade da criança quando começar a creche"
            ajuda="Cada faixa de idade tem um nome oficial — chamamos de grupamento — e uma quantidade de vagas diferente."
          >
            <Opcoes<Grupamento>
              rotuloGrupo="Grupamento"
              valor={perfil.grupamento}
              onChange={(v) => {
                setPerfil((p) => ({ ...p, grupamento: v }));
                setManual(null);
              }}
              opcoes={[
                { valor: "Berçário", rotulo: "Berçário", nota: "Até 1 ano" },
                { valor: "Maternal I", rotulo: "Maternal I", nota: "1 a 2 anos" },
                { valor: "Maternal II", rotulo: "Maternal II", nota: "2 a 3 anos" },
              ]}
            />
          </Campo>
          <Campo
            rotulo="Horário de que você precisa"
            ajuda="A disputa é bem diferente entre os dois: costuma haver muito mais gente pedindo integral do que parcial."
          >
            <Opcoes<Horario>
              rotuloGrupo="Horário"
              valor={perfil.horario}
              onChange={(v) => {
                setPerfil((p) => ({ ...p, horario: v }));
                setManual(null);
              }}
              opcoes={[
                { valor: "Integral", rotulo: "Integral", nota: "Dia inteiro" },
                { valor: "Parcial", rotulo: "Parcial", nota: "Meio período" },
              ]}
            />
          </Campo>
          <Navegacao
            voltar={() => irPara("local")}
            proximo={() => irPara("questionario")}
          />
        </section>
      )}

      {etapa === "questionario" && (
        <section className="mt-5 flex flex-col gap-5">
          <Cabecalho
            titulo="Sua situação hoje"
            texto="Marque o que valer para a sua família. Cada item soma pontos na inscrição — e ponto muda muito a sua chance de vaga."
          />
          <CaixaOrientacao titulo="Por que estamos perguntando isso">
            <p>
              A Prefeitura ordena a fila de cada creche por pontos. Quem tem
              mais pontos passa na frente. Esta é a mesma lista de critérios
              que você vai ver na inscrição oficial.
            </p>
            <p>
              <strong>Pule o que não souber ou não quiser responder.</strong>{" "}
              Nada aqui é obrigatório e nada trava o resultado — só deixa a
              estimativa mais próxima da sua realidade.
            </p>
          </CaixaOrientacao>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Toque para marcar. O número à direita é quanto o item soma.
          </p>
          <ul className="flex flex-col gap-2">
            {catalogo.regua_pontuacao
              .filter((c) => c.pontos > 0)
              .map((c) => {
                const marcado = perfil.criterios.includes(c.perg_id);
                return (
                  <li key={c.perg_id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={marcado}
                      onClick={() => alternaCriterio(c.perg_id)}
                      className="flex w-full min-h-[44px] items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors"
                      style={{
                        background: marcado ? "var(--brand-suave)" : "var(--elevated)",
                        border: `1px solid ${marcado ? "var(--brand)" : "var(--border-controle)"}`,
                      }}
                    >
                      <span
                        className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded"
                        style={{
                          border: `2px solid ${marcado ? "var(--brand)" : "var(--border-controle)"}`,
                          background: marcado ? "var(--brand)" : "transparent",
                        }}
                      >
                        {marcado && (
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                            <path
                              d="M2 6.5L4.5 9L10 3"
                              fill="none"
                              stroke="var(--brand-ink)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 text-body leading-snug">{c.texto}</span>
                      <span
                        className="tnum shrink-0 text-label font-semibold"
                        style={{ color: marcado ? "var(--brand)" : "var(--muted)" }}
                      >
                        +{c.pontos}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
          <button
            type="button"
            role="checkbox"
            aria-checked={perfil.precisaAcessibilidade}
            onClick={() => {
              setPerfil((p) => ({
                ...p,
                precisaAcessibilidade: !p.precisaAcessibilidade,
              }));
              setManual(null);
            }}
            className="flex w-full min-h-[44px] items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors"
            style={{
              background: perfil.precisaAcessibilidade ? "var(--brand-suave)" : "var(--elevated)",
              border: `1px solid ${perfil.precisaAcessibilidade ? "var(--brand)" : "var(--border-controle)"}`,
            }}
          >
            <span
              className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded"
              style={{
                border: `2px solid ${perfil.precisaAcessibilidade ? "var(--brand)" : "var(--border-controle)"}`,
                background: perfil.precisaAcessibilidade ? "var(--brand)" : "transparent",
              }}
            >
              {perfil.precisaAcessibilidade && (
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                  <path
                    d="M2 6.5L4.5 9L10 3"
                    fill="none"
                    stroke="var(--brand-ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="flex-1 text-body leading-snug">
              A criança precisa de creche acessível
              <span className="mt-0.5 block text-label" style={{ color: "var(--muted)" }}>
                Isso conta pontos junto com educação especial. Mas não sabemos
                quais creches são acessíveis — vamos lembrar você de confirmar
                por telefone.
              </span>
            </span>
          </button>

          {/*
            A pontuação aparece aqui, e não só no final, porque é o retorno
            imediato de cada item marcado: a família vê o número subir e
            entende que a resposta dela mudou alguma coisa de verdade.
          */}
          <div
            className="rounded-lg px-4 py-3.5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-body font-medium">Seus pontos até agora</span>
              <span className="tnum text-h2 font-semibold" style={{ color: "var(--brand)" }}>
                {carteira.pontuacao}
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Quanto mais pontos, mais na frente da fila você fica em toda
              creche que pedir.
            </p>
          </div>
          <Navegacao
            voltar={() => irPara("deslocamento")}
            proximo={() => irPara("carteira")}
            rotuloProximo="Ver as creches recomendadas"
          />
        </section>
      )}

      {etapa === "carteira" && (
        <section className="mt-5 flex flex-col gap-5">
          <Cabecalho
            titulo="Prontas: as creches que recomendamos para você"
            texto="Esta é a sua lista, na ordem sugerida. Você pode trocar, reordenar ou ignorar tudo — a decisão é sua."
          />

          {itens.length > 0 && <ComoLer quantidade={itens.length} />}

          {perfil.precisaAcessibilidade && (
            <p
              className="rounded-lg px-4 py-3 text-sm leading-relaxed"
              style={{
                background: "var(--accent-suave)",
                color: "var(--ink)",
                border: "1px solid var(--accent)",
              }}
            >
              <strong>Lembrete sobre acessibilidade.</strong> Você disse que a
              criança precisa de creche acessível, e isso já entrou nos seus
              pontos. Mas as bases públicas da Prefeitura não dizem quais
              creches são acessíveis — a gente prefere avisar a chutar. Ligue
              para cada creche desta lista e confirme antes de decidir a ordem.
            </p>
          )}
          <ResultadoCarteira
            itens={itens}
            deficit={carteira.deficitTerritorial}
            probabilidade={probabilidadeExibida}
            melhorChance={carteira.melhorChanceDisponivel}
            editada={manual !== null}
            perdeuAncora={perdeuAncora}
            probabilidadeSugerida={carteira.probabilidadeAgregada}
            onRestaurar={() => setManual(null)}
            alternativas={carteira.alternativas}
            onDefinirManual={setManual}
            codigosAtuais={itens.map((i) => i.unidade.codigo)}
          />
          <MinhaEscolha
            propria={propria}
            onMudar={setPropria}
            disponiveis={[...itens, ...carteira.alternativas]}
            probabilidadeSugerida={carteira.probabilidadeAgregada}
          />
          <div className="flex flex-col gap-2">
            <h2 className="text-h3 font-semibold">Onde ficam, no mapa</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Os círculos maiores e cheios são as creches da sua lista. Os
              menores são as outras opções que ficam no seu alcance. Toque em
              qualquer um para ver o nome.
            </p>
            <Mapa
              pontos={pontos}
              ancoras={perfil.ancoras}
              onSelecionarUnidade={setSelecionada}
              unidadeSelecionada={selecionada}
            />
          </div>

          <ProximoPasso />

          <Navegacao
            voltar={() => irPara("questionario")}
            rotuloVoltar="Mudar minhas respostas"
          />
        </section>
      )}

      <Personas
        onCarregar={(p) => {
          setPerfil(p);
          setManual(null);
          irPara("carteira");
        }}
      />
    </div>
  );
}

/**
 * Cartão de leitura da carteira, mostrado uma vez na entrega.
 *
 * A ordem das cinco opções só faz sentido para quem entende os papéis: sem
 * isso, a lista parece um ranking de qualidade, e a âncora — que existe
 * justamente para a família não sair sem vaga — vira "a pior da lista".
 * Dispensável de propósito: útil na primeira leitura, ruído na quinta.
 */
function ComoLer({ quantidade }: { quantidade: number }) {
  return (
    <CartaoDispensavel titulo="Como ler esta página">
      <p className="text-body leading-relaxed">
        Encontramos {quantidade}{" "}
        {quantidade === 1 ? "creche" : "creches"} para você. Elas não estão em
        ordem da melhor para a pior: cada uma tem um papel diferente na sua
        inscrição, e é a combinação delas que protege você.
      </p>
      <GlossarioPapeis />
      <Ressalva>
        A chance aparece como faixa, nunca como número exato. Ela vem do
        histórico de 2021 a 2025 e indica a direção — não é uma promessa de
        vaga.
      </Ressalva>
    </CartaoDispensavel>
  );
}

/**
 * O que fazer depois de fechar a carteira.
 *
 * A entrega não é a lista: é a inscrição feita no matrícula.rio. Sem este
 * fecho, a família sai da ferramenta com uma boa decisão e nenhum caminho
 * para executá-la.
 */
function ProximoPasso() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 font-semibold">E agora, o que fazer</h2>
      <ListaPassos
        itens={[
          {
            titulo: "Anote as creches nesta ordem",
            texto:
              "Tire um print ou escreva num papel. Você vai precisar dos nomes na hora da inscrição.",
          },
          {
            titulo: "Ligue para confirmar",
            texto:
              "Horário de funcionamento e acessibilidade não estão nas bases públicas. Uma ligação evita surpresa depois.",
          },
          {
            titulo: "Inscreva-se no matrícula.rio",
            texto:
              "A inscrição oficial é lá, e só lá. Esta ferramenta ajuda você a escolher, mas não inscreve ninguém.",
          },
        ]}
      />
    </section>
  );
}

function Cabecalho({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <h2 className="text-h2 font-semibold">{titulo}</h2>
      <p className="mt-1.5 max-w-[65ch] text-md" style={{ color: "var(--muted)" }}>
        {texto}
      </p>
    </div>
  );
}

function Passos({ etapa, onIr }: { etapa: Etapa; onIr: (e: Etapa) => void }) {
  const atual = ETAPAS.findIndex((e) => e.id === etapa);
  return (
    <nav aria-label="Etapas" className="flex gap-1 overflow-x-auto pt-6">
      {ETAPAS.map((e, i) => {
        const feito = i < atual;
        const ativo = i === atual;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onIr(e.id)}
            aria-current={ativo ? "step" : undefined}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors"
            style={{
              background: ativo ? "var(--brand-suave)" : "transparent",
              color: ativo ? "var(--brand)" : feito ? "var(--ink)" : "var(--muted)",
            }}
          >
            <span
              className="tnum grid h-5 w-5 place-items-center rounded-full text-micro font-semibold"
              style={{
                background: ativo || feito ? "var(--brand)" : "var(--border)",
                color: ativo || feito ? "var(--brand-ink)" : "var(--muted)",
              }}
            >
              {feito ? "✓" : i + 1}
            </span>
            {e.rotulo}
          </button>
        );
      })}
    </nav>
  );
}

function Navegacao({
  voltar,
  proximo,
  rotuloProximo = "Continuar",
  rotuloVoltar = "Voltar",
}: {
  voltar?: () => void;
  proximo?: () => void;
  rotuloProximo?: string;
  rotuloVoltar?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {voltar && (
        <Botao variante="secundario" onClick={voltar}>
          {rotuloVoltar}
        </Botao>
      )}
      {proximo && (
        <Botao onClick={proximo} className="flex-1 sm:flex-none">
          {rotuloProximo}
        </Botao>
      )}
    </div>
  );
}

function ResultadoCarteira({
  itens,
  deficit,
  probabilidade,
  melhorChance,
  editada,
  perdeuAncora,
  probabilidadeSugerida,
  onRestaurar,
  alternativas,
  onDefinirManual,
  codigosAtuais,
}: {
  itens: ItemCarteira[];
  deficit: boolean;
  probabilidade: number;
  melhorChance: number | null;
  editada: boolean;
  perdeuAncora: boolean;
  probabilidadeSugerida: number;
  onRestaurar: () => void;
  alternativas: ItemCarteira[];
  onDefinirManual: (c: string[]) => void;
  codigosAtuais: string[];
}) {
  const [trocando, setTrocando] = useState<number | null>(null);

  if (itens.length === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--chance-minima-suave)",
          border: "1px solid var(--chance-minima)",
        }}
      >
        <h2 className="text-h3 font-semibold" style={{ color: "var(--chance-minima)" }}>
          Não encontramos nenhuma creche no seu alcance
        </h2>
        <p className="mt-2 max-w-[65ch] text-body">
          Com os pontos e o deslocamento que você informou, nenhuma unidade atende a faixa
          etária e o horário pedidos. Não vamos sugerir uma creche inviável só para preencher
          as cinco opções.
        </p>
        <p className="mt-2 max-w-[65ch] text-body">
          Seu caso foi registrado como demanda não atendida na sua região — essa informação
          vai para quem planeja a rede.
        </p>
      </div>
    );
  }

  return (
    <>
      {deficit && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--chance-baixa-suave)",
            border: "1px solid var(--chance-baixa)",
          }}
        >
          <h2 className="text-h3 font-semibold" style={{ color: "var(--chance-baixa)" }}>
            Não há nenhuma aposta segura perto de você
          </h2>
          <p className="mt-2 max-w-[65ch] text-body">
            Nenhuma creche no seu alcance tem histórico de atender a maioria de quem se
            inscreve. Montamos a carteira com a melhor chance realmente disponível.
            {melhorChance !== null && (
              <>
                {" "}
                Considerando a sua pontuação, a melhor delas fica na faixa{" "}
                <strong>{FAIXA_TEXTO[faixaDe(melhorChance)]}</strong> — mas isso vem do seu
                perfil, não de a unidade costumar ter vaga.
              </>
            )}
          </p>
          <p className="mt-2 max-w-[65ch] text-body">
            Seu caso foi registrado como déficit territorial na sua região.
          </p>
        </div>
      )}

      <div
        className="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-h2 font-semibold">
            {editada ? "Sua carteira editada" : "Sua carteira"}
          </h2>
          {editada && (
            <Botao variante="fantasma" tamanho="sm" onClick={onRestaurar}>
              Voltar à sugestão
            </Botao>
          )}
        </div>
        {editada && <Comparacao editada={probabilidade} sugerida={probabilidadeSugerida} />}
        {perdeuAncora && (
          <p
            className="mt-2 rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--chance-baixa-suave)",
              color: "var(--chance-baixa)",
              border: "1px solid var(--chance-baixa)",
            }}
            role="alert"
          >
            Sua carteira ficou sem nenhuma aposta segura. A decisão é sua — mas sem uma
            unidade de vaga mais provável, a chance de não conseguir nenhuma vaga aumenta
            bastante.
          </p>
        )}
        <p className="mt-2 max-w-[65ch] text-body" style={{ color: "var(--muted)" }}>
          Com estas {itens.length} opções, a chance de conseguir vaga em pelo menos uma delas
          é{" "}
          <strong style={{ color: "var(--ink)" }}>
            {ROTULO_AGREGADO(probabilidade).toLowerCase()}
          </strong>
          . Trabalhamos com faixas, não com número exato: a estimativa acerta a direção, não a
          magnitude.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {itens.map((item, i) => (
          <li key={item.unidade.codigo}>
            <CartaoUnidade
              item={item}
              posicao={i + 1}
              primeiro={i === 0}
              ultimo={i === itens.length - 1}
              onSubir={() => {
                const c = [...codigosAtuais];
                [c[i - 1], c[i]] = [c[i], c[i - 1]];
                onDefinirManual(c);
              }}
              onDescer={() => {
                const c = [...codigosAtuais];
                [c[i], c[i + 1]] = [c[i + 1], c[i]];
                onDefinirManual(c);
              }}
              onTrocar={() => setTrocando(trocando === i ? null : i)}
            />
            {trocando === i && (
              <div
                className="mt-2 rounded-lg p-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="mb-2 text-sm font-medium">
                  Trocar por outra creche do seu alcance
                </p>
                <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {alternativas.slice(0, 12).map((alt) => (
                    <li key={alt.unidade.codigo}>
                      <button
                        type="button"
                        onClick={() => {
                          const c = [...codigosAtuais];
                          c[i] = alt.unidade.codigo;
                          onDefinirManual(c);
                          setTrocando(null);
                        }}
                        className="flex w-full min-h-[44px] items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors"
                        style={{ background: "var(--elevated)" }}
                      >
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {tituloCase(alt.unidade.nome)}
                        </span>
                        <SinalChance faixa={alt.faixa} compacto />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * O custo (ou ganho) da alteração que a família fez.
 *
 * Em faixas e em direção, nunca em pontos percentuais: a estimativa acerta
 * a direção e erra a magnitude, e cravar "-7pp" seria precisão falsa.
 */
function Comparacao({ editada, sugerida }: { editada: number; sugerida: number }) {
  const delta = editada - sugerida;
  const relevante = Math.abs(delta) >= 0.02;
  const piorou = delta < 0;

  const cor = !relevante
    ? "var(--muted)"
    : piorou
      ? "var(--chance-baixa)"
      : "var(--chance-alta)";

  return (
    <p
      className="mt-3 rounded-lg px-3 py-2 text-sm"
      style={{ background: "var(--elevated)", color: cor, border: `1px solid ${cor}` }}
      role="status"
    >
      {!relevante
        ? "Sua mudança praticamente não altera a chance de conseguir vaga."
        : piorou
          ? "Com esta troca, sua chance de conseguir vaga ficou menor que a da carteira sugerida."
          : "Com esta troca, sua chance de conseguir vaga ficou maior que a da carteira sugerida."}
    </p>
  );
}

/** Faixa qualitativa da probabilidade agregada. Nunca um número cravado. */
function ROTULO_AGREGADO(p: number): string {
  if (p >= TETO_AGREGADO) return "Muito boa";
  if (p >= 0.6) return "Boa";
  if (p >= 0.35) return "Razoável";
  return "Baixa";
}

const FAIXA_TEXTO = {
  alta: "aposta segura",
  media: "chance real",
  baixa: "disputada",
  minima: "muito disputada",
} as const;

/**
 * Comparação com o que a família tinha escolhido sozinha.
 *
 * É o núcleo do argumento do produto: nos dados, a qualidade da escolha vale
 * 17,2pp de chance de vaga entre famílias equivalentes. Sem poder ver a
 * própria lista ao lado da sugerida, a família não tem como julgar isso.
 */
function MinhaEscolha({
  propria,
  onMudar,
  disponiveis,
  probabilidadeSugerida,
}: {
  propria: string[];
  onMudar: (c: string[]) => void;
  disponiveis: ItemCarteira[];
  probabilidadeSugerida: number;
}) {
  const [aberto, setAberto] = useState(false);

  const escolhidos = propria
    .map((c) => disponiveis.find((i) => i.unidade.codigo === c))
    .filter((i): i is ItemCarteira => !!i);
  const minha = probabilidadeAgregada(escolhidos.map((i) => i.chance));

  return (
    <section
      className="rounded-xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h3">Você já tinha escolhido alguma creche?</h2>
        <Botao variante="secundario" tamanho="sm" onClick={() => setAberto(!aberto)}>
          {aberto ? "Fechar" : "Comparar com a minha escolha"}
        </Botao>
      </div>
      <p className="mt-1.5 max-w-[65ch] text-sm" style={{ color: "var(--muted)" }}>
        Monte a lista que você faria por conta própria e veja a diferença antes de decidir.
      </p>

      {aberto && (
        <>
          <ul className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
            {disponiveis.slice(0, 25).map((i) => {
              const marcado = propria.includes(i.unidade.codigo);
              return (
                <li key={i.unidade.codigo}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    disabled={!marcado && propria.length >= 5}
                    onClick={() =>
                      onMudar(
                        marcado
                          ? propria.filter((c) => c !== i.unidade.codigo)
                          : [...propria, i.unidade.codigo],
                      )
                    }
                    className="flex w-full min-h-[44px] items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors disabled:opacity-45"
                    style={{
                      background: marcado ? "var(--brand-suave)" : "var(--elevated)",
                      border: `1px solid ${marcado ? "var(--brand)" : "transparent"}`,
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {tituloCase(i.unidade.nome)}
                    </span>
                    <SinalChance faixa={i.faixa} compacto />
                  </button>
                </li>
              );
            })}
          </ul>

          {escolhidos.length > 0 && (
            <div
              className="mt-3 grid gap-3 rounded-lg p-3 sm:grid-cols-2"
              style={{ background: "var(--elevated)" }}
            >
              <div>
                <p className="text-label" style={{ color: "var(--muted)" }}>
                  Sua escolha ({escolhidos.length}{" "}
                  {escolhidos.length === 1 ? "opção" : "opções"})
                </p>
                <p className="mt-0.5 text-h3">{ROTULO_AGREGADO(minha)}</p>
              </div>
              <div>
                <p className="text-label" style={{ color: "var(--muted)" }}>
                  Carteira sugerida (5 opções)
                </p>
                <p className="mt-0.5 text-h3" style={{ color: "var(--brand)" }}>
                  {ROTULO_AGREGADO(probabilidadeSugerida)}
                </p>
              </div>
              <p className="text-sm sm:col-span-2" style={{ color: "var(--muted)" }}>
                {minha >= probabilidadeSugerida
                  ? "Sua escolha já está no mesmo patamar da sugestão — a decisão final é sua."
                  : "A carteira sugerida tem chance maior de conseguir alguma vaga. Compare os cartões acima antes de decidir."}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Personas({ onCarregar }: { onCarregar: (p: Perfil) => void }) {
  return (
    <section className="mt-12 border-t pt-6" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-md font-semibold">Perfis de demonstração</h2>
      <p className="mt-1 max-w-[65ch] text-sm" style={{ color: "var(--muted)" }}>
        Casos pré-configurados para ver o comportamento do sistema sem preencher o formulário.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onCarregar(p.perfil)}
            className="flex min-h-[44px] flex-col gap-1 rounded-lg p-3 text-left transition-colors"
            style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
          >
            <span className="text-body font-semibold">{p.nome}</span>
            <span className="text-label" style={{ color: "var(--muted)" }}>
              {p.resumo}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
