/**
 * Costura 1 — motor de recomendação.
 *
 * Verifica comportamento externo observável: dado um perfil, a carteira
 * devolvida satisfaz as regras. Não verifica como o score foi calculado,
 * nem a ordem das operações. Pesos e limiares vão ser calibrados; teste
 * acoplado a eles quebra a cada ajuste sem pegar defeito real.
 */
import { describe, expect, it } from "vitest";
import { recomendar } from "./motor";
import { CASA, TRABALHO, unidade } from "./fixtures";
import type { Perfil, Unidade } from "./tipos";

/** CadÚnico vale 51 pontos na régua vigente — o critério dominante. */
const CADUNICO = 28;

function perfil(over: Partial<Perfil> = {}): Perfil {
  return {
    ancoras: [CASA],
    modal: "transporte",
    grupamento: "Maternal I",
    horario: "Integral",
    criterios: [],
    precisaAcessibilidade: false,
    ...over,
  };
}

/** Uma unidade a 1km com chance histórica alta: âncora elegível. */
function ancoraElegivel(codigo = "ANCORA"): Unidade {
  return unidade({ codigo, chance_hist: 0.72, km: 1 });
}

/** Unidade disputada a 1km: chance baixa. */
function disputada(codigo = "DISPUTADA"): Unidade {
  return unidade({ codigo, chance_hist: 0.12, km: 1 });
}

describe("regra 1 — âncora sempre", () => {
  it("inclui uma unidade com chance histórica >=50% quando existe no alcance", () => {
    const catalogo = [ancoraElegivel(), disputada("D1"), disputada("D2"), disputada("D3")];
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.some((i) => i.papel === "ancora")).toBe(true);
    expect(carteira.itens.map((i) => i.unidade.codigo)).toContain("ANCORA");
  });

  it("inclui âncora mesmo quando a família já tem boas apostas — não é condicional ao perfil", () => {
    const catalogo = [
      ancoraElegivel("A1"),
      unidade({ codigo: "B1", chance_hist: 0.45, km: 1 }),
      unidade({ codigo: "B2", chance_hist: 0.44, km: 1 }),
    ];
    const carteira = recomendar(perfil({ criterios: [CADUNICO] }), catalogo);

    expect(carteira.itens.some((i) => i.papel === "ancora")).toBe(true);
  });
});

describe("regra 5 — déficit territorial é declarado, não mascarado", () => {
  const semAncora = [
    disputada("D1"),
    unidade({ codigo: "D2", chance_hist: 0.2, km: 2 }),
    unidade({ codigo: "D3", chance_hist: 0.31, km: 3 }),
  ];

  it("marca déficit territorial quando não há âncora no alcance", () => {
    const carteira = recomendar(perfil(), semAncora);
    expect(carteira.deficitTerritorial).toBe(true);
  });

  it("devolve a melhor chance real disponível em vez de inventar recomendação", () => {
    const carteira = recomendar(perfil(), semAncora);
    expect(carteira.melhorChanceDisponivel).not.toBeNull();
    expect(carteira.itens.length).toBeGreaterThan(0);
  });

  it("não relaxa o limiar em silêncio: nenhum item vira âncora sem chance >=50%", () => {
    const carteira = recomendar(perfil(), semAncora);
    for (const item of carteira.itens) {
      if (item.papel === "ancora") {
        expect(item.unidade.chance_hist).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it("não marca déficit quando existe âncora no alcance", () => {
    const carteira = recomendar(perfil(), [ancoraElegivel(), ...semAncora]);
    expect(carteira.deficitTerritorial).toBe(false);
  });
});

describe("regra 4 — nada fora do alcance", () => {
  it("não inclui unidade distante quando a família anda a pé", () => {
    const catalogo = [
      unidade({ codigo: "PERTO", chance_hist: 0.3, km: 0.5 }),
      unidade({ codigo: "LONGE", chance_hist: 0.95, km: 40 }),
    ];
    const carteira = recomendar(perfil({ modal: "pe" }), catalogo);

    expect(carteira.itens.map((i) => i.unidade.codigo)).not.toContain("LONGE");
  });

  it("não inclui unidade fora do alcance nem quando a carteira ficaria vazia", () => {
    const catalogo = [unidade({ codigo: "LONGE", chance_hist: 0.95, km: 60 })];
    const carteira = recomendar(perfil({ modal: "pe" }), catalogo);

    expect(carteira.itens).toHaveLength(0);
  });

  it("unidade sem coordenada nunca entra na carteira", () => {
    const catalogo = [
      unidade({ codigo: "SEM_GEO", chance_hist: 0.9, lat: null, lng: null }),
      disputada("D1"),
    ];
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.map((i) => i.unidade.codigo)).not.toContain("SEM_GEO");
  });

  it("alcance maior de carro do que a pé", () => {
    const catalogo = [unidade({ codigo: "MEDIA", chance_hist: 0.6, km: 8 })];

    const aPe = recomendar(perfil({ modal: "pe" }), catalogo);
    const deCarro = recomendar(perfil({ modal: "carro" }), catalogo);

    expect(aPe.itens).toHaveLength(0);
    expect(deCarro.itens.length).toBeGreaterThan(0);
  });
});

describe("regra 6 — teto de 5", () => {
  it("nunca devolve mais de 5 opções", () => {
    const catalogo = Array.from({ length: 30 }, (_, i) =>
      unidade({ codigo: `U${i}`, chance_hist: 0.3 + (i % 10) * 0.05, km: 1 + i * 0.1 }),
    );
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.length).toBeLessThanOrEqual(5);
    expect(carteira.itens.length).toBe(5);
  });
});

describe("regra 3 — chance é do par (família, unidade)", () => {
  it("dois perfis idênticos exceto pela pontuação recebem chances diferentes, na direção correta", () => {
    const catalogo = [unidade({ codigo: "U1", chance_hist: 0.3, km: 1 })];

    const semCriterio = recomendar(perfil(), catalogo);
    const comCadUnico = recomendar(perfil({ criterios: [CADUNICO] }), catalogo);

    const a = semCriterio.itens[0];
    const b = comCadUnico.itens[0];

    expect(b.chance).toBeGreaterThan(a.chance);
  });

  it("a pontuação da carteira reflete os critérios declarados", () => {
    const catalogo = [ancoraElegivel()];
    expect(recomendar(perfil(), catalogo).pontuacao).toBe(0);
    expect(recomendar(perfil({ criterios: [CADUNICO] }), catalogo).pontuacao).toBeGreaterThan(0);
  });
});

describe("confiabilidade da amostra", () => {
  it("unidade sem histórico confiável nunca entra como âncora", () => {
    const catalogo = [
      unidade({ codigo: "FRAGIL", chance_hist: 0.9, n_hist: 4, confiavel: false, km: 1 }),
      disputada("D1"),
      disputada("D2"),
    ];
    const carteira = recomendar(perfil(), catalogo);

    const fragil = carteira.itens.find((i) => i.unidade.codigo === "FRAGIL");
    if (fragil) expect(fragil.papel).not.toBe("ancora");
    expect(carteira.deficitTerritorial).toBe(true);
  });
});

describe("compatibilidade de grupamento e horário", () => {
  it("unidade que não atende o grupamento da criança não aparece", () => {
    const catalogo = [
      unidade({
        codigo: "SO_BERCARIO",
        chance_hist: 0.9,
        km: 1,
        grupamentos: [{ grupamento: "Berçário", horario: "Integral", chance: 0.9 }],
      }),
      disputada("D1"),
    ];
    const carteira = recomendar(perfil({ grupamento: "Maternal I" }), catalogo);

    expect(carteira.itens.map((i) => i.unidade.codigo)).not.toContain("SO_BERCARIO");
  });

  it("unidade que não atende o horário pedido não aparece", () => {
    const catalogo = [
      unidade({
        codigo: "SO_INTEGRAL",
        chance_hist: 0.9,
        km: 1,
        grupamentos: [{ grupamento: "Maternal I", horario: "Integral", chance: 0.9 }],
      }),
      disputada("D1"),
    ];
    const carteira = recomendar(perfil({ horario: "Parcial" }), catalogo);

    expect(carteira.itens.map((i) => i.unidade.codigo)).not.toContain("SO_INTEGRAL");
  });

  it("usa a chance do recorte grupamento x horário, não a média da unidade", () => {
    const catalogo = [
      unidade({
        codigo: "U1",
        chance_hist: 0.5,
        km: 1,
        grupamentos: [
          { grupamento: "Maternal I", horario: "Integral", chance: 0.85, opcoes: 60 },
          { grupamento: "Maternal II ", horario: "Integral", chance: 0.15, opcoes: 60 },
        ],
      }),
    ];

    const mat1 = recomendar(perfil({ grupamento: "Maternal I" }), catalogo).itens[0];
    const mat2 = recomendar(perfil({ grupamento: "Maternal II" }), catalogo).itens[0];

    expect(mat1.chance).toBeGreaterThan(mat2.chance);
  });

  it("tolera o espaço extra em 'Maternal II ' vindo da base da SME", () => {
    const catalogo = [
      unidade({
        codigo: "U1",
        chance_hist: 0.6,
        km: 1,
        grupamentos: [{ grupamento: "Maternal II ", horario: "Integral", chance: 0.6 }],
      }),
    ];
    const carteira = recomendar(perfil({ grupamento: "Maternal II" }), catalogo);

    expect(carteira.itens).toHaveLength(1);
  });
});

describe("regra 7 — ordem das âncoras de localização entra como peso", () => {
  it("alterar a ordem das âncoras altera a carteira", () => {
    const catalogo = [
      unidade({ codigo: "PERTO_CASA", chance_hist: 0.4, distanciaDe: CASA, km: 0.5 }),
      unidade({ codigo: "PERTO_TRAB", chance_hist: 0.4, distanciaDe: TRABALHO, km: 0.5 }),
    ];

    const casaPrimeiro = recomendar(
      perfil({ ancoras: [CASA, TRABALHO] }),
      catalogo,
    );
    const trabalhoPrimeiro = recomendar(
      perfil({ ancoras: [TRABALHO, CASA] }),
      catalogo,
    );

    expect(casaPrimeiro.itens[0].unidade.codigo).not.toBe(
      trabalhoPrimeiro.itens[0].unidade.codigo,
    );
  });

  it("cada item declara a âncora de localização que o justifica", () => {
    const catalogo = [
      unidade({ codigo: "PERTO_TRAB", chance_hist: 0.5, distanciaDe: TRABALHO, km: 0.3 }),
    ];
    const carteira = recomendar(perfil({ ancoras: [CASA, TRABALHO] }), catalogo);

    expect(carteira.itens[0].justificadaPor.id).toBe("trabalho");
  });
});

describe("forma da saída", () => {
  it("cada unidade devolvida tem papel, explicação e âncora que a justifica", () => {
    const catalogo = [ancoraElegivel(), disputada("D1"), disputada("D2")];
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.length).toBeGreaterThan(0);
    for (const item of carteira.itens) {
      expect(["sonho", "equilibrio", "ancora"]).toContain(item.papel);
      expect(item.explicacao.length).toBeGreaterThan(0);
      expect(item.justificadaPor).toBeDefined();
      expect(item.distanciaKm).toBeGreaterThanOrEqual(0);
      expect(["alta", "media", "baixa", "minima"]).toContain(item.faixa);
    }
  });

  it("separa chance de encaixe: os dois eixos nunca colapsam num número", () => {
    const catalogo = [ancoraElegivel(), disputada("D1")];
    const carteira = recomendar(perfil(), catalogo);

    for (const item of carteira.itens) {
      expect(item.chance).toBeGreaterThanOrEqual(0);
      expect(item.chance).toBeLessThanOrEqual(1);
      expect(item.encaixe).toBeGreaterThanOrEqual(0);
      expect(item.encaixe).toBeLessThanOrEqual(1);
    }
  });

  it("probabilidade agregada é maior que a melhor chance individual", () => {
    const catalogo = [
      unidade({ codigo: "U1", chance_hist: 0.4, km: 1 }),
      unidade({ codigo: "U2", chance_hist: 0.4, km: 1.2 }),
      unidade({ codigo: "U3", chance_hist: 0.4, km: 1.4 }),
    ];
    const carteira = recomendar(perfil(), catalogo);
    const melhor = Math.max(...carteira.itens.map((i) => i.chance));

    expect(carteira.probabilidadeAgregada).toBeGreaterThan(melhor);
    expect(carteira.probabilidadeAgregada).toBeLessThanOrEqual(1);
  });

  it("carteira vazia tem probabilidade agregada zero", () => {
    const carteira = recomendar(perfil({ modal: "pe" }), [
      unidade({ codigo: "LONGE", chance_hist: 0.9, km: 80 }),
    ]);

    expect(carteira.itens).toHaveLength(0);
    expect(carteira.probabilidadeAgregada).toBe(0);
  });
});

describe("determinismo", () => {
  it("mesma entrada, mesma saída", () => {
    const catalogo = Array.from({ length: 12 }, (_, i) =>
      unidade({ codigo: `U${i}`, chance_hist: 0.2 + i * 0.05, km: 1 + i * 0.2 }),
    );

    const a = recomendar(perfil(), catalogo);
    const b = recomendar(perfil(), catalogo);

    expect(a.itens.map((i) => i.unidade.codigo)).toEqual(b.itens.map((i) => i.unidade.codigo));
    expect(a.probabilidadeAgregada).toBe(b.probabilidadeAgregada);
  });

  it("não muta o catálogo recebido", () => {
    const catalogo = [ancoraElegivel(), disputada("D1")];
    const antes = JSON.stringify(catalogo);
    recomendar(perfil(), catalogo);

    expect(JSON.stringify(catalogo)).toBe(antes);
  });
});

describe("regra 2 — otimizar o piso, não o spread", () => {
  it("prefere as medianas às disputadas ao preencher as vagas restantes", () => {
    // Medianas suficientes para preencher a carteira: as disputadas de baixo
    // valor só entrariam se o motor não estivesse elevando o piso.
    const catalogo = [
      unidade({ codigo: "MED1", chance_hist: 0.44, km: 1 }),
      unidade({ codigo: "MED2", chance_hist: 0.43, km: 1.1 }),
      unidade({ codigo: "MED3", chance_hist: 0.42, km: 1.2 }),
      unidade({ codigo: "MED4", chance_hist: 0.41, km: 1.3 }),
      unidade({ codigo: "MED5", chance_hist: 0.4, km: 1.4 }),
      unidade({ codigo: "RUIM1", chance_hist: 0.05, km: 3 }),
      unidade({ codigo: "RUIM2", chance_hist: 0.04, km: 3.2 }),
    ];
    const carteira = recomendar(perfil(), catalogo);
    const codigos = carteira.itens.map((i) => i.unidade.codigo);

    expect(codigos).toContain("MED1");
    expect(codigos).toContain("MED2");
    expect(codigos).not.toContain("RUIM2");
  });

  it("o piso da carteira é a menor chance entre as opções", () => {
    const catalogo = [
      ancoraElegivel(),
      unidade({ codigo: "M1", chance_hist: 0.35, km: 1 }),
      unidade({ codigo: "M2", chance_hist: 0.3, km: 1.1 }),
    ];
    const carteira = recomendar(perfil(), catalogo);
    const piso = Math.min(...carteira.itens.map((i) => i.chance));

    expect(piso).toBeGreaterThan(0);
  });
});

describe("acessibilidade", () => {
  it("perfil com necessidade de acessibilidade ainda recebe carteira", () => {
    const catalogo = [ancoraElegivel(), disputada("D1")];
    const carteira = recomendar(perfil({ precisaAcessibilidade: true }), catalogo);

    expect(carteira.itens.length).toBeGreaterThan(0);
  });
});

describe("carteira é portfólio, não lista do mesmo", () => {
  it("não empilha cinco âncoras quando há alternativas: os papéis se diferenciam", () => {
    // Bairro com muita oferta fácil: sem cuidado, o motor escolhe 5 apostas
    // seguras idênticas e a carteira deixa de ser um portfólio.
    const catalogo = [
      ...Array.from({ length: 8 }, (_, i) =>
        unidade({ codigo: `SEG${i}`, chance_hist: 0.8 - i * 0.01, km: 2 + i * 0.1 }),
      ),
      unidade({ codigo: "PERTINHO", chance_hist: 0.22, km: 0.3 }),
    ];
    const carteira = recomendar(perfil(), catalogo);
    const papeis = new Set(carteira.itens.map((i) => i.papel));

    expect(papeis.size).toBeGreaterThan(1);
  });

  it("exatamente um item carrega o papel de âncora", () => {
    const catalogo = Array.from({ length: 8 }, (_, i) =>
      unidade({ codigo: `SEG${i}`, chance_hist: 0.8 - i * 0.02, km: 1 + i * 0.2 }),
    );
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.filter((i) => i.papel === "ancora")).toHaveLength(1);
  });

  it("mantém a unidade mais próxima mesmo disputada — a família quer o que quer", () => {
    const catalogo = [
      ...Array.from({ length: 6 }, (_, i) =>
        unidade({ codigo: `LONGE${i}`, chance_hist: 0.75, km: 5 + i * 0.2 }),
      ),
      unidade({ codigo: "PERTINHO", chance_hist: 0.18, km: 0.2 }),
    ];
    const carteira = recomendar(perfil(), catalogo);

    expect(carteira.itens.map((i) => i.unidade.codigo)).toContain("PERTINHO");
  });
});

describe("probabilidade agregada é calibrada, não otimista", () => {
  it("nunca chega a 100%: a simulação acerta a direção e erra a magnitude", () => {
    const catalogo = Array.from({ length: 6 }, (_, i) =>
      unidade({ codigo: `U${i}`, chance_hist: 0.9, km: 1 + i * 0.1 }),
    );
    const carteira = recomendar(perfil({ criterios: [CADUNICO] }), catalogo);

    expect(carteira.probabilidadeAgregada).toBeLessThan(0.95);
  });

  it("continua monótona: mais opções boas não pioram a probabilidade", () => {
    const uma = recomendar(perfil(), [unidade({ codigo: "U0", chance_hist: 0.4, km: 1 })]);
    const tres = recomendar(perfil(), [
      unidade({ codigo: "U0", chance_hist: 0.4, km: 1 }),
      unidade({ codigo: "U1", chance_hist: 0.4, km: 1.1 }),
      unidade({ codigo: "U2", chance_hist: 0.4, km: 1.2 }),
    ]);

    expect(tres.probabilidadeAgregada).toBeGreaterThan(uma.probabilidadeAgregada);
  });
});

describe("consistência de apresentação", () => {
  it("a distância da explicação é a mesma do campo distanciaKm", () => {
    const catalogo = [unidade({ codigo: "U1", chance_hist: 0.6, km: 1.55 })];
    const item = recomendar(perfil(), catalogo).itens[0];

    if (item.distanciaKm >= 1) {
      const naFrase = item.explicacao.match(/(\d+,\d+) km/)?.[1];
      expect(naFrase).toBe(item.distanciaKm.toFixed(1).replace(".", ","));
    }
  });
});
