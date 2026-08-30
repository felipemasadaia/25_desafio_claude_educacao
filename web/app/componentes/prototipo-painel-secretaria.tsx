"use client";

import { useEffect, useMemo, useState } from "react";
import { catalogo, unidadesComGeo } from "@/lib/catalogo";
import { calculaCobertura } from "@/lib/cobertura";
import { bairrosDoRecorte, microareas, type Recorte } from "@/lib/territorio";
import styles from "./prototipo-painel-secretaria.module.css";

type Variante = "A" | "B" | "C";
type Area = ReturnType<typeof microareas>[number];

const VARIANTES: Array<{ id: Variante; nome: string }> = [
  { id: "A", nome: "Briefing de decisão" },
  { id: "B", nome: "Território primeiro" },
  { id: "C", nome: "Mesa de intervenções" },
];

const cres = [...new Set(catalogo.unidades.map((u) => u.cre).filter((c): c is number => c !== null))].sort(
  (a, b) => a - b,
);

export function PrototipoPainelSecretaria({ varianteInicial }: { varianteInicial: Variante }) {
  const [variante, setVariante] = useState<Variante>(varianteInicial);
  const [cre, setCre] = useState<Recorte>("todas");
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);

  const dados = useMemo(() => montaDados(cre), [cre]);

  useEffect(() => {
    if (!areaSelecionada || !dados.areas.some((a) => a.microarea === areaSelecionada)) {
      setAreaSelecionada(dados.prioridades[0]?.microarea ?? null);
    }
  }, [areaSelecionada, dados.areas, dados.prioridades]);

  function trocar(proxima: Variante) {
    setVariante(proxima);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", proxima);
    window.history.replaceState(null, "", url);
  }

  function navegar(direcao: -1 | 1) {
    const atual = VARIANTES.findIndex((v) => v.id === variante);
    trocar(VARIANTES[(atual + direcao + VARIANTES.length) % VARIANTES.length].id);
  }

  useEffect(() => {
    function onKeyDown(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement;
      if (alvo.matches("input, textarea, select, [contenteditable='true']")) return;
      if (evento.key === "ArrowLeft") navegar(-1);
      if (evento.key === "ArrowRight") navegar(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const selecionada = dados.areas.find((a) => a.microarea === areaSelecionada) ?? dados.prioridades[0];

  return (
    <div className={styles.prototipo}>
      <div className={styles.aviso}>
        <span>PROTÓTIPO DESCARTÁVEL</span>
        <p>Qual estrutura leva o secretário de um sinal territorial a uma prioridade defensável?</p>
      </div>

      {variante === "A" && <VarianteA dados={dados} cre={cre} setCre={setCre} />}
      {variante === "B" && (
        <VarianteB
          dados={dados}
          cre={cre}
          setCre={setCre}
          selecionada={selecionada}
          setSelecionada={setAreaSelecionada}
        />
      )}
      {variante === "C" && <VarianteC dados={dados} cre={cre} setCre={setCre} />}

      {process.env.NODE_ENV !== "production" && (
        <div className={styles.switcher} aria-label="Alternar proposta visual">
          <button type="button" onClick={() => navegar(-1)} aria-label="Proposta anterior">
            ←
          </button>
          <div>
            <strong>{variante}</strong>
            <span>{VARIANTES.find((v) => v.id === variante)?.nome}</span>
          </div>
          <button type="button" onClick={() => navegar(1)} aria-label="Próxima proposta">
            →
          </button>
        </div>
      )}
    </div>
  );
}

type Dados = ReturnType<typeof montaDados>;
type PropsVariante = { dados: Dados; cre: Recorte; setCre: (cre: Recorte) => void };

function VarianteA({ dados, cre, setCre }: PropsVariante) {
  const principal = dados.prioridades[0];

  return (
    <main className={styles.executivo}>
      <Cabecalho
        titulo="Sala de decisão"
        subtitulo="Uma leitura semanal para decidir onde a rede precisa agir primeiro."
        cre={cre}
        setCre={setCre}
      />

      <section className={styles.faixaDecisao}>
        <div>
          <p className={styles.rotulo}>Prioridade desta leitura</p>
          <h1>{principal ? `Investigar a microárea ${principal.microarea}` : "Nenhum sinal no recorte"}</h1>
          <p>
            {principal
              ? `${principal.procura.toLocaleString("pt-BR")} pedidos registrados e nenhuma oferta historicamente segura. O padrão sugere restrição estrutural, mas exige validação local antes de investimento.`
              : "O recorte selecionado não possui microáreas comparáveis na base atual."}
          </p>
        </div>
        <div className={styles.decisaoAcoes}>
          <button type="button" className={styles.primario}>Abrir diagnóstico</button>
          <button type="button" className={styles.secundario}>Registrar para pauta</button>
        </div>
      </section>

      <section className={styles.metricasExecutivas} aria-label="Leituras principais">
        <Metrica valor={`${dados.percentualSemOferta}%`} rotulo="território sem oferta segura ao alcance" tom="critico" />
        <Metrica valor={`${dados.semOferta.length}`} rotulo={`microáreas sem oferta segura em ${dados.areas.length}`} />
        <Metrica valor={`${dados.percentualUmaOpcao}%`} rotulo="das inscrições registram uma única escolha" />
        <Metrica valor={`${dados.unidadesRecorte}`} rotulo="unidades observadas neste recorte" />
      </section>

      <div className={styles.gradeExecutiva}>
        <section className={styles.painelBranco}>
          <TituloSecao numero="01" titulo="Fila de prioridades" apoio="Ordenada por gravidade estrutural e volume observado." />
          <ol className={styles.listaPrioridades}>
            {dados.prioridades.slice(0, 5).map((area, indice) => (
              <li key={area.microarea}>
                <span className={styles.posicao}>{String(indice + 1).padStart(2, "0")}</span>
                <div>
                  <strong>Microárea {area.microarea}</strong>
                  <p>{leituraArea(area)}</p>
                </div>
                <Selo tipo={area.descasamento === null ? "estrutura" : "pressao"} />
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.painelEscuro}>
          <p className={styles.rotulo}>Como interpretar</p>
          <h2>O dado aponta onde olhar. Não decide a obra.</h2>
          <div className={styles.linhaMetodo}>
            <span>1</span><p><strong>Sinal</strong> — ausência de oferta segura e pressão registrada.</p>
          </div>
          <div className={styles.linhaMetodo}>
            <span>2</span><p><strong>Validação</strong> — acesso, capacidade instalada e demanda local.</p>
          </div>
          <div className={styles.linhaMetodo}>
            <span>3</span><p><strong>Decisão</strong> — expandir, redistribuir ou informar melhor.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function VarianteB({
  dados,
  cre,
  setCre,
  selecionada,
  setSelecionada,
}: PropsVariante & { selecionada?: Area; setSelecionada: (id: string) => void }) {
  const areasMapa = dados.prioridades.slice(0, 12);

  return (
    <main className={styles.territorial}>
      <aside className={styles.barraLateral}>
        <div className={styles.marcaCompacta}>SME<span>RJ</span></div>
        <nav aria-label="Seções do painel">
          <button className={styles.navAtivo} type="button"><span>⌖</span> Território</button>
          <button type="button"><span>≋</span> Rede</button>
          <button type="button"><span>◎</span> Unidades</button>
          <button type="button"><span>□</span> Pautas</button>
        </nav>
        <p className={styles.versao}>Leitura estrutural<br />Processos 2021–2025</p>
      </aside>

      <div className={styles.conteudoTerritorial}>
        <Cabecalho
          titulo="Onde a rede pede intervenção?"
          subtitulo="Explore os sinais, selecione um território e veja o que precisa ser confirmado."
          cre={cre}
          setCre={setCre}
        />

        <div className={styles.workspaceMapa}>
          <section className={styles.mapaAbstrato} aria-label="Mapa esquemático de áreas prioritárias">
            <div className={styles.mapaLegenda}>
              <span><i className={styles.critico} /> Sem oferta segura</span>
              <span><i className={styles.pressao} /> Pressão alta</span>
            </div>
            <div className={styles.malhaMapa}>
              {areasMapa.map((area, indice) => (
                <button
                  type="button"
                  key={area.microarea}
                  onClick={() => setSelecionada(area.microarea)}
                  className={`${area.descasamento === null ? styles.celulaCritica : styles.celulaPressao} ${
                    selecionada?.microarea === area.microarea ? styles.celulaSelecionada : ""
                  }`}
                  style={{ "--i": indice } as React.CSSProperties}
                  aria-label={`Microárea ${area.microarea}: ${leituraArea(area)}`}
                >
                  <span>{area.microarea}</span>
                  <small>{area.procura.toLocaleString("pt-BR")}</small>
                </button>
              ))}
            </div>
            <p className={styles.notaMapa}>Representação esquemática para testar a hierarquia — não preserva geografia real.</p>
          </section>

          <aside className={styles.dossie}>
            {selecionada ? (
              <>
                <p className={styles.rotulo}>Território selecionado</p>
                <h2>Microárea {selecionada.microarea}</h2>
                <Selo tipo={selecionada.descasamento === null ? "estrutura" : "pressao"} />
                <dl>
                  <div><dt>Pedidos registrados</dt><dd>{selecionada.procura.toLocaleString("pt-BR")}</dd></div>
                  <div><dt>Unidades observadas</dt><dd>{selecionada.unidades}</dd></div>
                  <div><dt>Ofertas seguras</dt><dd>{selecionada.ancoras}</dd></div>
                </dl>
                <h3>Antes de decidir</h3>
                <ul>
                  <li>Confirmar capacidade ociosa nas unidades próximas</li>
                  <li>Validar barreiras reais de deslocamento</li>
                  <li>Comparar com projeção demográfica local</li>
                </ul>
                <button type="button" className={styles.primario}>Montar diagnóstico</button>
              </>
            ) : <p>Selecione uma microárea.</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}

function VarianteC({ dados, cre, setCre }: PropsVariante) {
  const estrutural = dados.semOferta[0];
  const pressao = dados.comOferta[0];
  const comunicacao = dados.bairrosCriticos[0];

  return (
    <main className={styles.mesa}>
      <Cabecalho
        titulo="Mesa de intervenções"
        subtitulo="Compare naturezas diferentes de problema antes de disputar o mesmo orçamento."
        cre={cre}
        setCre={setCre}
      />

      <section className={styles.perguntaCentral}>
        <span>Decisão em preparação</span>
        <h1>Qual intervenção deve entrar primeiro na próxima pauta da rede?</h1>
        <p>Os sinais abaixo não são equivalentes. Cada um pede evidência e resposta diferentes.</p>
      </section>

      <section className={styles.colunasIntervencao}>
        <CartaoIntervencao
          indice="I"
          tipo="Estrutura"
          titulo={estrutural ? `Investigar expansão em ${estrutural.microarea}` : "Sem caso no recorte"}
          tese="Não há oferta historicamente segura no território observado."
          evidencia={estrutural ? `${estrutural.procura.toLocaleString("pt-BR")} pedidos · ${estrutural.unidades} unidades` : "—"}
          confirmar="Demografia, terrenos, capacidade e barreiras de acesso"
          tom="vermelho"
        />
        <CartaoIntervencao
          indice="II"
          tipo="Gestão da oferta"
          titulo={pressao ? `Reequilibrar a microárea ${pressao.microarea}` : "Sem caso no recorte"}
          tese="Existe oferta segura, mas a procura se concentra em poucas opções."
          evidencia={pressao ? `${Math.round(pressao.descasamento ?? 0).toLocaleString("pt-BR")} pedidos por oferta segura` : "—"}
          confirmar="Turnos, capacidade, reputação e acesso entre unidades"
          tom="amarelo"
        />
        <CartaoIntervencao
          indice="III"
          tipo="Informação"
          titulo={comunicacao ? `Ampliar escolhas em ${comunicacao.bairro}` : "Sem caso no recorte"}
          tese="Muitas inscrições registram uma única opção, apesar da rede disponível."
          evidencia={comunicacao ? `${Math.round(comunicacao.so_uma_opcao * 100)}% com uma opção · ${comunicacao.inscricoes.toLocaleString("pt-BR")} inscrições` : "—"}
          confirmar="Quais alternativas eram de fato viáveis para esse público"
          tom="azul"
        />
      </section>

      <section className={styles.rodapeMesa}>
        <div>
          <span>Recomendação do protótipo</span>
          <strong>Leve Estrutura para validação primeiro</strong>
          <p>É o único sinal em que melhorar informação, sozinho, não cria uma alternativa segura.</p>
        </div>
        <button type="button" className={styles.primario}>Preparar pauta executiva</button>
      </section>
    </main>
  );
}

function Cabecalho({
  titulo,
  subtitulo,
  cre,
  setCre,
}: { titulo: string; subtitulo: string; cre: Recorte; setCre: (cre: Recorte) => void }) {
  return (
    <header className={styles.cabecalhoInterno}>
      <div>
        <p className={styles.sobretitulo}>Secretaria Municipal de Educação · Rio de Janeiro</p>
        <h2>{titulo}</h2>
        <p>{subtitulo}</p>
      </div>
      <label className={styles.filtroCre}>
        <span>Recorte territorial</span>
        <select value={cre} onChange={(e) => setCre(e.target.value === "todas" ? "todas" : Number(e.target.value))}>
          <option value="todas">Rede inteira</option>
          {cres.map((item) => <option key={item} value={item}>{item}ª CRE</option>)}
        </select>
      </label>
    </header>
  );
}

function Metrica({ valor, rotulo, tom }: { valor: string; rotulo: string; tom?: "critico" }) {
  return <div className={tom === "critico" ? styles.metricaCritica : ""}><strong>{valor}</strong><span>{rotulo}</span></div>;
}

function TituloSecao({ numero, titulo, apoio }: { numero: string; titulo: string; apoio: string }) {
  return <div className={styles.tituloSecao}><span>{numero}</span><div><h2>{titulo}</h2><p>{apoio}</p></div></div>;
}

function Selo({ tipo }: { tipo: "estrutura" | "pressao" }) {
  return <span className={tipo === "estrutura" ? styles.seloEstrutura : styles.seloPressao}>{tipo === "estrutura" ? "Sem oferta segura" : "Pressão alta"}</span>;
}

function CartaoIntervencao({
  indice, tipo, titulo, tese, evidencia, confirmar, tom,
}: {
  indice: string; tipo: string; titulo: string; tese: string; evidencia: string; confirmar: string; tom: "vermelho" | "amarelo" | "azul";
}) {
  return (
    <article className={`${styles.cartaoIntervencao} ${styles[tom]}`}>
      <div className={styles.cabecalhoCartao}><span>{indice}</span><p>{tipo}</p></div>
      <h2>{titulo}</h2>
      <p className={styles.tese}>{tese}</p>
      <dl>
        <div><dt>Evidência disponível</dt><dd>{evidencia}</dd></div>
        <div><dt>Precisa confirmar</dt><dd>{confirmar}</dd></div>
      </dl>
      <button type="button">Levar para comparação <span>→</span></button>
    </article>
  );
}

function leituraArea(area: Area) {
  return area.descasamento === null
    ? `${area.procura.toLocaleString("pt-BR")} pedidos e nenhuma oferta segura`
    : `${Math.round(area.descasamento).toLocaleString("pt-BR")} pedidos por oferta segura`;
}

function montaDados(cre: Recorte) {
  const areas = microareas(cre);
  const semOferta = areas.filter((a) => a.descasamento === null);
  const comOferta = areas.filter((a) => a.descasamento !== null);
  const cobertura = calculaCobertura(true, cre);
  const bairros = bairrosDoRecorte(cre);
  const bairrosCriticos = [...bairros]
    .filter((b) => b.inscricoes >= 200)
    .sort((a, b) => b.so_uma_opcao - a.so_uma_opcao)
    .slice(0, 8);
  const unidadesRecorte = cre === "todas" ? unidadesComGeo.length : unidadesComGeo.filter((u) => u.cre === cre).length;
  const inscricoes = bairros.reduce((soma, b) => soma + b.inscricoes, 0);
  const umaOpcao = bairros.reduce((soma, b) => soma + b.inscricoes * b.so_uma_opcao, 0);

  return {
    areas,
    semOferta,
    comOferta,
    prioridades: [...semOferta.slice(0, 7), ...comOferta.slice(0, 5)],
    cobertura,
    bairrosCriticos,
    unidadesRecorte,
    percentualSemOferta: Math.round((cobertura.semAncora / Math.max(1, cobertura.total)) * 100),
    percentualUmaOpcao: Math.round((umaOpcao / Math.max(1, inscricoes)) * 100),
  };
}
