import { describe, expect, it } from "vitest";
import {
  ETAPAS,
  filaDoRecorte,
  resumoOperacao,
  taxaContatoAtivo,
  unidadesOperacionais,
} from "./operacao";
import { catalogo } from "./catalogo";
import { normalizaBairro } from "./territorio";

/**
 * Guarda-corpos da camada operacional.
 *
 * A camada é simulada, mas simulada não é arbitrária: ela precisa ser
 * determinística (o gestor reencontra o caso que estava vendo), coerente com
 * os agregados reais que a ancoram, e nunca inventar vaga onde a chance
 * histórica diz que falta.
 */

const soUmaOpcao = new Map(
  catalogo.bairros.map((b) => [normalizaBairro(b.bairro), b.so_uma_opcao]),
);

describe("unidadesOperacionais", () => {
  it("é determinístico entre chamadas", () => {
    const a = unidadesOperacionais(4);
    const b = unidadesOperacionais(4);
    expect(a.map((u) => u.vagas)).toEqual(b.map((u) => u.vagas));
    expect(a.map((u) => u.codigo)).toEqual(b.map((u) => u.codigo));
  });

  it("respeita o recorte de CRE", () => {
    const cre = unidadesOperacionais(2);
    expect(cre.length).toBeGreaterThan(0);
    expect(cre.every((u) => u.cre === 2)).toBe(true);
  });

  it("nunca cria vaga em recorte com chance de até 50%", () => {
    // Chance <= 50% significa fila maior que oferta: ali não sobra vaga, e
    // inventar uma faria o painel chamar família para um lugar sem lugar.
    for (const u of unidadesOperacionais("todas")) {
      for (const r of u.porRecorte) {
        expect(r.chance).toBeGreaterThan(0.5);
      }
    }
  });

  it("soma das vagas por recorte bate com o total da unidade", () => {
    for (const u of unidadesOperacionais("todas").slice(0, 200)) {
      expect(u.porRecorte.reduce((s, r) => s + r.vagas, 0)).toBe(u.vagas);
    }
  });

  it("deriva a fila da procura e da chance reais", () => {
    const unidades = unidadesOperacionais("todas");
    const bruta = new Map(catalogo.unidades.map((u) => [u.codigo, u]));

    for (const u of unidades.slice(0, 100)) {
      const real = bruta.get(u.codigo);
      expect(real).toBeDefined();
      expect(u.procura).toBe(real?.opcoes_2025);
      // A fila nunca passa da procura: são pedidos não atendidos, um
      // subconjunto dos pedidos recebidos.
      expect(u.fila).toBeLessThanOrEqual(u.procura);
    }
  });

  it("vem ordenado por vaga, para a triagem começar por onde há oferta", () => {
    const u = unidadesOperacionais("todas");
    for (let i = 1; i < u.length; i++) {
      expect(u[i - 1].vagas).toBeGreaterThanOrEqual(u[i].vagas);
    }
  });
});

describe("taxaContatoAtivo", () => {
  it("cai conforme o bairro concentra inscrição de uma opção só", () => {
    expect(taxaContatoAtivo(0.2)).toBeGreaterThan(taxaContatoAtivo(0.7));
  });

  it("fica sempre em faixa plausível", () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      expect(taxaContatoAtivo(v)).toBeGreaterThanOrEqual(0.55);
      expect(taxaContatoAtivo(v)).toBeLessThanOrEqual(0.88);
    }
  });
});

describe("filaDoRecorte", () => {
  const unidades = unidadesOperacionais(3);
  const fila = filaDoRecorte(unidades, soUmaOpcao);

  it("é determinística", () => {
    const outra = filaDoRecorte(unidadesOperacionais(3), soUmaOpcao);
    expect(fila.map((i) => i.protocolo)).toEqual(outra.map((i) => i.protocolo));
  });

  it("só materializa família de unidade que tem vaga", () => {
    const comVaga = new Set(unidades.filter((u) => u.vagas > 0).map((u) => u.codigo));
    expect(fila.every((i) => comVaga.has(i.unidade))).toBe(true);
  });

  it("nunca convida quem não tem contato ativo", () => {
    // O gargalo é o ponto do produto: sem número que responde, a família
    // trava em elegível, e é isso que a tela precisa deixar visível.
    const convidados = fila.filter((i) => i.etapa !== "elegivel");
    expect(convidados.every((i) => i.contato === "ativo")).toBe(true);
  });

  it("mantém protocolo único por família", () => {
    const protocolos = fila.map((i) => i.protocolo);
    expect(new Set(protocolos).size).toBe(protocolos.length);
  });

  it("gera pontuação dentro da régua vigente", () => {
    const teto = catalogo.regua_pontuacao.reduce((s, c) => s + Math.max(0, c.pontos), 0);
    expect(fila.every((i) => i.pontos >= 0 && i.pontos <= teto)).toBe(true);
  });
});

describe("resumoOperacao", () => {
  const unidades = unidadesOperacionais("todas");
  const fila = filaDoRecorte(unidades, soUmaOpcao);
  const resumo = resumoOperacao(fila, unidades);

  it("contabiliza toda inscrição em exatamente uma etapa", () => {
    const soma = ETAPAS.reduce((s, e) => s + resumo.porEtapa[e.id], 0);
    expect(soma).toBe(fila.length);
  });

  it("contabiliza todo contato em exatamente uma situação", () => {
    const soma = resumo.contatos.ativo + resumo.contatos.inativo + resumo.contatos.nao_verificado;
    expect(soma).toBe(fila.length);
  });

  it("produz vagas em ordem de grandeza plausível para a rede", () => {
    // Não é o número da SME — que não existe na base. É um guarda-corpo
    // contra calibragem que estoure para absurdo em qualquer direção.
    expect(resumo.vagas).toBeGreaterThan(500);
    expect(resumo.vagas).toBeLessThan(20000);
  });

  it("mantém a fila da rede coerente com a procura total", () => {
    const procura = catalogo.unidades.reduce((s, u) => s + u.opcoes_2025, 0);
    expect(resumo.fila).toBeLessThan(procura);
  });
});
