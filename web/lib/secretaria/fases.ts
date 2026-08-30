import {
  ANO_ALVO,
  BAIRROS,
  CRES,
  eSegura,
  hash,
  MIN_AMOSTRA,
  rnd,
  SERIE,
  UNIDADES,
  type BairroBruto,
  type Grupamento,
  type Horario,
  type UnidadeBruta,
} from "./dados";

/** Recorte territorial ativo em toda a plataforma. */
export type Recorte = { cre: number | "todas" };

export function unidadesDo(r: Recorte): UnidadeBruta[] {
  return r.cre === "todas" ? UNIDADES : UNIDADES.filter((u) => u.cre === r.cre);
}

/* ===================================================== FASE 1 — PRÉ ======= */

/**
 * Capacidade declarada de uma unidade para o próximo ciclo.
 *
 * Real: `matriculas` (grupamento|horário -> vagas), mas só existe em 74 das
 * 872 unidades. Onde falta, a capacidade é ESTIMADA a partir da procura
 * histórica e da taxa de atendimento — `opcoes × chance` é, por construção,
 * quantos daquele recorte a unidade de fato absorveu. É a melhor proxy que
 * a base sustenta; derivar do tipo da unidade seria inventar dado.
 */
export type Capacidade = {
  grupamento: Grupamento;
  horario: Horario;
  vagas: number;
  /** true quando veio de `matriculas`; false quando foi estimada. */
  declarada: boolean;
  procura: number;
  chance: number;
};

export function capacidadeDa(u: UnidadeBruta): Capacidade[] {
  return u.por_grupamento.map((r) => {
    const chave = `${r.grupamento}|${r.horario}`;
    const declarada = u.matriculas[chave];
    return {
      grupamento: r.grupamento as Grupamento,
      horario: r.horario as Horario,
      vagas: declarada ?? Math.max(1, Math.round(r.opcoes * r.chance)),
      declarada: declarada !== undefined,
      procura: r.opcoes,
      chance: r.chance,
    };
  });
}

/**
 * Estado de preenchimento do formulário de pré-inscrição pela unidade.
 *
 * SIMULADO. A base não registra o ciclo administrativo. O gradiente é
 * ancorado em sinal real: unidade com `matriculas` declarada já provou que
 * reporta, então confirma cedo; sem histórico confiável, atrasa.
 */
export type StatusPre = "confirmada" | "parcial" | "pendente";

export function statusPre(u: UnidadeBruta): StatusPre {
  const temDeclarado = Object.keys(u.matriculas).length > 0;
  const s = rnd(`pre|${u.codigo}`);
  if (temDeclarado) return s < 0.82 ? "confirmada" : "parcial";
  if (!u.confiavel || u.n_hist < MIN_AMOSTRA) return s < 0.45 ? "pendente" : "parcial";
  if (s < 0.58) return "confirmada";
  if (s < 0.85) return "parcial";
  return "pendente";
}

export type LinhaPre = {
  codigo: string;
  nome: string;
  tipo: string | null;
  cre: number | null;
  microarea: string | null;
  bairro: string;
  status: StatusPre;
  /** Total de vagas do próximo ciclo. */
  vagas: number;
  /** Quantas vagas vêm de declaração real, não de estimativa. */
  vagasDeclaradas: number;
  capacidade: Capacidade[];
  procura: number;
  chance: number | null;
  segura: boolean;
  /** Vagas menos procura: negativo = a unidade não dá conta do que pedem. */
  saldo: number;
};

export function preInscricao(r: Recorte): LinhaPre[] {
  return unidadesDo(r)
    .map((u) => {
      const cap = capacidadeDa(u);
      const vagas = cap.reduce((s, c) => s + c.vagas, 0);
      return {
        codigo: u.codigo,
        nome: u.nome ?? "Unidade sem nome",
        tipo: u.tipo,
        cre: u.cre,
        microarea: u.microarea,
        bairro: u.bairro ?? "",
        status: statusPre(u),
        vagas,
        vagasDeclaradas: cap.filter((c) => c.declarada).reduce((s, c) => s + c.vagas, 0),
        capacidade: cap,
        procura: u.opcoes_2025,
        chance: u.chance_hist,
        segura: eSegura(u),
        saldo: vagas - u.opcoes_2025,
      };
    })
    .sort((a, b) => a.saldo - b.saldo);
}

/**
 * Projeção de inscrições para o próximo ciclo.
 *
 * Real: a série anual 2021-2025. A projeção é a média dos três últimos anos
 * — não uma regressão: com cinco pontos e uma pandemia no meio, tendência
 * seria overfitting apresentado como previsão.
 */
export function projecao(): { inscricoes: number; base: number[]; variacao: number } {
  const ultimos = SERIE.slice(-3).map((a) => a.inscricoes);
  const media = Math.round(ultimos.reduce((s, v) => s + v, 0) / ultimos.length);
  const atual = SERIE[SERIE.length - 1].inscricoes;
  return { inscricoes: media, base: ultimos, variacao: (media - atual) / atual };
}

export type ResumoPre = {
  unidades: number;
  vagas: number;
  vagasDeclaradas: number;
  confirmadas: number;
  parciais: number;
  pendentes: number;
  /** Unidades cuja procura histórica supera a capacidade do próximo ciclo. */
  sobrecarregadas: number;
};

export function resumoPre(linhas: LinhaPre[]): ResumoPre {
  return {
    unidades: linhas.length,
    vagas: linhas.reduce((s, l) => s + l.vagas, 0),
    vagasDeclaradas: linhas.reduce((s, l) => s + l.vagasDeclaradas, 0),
    confirmadas: linhas.filter((l) => l.status === "confirmada").length,
    parciais: linhas.filter((l) => l.status === "parcial").length,
    pendentes: linhas.filter((l) => l.status === "pendente").length,
    sobrecarregadas: linhas.filter((l) => l.saldo < 0).length,
  };
}

/* ===================================================== FASE 2 — DEMANDA === */

/**
 * Descompasso entre o que as famílias pedem e o que a rede oferece, por
 * microárea — o recorte de planejamento que de fato aloca vaga.
 *
 * Tudo real: procura (`opcoes_2025`), capacidade (declarada ou estimada) e
 * apostas seguras (chance histórica >= 50% com amostra confiável).
 *
 * A razão procura/vaga é o sinal principal. Microárea sem nenhuma aposta
 * segura é categoria própria, nunca um número grande: sem denominador a
 * razão não existe, e forjar um esconde a diferença entre "disputado" e
 * "não tem onde apostar".
 */
export type Descompasso = {
  microarea: string;
  cre: number | null;
  bairros: string[];
  unidades: number;
  procura: number;
  vagas: number;
  seguras: number;
  /** Procura por vaga. > 1 significa fila maior que a oferta. */
  pressao: number;
  /** Vagas menos procura. Negativo é déficit. */
  saldo: number;
  /** Sem nenhuma aposta segura no território. */
  semAposta: boolean;
};

export function descompasso(r: Recorte): Descompasso[] {
  const mapa = new Map<string, Descompasso & { _bairros: Set<string> }>();

  for (const u of unidadesDo(r)) {
    if (!u.microarea) continue;
    const atual =
      mapa.get(u.microarea) ??
      {
        microarea: u.microarea,
        cre: u.cre,
        bairros: [],
        _bairros: new Set<string>(),
        unidades: 0,
        procura: 0,
        vagas: 0,
        seguras: 0,
        pressao: 0,
        saldo: 0,
        semAposta: true,
      };

    atual.unidades++;
    atual.procura += u.opcoes_2025;
    atual.vagas += capacidadeDa(u).reduce((s, c) => s + c.vagas, 0);
    if (eSegura(u)) atual.seguras++;
    if (u.bairro) atual._bairros.add(u.bairro);
    mapa.set(u.microarea, atual);
  }

  return [...mapa.values()]
    .map((m) => ({
      ...m,
      bairros: [...m._bairros],
      pressao: m.vagas > 0 ? m.procura / m.vagas : Infinity,
      saldo: m.vagas - m.procura,
      semAposta: m.seguras === 0,
    }))
    .sort((a, b) => b.pressao - a.pressao);
}

/**
 * Demanda por grupamento × horário no recorte.
 *
 * Real. É o corte que muda a decisão: uma CRE pode ter saldo total positivo
 * e ainda assim não ter uma vaga de Berçário Integral, que é onde a fila
 * aperta.
 */
export type CorteDemanda = {
  grupamento: Grupamento;
  horario: Horario;
  procura: number;
  vagas: number;
  pressao: number;
};

export function porGrupamento(r: Recorte): CorteDemanda[] {
  const mapa = new Map<string, CorteDemanda>();
  for (const u of unidadesDo(r)) {
    for (const c of capacidadeDa(u)) {
      const k = `${c.grupamento}|${c.horario}`;
      const atual =
        mapa.get(k) ??
        { grupamento: c.grupamento, horario: c.horario, procura: 0, vagas: 0, pressao: 0 };
      atual.procura += c.procura;
      atual.vagas += c.vagas;
      mapa.set(k, atual);
    }
  }
  return [...mapa.values()]
    .map((c) => ({ ...c, pressao: c.vagas > 0 ? c.procura / c.vagas : Infinity }))
    .sort((a, b) => b.procura - a.procura);
}

/**
 * Bairros com inscrição registrada e nenhuma unidade no catálogo.
 *
 * Real e deliberadamente exposto: é o caso mais grave — demanda sem
 * nenhuma oferta —, e some-lo do recorte esconderia exatamente o que a
 * Secretaria precisa ver.
 */
export function bairrosSemOferta(): BairroBruto[] {
  const comUnidade = new Set(
    UNIDADES.map((u) => (u.bairro ?? "").toUpperCase().trim()).filter(Boolean),
  );
  return BAIRROS.filter((b) => !comUnidade.has(b.bairro.toUpperCase().trim())).sort(
    (a, b) => b.inscricoes - a.inscricoes,
  );
}

/** CREs ordenadas por pressão, para a visão de rede. */
export function pressaoPorCre(): Array<{
  cre: number;
  procura: number;
  vagas: number;
  pressao: number;
  unidades: number;
  seguras: number;
}> {
  return CRES.map((cre) => {
    const us = UNIDADES.filter((u) => u.cre === cre);
    const vagas = us.reduce(
      (s, u) => s + capacidadeDa(u).reduce((t, c) => t + c.vagas, 0),
      0,
    );
    const procura = us.reduce((s, u) => s + u.opcoes_2025, 0);
    return {
      cre,
      procura,
      vagas,
      pressao: vagas > 0 ? procura / vagas : Infinity,
      unidades: us.length,
      seguras: us.filter(eSegura).length,
    };
  }).sort((a, b) => b.pressao - a.pressao);
}

export { ANO_ALVO, hash };
