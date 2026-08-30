import { describe, expect, it } from "vitest";
import { reavalia } from "./edicao";
import { recomendar } from "./motor";
import { CASA, unidade } from "./fixtures";
import type { Perfil } from "./tipos";

const perfil: Perfil = {
  ancoras: [CASA],
  modal: "transporte",
  grupamento: "Maternal I",
  horario: "Integral",
  criterios: [],
  precisaAcessibilidade: false,
};

const catalogo = [
  unidade({ codigo: "ANCORA", chance_hist: 0.72, km: 1 }),
  unidade({ codigo: "MED1", chance_hist: 0.4, km: 1.2 }),
  unidade({ codigo: "MED2", chance_hist: 0.38, km: 1.3 }),
  unidade({ codigo: "MED3", chance_hist: 0.36, km: 1.4 }),
  unidade({ codigo: "MED4", chance_hist: 0.34, km: 1.5 }),
  unidade({ codigo: "MED5", chance_hist: 0.32, km: 1.6 }),
];

describe("reavaliação de carteira editada", () => {
  it("avisa quando a edição removeu a única aposta segura", () => {
    const sugerida = recomendar(perfil, catalogo);
    expect(sugerida.itens.some((i) => i.papel === "ancora")).toBe(true);

    const semAncora = sugerida.itens.filter((i) => i.unidade.codigo !== "ANCORA");
    const editada = reavalia(semAncora, true);

    expect(editada.perdeuAncora).toBe(true);
    expect(editada.itens.some((i) => i.papel === "ancora")).toBe(false);
  });

  it("não avisa quando a âncora continua na carteira", () => {
    const sugerida = recomendar(perfil, catalogo);
    const editada = reavalia(sugerida.itens, true);

    expect(editada.perdeuAncora).toBe(false);
    expect(editada.itens.filter((i) => i.papel === "ancora")).toHaveLength(1);
  });

  it("promove uma nova âncora quando a família troca por outra unidade segura", () => {
    const catalogoDuasAncoras = [
      ...catalogo,
      unidade({ codigo: "ANCORA2", chance_hist: 0.66, km: 2 }),
    ];
    const sugerida = recomendar(perfil, catalogoDuasAncoras);
    const outra = [...sugerida.alternativas, ...sugerida.itens].find(
      (i) => i.unidade.codigo === "ANCORA2",
    )!;
    const trocada = [outra, ...sugerida.itens.filter((i) => i.papel !== "ancora")];

    const editada = reavalia(trocada, true);

    expect(editada.perdeuAncora).toBe(false);
    expect(editada.itens[0].papel).toBe("ancora");
  });

  it("nunca marca mais de uma âncora", () => {
    const catalogoDuasAncoras = [
      unidade({ codigo: "A1", chance_hist: 0.8, km: 1 }),
      unidade({ codigo: "A2", chance_hist: 0.75, km: 1.1 }),
      unidade({ codigo: "A3", chance_hist: 0.7, km: 1.2 }),
    ];
    const sugerida = recomendar(perfil, catalogoDuasAncoras);
    const editada = reavalia(sugerida.itens, true);

    expect(editada.itens.filter((i) => i.papel === "ancora")).toHaveLength(1);
  });

  it("unidade com histórico frágil não vira âncora na reavaliação", () => {
    const fragil = recomendar(perfil, [
      unidade({ codigo: "FRAGIL", chance_hist: 0.9, n_hist: 5, confiavel: false, km: 1 }),
      unidade({ codigo: "MED1", chance_hist: 0.4, km: 1.2 }),
    ]);
    const editada = reavalia(fragil.itens, false);

    expect(editada.itens.some((i) => i.papel === "ancora")).toBe(false);
  });
});
