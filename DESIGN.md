# Design

## Theme

**Claro por padrão, escuro completo como par.** A cena que decide: uma mãe em pé na fila,
sol de meio-dia do Rio batendo numa tela riscada de celular. Isso exige superfície clara e
contraste alto — não a estética de ferramenta escura. O tema escuro existe de verdade
(paridade total de tokens, não um filtro), para o gestor da SME à noite e para economia de
bateria em OLED barato.

Registro: **product**. Estratégia de cor: **Restrained** — neutros puros, tipografia fazendo
a hierarquia, cor entrando só onde significa. Referência de sensação: a calma tech do
Notion.

## Color

OKLCH em todo lugar. `bg` é branco puro no claro e neutro puro no escuro — a marca vive nos
tokens de marca e na tipografia, nunca num tingimento da superfície.

### Marca

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--brand` | `oklch(0.48 0.11 268)` | `oklch(0.72 0.11 268)` | Ação primária, seleção, foco |
| `--accent` | `oklch(0.55 0.13 195)` | `oklch(0.74 0.11 195)` | Links, pills, réguas de destaque |

Indigo-ardósia profundo em vez do violeta saturado do seed: "AI-purple-on-white" é zona de
atração e "gradiente roxo" é anti-referência declarada. O accent fica em ciano-petróleo —
distinto do brand em matiz (73°) e em luminosidade.

### Superfícies e texto

| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `oklch(1 0 0)` | `oklch(0.16 0 0)` |
| `--surface` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--elevated` | `oklch(1 0 0)` | `oklch(0.245 0 0)` |
| `--ink` | `oklch(0.22 0.008 268)` | `oklch(0.95 0.004 268)` |
| `--muted` | `oklch(0.50 0.010 268)` | `oklch(0.71 0.008 268)` |
| `--border` | `oklch(0.90 0.004 268)` | `oklch(0.30 0.004 268)` |

`--ink` vs `--bg` ≥ 7:1 nos dois temas. `--muted` ≥ 4.5:1 — texto secundário aqui carrega
informação real (distância, motivo), então não desce para o cinza-elegante de 3:1.

### Sinal de chance — nunca só cor

A chance é o dado central e aparece em **quatro faixas qualitativas**, jamais como número
cravado. Cada faixa carrega **cor + rótulo textual + forma**, para daltonismo e para leitura
sob sol.

| Faixa | Rótulo | Forma | Claro | Escuro |
|---|---|---|---|---|
| alta | "Aposta segura" | círculo cheio ● | `oklch(0.52 0.13 165)` | `oklch(0.76 0.12 165)` |
| media | "Chance real" | círculo meio ◐ | `oklch(0.60 0.13 85)` | `oklch(0.80 0.12 85)` |
| baixa | "Disputada" | círculo quarto ◔ | `oklch(0.58 0.15 45)` | `oklch(0.78 0.13 45)` |
| minima | "Muito disputada" | círculo vazio ○ | `oklch(0.55 0.17 25)` | `oklch(0.74 0.14 25)` |

Verde–âmbar–laranja–vermelho evitando o par verde/vermelho como única distinção: as quatro
faixas se separam também por luminosidade e por forma. Um daltônico deuteranope distingue
pela forma e pelo rótulo.

### Papéis da carteira

`sonho`, `equilibrio` e `ancora` são marcados por rótulo textual e peso tipográfico, não por
cor própria — cor já está saturada pela chance, e dois sistemas de cor competindo destroem a
leitura dos dois eixos.

## Typography

Uma família só: **Geist Sans** (já no scaffold), pesos 400/500/600. Produto não precisa de
par display/body. Números tabulares (`font-variant-numeric: tabular-nums`) em toda métrica.

Escala **fixa em rem**, razão ~1.2 — nunca `clamp()` fluido: em UI de produto o heading
fluido encolhe dentro de painel e piora.

Cada passo existe como token **e** como utilitário do Tailwind
(`text-display`, `text-h2`, …). Os componentes usam o utilitário; tamanho
arbitrário (`text-[0.9rem]`) não entra — foi o que fez a escala virar
decoração na primeira versão.

| Passo | Utilitário | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `--t-display` | `text-display` | 1.75rem | 600 | Título de página, indicador do painel |
| `--t-h2` | `text-h2` | 1.375rem | 600 | Seção |
| `--t-h3` | `text-h3` | 1.0625rem | 600 | Nome de unidade |
| `--t-md` | `text-md` | 0.9375rem | 400 | Texto de apoio de cabeçalho |
| `--t-body` | `text-body` | 0.875rem | 400 | Corpo |
| `--t-sm` | `text-sm` | 0.8125rem | 400 | Metadados, motivo |
| `--t-label` | `text-label` | 0.75rem | 500 | Rótulos de formulário |
| `--t-micro` | `text-micro` | 0.6875rem | 500 | Selo de papel, cabeçalho de tabela |

Prosa limitada a 65–75ch. `text-wrap: balance` em h1–h3. Sem eyebrow em caixa alta acima de
cada seção, sem marcadores numerados como scaffolding.

## Spacing & Layout

Escala de 4px: 4, 8, 12, 16, 24, 32, 48, 64. Ritmo variado — não o mesmo `gap` em tudo.

Mobile-first estrutural: a família é celular em pé. Painel da SME é o único desktop-first.
Alvos de toque ≥44px em toda a face da família. Flex para 1D, grid para 2D.
Grid responsiva sem breakpoint: `repeat(auto-fit, minmax(280px, 1fr))`.

Escala de z-index semântica: `--z-dropdown: 10`, `--z-sticky: 20`, `--z-backdrop: 30`,
`--z-modal: 40`, `--z-toast: 50`.

## Components

Todo componente interativo tem: default, hover, focus-visible, active, disabled. Foco
visível sempre — `outline: 2px solid var(--brand); outline-offset: 2px`. Vocabulário único
nas duas faces: mesmo botão, mesmo campo, mesmo cartão.

**Cartão de unidade** é o componente central. Chance e encaixe ocupam colunas visualmente
separadas e nunca colapsam num número único — é o que permite à família discordar de forma
informada. Cartões só onde são de fato a melhor afordância; nunca cartão dentro de cartão.

Estados vazios ensinam a interface. Skeleton em carregamento, não spinner no meio do
conteúdo.

## Motion

150–250ms, `ease-out` exponencial, sem bounce. Movimento comunica estado — mudança de etapa,
recálculo de carteira, entrada de resultado — nunca decoração. Sem sequência coreografada de
carregamento de página.

Conteúdo é visível por padrão; a animação realça, nunca destrava a visibilidade.
`prefers-reduced-motion: reduce` troca toda transição por crossfade ou corte seco.
