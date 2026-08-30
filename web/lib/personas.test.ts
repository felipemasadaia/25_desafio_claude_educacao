import { describe, expect, it } from "vitest";
import { catalogo, unidadesComGeo } from "./catalogo";
import { PERSONAS } from "./personas";
import { recomendar } from "./recomendador/motor";

/**
 * As personas sustentam a narrativa da demonstração. Se os dados mudarem e
 * elas deixarem de mostrar o que prometem, é melhor o teste falhar aqui do
 * que descobrir no palco.
 */
describe("personas da demonstração", () => {
  const resultado = (i: number) =>
    recomendar(PERSONAS[i].perfil, unidadesComGeo, catalogo.regua_pontuacao);

  it("a primeira persona cai em déficit territorial — é o caso difícil", () => {
    const r = resultado(0);
    expect(r.deficitTerritorial).toBe(true);
    expect(r.itens.length).toBeGreaterThan(0);
  });

  it("a segunda difere da primeira só pela pontuação", () => {
    const [a, b] = [PERSONAS[0].perfil, PERSONAS[1].perfil];
    expect(b.ancoras).toEqual(a.ancoras);
    expect(b.modal).toBe(a.modal);
    expect(b.grupamento).toBe(a.grupamento);
    expect(b.horario).toBe(a.horario);
    expect(b.criterios).not.toEqual(a.criterios);
  });

  it("a prioridade legal melhora a leitura das mesmas unidades", () => {
    const sem = resultado(0);
    const com = resultado(1);

    expect(com.pontuacao).toBeGreaterThan(sem.pontuacao);
    expect(com.probabilidadeAgregada).toBeGreaterThan(sem.probabilidadeAgregada);

    // A prova de palco: as mesmas unidades, chance maior para quem tem
    // prioridade. Sem isso a persona 2 não demonstra nada.
    const porCodigo = new Map(sem.itens.map((i) => [i.unidade.codigo, i.chance]));
    const comuns = com.itens.filter((i) => porCodigo.has(i.unidade.codigo));
    expect(comuns.length).toBeGreaterThan(0);
    for (const item of comuns) {
      expect(item.chance).toBeGreaterThan(porCodigo.get(item.unidade.codigo)!);
    }
  });

  it("toda persona devolve carteira não vazia", () => {
    for (const [i, p] of PERSONAS.entries()) {
      expect(resultado(i).itens.length, p.nome).toBeGreaterThan(0);
    }
  });

  it("a persona de vários pontos usa mais de uma âncora de localização", () => {
    const r = resultado(2);
    const usadas = new Set(r.itens.map((i) => i.justificadaPor.id));
    expect(usadas.size).toBeGreaterThan(1);
  });
});
