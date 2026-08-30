/**
 * Catálogos sintéticos pequenos e legíveis para os testes do motor.
 *
 * Deliberadamente NÃO usa o catálogo real de 872 unidades: testes acoplados
 * aos dados reais quebram quando o pré-processamento muda, sem pegar defeito.
 */
import type { AncoraLocalizacao, Unidade } from "./tipos";

/** Centro de referência dos fixtures (Centro do Rio). */
export const CASA: AncoraLocalizacao = {
  id: "casa",
  rotulo: "Casa",
  lat: -22.9,
  lng: -43.2,
};

export const TRABALHO: AncoraLocalizacao = {
  id: "trabalho",
  rotulo: "Trabalho",
  lat: -22.93,
  lng: -43.18,
};

/** ~1km por 0.009 grau de latitude. Facilita posicionar unidades por distância. */
export function aKm(base: AncoraLocalizacao, km: number): { lat: number; lng: number } {
  return { lat: base.lat + km * 0.009, lng: base.lng };
}

type OpcoesUnidade = {
  codigo: string;
  chance_hist?: number | null;
  n_hist?: number;
  confiavel?: boolean;
  distanciaDe?: AncoraLocalizacao;
  km?: number;
  grupamentos?: Array<{ grupamento: string; horario: string; chance: number; opcoes?: number }>;
  lat?: number | null;
  lng?: number | null;
  bairro?: string;
};

/** Constrói uma unidade de teste com padrões sensatos. */
export function unidade(o: OpcoesUnidade): Unidade {
  const base = o.distanciaDe ?? CASA;
  const pos = o.km !== undefined ? aKm(base, o.km) : { lat: base.lat, lng: base.lng };
  const chance = o.chance_hist === undefined ? 0.4 : o.chance_hist;
  return {
    codigo: o.codigo,
    nome: `Creche ${o.codigo}`,
    tipo: "Creche",
    cre: 1,
    microarea: "1.1",
    bairro: o.bairro ?? "CENTRO",
    endereco: "Rua de Teste, 1",
    lat: o.lat !== undefined ? o.lat : pos.lat,
    lng: o.lng !== undefined ? o.lng : pos.lng,
    chance_hist: chance,
    n_hist: o.n_hist ?? 100,
    confiavel: o.confiavel ?? true,
    opcoes_2025: 50,
    criancas_2025: 50,
    taxa_2025: chance,
    matriculas: {},
    por_grupamento:
      o.grupamentos?.map((g) => ({
        grupamento: g.grupamento,
        horario: g.horario,
        opcoes: g.opcoes ?? 40,
        chance: g.chance,
      })) ??
      [
        { grupamento: "Berçário", horario: "Integral", opcoes: 40, chance: chance ?? 0.4 },
        { grupamento: "Maternal I", horario: "Integral", opcoes: 40, chance: chance ?? 0.4 },
        { grupamento: "Maternal II ", horario: "Integral", opcoes: 40, chance: chance ?? 0.4 },
      ],
  };
}
