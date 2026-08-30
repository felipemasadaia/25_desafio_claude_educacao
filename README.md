# Carteira de Creches — Rio de Janeiro

Duas ferramentas sobre a mesma base de dados do processo seletivo de creche do
município do Rio. De um lado a **família**, que precisa escolher até 5 creches sem
escolher às cegas. Do outro a **Secretaria**, que precisa distinguir déficit real
de desinformação. As duas faces leem o mesmo motor por lados opostos.

## Vídeo de apresentação

<!-- Substituir pelo link do YouTube quando o vídeo estiver publicado. -->

_A gravar._

## Acessar

| Face | O que faz | Link |
| ---- | --------- | ---- |
| **Família** | Monta uma carteira de até 5 creches, com papel e chance declarados para cada uma | _a publicar_ — rota `/familia` |
| **Secretaria (SME)** | Conduz o ciclo de matrícula nas três fases, da pré-inscrição ao contato porta a porta | _a publicar_ — rota `/secretaria` |

> As duas faces vivem na mesma aplicação: um deploy, dois públicos. A raiz (`/`)
> pergunta uma vez quem chegou e sai do caminho.

## O problema

Hoje **47% das famílias preenchem uma única opção** na inscrição. Quem preenche uma
opção só está apostando tudo numa creche que pode ter 40 candidatos por vaga — e
descobre isso depois do resultado. Do lado da Secretaria, a fila registra *escolhas*,
não *necessidade*: uma microárea sem nenhuma creche viável aparece como silêncio,
não como déficit.

## As duas soluções

### Família — recomendador de carteira

A família marca onde vive, trabalha ou tem com quem contar, responde a régua oficial
de pontuação (pulando o que não souber) e recebe até 5 unidades com **papel declarado**:

- **Âncora** — a aposta segura: unidade que historicamente costuma ter vaga.
- **Equilíbrio** — chance real, encaixa na rotina.
- **Sonho** — a creche que ela quer de verdade, mesmo disputada.

Dois eixos que nunca colapsam num número só: **chance** (vai conseguir vaga?) e
**encaixe** (dá para levar todo dia?). Um número único esconderia o trade-off e
tiraria da família a capacidade de discordar de forma informada.

Quando não existe nenhuma opção segura ao alcance, a ferramenta **diz isso** em vez de
preencher as 5 vagas com unidade inviável — e essa recusa vira dado de planejamento
do outro lado.

### Secretaria — plataforma do ciclo de matrícula

Uma tela por fase, com o recorte de CRE valendo para todas:

1. **Pré-inscrição** — quanta vaga a rede terá, quais unidades ainda não responderam
   ao formulário, e onde a capacidade já nasce menor que a procura. Inclui o mapa
   coroplético das 11 CREs sobre geometria oficial SME/IPP.
2. **Durante a inscrição** — onde o que as famílias pedem não encontra o que a rede
   oferece. O recorte é a **microárea**, não o bairro: um bairro pode fechar
   equilibrado escondendo uma microárea sem uma única aposta segura.
3. **CRM de convocação** — a vaga só vira matrícula se a família for alcançada. O
   fluxo valida o telefone antes de convidar, e quem não passa entra numa rota de
   resgate: notificação no aparelho ou agente na porta.

## Rodando

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Outros comandos:

```bash
npm run test       # 93 testes do motor de recomendação
npm run typecheck
npm run build
```

## Estrutura

| Pasta       | O que é                                                          |
| ----------- | ---------------------------------------------------------------- |
| `web/`      | A aplicação Next.js (App Router, TypeScript, Tailwind)           |
| `web/lib/`  | O motor: recomendador, cobertura, território, dados da secretaria |
| `web/data/` | Catálogo processado (`creches.json`) e geometria das CREs        |
| `etl/`      | Scripts de preparação de dados (geojson das CREs a partir do shapefile) |
| `scripts/`  | Processamento do catálogo e guarda-corpos de dados (Python)      |
| `docs/`     | ADRs e convenções de agente                                       |

Documentos de contexto: [`PRODUCT.md`](PRODUCT.md) (usuários e princípios),
[`CONTEXT.md`](CONTEXT.md) (glossário do domínio e invariantes),
[`DESIGN.md`](DESIGN.md) (decisões de interface).

## Dados

Bases anonimizadas de **5 processos seletivos (2021–2025)** do repositório público
[CIT-SME-RJ/dadoscreche](https://github.com/CIT-SME-RJ/dadoscreche): 837 mil opções
de inscrição, 872 unidades, régua de pontuação socioeconômica, oferta e matrícula
por unidade e CRE. Geometria territorial do shapefile SME/IPP (233 microáreas).

O repositório de dados brutos não é duplicado aqui. Para reprocessar:

```bash
git clone https://github.com/CIT-SME-RJ/dadoscreche.git dados_sme
```

Os dados que a aplicação consome já estão versionados em `web/data/`.

### O que é real e o que é simulado

Declarado em vez de escondido, porque a diferença muda o que a demonstração prova:

- **Real** — unidade, CRE, microárea, bairro, coordenada, procura por unidade e por
  grupamento × horário, chance histórica, série anual de inscrições, régua oficial
  de pontuação.
- **Simulado** — o estado do formulário de capacidade e os cadastros individuais do
  CRM. A base é agregada e anonimizada: não traz criança identificada nem telefone,
  e sem isso não existe CRM nenhum. A simulação é determinística (hash da chave,
  nunca `Math.random`), para o gestor reencontrar o mesmo caso a cada recarga, e
  cada campo fictício é ancorado num sinal real.

## Limites conhecidos

- A chance aparece como **faixa qualitativa**, nunca como número cravado. A simulação
  acerta a direção e erra a magnitude; cravar "22ª posição" e a família não entrar
  destrói a confiança no serviço.
- **Acessibilidade da unidade não entra no encaixe.** As bases públicas não dizem
  quais creches são acessíveis. A ferramenta avisa e pede confirmação por telefone,
  em vez de chutar.
- O catálogo não traz vaga ofertada por unidade (`matriculas` existe em 74 de 872),
  então o painel mede **descasamento** — procura por aposta segura — e não "demanda
  por vaga". Derivar oferta do tipo da unidade seria inventar dado.

## Acessibilidade

WCAG 2.2 AA, verificado nos temas claro e escuro. Chance nunca comunicada só por cor
(cor + rótulo + forma). Alvos de toque ≥44px, navegação por teclado, foco visível,
zoom 200% sem quebra, `prefers-reduced-motion` respeitado. O caso base é o celular
modesto em dados móveis, não o desktop com o mapa grande.

## Estado

Protótipo de demonstração. Não substitui a inscrição no
[matrícula.rio](https://matricula.rio), que continua sendo o canal oficial.
