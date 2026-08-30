import { describe, expect, it } from "vitest";
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

describe("ordenação por gravidade", () => {
  it("ordena CREs pela proporção descoberta, não pela contagem bruta", () => {
    const { porCre } = calculaCobertura(true);
    const proporcoes = porCre.map((c) => c.semAncora / c.total);

    for (let i = 1; i < proporcoes.length; i++) {
      expect(proporcoes[i]).toBeLessThanOrEqual(proporcoes[i - 1]);
    }
  });
});
