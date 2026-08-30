import { unidadesComGeo } from "./catalogo";
import type { Recorte } from "./territorio";
import type { Grupamento, Horario, Unidade } from "./recomendador/tipos";

/**
 * Camada operacional da SME: vaga vacante, fila de espera e trilha de convites.
 *
 * ATENÇÃO — esta camada é SIMULADA, e a interface declara isso em toda tela.
 * O painel analítico responde "onde falta"; esta camada responde "quem eu
 * chamo agora". São perguntas diferentes e bases diferentes.
 *
 * O catálogo é agregado e anonimizado: não traz vaga ofertada por unidade
 * (`matriculas` só existe em 74 de 872), não traz criança identificada e não
 * traz contato. Nada disso pode ser extraído da base — então é gerado aqui.
 *
 * O que ancora a simulação em dado real, e por quê:
 *
 * - **A folga por unidade** vem de `chance_hist` e `opcoes_2025`, que são
 *   reais. Uma unidade com chance alta e procura baixa tem folga; a vaga
 *   vacante é essa folga convertida em contagem.
 * - **O tamanho da fila** vem de `opcoes_2025 × (1 - chance)`: quantos
 *   pedidos aquela unidade recebeu e historicamente não atende.
 * - **A distribuição por grupamento** vem de `por_grupamento`, real.
 * - **A taxa de contato ativo** varia por bairro segundo `so_uma_opcao` do
 *   catálogo real — bairro onde a família preenche uma opção só é o mesmo
 *   onde o cadastro é mais precário. A correlação é hipótese de produto,
 *   não achado dos dados; o número é fictício, o gradiente é plausível.
 *
 * Determinístico de propósito: mesma unidade produz sempre a mesma fila, em
 * qualquer recarga. Um mock que muda a cada render não serve para demonstrar
 * um pipeline, onde o gestor precisa reencontrar o caso que estava vendo.
 */

/* --------------------------------------------------------- determinismo ---- */

/**
 * Hash estável de string para inteiro (FNV-1a de 32 bits).
 *
 * Não usa `Math.random`: o mock precisa ser reprodutível entre renders, entre
 * servidor e cliente (senão o Next acusa divergência de hidratação) e entre
 * sessões do gestor.
 */
function hash(semente: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pseudoaleatório em [0,1) a partir de uma semente textual. */
function aleatorio(semente: string): number {
  return hash(semente) / 0x100000000;
}

/** Escolhe determinsticamente um item da lista. */
function escolhe<T>(lista: readonly T[], semente: string): T {
  return lista[hash(semente) % lista.length];
}

/* -------------------------------------------------------------- vagas ------ */

/**
 * Vagas vacantes de uma unidade, por grupamento e horário.
 *
 * A contagem é derivada da folga histórica real: chance alta significa que
 * quem pede costuma entrar, o que na prática é oferta sobrando em relação à
 * procura daquele recorte.
 */
export type VagaVacante = {
  grupamento: Grupamento;
  horario: Horario;
  vagas: number;
  /** Pedidos reais naquele recorte, do catálogo. */
  procura: number;
  /** Chance histórica real do recorte. */
  chance: number;
};

export type UnidadeOperacional = {
  codigo: string;
  nome: string;
  bairro: string;
  cre: number | null;
  microarea: string | null;
  lat: number;
  lng: number;
  /** Total de vagas vacantes simuladas na unidade. */
  vagas: number;
  /** Detalhe por grupamento × horário. */
  porRecorte: VagaVacante[];
  /** Famílias esperando: pedidos que historicamente não são atendidos. */
  fila: number;
  /** Chance histórica real da unidade. */
  chanceHist: number | null;
  /** Procura real no ano-alvo. */
  procura: number;
};

/**
 * Fração da procura que vira vaga vacante.
 *
 * Calibrada para que a rede inteira feche em ordem de grandeza plausível
 * (alguns milhares de vagas ociosas), não para reproduzir um número da SME —
 * que não existe na base.
 */
const FATOR_VAGA = 0.22;

/** Só recortes com amostra mínima entram: abaixo disso a chance é ruído. */
const MIN_AMOSTRA_RECORTE = 10;

function vagasDoRecorte(u: Unidade, r: Unidade["por_grupamento"][number]): number {
  if (r.opcoes < MIN_AMOSTRA_RECORTE) return 0;
  // Folga = o quanto a chance passa da metade. Chance <= 50% não sobra vaga:
  // ali a fila é maior que a oferta, por definição de âncora.
  const folga = Math.max(0, r.chance - 0.5) * 2;
  const base = r.opcoes * folga * FATOR_VAGA;
  // Ruído determinístico de ±25% para a tela não parecer uma fórmula linear.
  const ruido = 0.75 + aleatorio(`${u.codigo}|${r.grupamento}|${r.horario}`) * 0.5;
  return Math.round(base * ruido);
}

/** Fila de espera: pedidos que a unidade historicamente não atende. */
function filaDaUnidade(u: Unidade): number {
  const chance = u.chance_hist ?? 0.5;
  return Math.round(u.opcoes_2025 * (1 - chance));
}

export function unidadesOperacionais(cre: Recorte): UnidadeOperacional[] {
  const alvo = cre === "todas" ? unidadesComGeo : unidadesComGeo.filter((u) => u.cre === cre);

  return alvo
    .map((u) => {
      const porRecorte = u.por_grupamento
        .map((r) => ({
          grupamento: r.grupamento as Grupamento,
          horario: r.horario as Horario,
          vagas: vagasDoRecorte(u, r),
          procura: r.opcoes,
          chance: r.chance,
        }))
        .filter((r) => r.vagas > 0);

      return {
        codigo: u.codigo,
        nome: u.nome ?? "Unidade sem nome",
        bairro: u.bairro ?? "",
        cre: u.cre,
        microarea: u.microarea,
        lat: u.lat as number,
        lng: u.lng as number,
        vagas: porRecorte.reduce((s, r) => s + r.vagas, 0),
        porRecorte,
        fila: filaDaUnidade(u),
        chanceHist: u.chance_hist,
        procura: u.opcoes_2025,
      };
    })
    .sort((a, b) => b.vagas - a.vagas);
}

/* --------------------------------------------------------------- fila ------ */

/**
 * Situação do contato de uma família.
 *
 * A verificação prévia existe porque disparar convite para número morto
 * consome a vaga: a família não responde, o prazo vence, e a vaga volta ao
 * pool tarde demais para ser reofertada no mesmo ciclo.
 */
export type SituacaoContato = "ativo" | "inativo" | "nao_verificado";

/** Etapas da trilha de convite, na ordem em que acontecem. */
export const ETAPAS = [
  { id: "elegivel", rotulo: "Elegível", descricao: "Vaga casou com família da fila" },
  { id: "verificado", rotulo: "Contato ativo", descricao: "WhatsApp respondeu ao ping" },
  { id: "convidado", rotulo: "Convite enviado", descricao: "Aguardando resposta" },
  { id: "aceito", rotulo: "Aceite", descricao: "Vaga confirmada" },
  { id: "perdido", rotulo: "Sem resposta", descricao: "Prazo vencido ou recusa" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["id"];

export type Inscricao = {
  /** Protocolo fictício, estável por família. */
  protocolo: string;
  /** Nome fictício. A base real é anonimizada. */
  nome: string;
  /** Telefone fictício, com DDD do Rio. */
  telefone: string;
  contato: SituacaoContato;
  etapa: Etapa;
  grupamento: Grupamento;
  horario: Horario;
  /** Unidade pretendida. */
  unidade: string;
  unidadeNome: string;
  bairro: string;
  cre: number | null;
  /** Pontuação da régua vigente. Fictícia, na faixa que a régua permite. */
  pontos: number;
  /** Dias esperando desde a inscrição. */
  diasNaFila: number;
};

const PRIMEIROS = [
  "Ana", "Maria", "Juliana", "Camila", "Patrícia", "Fernanda", "Luciana", "Beatriz",
  "Carla", "Simone", "Rafaela", "Vanessa", "Tatiane", "Débora", "Priscila", "Aline",
  "Jéssica", "Renata", "Mônica", "Cristiane", "Sandra", "Elaine", "Bruna", "Larissa",
] as const;

const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Rodrigues",
  "Almeida", "Nascimento", "Carvalho", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa",
] as const;

/**
 * Proporção de contatos ativos no bairro.
 *
 * Hipótese de produto, não achado: onde a família preenche uma opção só, o
 * cadastro tende a ser mais precário. Usa `so_uma_opcao` real do bairro como
 * gradiente, entre 55% e 88%.
 */
export function taxaContatoAtivo(soUmaOpcao: number): number {
  return 0.88 - Math.min(1, Math.max(0, soUmaOpcao)) * 0.33;
}

/** Telefone fictício, formato do Rio. Sempre 9xxxx para não colidir com fixo real. */
function telefoneFicticio(semente: string): string {
  const n = hash(semente);
  const bloco1 = String(90000 + (n % 10000)).slice(0, 5);
  const bloco2 = String(1000 + ((n >> 8) % 9000));
  return `(21) ${bloco1}-${bloco2}`;
}

/**
 * Gera a fila de uma unidade.
 *
 * `quantidade` limita o custo: a fila real de uma unidade grande passa de
 * 100 famílias, e materializar todas para todas as unidades geraria dezenas
 * de milhares de objetos por render sem nada aparecer na tela.
 */
function filaDaUnidadeDetalhada(
  u: UnidadeOperacional,
  soUmaOpcao: number,
  quantidade: number,
): Inscricao[] {
  const taxa = taxaContatoAtivo(soUmaOpcao);
  const recortes = u.porRecorte.length > 0 ? u.porRecorte : null;

  return Array.from({ length: quantidade }, (_, i) => {
    const s = `${u.codigo}|${i}`;
    const r = recortes ? recortes[i % recortes.length] : null;

    const sorteioContato = aleatorio(`${s}|contato`);
    // 12% ficam por verificar de propósito: é o backlog que a tela precisa
    // mostrar como trabalho pendente, não como ausência de dado.
    const contato: SituacaoContato =
      sorteioContato > 0.88 ? "nao_verificado" : sorteioContato < taxa ? "ativo" : "inativo";

    return {
      protocolo: `2025${String(hash(s) % 1000000).padStart(6, "0")}`,
      nome: `${escolhe(PRIMEIROS, `${s}|p`)} ${escolhe(SOBRENOMES, `${s}|s`)}`,
      telefone: telefoneFicticio(s),
      contato,
      etapa: etapaDe(s, contato),
      grupamento: (r?.grupamento ?? "Berçário") as Grupamento,
      horario: (r?.horario ?? "Integral") as Horario,
      unidade: u.codigo,
      unidadeNome: u.nome,
      bairro: u.bairro,
      cre: u.cre,
      pontos: Math.round(aleatorio(`${s}|pts`) * 16),
      diasNaFila: 3 + Math.floor(aleatorio(`${s}|dias`) * 120),
    };
  });
}

/**
 * Em que etapa a família está.
 *
 * Contato inativo trava em "elegível": é exatamente o gargalo que a tela
 * precisa evidenciar — não dá para convidar quem não se consegue alcançar.
 */
function etapaDe(semente: string, contato: SituacaoContato): Etapa {
  if (contato !== "ativo") return "elegivel";
  const s = aleatorio(`${semente}|etapa`);
  if (s < 0.28) return "verificado";
  if (s < 0.62) return "convidado";
  if (s < 0.86) return "aceito";
  return "perdido";
}

/* ------------------------------------------------------------ agregados ---- */

export type ResumoOperacao = {
  /** Vagas vacantes simuladas no recorte. */
  vagas: number;
  /** Unidades com ao menos uma vaga. */
  unidadesComVaga: number;
  /** Famílias na fila (soma das filas das unidades). */
  fila: number;
  /** Contagem por etapa da trilha. */
  porEtapa: Record<Etapa, number>;
  /** Contatos por situação. */
  contatos: Record<SituacaoContato, number>;
};

export function resumoOperacao(inscricoes: Inscricao[], unidades: UnidadeOperacional[]): ResumoOperacao {
  const porEtapa = { elegivel: 0, verificado: 0, convidado: 0, aceito: 0, perdido: 0 } as Record<
    Etapa,
    number
  >;
  const contatos = { ativo: 0, inativo: 0, nao_verificado: 0 } as Record<SituacaoContato, number>;

  for (const i of inscricoes) {
    porEtapa[i.etapa]++;
    contatos[i.contato]++;
  }

  return {
    vagas: unidades.reduce((s, u) => s + u.vagas, 0),
    unidadesComVaga: unidades.filter((u) => u.vagas > 0).length,
    fila: unidades.reduce((s, u) => s + u.fila, 0),
    porEtapa,
    contatos,
  };
}

/**
 * Fila materializada do recorte.
 *
 * Amostra as unidades com mais vaga: são as que de fato geram convite. O
 * limite existe para a tela não montar dezenas de milhares de linhas — e o
 * número real da fila continua disponível em `resumoOperacao`.
 */
export function filaDoRecorte(
  unidades: UnidadeOperacional[],
  soUmaOpcaoPorBairro: Map<string, number>,
  limiteUnidades = 60,
  porUnidade = 8,
): Inscricao[] {
  return unidades
    .filter((u) => u.vagas > 0)
    .slice(0, limiteUnidades)
    .flatMap((u) =>
      filaDaUnidadeDetalhada(
        u,
        soUmaOpcaoPorBairro.get(u.bairro) ?? 0.47,
        Math.min(porUnidade, Math.max(1, Math.ceil(u.fila / 12))),
      ),
    );
}
