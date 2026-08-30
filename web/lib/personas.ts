import type { Perfil } from "./recomendador/tipos";

/**
 * Personas da demonstração.
 *
 * Escolhidas para construir a narrativa em sequência: o caso difícil, o
 * mesmo caso com prioridade legal (prova de que o sistema entendeu a
 * política), e uma família com vários pontos de referência.
 *
 * As coordenadas não são inventadas — foram escolhidas varrendo o catálogo
 * atrás de territórios com déficit real. Numa versão anterior as personas
 * caíam em Santa Cruz, que tem vacância alta: as três devolviam cinco
 * "aposta segura" e a narrativa do caso difícil não se sustentava na tela.
 */
export type Persona = {
  id: string;
  nome: string;
  resumo: string;
  perfil: Perfil;
};

/** Rio das Pedras: déficit territorial real para quem anda a pé. */
const RIO_DAS_PEDRAS = { lat: -22.976261, lng: -43.325334 };
const CAMPO_GRANDE = { lat: -22.9035, lng: -43.5615 };

export const PERSONAS: Persona[] = [
  {
    id: "deficit",
    nome: "Sem critério, sem carro",
    resumo:
      "Rio das Pedras, vai a pé, nenhum critério de pontuação. O caso difícil: nenhuma aposta segura ao alcance.",
    perfil: {
      ancoras: [{ id: "casa", rotulo: "Casa", ...RIO_DAS_PEDRAS }],
      modal: "pe",
      grupamento: "Maternal I",
      horario: "Integral",
      criterios: [],
      precisaAcessibilidade: false,
    },
  },
  {
    id: "cadunico",
    nome: "A mesma família, com CadÚnico",
    resumo:
      "Perfil idêntico ao anterior, um único atributo trocado. As mesmas unidades mudam de leitura.",
    perfil: {
      ancoras: [{ id: "casa", rotulo: "Casa", ...RIO_DAS_PEDRAS }],
      modal: "pe",
      grupamento: "Maternal I",
      horario: "Integral",
      criterios: [28],
      precisaAcessibilidade: false,
    },
  },
  {
    id: "dois-pontos",
    nome: "Casa e trabalho longe",
    resumo:
      "Mora em Campo Grande, trabalha no Centro e conta com a avó. Três pontos de referência, ônibus.",
    perfil: {
      ancoras: [
        { id: "casa", rotulo: "Casa", ...CAMPO_GRANDE },
        { id: "trabalho", rotulo: "Trabalho", lat: -22.9068, lng: -43.1861 },
        { id: "avo", rotulo: "Avó", lat: -22.8925, lng: -43.5482 },
      ],
      modal: "transporte",
      grupamento: "Maternal II",
      horario: "Integral",
      criterios: [20, 6],
      precisaAcessibilidade: false,
    },
  },
];
