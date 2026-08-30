import { describe, expect, it } from "vitest";
import { catalogo } from "./catalogo";
import { bairrosDoRecorte, microareas, normalizaBairro } from "./territorio";

describe("normalização de bairro", () => {
  it("casa as grafias divergentes das duas bases", () => {
    expect(normalizaBairro("RAMOS")).toBe(normalizaBairro("Ramos"));
    expect(normalizaBairro("Santíssimo")).toBe(normalizaBairro("SANTISSIMO"));
    expect(normalizaBairro("  Vila  da Penha ")).toBe("VILA DA PENHA");
  });

  it("trata ausência sem estourar", () => {
    expect(normalizaBairro(null)).toBe("");
  });
});

describe("recorte de bairros por CRE", () => {
  it("sem recorte devolve o agregado inteiro", () => {
    expect(bairrosDoRecorte("todas")).toHaveLength(catalogo.bairros.length);
  });

  it("o recorte de uma CRE é menor que a rede", () => {
    const parcial = bairrosDoRecorte(1);
    expect(parcial.length).toBeGreaterThan(0);
    expect(parcial.length).toBeLessThan(catalogo.bairros.length);
  });

  it("bairro em duas CREs aparece nos dois recortes", () => {
    // Ramos tem unidades na 3ª e na 4ª CRE. Forçar um dono só o faria
    // desaparecer do painel da outra.
    const naTerceira = bairrosDoRecorte(3).some((b) => normalizaBairro(b.bairro) === "RAMOS");
    const naQuarta = bairrosDoRecorte(4).some((b) => normalizaBairro(b.bairro) === "RAMOS");
    expect(naTerceira).toBe(true);
    expect(naQuarta).toBe(true);
  });
});

describe("descasamento por microárea", () => {
  it("microárea sem âncora tem descasamento nulo, não infinito", () => {
    const semAncora = microareas("todas").filter((m) => m.ancoras === 0);
    expect(semAncora.length).toBeGreaterThan(0);
    for (const m of semAncora) {
      expect(m.descasamento).toBeNull();
    }
  });

  it("descasamento é procura dividida por âncora", () => {
    const comAncora = microareas("todas").find((m) => m.ancoras > 0);
    expect(comAncora).toBeDefined();
    expect(comAncora!.descasamento).toBeCloseTo(comAncora!.procura / comAncora!.ancoras, 6);
  });

  it("as sem aposta segura vêm primeiro, ordenadas por procura", () => {
    const lista = microareas("todas");
    const corte = lista.findIndex((m) => m.descasamento !== null);
    expect(corte).toBeGreaterThan(0);

    const semAncora = lista.slice(0, corte);
    for (let i = 1; i < semAncora.length; i++) {
      expect(semAncora[i].procura).toBeLessThanOrEqual(semAncora[i - 1].procura);
    }
    // Nenhuma com âncora se infiltra antes do corte.
    expect(semAncora.every((m) => m.descasamento === null)).toBe(true);
  });

  it("o recorte por CRE devolve só microáreas daquela CRE", () => {
    const daQuinta = microareas(5);
    expect(daQuinta.length).toBeGreaterThan(0);
    expect(daQuinta.every((m) => m.cre === 5)).toBe(true);
  });

  it("a procura do recorte soma a procura das unidades daquela CRE", () => {
    const esperado = catalogo.unidades
      .filter((u) => u.cre === 5 && u.lat !== null && u.microarea)
      .reduce((s, u) => s + u.opcoes_2025, 0);
    const obtido = microareas(5).reduce((s, m) => s + m.procura, 0);
    expect(obtido).toBe(esperado);
  });
});
