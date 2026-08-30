# Spec: Recomendador de Carteira de Creches

Status: ready-for-agent

Fonte dos dados: `CIT-SME-RJ/dadoscreche` (clonado em `dados_sme/`), 5 processos seletivos anonimizados (2021–2025).

---

## Problem Statement

Uma família do Rio de Janeiro que precisa de creche entra no matrícula.rio, pode escolher até 5 unidades, e escolhe às cegas. O site mostra quais creches existem, mas não mostra o que decide o resultado: quantas vagas aquela unidade costuma ter, quanta gente disputa, e onde essa família específica cairia na fila com a pontuação que ela tem.

O resultado, medido nas bases dos 5 processos:

- **47% das famílias preenchem uma única opção** em 2025 — contra 29% em 2021. O comportamento está piorando ano a ano, e a média de opções caiu de 2,71 para 2,22.
- **A qualidade da escolha vale 17,2 pontos percentuais de chance de vaga**, comparando famílias do mesmo bairro, mesma faixa de pontuação, mesmo grupamento e mesmo horário. Quem escolheu bem tem ~77% de chance; quem escolheu mal, ~60%.
- **A pontuação socioeconômica é ortogonal à qualidade da carteira** (correlação −0,014). Família com CadÚnico escolhe tão mal quanto família sem critério nenhum, e perde tanto quanto ela. A prioridade legal existe no papel e se perde no formulário.
- **Só 15,1% das famílias têm pelo menos uma unidade de alta vacância** na lista — a opção que mais aumenta a chance de conseguir vaga.

Do outro lado do balcão, a SME planeja a rede olhando a demanda histórica da fila. Mas a fila registra escolhas, não necessidade: a mesma criança aparece em até 5 filas, e uma unidade com fila zero pode significar tanto "sobra vaga" quanto "ninguém consegue chegar aqui". A secretaria não tem como distinguir déficit real de desinformação.

## Solution

Duas faces sobre o mesmo motor.

**Para a família** — um assistente de escolha que, antes da inscrição, monta uma carteira de até 5 creches calibrada para a realidade dela.

A família marca no mapa os pontos que importam (casa, trabalho, casa da avó), ordena esses pontos por prioridade, diz como se desloca e responde ao questionário socioeconômico. O sistema devolve uma carteira em que cada creche tem um papel explícito e dois eixos visíveis:

- **Chance de vaga** — simulada com a pontuação daquela família, não a média da unidade. A mesma creche mostra chance diferente para perfis diferentes.
- **Encaixe** — trajeto, faixa etária, horário, acessibilidade.

E cada recomendação vem com o motivo em uma frase, para a família poder discordar.

**Para a SME** — um painel que lê os mesmos dados pelo outro lado: onde está o descasamento entre oferta e demanda, quais unidades têm vacância crônica, e quantas famílias ficaram sem nenhuma opção segura ao alcance. Uma família que o recomendador não consegue atender não é uma falha silenciosa: vira um registro de déficit territorial no painel.

A ponte entre as duas faces é a honestidade sobre o limite: quando não há creche viável no alcance de uma família, o sistema diz isso em vez de inventar recomendação, e esse "não consegui" é exatamente o dado que a secretaria precisa para planejar oferta.

## User Stories

### Descoberta e localização (família)

1. Como responsável por uma criança de 0 a 3 anos, quero informar onde moro marcando um ponto no mapa, para que o sistema entenda minha localização mesmo que minha rua não tenha numeração oficial.
2. Como responsável que mora em comunidade, quero que o mapa não dependa só do meu CEP, para que a recomendação não erre por o CEP cobrir um território grande demais.
3. Como responsável, quero usar meu CEP apenas como atalho para centralizar o mapa, para que eu não precise arrastar o pin desde o zero.
4. Como responsável que trabalha longe de casa, quero adicionar o endereço do meu trabalho como segundo ponto de referência, para que apareçam creches no caminho que eu já faço.
5. Como responsável que conta com a avó para buscar a criança, quero adicionar a casa dela como ponto de referência, para que creches perto dela entrem na recomendação.
6. Como responsável, quero ordenar meus pontos de referência por prioridade, para que o sistema saiba que casa importa mais que trabalho — sem me pedir para traduzir isso em porcentagem.
7. Como responsável, quero remover ou reposicionar um ponto depois de marcá-lo, para corrigir um erro sem refazer tudo.
8. Como responsável, quero declarar como me desloco (a pé, ônibus/BRT, carro), para que o alcance considerado seja o meu de verdade.
9. Como responsável sem transporte próprio, quero que creches fora do meu alcance real não sejam recomendadas, para não perder opção com uma escolha inviável.
10. Como responsável, quero ver no mapa todas as creches próximas com sinalização visual de chance de vaga, para entender o panorama antes de decidir.

### Perfil e pontuação (família)

11. Como responsável, quero responder ao questionário socioeconômico uma vez, para que minha pontuação seja considerada em todas as recomendações.
12. Como responsável com CadÚnico, quero que minha prioridade legal seja refletida na chance mostrada, para não desistir de uma creche boa que eu na verdade conseguiria.
13. Como responsável, quero ver quantos pontos minha situação gera e quanto isso pesa, para entender por que uma creche difícil aparece como viável para mim.
14. Como responsável, quero informar a faixa etária da criança, para ver apenas unidades que atendem o grupamento dela.
15. Como responsável, quero informar se preciso de horário integral ou parcial, para que a chance mostrada seja a daquele horário — que tem concorrência muito diferente.
16. Como responsável de criança com deficiência, quero informar isso, para que a recomendação considere tanto a pontuação quanto a acessibilidade da unidade.
17. Como responsável, quero poder pular perguntas que não sei responder, para não travar no formulário.

### Carteira recomendada (família)

18. Como responsável, quero receber uma carteira de até 5 creches em vez de uma lista solta, para saber em quais me inscrever e em que ordem.
19. Como responsável, quero que cada creche da carteira tenha um papel declarado (sonho, equilíbrio, âncora), para entender que elas cumprem funções diferentes.
20. Como responsável, quero que a carteira sempre inclua ao menos uma âncora quando existir uma no meu alcance, para não apostar tudo em creche disputada.
21. Como responsável, quero manter na carteira a creche que eu quero mesmo que ela seja difícil, para não abrir mão do que importa para mim.
22. Como responsável, quero ver a chance de vaga de cada creche calculada para o meu perfil, para saber onde realmente tenho possibilidade.
23. Como responsável, quero ver o encaixe de cada creche com a minha rotina separado da chance, para poder discordar do sistema quando a recomendação parecer estranha.
24. Como responsável, quero ler em uma frase por que cada creche foi recomendada, para confiar ou rejeitar a sugestão com base em algo concreto.
25. Como responsável, quero ver minha probabilidade de conseguir alguma vaga com a carteira inteira, para entender o ganho de seguir a recomendação.
26. Como responsável, quero comparar a carteira sugerida com as creches que eu tinha escolhido sozinho, para ver a diferença antes de decidir.
27. Como responsável, quero trocar uma creche da carteira por outra do mapa, para manter o controle da decisão final.
28. Como responsável, quero ver o impacto na probabilidade quando altero a carteira, para entender o custo da minha mudança.
29. Como responsável, quero reordenar as opções da carteira, já que a ordem importa na classificação.
30. Como responsável, quero ver a distância e o tempo estimado de trajeto de cada creche a partir do ponto de referência que a justifica, para julgar a viabilidade no meu dia.
31. Como responsável, quero saber quando uma creche está sendo recomendada por causa do meu trabalho e não da minha casa, para avaliar o risco caso eu mude de emprego.

### Limite honesto (família)

32. Como responsável que mora em bairro de déficit, quero ser avisado quando não existe nenhuma opção segura ao meu alcance, para não ter falsa expectativa.
33. Como responsável nessa situação, quero ver qual é a melhor chance realmente disponível perto de mim, para decidir com a informação correta.
34. Como responsável, quero que o sistema nunca me recomende uma creche inviável só para preencher as 5 vagas, para confiar no que ele diz.
35. Como responsável, quero saber que meu caso foi registrado como demanda não atendida na minha região, para entender que a informação vai para quem planeja a rede.

### Painel da SME

36. Como gestor da SME, quero ver o mapa de descasamento entre oferta e demanda por bairro e microárea, para direcionar o planejamento de vagas.
37. Como gestor, quero identificar unidades com vacância crônica, para entender por que elas não são escolhidas.
38. Como gestor, quero ver quantas famílias ficaram sem nenhuma opção segura ao alcance, por região, para distinguir déficit real de problema de informação.
39. Como gestor, quero ver a evolução do número médio de opções por inscrição ao longo dos anos, para acompanhar se o comportamento de escolha está melhorando.
40. Como gestor, quero ver a proporção de famílias que preenchem uma única opção, por região, para focar comunicação onde o problema é maior.
41. Como gestor, quero ver a taxa de sucesso por bairro, para identificar territórios em desvantagem estrutural.
42. Como gestor, quero ver quantas famílias têm ao menos uma âncora na carteira hoje, para dimensionar o espaço de melhoria.
43. Como gestor, quero ver o efeito agregado estimado caso as famílias seguissem as recomendações, para justificar a adoção do sistema.
44. Como gestor, quero filtrar o painel por CRE, para trabalhar apenas com o meu território.
45. Como gestor, quero ver a régua de pontuação vigente e o peso de cada critério, para entender o que está governando a classificação.

### Demonstração

46. Como apresentador, quero carregar perfis pré-configurados com um clique, para demonstrar o produto sem preencher formulário no palco.
47. Como apresentador, quero mostrar dois perfis idênticos que diferem apenas na pontuação, para provar que o sistema entendeu a política de priorização.
48. Como apresentador, quero mostrar um caso real reconstruído da base de 2025, para comparar o que a família escolheu com o que o sistema recomendaria.
49. Como apresentador, quero que a aplicação funcione sem conexão externa, para não depender de rede durante a demonstração.
50. Como apresentador, quero que a origem e as limitações dos dados estejam visíveis na interface, para antecipar a pergunta sobre validade dos números.

## Implementation Decisions

### Vocabulário do domínio

Termos usados de forma consistente em código, interface e testes. (Não há `CONTEXT.md` no repo ainda; estes termos devem alimentá-lo quando `/domain-modeling` rodar.)

- **Unidade** — creche ou escola que oferece vaga de creche. Identificada pelo código da unidade (`esc_codigo`/`DESIGNACAO`).
- **Âncora de localização** — ponto de referência marcado pela família no mapa (casa, trabalho, casa de parente). Distinto de âncora da carteira.
- **Alcance** — conjunto de unidades que a família consegue frequentar, derivado das âncoras de localização e do modal de deslocamento declarado.
- **Chance** — probabilidade estimada de a família conseguir vaga naquela unidade, considerando a pontuação dela. Propriedade do par (família, unidade), nunca da unidade sozinha.
- **Encaixe** — adequação da unidade à rotina e às necessidades da família: trajeto, grupamento, horário, acessibilidade.
- **Carteira** — o conjunto de até 5 unidades recomendado, com ordem e papéis.
- **Papel** — função de cada unidade na carteira: `sonho`, `equilibrio` ou `ancora`.
- **Âncora da carteira** — unidade com chance histórica ≥50%; a aposta segura da carteira.
- **Piso da carteira** — a menor chance entre as opções da carteira. É o que o algoritmo otimiza.
- **Grupamento** — faixa etária curricular (Berçário, Maternal I, Maternal II).
- **Déficit territorial** — situação em que não existe âncora da carteira dentro do alcance da família.

### Arquitetura geral

- Aplicação Next.js (App Router, TypeScript), duas rotas de topo: a face do cidadão e o painel da SME.
- **A demo roda local.** O deploy no Railway é o caminho de produção e não é pré-requisito para a apresentação. A conexão GitHub↔Railway, a criação do projeto e o provisionamento do Postgres são feitos pelo usuário na conta dele.
- Persistência preparada para `DATABASE_URL` via variável de ambiente, com fallback em memória quando ausente. Nenhum caminho crítico da demo depende do banco.
- Sem dependência de serviço externo em tempo de execução: sem API de geocodificação, sem API de rotas, sem tiles remotos obrigatórios. A demo precisa funcionar offline.

### Catálogo pré-processado

- Um script Python transforma as bases da SME num catálogo único consumido pela aplicação, gerado em tempo de build e versionado.
- O catálogo carrega, por unidade: identificação, tipo, CRE, microárea, bairro, coordenada, chance histórica, tamanho da amostra histórica, marcador de confiabilidade, demanda observada no ano-alvo, matrículas por grupamento e horário, e o recorte de chance por grupamento × horário.
- Carrega também: agregados por bairro, régua de pontuação vigente e série anual de indicadores.
- **Regra de não-vazamento:** a chance histórica de uma unidade é calculada exclusivamente com processos anteriores ao ano avaliado. É o que sustenta a validade dos números apresentados.
- Unidades com menos de 30 opções históricas são marcadas como não confiáveis e não podem ser usadas como âncora da carteira.
- Estado atual: 872 unidades, 852 com coordenada, 869 com histórico confiável, 118 âncoras elegíveis, 155 bairros. Arquivo com cerca de 0,5 MB.

### Motor de recomendação

Módulo puro, sem I/O, sem dependência de React. Recebe perfil e catálogo, devolve carteira. É a costura principal de teste.

**Entrada (perfil):** âncoras de localização ordenadas por prioridade, modal de deslocamento, grupamento, horário, respostas do questionário, necessidade de acessibilidade.

**Saída (carteira):** lista ordenada de até 5 unidades, cada uma com papel, chance, encaixe, âncora de localização que a justifica, distância, e explicação em uma frase; mais a probabilidade agregada da carteira e o marcador de déficit territorial quando aplicável.

**Regras validadas nos dados — cada uma é um teste:**

1. **Âncora sempre.** Toda carteira inclui ao menos uma unidade com chance histórica ≥50%, quando existir uma no alcance. Vale +11 a +15pp de chance de vaga, com o número de opções controlado, replicado em 2023, 2024 e 2025. Não é condicional ao perfil: vale igualmente para quem já tem boa aposta e para quem não tem.
2. **Otimizar o piso, não o spread.** O algoritmo maximiza a chance da segunda e terceira opções. Diversificação por diversificação tem efeito negativo — a regra anterior de "espalhar risco" foi testada e rejeitada: o sinal trocava conforme o limiar e não replicava entre anos.
3. **Chance é do par (família, unidade).** Calculada simulando onde a família cairia na fila daquela unidade com a pontuação dela, contra a distribuição de pontuações dos concorrentes. Nunca a média da unidade.
4. **Nada fora do alcance.** Unidades fora do alcance derivado das âncoras e do modal não entram na carteira em nenhuma hipótese.
5. **Déficit territorial é declarado, não mascarado.** Sem âncora no alcance, a carteira é montada com a melhor chance real disponível e marcada como déficit territorial. O sistema não relaxa o limiar em silêncio nem estende o raio para além do declarado.
6. **Teto de 5.** Nunca mais de 5 opções, respeitando o limite do processo real.
7. **Ordem das âncoras de localização entra como peso.** A ordenação declarada pela família vira peso interno; a interface explica o efeito, nunca a fórmula.

**Sobre a precisão:** a chance é apresentada em faixas qualitativas, não como número pontual. A simulação acerta a direção e erra a magnitude — cravar "22ª posição" e a família não entrar destrói a confiança no serviço.

### Interface da família

- Fluxo em etapas: localização no mapa → deslocamento e grupamento → questionário → carteira.
- Mapa com as unidades do alcance, sinalizadas por chance. Pin arrastável para cada âncora de localização.
- Cartão de unidade com os dois eixos separados visualmente. Chance e encaixe nunca colapsam num número único — é o que permite à família discordar de forma informada.
- Comparação lado a lado entre a carteira sugerida e uma seleção manual.
- Aviso de déficit territorial quando aplicável, com a melhor opção real e a informação de que o caso foi registrado.
- Origem e limitações dos dados visíveis na interface.

### Painel da SME

- Consome os mesmos agregados do catálogo, com filtro por CRE.
- Mapa de descasamento por bairro e microárea; lista de unidades com vacância crônica; contagem de famílias sem âncora ao alcance; série anual de indicadores; régua de pontuação vigente.
- Quando houver banco, incorpora os perfis reais submetidos; sem banco, opera sobre o histórico.

### Personas da demonstração

Três perfis pré-carregados, escolhidos para construir a narrativa em sequência:

1. Família em bairro de déficit, sem critério de pontuação, sem transporte próprio — o caso difícil, onde a âncora salva a inscrição.
2. A mesma família, com CadÚnico — perfil idêntico, um único atributo trocado. A mesma unidade muda de leitura de chance. É a prova de que o sistema entendeu a política de priorização.
3. Caso real reconstruído da base de 2025 — família cuja melhor aposta tinha menos de 20% de chance, mostrada lado a lado com o que o sistema recomendaria.

## Testing Decisions

**O que faz um bom teste aqui:** verifica comportamento externo observável — dado um perfil, a carteira devolvida satisfaz as regras. Não verifica como o score foi calculado internamente, qual a ordem das operações, nem a estrutura interna dos módulos. Os pesos e limiares vão ser calibrados; testes acoplados a eles quebram a cada ajuste sem pegar defeito real.

**Costura 1 — motor de recomendação.** A costura principal. Função pura, testada com catálogos sintéticos pequenos e legíveis (uma dúzia de unidades com propriedades escolhidas), não com o catálogo real de 872.

Cobertura:

- Carteira inclui âncora quando existe uma no alcance.
- Sem âncora no alcance: marcador de déficit territorial presente, melhor chance real devolvida, limiar não relaxado.
- Nenhuma unidade fora do alcance aparece na carteira, em nenhum cenário.
- Nunca mais de 5 opções.
- Dois perfis idênticos exceto pela pontuação recebem chances diferentes para a mesma unidade — e na direção correta.
- Unidades sem histórico confiável nunca entram como âncora.
- Unidades de grupamento ou horário incompatíveis não aparecem.
- Alterar a ordem das âncoras de localização altera a carteira.
- Cada unidade devolvida tem papel, explicação e a âncora de localização que a justifica.
- Carteira determinística: mesma entrada, mesma saída.

**Costura 2 — pré-processamento do catálogo.** Guarda-corpo de dados. Existe porque um vazamento temporal silencioso invalidaria todos os números apresentados.

Cobertura:

- Nenhuma opção do ano-alvo entra no cálculo da chance histórica.
- Unidades abaixo do limite mínimo de amostra são marcadas como não confiáveis.
- Toda unidade do catálogo existe nas bases de origem; contagens conferem.
- Unidades sem coordenada são identificáveis e tratadas, não silenciosamente omitidas.

**Sem costura própria, deliberadamente:** mapa, questionário e painel. São apresentação sobre a costura 1; testá-los isoladamente gera manutenção sem capturar defeito real. Verificação por uso durante a construção.

**Prior art:** não há testes no repo — este é o primeiro código. As convenções estabelecidas aqui viram a referência.

## Out of Scope

- Integração real com o matrícula.rio ou com qualquer sistema da SME. O protótipo lê dados exportados; não escreve inscrição em lugar nenhum.
- Autenticação, cadastro de usuário, gestão de sessão.
- Cálculo real de rota por transporte público. O alcance usa distância com ajuste por modal; roteirização é projeto próprio.
- Geocodificação de endereço. O pin no mapa é a fonte da verdade da localização da família.
- Resolver a dor de convocação (contato com a família, prazo de 3 dias, contato desatualizado). É problema real e grave, mas outro produto — o time já o identificou separadamente.
- Notificação por WhatsApp e acompanhamento de posição na fila.
- Reequilíbrio ativo de demanda pela SME. O painel informa; não redireciona.
- Deploy, provisionamento de banco e configuração de infraestrutura no Railway — ação do usuário na conta dele.
- Dados do processo vigente de 2026, que não estão na base.

## Further Notes

**Sobre a validade dos números.** Os dados são anonimizados e o próprio README da SME avisa que os indicadores não representam a realidade — servem para ilustrar as dinâmicas do processo. Isso deve ser declarado na interface e na apresentação, antes que alguém pergunte. As conclusões são sobre a *estrutura* do problema, não sobre magnitudes absolutas.

**Limitação metodológica.** Toda a evidência é observacional. O efeito de 17,2pp sobrevive a controle por bairro, faixa de pontuação, grupamento e horário, e o efeito da âncora replica em três anos independentes — mas famílias que escolhem unidades de alta vacância podem diferir das que não escolhem por razões não observadas. O efeito real de um recomendador é provavelmente menor que os números brutos. A direção é robusta; a magnitude, não.

**Uma regra foi testada e rejeitada.** A hipótese inicial era que a âncora só ajudava famílias em situação ruim. Não se sustentou: o efeito trocava de sinal conforme o limiar arbitrário e não replicava fora de 2025. A regra correta — âncora para todos — é mais simples e tem evidência mais forte. Registrado aqui para que não seja reintroduzida.

**Sobre o risco de recomendar o que ninguém quer.** Fila zero em uma unidade pode significar "sobra vaga" ou "ninguém consegue chegar". A separação entre chance e encaixe existe exatamente para isso: alta vacância sozinha nunca sobe uma unidade na carteira sem encaixe compatível.

**Sobre o efeito de segunda ordem.** Se o sistema for adotado em escala, a recomendação altera a demanda que ela própria usa como insumo — a chance histórica envelhece durante o processo. Não é problema no protótipo, mas é decisão de arquitetura para produção: o catálogo precisaria ser recalculado, e a recomendação, distribuída de forma a não concentrar todas as famílias na mesma unidade.

**Escopo de tempo.** Protótipo navegável para hackathon. Vale mais uma jornada curta que funciona de ponta a ponta do que várias telas pela metade.
