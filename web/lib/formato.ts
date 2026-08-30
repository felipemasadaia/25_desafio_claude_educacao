/**
 * Formatação de texto vindo das bases da SME.
 *
 * Os dados chegam em caixa alta inconsistente ("SANTA CRUZ" numa linha,
 * "Santa Cruz" noutra) e com nomes de unidade inteiramente em maiúsculas,
 * que ocupam três linhas no celular e são mais lentos de ler.
 */

/** Palavras que ficam minúsculas no meio do nome. */
const MINUSCULAS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "à", "ao",
]);

/** Siglas e romanos que permanecem em caixa alta. */
const SIGLAS = new Set([
  "CP", "CM", "EDI", "CIEP", "CE", "CCDF", "CAAD", "II", "III", "IV", "VI",
  "VII", "VIII", "IX", "XI", "XII", "SME", "CRE",
]);

/**
 * Caixa de título respeitando preposições e siglas.
 *
 * "CP ASSOCIAÇÃO DE MORADORES DAS MORADAS DO IMPÉRIO"
 *   -> "CP Associação de Moradores das Moradas do Império"
 */
export function tituloCase(texto: string | null): string {
  if (!texto) return "";
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return "";

  // A base mistura caixas no mesmo campo — "SANTA CRUZ", "Santa Cruz" e
  // "campo grande" convivem. Normaliza sempre, em vez de confiar na caixa
  // de origem, senão o mesmo bairro aparece de duas formas na mesma tela.
  return limpo
    .split(" ")
    .map((palavra, i) => {
      const nu = palavra.replace(/[^A-ZÀ-Ú0-9]/gi, "");
      if (SIGLAS.has(nu)) return palavra;
      const min = palavra.toLowerCase();
      if (i > 0 && MINUSCULAS.has(min)) return min;
      // Preserva hífen interno: "SANTA CRUZ-RIO" -> "Santa Cruz-Rio"
      return min.replace(/(^|[\s\-/])([a-zà-ú])/g, (_, sep, c) => sep + c.toUpperCase());
    })
    .join(" ");
}

/** Distância em português: vírgula decimal, e metros abaixo de 1 km. */
export function formataDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** Número com separador decimal brasileiro. */
export function formataNumero(valor: number, casas = 2): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}
