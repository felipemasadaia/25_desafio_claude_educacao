import { NextResponse } from "next/server";

/**
 * Geocodificação de endereço/CEP restrita ao município do Rio, via Nominatim.
 *
 * Roda no servidor por dois motivos: o Nominatim exige User-Agent
 * identificável (o navegador não deixa definir), e assim o navegador da
 * família não fala com terceiro nenhum.
 *
 * O resultado é sempre uma SUGESTÃO. O pino continua sendo a fonte de verdade
 * da localização — endereço de comunidade e rua sem número não geocodificam,
 * e a família não pode ficar de fora por isso.
 */

/** Bounding box do município (só cidade). Espelha LIMITES_MUNICIPIO do mapa. */
const CAIXA = { oeste: -43.796, sul: -23.083, leste: -43.099, norte: -22.746 };

const AGENTE = "carteira-creches-rio/0.1 (demo hackathon SME-RJ)";

export type Sugestao = {
  rotulo: string;
  lat: number;
  lng: number;
};

/** Só CEP do município do Rio: 20000-000 a 23799-999. */
function normalizaCep(texto: string): string | null {
  const digitos = texto.replace(/\D/g, "");
  if (digitos.length !== 8) return null;
  const prefixo = Number(digitos.slice(0, 5));
  if (prefixo < 20000 || prefixo > 23799) return null;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function dentroDoMunicipio(lat: number, lng: number) {
  return (
    lat >= CAIXA.sul && lat <= CAIXA.norte && lng >= CAIXA.oeste && lng <= CAIXA.leste
  );
}

type ItemNominatim = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
  };
};

/**
 * A bounding box do município é retangular; a Baixada Fluminense entra nela.
 * Sem checar o município, "Copacabana" traz o bairro homônimo de Duque de
 * Caxias — uma recomendação de creche na cidade errada.
 */
function ehMunicipioDoRio(item: ItemNominatim) {
  const a = item.address;
  if (!a) return true; // sem detalhe, a caixa já é a única barreira possível
  const nomes = [a.city, a.town, a.municipality, a.county].filter(Boolean);
  if (nomes.length === 0) return true;
  return nomes.some((n) => n === "Rio de Janeiro");
}

async function consulta(params: Record<string, string>): Promise<Sugestao[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set(
    "viewbox",
    `${CAIXA.oeste},${CAIXA.norte},${CAIXA.leste},${CAIXA.sul}`,
  );
  url.searchParams.set("bounded", "1");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const resposta = await fetch(url, {
    headers: { "User-Agent": AGENTE, "Accept-Language": "pt-BR" },
    // O catálogo é estático; endereço repetido não precisa bater no Nominatim.
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(6000),
  });
  if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as ItemNominatim[];
  return dados
    .filter(ehMunicipioDoRio)
    .map((d) => ({
      rotulo: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }))
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .filter((s) => dentroDoMunicipio(s.lat, s.lng));
}

type RespostaCep = {
  street?: string;
  neighborhood?: string;
  city?: string;
};

/** Compara bairro ignorando acento e caixa: "SÃO CRISTÓVÃO" == "Sao Cristovao". */
function mesmoBairro(a: string, b: string) {
  const limpa = (t: string) =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return limpa(a) === limpa(b);
}

/**
 * CEP: a BrasilAPI traduz em rua + bairro, o Nominatim geocodifica.
 *
 * A coordenada da própria BrasilAPI não é usada — para CEP genérico de bairro
 * ela devolve o centroide do município: um CEP de Santa Cruz chega apontando
 * para o Centro, 50 km fora. Errar em silêncio é pior que não achar, porque a
 * família aceitaria o ponto sem desconfiar.
 *
 * O bairro do Correios é a checagem cruzada: se o Nominatim geocodificar numa
 * rua homônima de outro bairro, o resultado é descartado.
 */
async function porCep(cep: string): Promise<Sugestao[]> {
  const resposta = await fetch(
    `https://brasilapi.com.br/api/cep/v2/${cep.replace("-", "")}`,
    { next: { revalidate: 604800 }, signal: AbortSignal.timeout(5000) },
  );
  if (!resposta.ok) return [];

  const dados = (await resposta.json()) as RespostaCep;
  if (dados.city !== "Rio de Janeiro") return [];

  const bairro = dados.neighborhood?.trim();
  const rua = dados.street?.trim();
  if (!bairro && !rua) return [];

  const rotulo = [rua, bairro, "Rio de Janeiro"].filter(Boolean).join(", ");
  const achados = await consulta({ q: `${rotulo}, RJ` });

  // Sem bairro do Correios não há como cruzar: devolve o que veio.
  if (!bairro) return achados.map((s) => ({ ...s, rotulo }));

  const noBairroCerto = achados.filter((s) =>
    s.rotulo.split(",").some((parte) => mesmoBairro(parte, bairro)),
  );

  // Rua não bateu no bairro: tenta o bairro sozinho, que ao menos é a região certa.
  if (noBairroCerto.length === 0) {
    const doBairro = await consulta({ q: `${bairro}, Rio de Janeiro, RJ` });
    return doBairro.slice(0, 1).map((s) => ({
      ...s,
      rotulo: `${bairro}, Rio de Janeiro (bairro — ajuste o pino na sua rua)`,
    }));
  }

  return noBairroCerto.map((s) => ({ ...s, rotulo }));
}

export async function GET(requisicao: Request) {
  const busca = new URL(requisicao.url).searchParams.get("q")?.trim() ?? "";
  if (busca.length < 3) {
    return NextResponse.json({ sugestoes: [] satisfies Sugestao[] });
  }

  const cep = normalizaCep(busca);
  // Oito dígitos que não são CEP do Rio: recusa direto, em vez de deixar a
  // busca livre achar uma rua parecida em Itaguaí ou Niterói.
  if (cep === null && /^\d{5}-?\d{3}$/.test(busca)) {
    return NextResponse.json({ sugestoes: [] satisfies Sugestao[] });
  }

  try {
    // CEP vai pela base dos Correios; texto livre vai ao Nominatim já
    // amarrado à cidade, para não cair em Niterói ou São Gonçalo.
    const sugestoes = cep
      ? await porCep(cep)
      : await consulta({ q: `${busca}, Rio de Janeiro, RJ` });

    return NextResponse.json({ sugestoes });
  } catch (erro) {
    // Falha de rede não pode travar o fluxo: a família segue pelo pino.
    console.error("geocodificação falhou", erro);
    return NextResponse.json(
      {
        sugestoes: [] satisfies Sugestao[],
        erro: "Não consegui buscar o endereço agora. Marque o ponto no mapa.",
      },
      { status: 200 },
    );
  }
}
