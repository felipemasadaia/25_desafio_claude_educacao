import {
  BAIRROS,
  escolhe,
  hash,
  REGUA,
  rnd,
  titulo,
  type Grupamento,
  type Horario,
  type UnidadeBruta,
} from "./dados";
import { capacidadeDa, unidadesDo, type Recorte } from "./fases";

/**
 * Fase 3 — CRM de contato ativo.
 *
 * A vaga só vira matrícula se a família for alcançada. O gargalo declarado
 * pela SME não é a vaga: é o telefone morto. Convite disparado para número
 * inválido consome o prazo, a vaga volta ao pool tarde e o ciclo fecha com
 * vaga ociosa e fila cheia ao mesmo tempo.
 *
 * Por isso o fluxo tem uma PRÉ-QUALIFICAÇÃO antes do convite: valida o
 * número primeiro, e só quem passa entra na régua de contato por telefone.
 * Quem não passa cai nas duas estratégias de resgate:
 *   1. Notificação push no aparelho — chega mesmo se a linha mudou de
 *      titular ou o plano virou pré-pago sem crédito, desde que o app
 *      esteja instalado.
 *   2. Busca ativa domiciliar — agente vai à porta do endereço da inscrição.
 *
 * TODO O CADASTRO INDIVIDUAL É FICTÍCIO. A base é anonimizada e agregada:
 * não há criança, nome, telefone nem endereço. O que ancora a simulação em
 * dado real está declarado campo a campo abaixo.
 */

/* --------------------------------------------------------- qualificação --- */

/**
 * Resultado da pré-qualificação do número.
 *
 * `valido`    — linha ativa, respondeu ao ping. Segue por telefone.
 * `push`      — linha não responde, mas o aparelho tem o app. Vai por push.
 * `sem_canal` — nada responde. Só busca ativa domiciliar resolve.
 * `pendente`  — ainda não verificado. É backlog de trabalho, não ausência.
 */
export type Qualificacao = "valido" | "push" | "sem_canal" | "pendente";

export const QUALIFICACOES: Array<{
  id: Qualificacao;
  rotulo: string;
  acao: string;
  tom: "ok" | "aviso" | "critico" | "neutro";
}> = [
  { id: "valido", rotulo: "Número válido", acao: "Ligação / WhatsApp", tom: "ok" },
  { id: "push", rotulo: "Só push", acao: "Notificação no aparelho", tom: "aviso" },
  { id: "sem_canal", rotulo: "Sem canal", acao: "Busca ativa domiciliar", tom: "critico" },
  { id: "pendente", rotulo: "Não verificado", acao: "Disparar validação", tom: "neutro" },
];

/**
 * Proporção esperada de números válidos no bairro.
 *
 * ANCORAGEM REAL: `so_uma_opcao` do bairro. Onde a família preenche uma
 * única opção, o preenchimento do cadastro é sistematicamente mais
 * precário — mesma população, mesma barreira. A correlação é hipótese de
 * produto, não achado dos dados: o gradiente é plausível, o número é
 * fictício. Faixa 55%-88%.
 */
export function taxaValidos(soUmaOpcao: number): number {
  return 0.88 - Math.min(1, Math.max(0, soUmaOpcao)) * 0.33;
}

const soUmaPorBairro = new Map(
  BAIRROS.map((b) => [b.bairro.toUpperCase().trim(), b.so_uma_opcao]),
);

export function soUmaOpcaoDe(bairro: string): number {
  return soUmaPorBairro.get(bairro.toUpperCase().trim()) ?? 0.47;
}

/* ------------------------------------------------------------- estágio ---- */

/** Etapas do funil de contato, na ordem em que acontecem. */
export const ESTAGIOS = [
  { id: "fila", rotulo: "Na fila", descricao: "Aguardando casamento com vaga" },
  { id: "qualificar", rotulo: "A qualificar", descricao: "Número ainda não validado" },
  { id: "contatar", rotulo: "A contatar", descricao: "Canal definido, convite não enviado" },
  { id: "aguardando", rotulo: "Aguardando resposta", descricao: "Convite enviado, prazo correndo" },
  { id: "aceito", rotulo: "Matrícula aceita", descricao: "Vaga confirmada" },
  { id: "perdido", rotulo: "Perdido", descricao: "Prazo vencido, recusa ou não localizado" },
] as const;

export type Estagio = (typeof ESTAGIOS)[number]["id"];

export type Contato = {
  protocolo: string;
  responsavel: string;
  crianca: string;
  telefone: string;
  qualificacao: Qualificacao;
  estagio: Estagio;
  /** Estratégia de resgate indicada quando o telefone não serve. */
  estrategia: "telefone" | "push" | "porta";
  grupamento: Grupamento;
  horario: Horario;
  unidade: string;
  unidadeNome: string;
  bairro: string;
  cre: number | null;
  microarea: string | null;
  /** Pontuação pela régua oficial. Fictícia, dentro da faixa que a régua permite. */
  pontos: number;
  /** Critérios da régua real que compõem a pontuação. */
  criterios: number[];
  diasNaFila: number;
  /** Tentativas de contato já feitas. */
  tentativas: number;
};

const PRIMEIROS_R = [
  "Ana", "Maria", "Juliana", "Camila", "Patrícia", "Fernanda", "Luciana", "Beatriz",
  "Carla", "Simone", "Rafaela", "Vanessa", "Tatiane", "Débora", "Priscila", "Aline",
  "Jéssica", "Renata", "Mônica", "Cristiane", "Sandra", "Elaine", "Bruna", "Larissa",
  "Marcos", "Rogério", "Anderson", "Wesley", "Cláudio", "Everton",
] as const;

const PRIMEIROS_C = [
  "Miguel", "Helena", "Arthur", "Alice", "Heitor", "Laura", "Théo", "Manuela",
  "Davi", "Sophia", "Gabriel", "Isabella", "Bernardo", "Luiza", "Samuel", "Cecília",
  "Enzo", "Valentina", "Nicolas", "Heloísa",
] as const;

const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Rodrigues",
  "Almeida", "Nascimento", "Carvalho", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa",
] as const;

/** Telefone fictício do Rio. Sempre 9xxxx, nunca colide com fixo real. */
function telefone(semente: string): string {
  const n = hash(semente);
  return `(21) 9${String(1000 + (n % 9000))}-${String(1000 + ((n >> 9) % 9000))}`;
}

/** Sorteia critérios da régua real coerentes com a pontuação. */
function criteriosDe(semente: string): { criterios: number[]; pontos: number } {
  const marcados: number[] = [];
  let pontos = 0;
  for (const c of REGUA) {
    // Critérios de peso alto são raros; os de peso baixo, comuns.
    const prob = c.pontos >= 25 ? 0.18 : c.pontos >= 4 ? 0.22 : 0.3;
    if (rnd(`${semente}|c${c.perg_id}`) < prob) {
      marcados.push(c.perg_id);
      pontos += c.pontos;
    }
  }
  return { criterios: marcados, pontos };
}

function qualificacaoDe(semente: string, taxa: number): Qualificacao {
  const s = rnd(`${semente}|qual`);
  // 14% ficam por verificar de propósito: é o backlog que a tela mostra
  // como trabalho pendente, não como dado faltando.
  if (s > 0.86) return "pendente";
  if (s < taxa) return "valido";
  // Do que sobra, dois terços ainda são alcançáveis por push.
  return rnd(`${semente}|push`) < 0.66 ? "push" : "sem_canal";
}

const ESTRATEGIA: Record<Qualificacao, Contato["estrategia"]> = {
  valido: "telefone",
  push: "push",
  sem_canal: "porta",
  pendente: "telefone",
};

/**
 * Em que estágio o contato está.
 *
 * Quem não foi qualificado trava em "a qualificar", e quem não tem canal
 * de telefone anda mais devagar — é exatamente o gargalo que a tela precisa
 * evidenciar: não se convida quem não se alcança.
 */
function estagioDe(semente: string, q: Qualificacao): Estagio {
  if (q === "pendente") return "qualificar";
  const s = rnd(`${semente}|est`);
  if (q === "valido") {
    if (s < 0.14) return "fila";
    if (s < 0.3) return "contatar";
    if (s < 0.58) return "aguardando";
    if (s < 0.88) return "aceito";
    return "perdido";
  }
  if (q === "push") {
    if (s < 0.22) return "fila";
    if (s < 0.52) return "contatar";
    if (s < 0.78) return "aguardando";
    if (s < 0.9) return "aceito";
    return "perdido";
  }
  // sem_canal: só sai da fila com busca ativa, e a maior parte não sai.
  if (s < 0.34) return "fila";
  if (s < 0.68) return "contatar";
  if (s < 0.82) return "aguardando";
  if (s < 0.89) return "aceito";
  return "perdido";
}

/**
 * Gera a fila de uma unidade.
 *
 * O tamanho vem de dado real: `opcoes_2025 × (1 - chance)` é quanto daquela
 * procura a unidade historicamente NÃO atende — a fila de espera dela.
 */
export function filaDaUnidade(u: UnidadeBruta, limite: number): Contato[] {
  const chance = u.chance_hist ?? 0.5;
  const tamanho = Math.min(limite, Math.max(1, Math.round(u.opcoes_2025 * (1 - chance) / 6)));
  const bairro = u.bairro ?? "";
  const taxa = taxaValidos(soUmaOpcaoDe(bairro));
  const recortes = capacidadeDa(u);

  return Array.from({ length: tamanho }, (_, i) => {
    const s = `${u.codigo}|${i}`;
    const r = recortes[i % Math.max(1, recortes.length)];
    const q = qualificacaoDe(s, taxa);
    const { criterios, pontos } = criteriosDe(s);

    return {
      protocolo: `${2026}${String(hash(s) % 1000000).padStart(6, "0")}`,
      responsavel: `${escolhe(PRIMEIROS_R, `${s}|pr`)} ${escolhe(SOBRENOMES, `${s}|sr`)}`,
      crianca: `${escolhe(PRIMEIROS_C, `${s}|pc`)} ${escolhe(SOBRENOMES, `${s}|sr`)}`,
      telefone: telefone(s),
      qualificacao: q,
      estagio: estagioDe(s, q),
      estrategia: ESTRATEGIA[q],
      grupamento: (r?.grupamento ?? "Berçário") as Grupamento,
      horario: (r?.horario ?? "Integral") as Horario,
      unidade: u.codigo,
      unidadeNome: titulo(u.nome),
      bairro,
      cre: u.cre,
      microarea: u.microarea,
      pontos,
      criterios,
      diasNaFila: 2 + Math.floor(rnd(`${s}|d`) * 140),
      tentativas: Math.floor(rnd(`${s}|t`) * 4),
    };
  });
}

/**
 * Fila do recorte, e quanto dela a tela mostra.
 *
 * Materializar a fila inteira seriam dezenas de milhares de objetos por
 * render. O corte é por unidade, ordenado por procura — é onde o convite de
 * fato acontece.
 *
 * O limite ACOMPANHA o recorte: com um teto fixo, a rede inteira e uma CRE
 * sozinha exibiriam quase a mesma fila, e o gestor leria que aquela CRE é a
 * rede toda. A amostra da rede cobre mais unidades justamente para a
 * comparação entre recortes continuar honesta.
 *
 * `cobertura` devolve o que ficou de fora, para a tela declarar o corte em
 * vez de apresentar a amostra como se fosse o total.
 */
export type FilaRecorte = {
  contatos: Contato[];
  /** Unidades com procura no recorte. */
  unidadesTotal: number;
  /** Unidades efetivamente amostradas. */
  unidadesAmostradas: number;
};

export function filaDoRecorte(r: Recorte, porUnidade = 9): FilaRecorte {
  const comProcura = unidadesDo(r)
    .filter((u) => u.opcoes_2025 > 0)
    .sort((a, b) => b.opcoes_2025 - a.opcoes_2025);

  const maxUnidades = r.cre === "todas" ? 260 : 70;
  const amostra = comProcura.slice(0, maxUnidades);

  return {
    contatos: amostra.flatMap((u) => filaDaUnidade(u, porUnidade)),
    unidadesTotal: comProcura.length,
    unidadesAmostradas: amostra.length,
  };
}

export type ResumoCrm = {
  total: number;
  porQualificacao: Record<Qualificacao, number>;
  porEstagio: Record<Estagio, number>;
  /** Alcançáveis por telefone. */
  alcancaveis: number;
  /** Exigem push ou porta. */
  resgate: number;
};

export function resumoCrm(contatos: Contato[]): ResumoCrm {
  const porQualificacao = { valido: 0, push: 0, sem_canal: 0, pendente: 0 } as Record<
    Qualificacao,
    number
  >;
  const porEstagio = {
    fila: 0, qualificar: 0, contatar: 0, aguardando: 0, aceito: 0, perdido: 0,
  } as Record<Estagio, number>;

  for (const c of contatos) {
    porQualificacao[c.qualificacao]++;
    porEstagio[c.estagio]++;
  }

  return {
    total: contatos.length,
    porQualificacao,
    porEstagio,
    alcancaveis: porQualificacao.valido,
    resgate: porQualificacao.push + porQualificacao.sem_canal,
  };
}

/** Texto do critério da régua, para explicar a pontuação de um contato. */
export function textoCriterio(id: number): string {
  return REGUA.find((c) => c.perg_id === id)?.texto ?? "";
}

export function pontosCriterio(id: number): number {
  return REGUA.find((c) => c.perg_id === id)?.pontos ?? 0;
}
