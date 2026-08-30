/**
 * Motor de recomendação — módulo puro, sem I/O, sem React.
 *
 * Recebe perfil + unidades, devolve carteira. É a costura principal de teste.
 * As regras implementadas aqui estão validadas nos dados e documentadas na
 * spec (.scratch/recomendador-carteira-creches/spec.md).
 */
import type {
  AncoraLocalizacao,
  Carteira,
  FaixaChance,
  Grupamento,
  ItemCarteira,
  Modal,
  Papel,
  Perfil,
  Unidade,
} from "./tipos";

/** Chance histórica a partir da qual a unidade é âncora da carteira. */
export const LIMIAR_ANCORA = 0.5;

/** Teto de opções do processo real. */
export const MAX_CARTEIRA = 5;

/** Abaixo disso a unidade é "sonho": vale manter, mas não sustenta a carteira. */
export const LIMIAR_SONHO = 0.25;

/**
 * Alcance por modal, em km.
 *
 * Não é roteirização — é distância com ajuste por modal, conforme a spec.
 * Roteirização real por transporte público é projeto próprio.
 */
const ALCANCE_KM: Record<Modal, number> = {
  pe: 2.5,
  transporte: 7,
  carro: 15,
};

/** Velocidade média porta-a-porta, km/h, para estimar minutos de trajeto. */
const VELOCIDADE_KMH: Record<Modal, number> = {
  pe: 4.5,
  transporte: 12,
  carro: 22,
};

/**
 * Pontuação máxima prática da régua vigente.
 *
 * CadÚnico (51) + educação especial (25) dominam; o resto soma ~24.
 * Usada para normalizar a vantagem do perfil, não para exibir posição.
 */
const PONTUACAO_REFERENCIA = 100;

/** Normaliza grupamento: a base da SME traz "Maternal II " com espaço extra. */
function normalizaGrupamento(texto: string): string {
  return texto.trim().toLowerCase();
}

/** Distância em km pela fórmula de Haversine. */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Soma dos pontos dos critérios declarados, pela régua vigente. */
export function calculaPontuacao(
  criterios: number[],
  regua: Array<{ perg_id: number; pontos: number }>,
): number {
  const porId = new Map(regua.map((r) => [r.perg_id, r.pontos]));
  return criterios.reduce((total, id) => total + (porId.get(id) ?? 0), 0);
}

/** O recorte grupamento × horário que serve este perfil, se existir. */
function recorteDoPerfil(unidade: Unidade, grupamento: Grupamento, horario: string) {
  const g = normalizaGrupamento(grupamento);
  const h = normalizaGrupamento(horario);
  return unidade.por_grupamento.find(
    (r) => normalizaGrupamento(r.grupamento) === g && normalizaGrupamento(r.horario) === h,
  );
}

/**
 * Chance do par (família, unidade).
 *
 * Parte da chance-base daquela unidade no recorte grupamento × horário e
 * desloca conforme a pontuação da família a posiciona na fila. Pontuação
 * alta sobe a chance; a magnitude do deslocamento encolhe conforme a
 * chance-base se aproxima dos extremos — quem já entraria quase sempre
 * ganha pouco, e nenhuma pontuação torna certa uma unidade saturada.
 *
 * A saída alimenta faixas qualitativas, nunca um número cravado.
 */
export function chanceParaPerfil(base: number, pontuacao: number): number {
  const vantagem = Math.min(1, Math.max(0, pontuacao / PONTUACAO_REFERENCIA));
  // Espaço que ainda resta até a certeza; a prioridade legal come parte dele.
  const espaco = 1 - base;
  const ajustada = base + espaco * vantagem * 0.55;
  return Math.min(0.97, Math.max(0.01, ajustada));
}

/** Faixa qualitativa. A interface nunca mostra o número cru. */
export function faixaDe(chance: number): FaixaChance {
  if (chance >= 0.5) return "alta";
  if (chance >= 0.3) return "media";
  if (chance >= 0.15) return "baixa";
  return "minima";
}

export const ROTULO_FAIXA: Record<FaixaChance, string> = {
  alta: "Aposta segura",
  media: "Chance real",
  baixa: "Disputada",
  minima: "Muito disputada",
};

/**
 * Uma unidade sustenta o papel de âncora da carteira?
 *
 * Propriedade da UNIDADE, não do par (família, unidade): a spec define
 * âncora como "chance histórica ≥50%" e amostra confiável. Deliberadamente
 * não usa a chance ajustada pelo perfil — senão a prioridade legal criaria
 * âncoras que não existem para mais ninguém, e a aposta segura deixaria de
 * significar "esta unidade costuma ter vaga".
 *
 * Exportada porque a reavaliação de carteira editada precisa da mesma regra.
 */
export function sustentaAncora(
  confiavel: boolean,
  chanceHistorica: number | null,
): boolean {
  return confiavel && (chanceHistorica ?? 0) >= LIMIAR_ANCORA;
}

/** Peso da âncora de localização pela ordem declarada. A primeira pesa mais. */
function pesoAncora(indice: number): number {
  return 1 / (1 + indice * 0.6);
}

type Candidata = {
  unidade: Unidade;
  chanceBase: number;
  chance: number;
  encaixe: number;
  ancora: AncoraLocalizacao;
  distanciaKm: number;
  minutos: number;
  pesoLocal: number;
  podeSerAncora: boolean;
};

/**
 * Unidades no alcance, já com chance e encaixe calculados.
 *
 * Filtra por: coordenada conhecida, compatibilidade de grupamento e horário,
 * e alcance derivado das âncoras de localização e do modal declarado.
 */
function candidatas(perfil: Perfil, unidades: Unidade[], pontuacao: number): Candidata[] {
  const alcance = ALCANCE_KM[perfil.modal];
  const velocidade = VELOCIDADE_KMH[perfil.modal];
  const saida: Candidata[] = [];

  for (const unidade of unidades) {
    if (unidade.lat === null || unidade.lng === null) continue;

    const recorte = recorteDoPerfil(unidade, perfil.grupamento, perfil.horario);
    if (!recorte) continue;

    // A âncora de localização mais vantajosa: menor distância ponderada pela
    // prioridade que a família declarou.
    let melhor: { ancora: AncoraLocalizacao; km: number; peso: number } | null = null;
    for (const [i, ancora] of perfil.ancoras.entries()) {
      const km = distanciaKm(ancora, { lat: unidade.lat, lng: unidade.lng });
      if (km > alcance) continue;
      const peso = pesoAncora(i);
      const custo = km / peso;
      if (!melhor || custo < melhor.km / melhor.peso) melhor = { ancora, km, peso };
    }
    if (!melhor) continue;

    const chanceBase = recorte.chance;
    const chance = chanceParaPerfil(chanceBase, pontuacao);

    // Encaixe: proximidade dentro do alcance, com pequeno bônus de oferta
    // consolidada no recorte. Eixo separado da chance, deliberadamente.
    //
    // Grupamento e horário já entraram como filtro (recorte incompatível não
    // chega aqui). Acessibilidade NÃO entra: as bases da SME não trazem
    // atributo de acessibilidade por unidade, e derivá-la do tipo da unidade
    // seria inventar dado. O perfil registra a necessidade e a interface
    // avisa que este ponto precisa ser confirmado com a unidade — melhor que
    // um número que finge saber.
    const proximidade = 1 - melhor.km / alcance;
    const oferta = Math.min(1, recorte.opcoes / 40);
    const encaixe = Math.min(1, Math.max(0, proximidade * 0.8 + oferta * 0.2));

    saida.push({
      unidade,
      chanceBase,
      chance,
      encaixe,
      ancora: melhor.ancora,
      distanciaKm: melhor.km,
      minutos: Math.round((melhor.km / velocidade) * 60),
      pesoLocal: melhor.peso,
      // Amostra frágil nunca sustenta a aposta segura da carteira.
      podeSerAncora: sustentaAncora(unidade.confiavel, unidade.chance_hist),
    });
  }

  return saida;
}

/**
 * Valor de uma candidata: chance com peso maior que encaixe, e o encaixe
 * ponderado pela prioridade da âncora de localização que a justifica.
 * Estes pesos vão ser calibrados — por isso vivem num lugar só.
 */
function valorDe(c: Candidata): number {
  return c.chance * 0.65 + c.encaixe * 0.35 * c.pesoLocal;
}

/** Ordem estável: valor decrescente, empate desfeito pelo código da unidade. */
function ordenaPorValor(lista: Candidata[]): Candidata[] {
  return [...lista].sort((a, b) => {
    const diferenca = valorDe(b) - valorDe(a);
    if (diferenca !== 0) return diferenca;
    return a.unidade.codigo.localeCompare(b.unidade.codigo);
  });
}

/**
 * Papel de cada unidade na carteira.
 *
 * Exatamente uma âncora: é a aposta segura declarada, e duplicá-la esvazia
 * o sentido do papel. O resto se divide entre sonho (o que a família quer,
 * mesmo disputado) e equilíbrio.
 *
 * Exportado porque a reavaliação de uma carteira editada precisa da mesma
 * regra: duas definições de papel divergiriam assim que os limiares fossem
 * calibrados.
 */
export function decidePapel(
  chance: number,
  podeSerAncora: boolean,
  jaTemAncora: boolean,
): Papel {
  if (podeSerAncora && !jaTemAncora) return "ancora";
  if (chance < LIMIAR_SONHO) return "sonho";
  return "equilibrio";
}

function papelDe(c: Candidata, jaTemAncora: boolean): Papel {
  return decidePapel(c.chance, c.podeSerAncora, jaTemAncora);
}

function explica(c: Candidata, papel: Papel): string {
  const local = c.ancora.rotulo.toLowerCase();
  const perto =
    c.distanciaKm < 1
      ? "a poucos minutos"
      : `a ${c.distanciaKm.toFixed(1).replace(".", ",")} km`;

  if (papel === "ancora") {
    return `Sua aposta mais segura: historicamente a maioria das famílias que pediram esta unidade conseguiu vaga, e ela fica ${perto} de ${local}.`;
  }
  if (papel === "sonho") {
    return `É muito disputada, mas fica ${perto} de ${local} — vale manter se for a que você realmente quer.`;
  }
  return `Bom equilíbrio entre chance e trajeto: ${perto} de ${local}, com procura moderada.`;
}

function paraItem(c: Candidata, papel: Papel): ItemCarteira {
  // Arredonda antes de explicar: a explicação e o rodapé do cartão mostram
  // a mesma distância, e dois arredondamentos davam "1,5 km" e "1,6 km"
  // no mesmo cartão.
  const arredondada = { ...c, distanciaKm: Number(c.distanciaKm.toFixed(1)) };
  return {
    unidade: c.unidade,
    papel,
    chance: c.chance,
    faixa: faixaDe(c.chance),
    encaixe: c.encaixe,
    justificadaPor: c.ancora,
    distanciaKm: arredondada.distanciaKm,
    minutos: c.minutos,
    explicacao: explica(arredondada, papel),
  };
}

/**
 * Probabilidade de conseguir ao menos uma vaga com a carteira inteira.
 *
 * NÃO é o produto ingênuo de eventos independentes. As opções de uma mesma
 * família competem contra populações que se sobrepõem: quem perde numa
 * unidade disputada tende a perder na vizinha, pelo mesmo motivo. Tratar
 * como independente devolve 100% para cinco boas apostas — um número que
 * os dados não sustentam e que a spec proíbe apresentar.
 *
 * Cada opção adicional entra com peso decrescente, e o resultado é limitado
 * a um teto explícito. A direção é robusta; a magnitude, não.
 */
export const TETO_AGREGADO = 0.93;

export function probabilidadeAgregada(chances: number[]): number {
  if (chances.length === 0) return 0;
  const ordenadas = [...chances].sort((a, b) => b - a);
  let restante = 1;
  for (const [i, chance] of ordenadas.entries()) {
    // Correlação entre filas: a n-ésima opção contribui menos que a anterior.
    const independencia = 0.75 ** i;
    restante *= 1 - chance * independencia;
  }
  return Math.min(TETO_AGREGADO, 1 - restante);
}

/**
 * Monta a carteira.
 *
 * Regra 1: âncora sempre, quando existir uma no alcance.
 * Regra 2: otimizar o piso — as opções seguintes maximizam a menor chance,
 *          não a dispersão. Diversificação por diversificação foi testada
 *          e rejeitada.
 *
 * A carteira é um portfólio, não um ranking: uma âncora, um sonho (a
 * unidade que a família de fato quer, ainda que disputada) e o resto
 * elevando o piso. Cinco apostas seguras idênticas satisfariam a regra 2
 * e ainda assim seriam uma recomendação pior — a família perde a unidade
 * que importa para ela.
 */
function montaCarteira(lista: Candidata[]): Candidata[] {
  const ordenadas = ordenaPorValor(lista);
  const escolhidas: Candidata[] = [];
  const pegar = (c: Candidata | undefined) => {
    if (c && !escolhidas.includes(c)) escolhidas.push(c);
  };

  // Regra 1 — a melhor âncora entra primeiro, incondicionalmente.
  pegar(ordenadas.find((c) => c.podeSerAncora));

  // O sonho: a unidade disputada que a família quer mesmo assim. Só ganha
  // uma vaga quando compensa a chance baixa com encaixe claramente melhor
  // que o das opções seguras — perto de casa, no caminho. Uma unidade
  // disputada E distante não é sonho, é opção ruim, e ocupar uma das cinco
  // vagas com ela custa chance de vaga à família.
  const melhorEncaixeSeguro = Math.max(
    0,
    ...ordenadas.filter((c) => c.chance >= LIMIAR_SONHO).map((c) => c.encaixe),
  );
  const sonho = ordenadas
    .filter((c) => c.chance < LIMIAR_SONHO && c.encaixe > melhorEncaixeSeguro)
    .sort((a, b) => b.encaixe * b.pesoLocal - a.encaixe * a.pesoLocal)[0];
  pegar(sonho);

  // Regra 2 — preenche elevando o piso: a cada passo entra a candidata que
  // maximiza a menor chance da carteira resultante, com o valor como desempate.
  while (escolhidas.length < MAX_CARTEIRA) {
    const restantes = ordenadas.filter((c) => !escolhidas.includes(c));
    if (restantes.length === 0) break;

    let melhor = restantes[0];
    let melhorPiso = -1;
    for (const c of restantes) {
      // O piso ignora o sonho já escolhido — ele é a aposta declarada da
      // família, não o que a carteira otimiza — mas a candidata em avaliação
      // conta sempre. Sem isso, uma unidade muito disputada empata com o
      // piso atual e entra na frente de uma opção mediana.
      const consideradas = [...escolhidas.filter((x) => x !== sonho), c];
      const piso = Math.min(...consideradas.map((x) => x.chance));
      if (piso > melhorPiso) {
        melhorPiso = piso;
        melhor = c;
      }
    }
    escolhidas.push(melhor);
  }

  // Ordem final: a família se inscreve nesta sequência, e a ordem importa
  // na classificação. Âncora nunca em último.
  return ordenaPorValor(escolhidas);
}

/**
 * Ponto de entrada do motor.
 *
 * @param perfil    o que a família declarou
 * @param unidades  catálogo (ou recorte dele)
 * @param regua     régua de pontuação vigente; ausente = pontuação zero
 */
export function recomendar(
  perfil: Perfil,
  unidades: Unidade[],
  regua: Array<{ perg_id: number; pontos: number }> = REGUA_PADRAO,
): Carteira {
  const pontuacao = calculaPontuacao(perfil.criterios, regua);
  const lista = candidatas(perfil, unidades, pontuacao);

  const escolhidas = montaCarteira(lista);

  // Regra 5 — sem âncora no alcance, a carteira é montada com a melhor chance
  // real disponível e marcada como déficit. O limiar não é relaxado em silêncio.
  const temAncora = escolhidas.some((c) => c.podeSerAncora);

  const itens: ItemCarteira[] = [];
  let ancoraUsada = false;
  for (const c of escolhidas) {
    const papel = papelDe(c, ancoraUsada);
    if (papel === "ancora") ancoraUsada = true;
    itens.push(paraItem(c, papel));
  }

  const alternativas = ordenaPorValor(lista.filter((c) => !escolhidas.includes(c)))
    .slice(0, 20)
    .map((c) => paraItem(c, papelDe(c, true)));

  return {
    itens,
    probabilidadeAgregada: probabilidadeAgregada(itens.map((i) => i.chance)),
    deficitTerritorial: lista.length > 0 && !temAncora,
    melhorChanceDisponivel:
      lista.length > 0 ? Math.max(...lista.map((c) => c.chance)) : null,
    pontuacao,
    alternativas,
  };
}

/**
 * Régua de pontuação vigente (2025), embutida como padrão para o motor
 * funcionar sem o catálogo. A fonte de verdade é `catalogo.regua_pontuacao`.
 */
export const REGUA_PADRAO = [
  { perg_id: 28, pontos: 51 },
  { perg_id: 31, pontos: 25 },
  { perg_id: 17, pontos: 4 },
  { perg_id: 20, pontos: 4 },
  { perg_id: 25, pontos: 3 },
  { perg_id: 18, pontos: 3 },
  { perg_id: 6, pontos: 2 },
  { perg_id: 16, pontos: 2 },
  { perg_id: 12, pontos: 2 },
  { perg_id: 23, pontos: 2 },
  { perg_id: 27, pontos: 2 },
  { perg_id: 29, pontos: 0 },
  { perg_id: 30, pontos: 0 },
];
