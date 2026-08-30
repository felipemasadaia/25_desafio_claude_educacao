# Prompt: construir a face da família

Você vai construir a interface de um assistente que ajuda famílias do Rio de
Janeiro a escolher creches no processo seletivo do matrícula.rio.

Stack: Next.js (App Router), TypeScript, React. Sem dependência de serviço
externo em runtime — a aplicação precisa funcionar offline.

**Como a família chega:** por um link já identificado, sem login e sem
cadastro. Os dados da inscrição (nome da criança, endereço, pontuação,
data de nascimento) chegam pré-carregados. Para construir, use um perfil
mockado com esses campos preenchidos — o ponto de integração real não faz
parte deste trabalho, mas a interface tem que ser escrita como se eles
sempre existissem.

---

## 1. O problema, em números

Uma família entra no matrícula.rio, pode escolher até 5 creches, e escolhe às
cegas. O site mostra quais creches existem, mas não mostra o que decide o
resultado: quantas vagas a unidade costuma ter, quanta gente disputa, e onde
essa família cairia na fila com a pontuação dela.

Medido em 5 processos seletivos reais (2021–2025):

- **47% das famílias preenchem uma única opção** em 2025, contra 29% em 2021.
  O comportamento está piorando: a média de opções caiu de 2,71 para 2,22.
- **A qualidade da escolha vale 17,2 pontos percentuais de chance de vaga**,
  comparando famílias do mesmo bairro, mesma faixa de pontuação, mesmo
  grupamento e mesmo horário.
- **A pontuação socioeconômica é ortogonal à qualidade da carteira**
  (correlação −0,014). Família com CadÚnico escolhe tão mal quanto família sem
  critério nenhum. A prioridade legal existe no papel e se perde no formulário.
- **Só 15,1% das famílias têm ao menos uma unidade de alta vacância** na lista
  — justamente a opção que mais aumenta a chance de vaga.

A pessoa do outro lado é uma mãe ou pai no celular, provavelmente sem
familiaridade com o vocabulário do processo, decidindo **uma** creche para
**um** filho. Errar aqui é a criança ficar sem vaga. Essa é a régua de todas
as decisões de interface abaixo.

---

## 2. O motor já existe — é contrato fechado

Existe um módulo puro em `lib/recomendador/` que recebe um perfil e devolve uma
carteira. **Não reimplemente, não reinterprete, não "melhore" essas regras.**
Elas foram validadas contra os dados e várias alternativas plausíveis já foram
testadas e rejeitadas. Você está construindo a interface sobre ele.

```ts
export type Grupamento = "Berçário" | "Maternal I" | "Maternal II";
export type Horario = "Integral" | "Parcial";
export type Modal = "pe" | "transporte" | "carro";
export type Papel = "sonho" | "equilibrio" | "ancora";
export type FaixaChance = "alta" | "media" | "baixa" | "minima";

/** Ponto de referência marcado pela família no mapa (casa, trabalho, avó). */
export type AncoraLocalizacao = {
  id: string; rotulo: string; lat: number; lng: number;
};

/** Entrada do motor: tudo que a família declarou. */
export type Perfil = {
  /** Ordenadas por prioridade: a primeira pesa mais. */
  ancoras: AncoraLocalizacao[];
  modal: Modal;
  grupamento: Grupamento;
  horario: Horario;
  /** perg_id dos critérios de pontuação. Vêm da inscrição, já preenchidos. */
  criterios: number[];
  precisaAcessibilidade: boolean;
};

/** Uma unidade dentro da carteira, com os dois eixos separados. */
export type ItemCarteira = {
  unidade: Unidade;
  papel: Papel;
  /** Probabilidade para ESTE perfil nesta unidade. Par (família, unidade). */
  chance: number;
  faixa: FaixaChance;
  /** Adequação à rotina: trajeto, grupamento, horário. 0..1 */
  encaixe: number;
  /** A âncora de localização que justifica esta unidade. */
  justificadaPor: AncoraLocalizacao;
  distanciaKm: number;
  minutos: number;
  /** O motivo, em uma frase, para a família poder discordar. */
  explicacao: string;
};

export type Carteira = {
  itens: ItemCarteira[];
  /** Probabilidade de conseguir ao menos uma vaga com a carteira inteira. */
  probabilidadeAgregada: number;
  /** Não existe âncora da carteira no alcance. Declarado, nunca mascarado. */
  deficitTerritorial: boolean;
  /** A melhor chance real disponível, quando há déficit. */
  melhorChanceDisponivel: number | null;
  pontuacao: number;
  /** Unidades no alcance que não entraram — material para troca manual. */
  alternativas: ItemCarteira[];
};

recomendar(perfil: Perfil, catalogo: Catalogo): Carteira
reavalia(itens: ItemCarteira[], perfil: Perfil): Carteira  // após edição manual
```

### As regras que o motor garante e a interface não pode contradizer

1. **Âncora sempre.** Toda carteira inclui ao menos uma unidade com chance
   histórica ≥50% e amostra confiável, quando existir uma no alcance. Vale +11
   a +15pp, replicado em três anos independentes.
2. **Otimizar o piso, não o spread.** Maximiza a chance da segunda e terceira
   opções. "Diversificar risco" foi testado e **rejeitado** — o sinal trocava
   conforme o limiar e não replicava entre anos. Não reintroduza essa ideia
   nem na cópia da interface.
3. **Chance é do par (família, unidade)**, nunca a média da unidade. Dois
   perfis idênticos exceto pela pontuação veem chances diferentes para a mesma
   creche.
4. **Nada fora do alcance**, em nenhuma hipótese.
5. **Déficit territorial é declarado, não mascarado.** Sem âncora no alcance, a
   carteira é montada com a melhor chance real e marcada. O sistema não relaxa
   o limiar em silêncio nem estende o raio.
6. **Teto de 5**, como no processo real.
7. **A ordem das âncoras de localização é peso.** A interface explica o efeito,
   nunca a fórmula.

---

## 3. Vocabulário — use exatamente estes termos, em português

Consistência entre código, interface e testes. Não invente sinônimos, não
traduza para inglês, não use "escola" onde o termo é "unidade".

- **Unidade** — creche ou escola que oferece vaga de creche.
- **Âncora de localização** — ponto marcado pela família no mapa.
- **Alcance** — conjunto de unidades que a família consegue frequentar.
- **Chance** — probabilidade de conseguir vaga naquela unidade, para aquela
  família.
- **Encaixe** — adequação à rotina: trajeto, grupamento, horário.
- **Carteira** — o conjunto de até 5 unidades, com ordem e papéis.
- **Papel** — `sonho`, `equilibrio` ou `ancora`.
- **Âncora da carteira** — a aposta segura. Propriedade da unidade, não do
  perfil.
- **Grupamento** — faixa etária curricular.
- **Déficit territorial** — não existe âncora da carteira no alcance.

---

## 4. O que construir

Fluxo em etapas, com estado local em React:

**Boas-vindas** → **Como você chega** → **Seus lugares** → **Carteira**

São **duas** etapas de preenchimento, não três, e essa é a decisão central do
produto: tudo que a inscrição já sabe vem pronto, e a família só acrescenta o
que só ela sabe. O fluxo inteiro precisa caber em poucos minutos no celular.

O indicador de progresso conta **só as duas etapas em que a família preenche
algo**. Boas-vindas e carteira ficam de fora: "passo 1 de 2" precisa contar o
trabalho que ainda falta. Contar o acolhimento faria a barra começar já andada;
contar a entrega faria parecer que ainda falta preencher depois do resultado.

A tela de boas-vindas já mostra o nome da criança e diz, em uma frase, o que
vai ser perguntado e quanto tempo leva.

### Ponto de partida: a família NÃO cadastra o que o Estado já sabe

Este é o princípio que organiza o fluxo inteiro. A família chega por um link
já identificada — a inscrição dela existe, a criança existe, o endereço
existe. Pedir de novo o que a SME já tem é onde a família desiste.

**Já vem preenchido, e a família só confirma:**

- **Nome da criança.** Aparece em texto, no topo. Não é campo de formulário.
- **Casa.** Já vem marcada no mapa, com o pin no endereço da inscrição.
- **Pontuação socioeconômica.** Já calculada a partir dos dados da inscrição
  (CadÚnico, critérios legais). A família **não responde questionário**. Ela vê
  a pontuação e o que a gerou, para entender por que uma creche disputada
  aparece como viável para ela.
- **Grupamento.** Derivado da data de nascimento da criança.

**A família só informa o que a base não tem como saber:**

- Como ela se desloca, e o que é "longe" para ela.
- Se existe outro ponto de referência além da casa.
- Qual desses pontos é o mais importante.

Se algum dado pré-carregado estiver errado, a família **pode corrigir** —
arrastar o pin da casa, ajustar o grupamento. Mas corrigir é a exceção, e a
interface tem que deixar claro que o caminho normal é seguir em frente.

### Etapa 1 — "Como você chega"

O que a inscrição não sabe: o alcance real desta família.

- **Como se desloca:** a pé / ônibus ou BRT / carro. Define o alcance.
- **O que é longe para você:** em vez de perguntar raio em quilômetros — que
  ninguém sabe responder — pergunte em tempo de trajeto, na linguagem do dia a
  dia. Ex.: "até 15 minutos" / "até 30 minutos" / "até 1 hora, se valer a
  pena". A família é quem define o próprio limite; o sistema não arbitra por
  ela.
- **Horário:** integral ou parcial. Muda muito a concorrência, então é pergunta
  de primeira classe, não detalhe escondido.
- **Acessibilidade:** se a criança precisa de alguma condição específica.
  Declare aqui mesmo que **o sistema não tem esse dado por unidade** e que a
  família precisa confirmar direto com a creche — não deixe essa ressalva só
  para o fim.

### Etapa 2 — "Seus lugares"

A casa **já está no mapa**. Esta etapa é sobre o que mais importa e sobre o
que vem primeiro.

- **Adicionar outros pontos**, se houver: trabalho, casa da avó, escola do
  irmão mais velho. É opcional — muita família vai seguir só com a casa, e o
  fluxo tem que funcionar assim.
- Para adicionar, o mapa com **pin arrastável é a fonte da verdade da
  localização** — não há geocodificação de endereço. Muita família mora em rua
  sem numeração oficial ou em comunidade onde o CEP cobre território grande
  demais. Busca por endereço ou CEP existe **apenas como atalho para
  centralizar o mapa**, nunca como a localização em si.
- **Ordenar por prioridade.** Se houver mais de um ponto, a família diz qual
  pesa mais: "a creche precisa ser perto de qual desses?". A ordem entra como
  peso no motor.
- A ordem é declarada arrastando ou com controles de subir/descer — **nunca**
  pedindo à família que traduza prioridade em porcentagem ou nota.
- Pode remover e reposicionar qualquer ponto, inclusive a casa.

### Etapa "Carteira"

- Até 5 cartões, ordenados, cada um com o **papel declarado**.
- **Chance e encaixe são dois eixos visualmente separados. Nunca colapse num
  número ou nota única** — é a separação que permite à família discordar de
  forma informada. Uma creche pode ter chance alta e encaixe ruim, e ela
  precisa ver isso.
- **Chance em faixa qualitativa, nunca número pontual.** Nada de "22ª posição"
  ou "68,4%". A simulação acerta a direção e erra a magnitude; cravar número e
  a família não entrar destrói a confiança no serviço.
- Cada cartão mostra: a explicação em uma frase, a âncora de localização que o
  justifica, distância e tempo estimado. Se uma creche entrou por causa do
  trabalho e não da casa, isso precisa estar visível — a família avalia o risco
  de mudar de emprego.
- Probabilidade agregada da carteira inteira, com a ressalva de que as filas
  são correlacionadas (não são eventos independentes).
- **Troca manual:** substituir uma unidade por outra do mapa, reordenar, e ver
  o impacto na probabilidade. A decisão final é da família.
- **Comparação lado a lado** entre a carteira sugerida e uma seleção que a
  família tenha feito por conta própria.

### Estado de déficit territorial

Quando `deficitTerritorial` é `true`:

- Diga com clareza que **não existe aposta segura no alcance dela**. Não
  suavize, não invente recomendação para preencher as 5 vagas.
- Mostre a melhor chance realmente disponível.
- Informe que o caso foi registrado como demanda não atendida na região, e que
  essa informação vai para quem planeja a rede.

Este estado não é um erro nem um caso de borda decorativo. É o dado mais
valioso do produto — é ele que distingue déficit real de desinformação. Trate
com o mesmo capricho visual do caso feliz.

---

## 5. Limites que a interface declara, nunca esconde

Coloque-os onde a pessoa vai lê-los no momento certo, não num rodapé genérico
que ninguém abre:

- **Acessibilidade não entra no encaixe.** As bases não trazem o atributo por
  unidade, e derivá-lo do tipo seria inventar dado. Avise a família para
  confirmar direto com a creche.
- **A chance é faixa qualitativa, nunca número pontual.**
- **A probabilidade agregada não trata as opções como independentes.** As filas
  são correlacionadas; há peso decrescente e teto explícito.
- **Sem roteirização.** O alcance é distância com ajuste por modal, não rota
  real de transporte público.
- **Os dados são anonimizados** e o material de origem avisa que os indicadores
  não representam a realidade. As conclusões são sobre a *estrutura* do
  problema, não sobre magnitudes absolutas.

---

## 6. Princípios de design

- **Mobile-first, de verdade.** Android modesto, 3G, dados contados. A pessoa
  está no celular, talvez na fila do posto de saúde. Alvos de toque generosos,
  primeira renderização rápida.
- **Português claro, sem jargão do processo.** "Chance de conseguir vaga", não
  "probabilidade estimada de alocação". Se um termo do domínio é inevitável
  (grupamento, âncora), explique-o na primeira aparição, ali mesmo.
- **Uma pergunta por vez.** Formulário longo numa tela é onde a família some.
- **Não pergunte o que você já sabe.** Cada campo pré-preenchido é uma família
  a menos que desiste no meio. Se o dado veio da inscrição, ele aparece
  confirmado, não em branco esperando digitação.
- **Explique o efeito, nunca a fórmula.** "Creches perto da sua casa aparecem
  primeiro" — não pesos, não score.
- **A família pode discordar em qualquer ponto.** Toda recomendação vem com
  motivo, e toda recomendação é editável. O sistema aconselha; quem decide é
  ela.
- Sem tela de login, sem cadastro. O link abre e já começa a ser útil.

---

## 7. Como saber que ficou certo

O fluxo inteiro leva poucos minutos no celular, e a família responde no máximo
a um punhado de perguntas — nenhuma delas sobre dado que a SME já tem.

Uma família que percorre o fluxo inteiro consegue responder, sem ajuda:

1. Em quais 5 creches devo me inscrever, e em que ordem?
2. Por que essa creche específica está na minha lista?
3. Qual delas é minha aposta segura, e qual é meu sonho?
4. O que acontece com minha chance se eu trocar esta por aquela?
5. Onde este sistema pode estar errado a meu respeito?

Se a interface responde às cinco, está pronta. Se colapsou chance e encaixe num
número só, ou cravou uma porcentagem pontual, ou escondeu um déficit
territorial atrás de uma recomendação inventada — não está. E se ela pediu à
família algum dado que a inscrição já tinha, também não está.
