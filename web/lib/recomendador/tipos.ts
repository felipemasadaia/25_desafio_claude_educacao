/**
 * Vocabulário do domínio, conforme a spec.
 *
 * Termos usados de forma consistente em código, interface e testes.
 * Não renomear sem atualizar a spec e o CONTEXT.md.
 */

/** Faixa etária curricular. */
export type Grupamento = "Berçário" | "Maternal I" | "Maternal II";

export type Horario = "Integral" | "Parcial";

/** Como a família se desloca. Define o alcance. */
export type Modal = "pe" | "transporte" | "carro";

/** Função de cada unidade na carteira. */
export type Papel = "sonho" | "equilibrio" | "ancora";

/**
 * Faixa qualitativa de chance.
 *
 * A chance nunca é apresentada como número pontual: a simulação acerta a
 * direção e erra a magnitude. Cravar posição e a família não entrar destrói
 * a confiança no serviço.
 */
export type FaixaChance = "alta" | "media" | "baixa" | "minima";

/** Recorte de chance por grupamento × horário dentro de uma unidade. */
export type RecorteUnidade = {
  grupamento: string;
  horario: string;
  opcoes: number;
  chance: number;
};

/** Creche ou escola que oferece vaga de creche. */
export type Unidade = {
  codigo: string;
  nome: string | null;
  tipo: string | null;
  cre: number | null;
  microarea: string | null;
  bairro: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  /** Chance histórica out-of-sample: só processos anteriores ao ano-alvo. */
  chance_hist: number | null;
  n_hist: number;
  /** Amostra histórica suficiente (>= 30 opções). Não confiável nunca vira âncora. */
  confiavel: boolean;
  opcoes_2025: number;
  criancas_2025: number;
  taxa_2025: number | null;
  matriculas: Record<string, number>;
  por_grupamento: RecorteUnidade[];
};

export type Bairro = {
  bairro: string;
  inscricoes: number;
  media_opcoes: number;
  so_uma_opcao: number;
  taxa_sucesso: number;
};

export type CriterioPontuacao = {
  perg_id: number;
  texto: string;
  pontos: number;
};

export type IndicadorAnual = {
  ano: number;
  inscricoes: number;
  media_opcoes: number;
  so_uma_opcao: number;
  taxa_sucesso: number;
};

export type Catalogo = {
  ano_alvo: number;
  gerado_de: string;
  unidades: Unidade[];
  bairros: Bairro[];
  regua_pontuacao: CriterioPontuacao[];
  serie_anual: IndicadorAnual[];
};

/**
 * Ponto de referência marcado pela família no mapa (casa, trabalho, casa de
 * parente). Distinto de âncora da carteira.
 */
export type AncoraLocalizacao = {
  id: string;
  rotulo: string;
  lat: number;
  lng: number;
};

/** Entrada do motor: tudo que a família declarou. */
export type Perfil = {
  /** Ordenadas por prioridade: a primeira pesa mais. */
  ancoras: AncoraLocalizacao[];
  modal: Modal;
  grupamento: Grupamento;
  horario: Horario;
  /** perg_id dos critérios marcados no questionário. */
  criterios: number[];
  precisaAcessibilidade: boolean;
};

/** Uma unidade dentro da carteira, com os dois eixos separados. */
export type ItemCarteira = {
  unidade: Unidade;
  papel: Papel;
  /** Probabilidade estimada para ESTE perfil nesta unidade. Par (família, unidade). */
  chance: number;
  faixa: FaixaChance;
  /** Adequação à rotina: trajeto, grupamento, horário, acessibilidade. 0..1 */
  encaixe: number;
  /** A âncora de localização que justifica esta unidade. */
  justificadaPor: AncoraLocalizacao;
  distanciaKm: number;
  minutos: number;
  /** O motivo, em uma frase, para a família poder discordar. */
  explicacao: string;
};

export type Carteira = {
  itens: ItemCarteira[];
  /** Probabilidade de conseguir ao menos uma vaga com a carteira inteira. */
  probabilidadeAgregada: number;
  /** Não existe âncora da carteira dentro do alcance. Declarado, nunca mascarado. */
  deficitTerritorial: boolean;
  /** A melhor chance real disponível, quando há déficit. */
  melhorChanceDisponivel: number | null;
  pontuacao: number;
  /** Unidades no alcance que não entraram — material para troca manual. */
  alternativas: ItemCarteira[];
};
