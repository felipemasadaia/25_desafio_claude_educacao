import type { Perfil } from "./recomendador/tipos";

/**
 * Personas da demonstração.
 *
 * Escolhidas para construir a narrativa em sequência: o caso difícil, o
 * mesmo caso com prioridade legal (prova de que o sistema entendeu a
 * política), e um caso real reconstruído da base de 2025.
 */
export type Persona = {
  id: string;
  nome: string;
  resumo: string;
  perfil: Perfil;
};

const SANTA_CRUZ = { lat: -22.9169, lng: -43.6845 };
const CAMPO_GRANDE = { lat: -22.9035, lng: -43.5615 };

export const PERSONAS: Persona[] = [
  {
    id: "deficit",
    nome: "Sem critério, sem carro",
    resumo:
      "Santa Cruz, vai a pé, nenhum critério de pontuação. O caso difícil — é onde a âncora salva a inscrição.",
    perfil: {
      ancoras: [{ id: "casa", rotulo: "Casa", ...SANTA_CRUZ }],
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
      ancoras: [{ id: "casa", rotulo: "Casa", ...SANTA_CRUZ }],
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
