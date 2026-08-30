import { describe, expect, it } from "vitest";
import { catalogo } from "./catalogo";
import { calculaCobertura } from "./cobertura";

describe("cobertura territorial", () => {
  it("calcula em tempo aceitável para render síncrono", () => {
    const t0 = performance.now();
    calculaCobertura(true);
    const dt = performance.now() - t0;
    console.log(`cobertura a pé: ${dt.toFixed(0)}ms`);
    expect(dt).toBeLessThan(400);
  });

  it("o alcance a pé cobre menos território que o de transporte", () => {
    const pe = calculaCobertura(true);
    const transporte = calculaCobertura(false);

    expect(pe.semAncora).toBeGreaterThan(transporte.semAncora);
    expect(pe.total).toBe(transporte.total);
  });

  it("as contagens fecham", () => {
    const c = calculaCobertura(true);
    expect(c.comAncora + c.semAncora).toBe(c.total);
    expect(c.porCre.reduce((s, x) => s + x.total, 0)).toBeLessThanOrEqual(c.total);
  });
});

describe("recorte por CRE", () => {
  it("avalia menos pontos que a rede inteira", () => {
    const rede = calculaCobertura(true);
    const parcial = calculaCobertura(true, 5);

    expect(parcial.total).toBeGreaterThan(0);
    expect(parcial.total).toBeLessThan(rede.total);
    expect(parcial.comAncora + parcial.semAncora).toBe(parcial.total);
  });

  it("'todas' é idêntico a não passar recorte", () => {
    expect(calculaCobertura(true, "todas")).toEqual(calculaCobertura(true));
  });

  it("a âncora da CRE vizinha continua cobrindo a divisa", () => {
    // Filtrar as âncoras junto com os pontos inventaria déficit na borda:
    // uma família na divisa alcança a creche da CRE do lado.
    const soma = [...new Set(catalogo.unidades.map((u) => u.cre))]
      .filter((c): c is number => c !== null)
      .reduce((s, c) => s + calculaCobertura(true, c).semAncora, 0);

    expect(soma).toBeLessThanOrEqual(calculaCobertura(true).semAncora);
  });
});

describe("ordenação por gravidade", () => {
  it("ordena CREs pela proporção descoberta, não pela contagem bruta", () => {
    const { porCre } = calculaCobertura(true);
    const proporcoes = porCre.map((c) => c.semAncora / c.total);

    for (let i = 1; i < proporcoes.length; i++) {
      expect(proporcoes[i]).toBeLessThanOrEqual(proporcoes[i - 1]);
    }
  });
});
