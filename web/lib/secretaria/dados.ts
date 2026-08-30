import bruto from "@/data/creches.json";

/**
 * Camada de dados da plataforma da Secretaria.
 *
 * Independente do resto do app de propósito: o recomendador responde
 * "que creche a família escolhe"; aqui a pergunta é "como a Secretaria
 * conduz o ciclo de matrícula, da pré-inscrição ao contato porta a porta".
 *
 * O que é REAL (base CIT-SME-RJ/dadoscreche, 2021-2025, anonimizada):
 *   unidade, CRE, microárea, bairro, coordenada, procura por unidade e por
 *   grupamento x horário, chance histórica, série anual de inscrições,
 *   régua de pontuação oficial.
 *
 * O que é SIMULADO, e por quê: a base é agregada e anonimizada — não traz
 * criança identificada, nem telefone, nem status de contato. Sem isso não
 * existe CRM nenhum. A simulação é determinística (hash da chave, nunca
 * Math.random) para o gestor reencontrar o mesmo caso a cada recarga, e
 * cada campo fictício é ancorado num sinal real, declarado no comentário.
 */

/* ------------------------------------------------------------- tipos ------ */

export type Grupamento = "Berçário" | "Maternal I" | "Maternal II";
export type Horario = "Integral" | "Parcial";

export type RecorteUnidade = {
  grupamento: string;
  horario: string;
  opcoes: number;
  chance: number;
  n_hist: number;
};

export type UnidadeBruta = {
  codigo: string;
  nome: string | null;
  tipo: string | null;
  cre: number | null;
  microarea: string | null;
  bairro: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  chance_hist: number | null;
  n_hist: number;
  confiavel: boolean;
  opcoes_2025: number;
  criancas_2025: number;
  taxa_2025: number | null;
  matriculas: Record<string, number>;
  por_grupamento: RecorteUnidade[];
};

export type BairroBruto = {
  bairro: string;
  inscricoes: number;
  media_opcoes: number;
  so_uma_opcao: number;
  taxa_sucesso: number;
};

export type AnoBruto = {
  ano: number;
  inscricoes: number;
  media_opcoes: number;
  so_uma_opcao: number;
  taxa_sucesso: number;
};

export type CriterioRegua = { perg_id: number; texto: string; pontos: number };

type Base = {
  ano_alvo: number;
  gerado_de: string;
  unidades: UnidadeBruta[];
  bairros: BairroBruto[];
  regua_pontuacao: CriterioRegua[];
  serie_anual: AnoBruto[];
};

const base = bruto as unknown as Base;

export const ANO_ALVO = base.ano_alvo;
export const ANO_CICLO = base.ano_alvo + 1;
export const FONTE = base.gerado_de;
export const UNIDADES = base.unidades;
export const BAIRROS = base.bairros;
export const REGUA = base.regua_pontuacao;
export const SERIE = base.serie_anual;

export const CRES = [
  ...new Set(UNIDADES.map((u) => u.cre).filter((c): c is number => c !== null)),
].sort((a, b) => a - b);

/** Limiar de "aposta segura": a unidade costuma atender quem a pede. */
export const LIMIAR_SEGURA = 0.5;
/** Amostra histórica mínima para a chance não ser ruído. */
export const MIN_AMOSTRA = 30;

export function eSegura(u: UnidadeBruta): boolean {
  return u.confiavel && (u.chance_hist ?? 0) >= LIMIAR_SEGURA;
}

/* ------------------------------------------------------- determinismo ----- */

/** FNV-1a de 32 bits. Reprodutível entre renders, servidor e cliente. */
export function hash(semente: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pseudoaleatório estável em [0,1). */
export function rnd(semente: string): number {
  return hash(semente) / 0x100000000;
}

export function escolhe<T>(lista: readonly T[], semente: string): T {
  return lista[hash(semente) % lista.length];
}

/* ---------------------------------------------------------- formato ------- */

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os"]);
const SIGLAS = new Set(["CP", "CM", "EDI", "CIEP", "CE", "CCDF", "SME", "CRE", "II", "III", "IV"]);

/** As bases misturam caixa no mesmo campo; normaliza sempre. */
export function titulo(texto: string | null): string {
  if (!texto) return "";
  return texto
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((p, i) => {
      const nu = p.replace(/[^A-ZÀ-Ú0-9]/gi, "");
      if (SIGLAS.has(nu)) return nu;
      const min = p.toLowerCase();
      if (i > 0 && MINUSCULAS.has(min)) return min;
      return min.replace(/(^|[\s\-/])([a-zà-ú])/g, (_, s, c) => s + c.toUpperCase());
    })
    .join(" ");
}

export function num(v: number): string {
  return v.toLocaleString("pt-BR");
}

export function pct(v: number, casas = 0): string {
  return `${(v * 100).toFixed(casas).replace(".", ",")}%`;
}
