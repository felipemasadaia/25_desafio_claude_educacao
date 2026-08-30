import { describe, expect, it } from "vitest";
import { formataDistancia, tituloCase } from "./formato";

describe("tituloCase", () => {
  it("converte nome de unidade em caixa alta para caixa de título", () => {
    expect(tituloCase("CP ASSOCIAÇÃO DE MORADORES DAS MORADAS DO IMPÉRIO")).toBe(
      "CP Associação de Moradores das Moradas do Império",
    );
  });

  it("preserva siglas conhecidas", () => {
    expect(tituloCase("EDI LILY MARINHO")).toBe("EDI Lily Marinho");
    expect(tituloCase("CM QUINTA DO CAJU")).toBe("CM Quinta do Caju");
  });

  it("normaliza bairro em caixa alta", () => {
    expect(tituloCase("SANTA CRUZ")).toBe("Santa Cruz");
  });

  it("preserva texto que já vem formatado", () => {
    expect(tituloCase("Creche Parceira")).toBe("Creche Parceira");
  });

  it("tolera nulo e vazio", () => {
    expect(tituloCase(null)).toBe("");
    expect(tituloCase("  ")).toBe("");
  });

  it("mantém numeral romano de grupamento", () => {
    expect(tituloCase("CRECHE MUNICIPAL II")).toBe("Creche Municipal II");
  });
});

describe("formataDistancia", () => {
  it("usa vírgula decimal, não ponto", () => {
    expect(formataDistancia(1.55)).toBe("1,6 km");
    expect(formataDistancia(2.3)).toBe("2,3 km");
  });

  it("mostra metros abaixo de 1 km", () => {
    expect(formataDistancia(0.39)).toBe("390 m");
  });
});

describe("tituloCase — caixa inconsistente na base", () => {
  it("normaliza bairro em minúsculas", () => {
    expect(tituloCase("campo grande")).toBe("Campo Grande");
  });

  it("o mesmo bairro em caixas diferentes vira o mesmo texto", () => {
    expect(tituloCase("SANTA CRUZ")).toBe(tituloCase("Santa Cruz"));
    expect(tituloCase("campo grande")).toBe(tituloCase("CAMPO GRANDE"));
  });

  it("preserva preposição em nome já formatado", () => {
    expect(tituloCase("Pedra de Guaratiba")).toBe("Pedra de Guaratiba");
  });
});
