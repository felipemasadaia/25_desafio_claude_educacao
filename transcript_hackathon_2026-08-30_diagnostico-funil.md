# Sessão de Hackathon — Diagnóstico do Funil de Matrículas e Escolha da Dor
**Data:** 30 de agosto de 2026
**Horário:** 10h07 – 10h24 (BRT)
**Fonte:** Wispr Flow Meeting Recorder (`17c6eb10-7928-4285-bea1-148ec80ba423`)

## Resumo

Sessão de hackathon analisando o funil de matrículas escolares: identificados vários pontos de vazamento (fila zero em 43% das unidades, contato com famílias, prazos curtos) e decisão de escolher uma dor para prototipar.

### Diagnóstico do funil
- Famílias colocam só 1-2 opções em vez de 5; régua socioeconômica desbalanceada (27/27/27/4)
- 43% das unidades têm fila zero: vagas perdidas, sem visibilidade de dificuldade da escola
- Déficit territorial: Jacarepaguá precisa de mais de 1.267 vagas do que a oferta local
- Prazos apertados: aprovação demora, depois só 3 dias para contato e 5 para selecionar
- Problema central: a equipe acompanha milhares de inscrições sem painel que sinalize, por unidade, quem ainda não tem vaga selecionada — hoje só aparece em checagem manual linha a linha

### Contato com famílias (validação em campo)
- Ligação à mãe do Felipe confirmou: chip pré-pago, troca de número frequente, sem portabilidade
- Portabilidade tende a existir só no pós-pago; no pré-pago o número é perdido junto com o aparelho
- Famílias não acessam e-mail; canais viáveis são WhatsApp, ligação ou porta a porta
- Não há canal alternativo estruturado — o número novo circula boca a boca, "passa pra quem precisa saber"
- Ideia: cadastrar segundo responsável e testar canais mensalmente antes do período crítico (~15 dias antes)
- Sinal barato de contato morto: WhatsApp enviado e não respondido

### Direção do produto
- Proposta de CRM/painel para acompanhar inscrições sem vaga selecionada, hoje feito linha a linha
- Painel estilo fila de restaurante: família recebe atualizações no WhatsApp ao subir posições (top 10, top 5, top 2)
- Divergência sobre escopo: 1 dor destrinchada vs. 2 dores; convergindo para "dor de receber"

### Decisões
- Focar em uma dor central ("dor de receber") em vez de atacar os 5 problemas levantados
- Partir para a fase de construção do protótipo

### Próximos Passos
- (Speaker 1) Descobrir como a equipe do colo entra em contato com as famílias hoje
- (Speaker 2) Começar a construir o protótipo, tentando primeiro abordagem via Claude

## Transcript

**Speaker 1:** Este documento reúne os dados de 5 processos seletivos que revelam sobre onde o funil vaza, e serve de base para escolher qual recorte atacar.

**Speaker 1:** As famílias só colocam 1 ou 2 opções ao invés de 5; a maioria, né.

**Speaker 1:** A régua de pontuação socioeconômica.

**Speaker 1:** Olha só, ali é 27, 27, 27, 4.

**Speaker 1:** E aí, talvez no modelo de recomendação, a gente pode colocar um peso para escola que tem, é, para escola que está dentro de um raio aceitável e tem mais vagas disponíveis. E aí, mais vagas disponíveis tem um peso maior.

**Speaker 2:** Não, mas eu, aí, eu acho que o principal ponto que a gente tem que atacar é isso daqui, ó: 43% das unidades têm fila zero. Tipo assim, cara, aqui tem uma. A gente tem que dar alguma visibilidade na hora que a pessoa vai se inscrever sobre "essa escola é mais difícil, essa escola é mais fácil".

**Speaker 2:** Porque, porra, cara, 43% das unidades têm fila zero. Tipo assim, pô, isso daqui é, já é, aqui é taxa de perda, vagas perdidas.

**Speaker 2:** Mas, cara, a raiz eu acho que é isso, tipo, pô, 43%.

**Speaker 1:** Então, o que deve estar ferrando muito é que, tipo, pô, a criança, em que momento que ela é aceita, ela, tipo, dá um acrônimo, ela dá vaga dela. Ela tem 3 dias para poder falar "eu se quero" ou "não". Aí depois tem mais 5 dias para selecionar.

**Speaker 1:** Isso daí até ferra muito o processo de caminho.

**Speaker 2:** Não, eu acho que isso ferra mesmo. Mas, tipo, isso a gente vai ter que resolver. É, não, você acha que os 3 dias, qual que é o problema de aprovar em 3 dias?

**Speaker 2:** Não entendi.

**Speaker 1:** Ah, aqui. Não, o problema é que a aprovação não é em 3 dias. O problema é que a aprovação demora, e depois de demorar tem 3 dias para entrar em contato.

**Speaker 1:** Mas aí, nesses 3 dias, se o número for outro, você nem consegue—

**Speaker 2:** É, então, eu acho que o problema é—

**Speaker 1:** Porque todas as pessoas não são pessoas que acessam e-mail todo dia, né? São pessoas que normalmente batalham pra caramba, chegam no final do dia, todo dia—

**Speaker 2:** E fazer um e-mail. Aí para ficar mandando mensagem no WhatsApp para o cara que o cara não vai ver o e-mail? Aí já manda mensagem: "foi aprovado", "você não abriu o e-mail", "não consegui ver".

**Speaker 1:** E ligar também, que acho que a galera tem. É ligar e—

**Speaker 2:** E mandar um—

**Speaker 1:** Cara, descobre aí como é que eles entram em contato hoje em dia. Isso é importante. Tipo, para a gente ver se a gente muda essa abordagem.

**Speaker 2:** O problema é que eu acho que essa, essa etapa de classificação e escolha demora muito.

**Speaker 1:** De classificação e escolha? É por isso que eles têm pouco tempo.

**Speaker 2:** É, de, não, por isso que eles demoram muito tempo para escolher, e por isso que—

**Speaker 1:** A gente fala que é um problema de gap no gap de processos atual. De visibilidade da fila.

**Speaker 1:** Porra, quando a criança não tem CPF. A criança não existe no— Multiinscrição também.

**Speaker 1:** Esse equilíbrio territorial não agregado, comparado à demanda de cada bairro e criação existente, enquanto fornece efetivamente atendimento e unidades para cada bairro, é um problema da mesma cidade. O que que está menos ali?

**Speaker 1:** Eu não entendi.

**Speaker 2:** Então, tipo assim, isso daqui é déficit de demanda do bairro maior que o atendimento local. Então isso daqui é um déficit, né. Então, cara, Jacarepaguá precisa de mais de 1.267 vagas do que tem.

**Speaker 2:** E aqui está sobrando e meia é do lado de Jacarepaguá, né.

**Speaker 1:** Não faço ideia. Eu nem sou do Rio.

**Speaker 2:** Ah, você não é do Rio, você não?

**Speaker 1:** Eu sou de Curitiba.

**Speaker 2:** Ah, é verdade.

**Speaker 1:** Essa aqui é uma boa. O problema central: a equipe, ela acompanha milhares de discussões, é, sem um painel que sinalize.

**Speaker 2:** Fala mais alto aqui do microfone para eu pegar.

**Speaker 1:** Não vai pegar.

**Speaker 2:** Fala aqui. Vai pegar, está pegando tudo.

**Speaker 1:** Aqui, ó, problema central: a equipe, a equipe do colo acompanha milhares de inscrições por processo, sem um painel que sinalize por unidade que a criança não tem uma vaga até selecionada. Então, porra, se fizer um CRMzão nisso daqui, que vai acompanhar isso aí e conseguir ficar em cima da pessoa, deve ajudar bastante.

**Speaker 2:** A visibilidade, né.

**Speaker 1:** É. É que hoje isso só aparece com checagem manual linha a linha. Pô, tem que fazer um sistemão de CRM disso, cara.

**Speaker 2:** Mas como problema de processo vem—

**Speaker 1:** Tá, vamos, peraí, só vamos dar umas uma, um pouco de abstração, tipo, olhar tudo, depois a gente tenta convergir, tá?

**Speaker 2:** Sim, sim.

**Speaker 1:** Tipo, uma forma de triangular também seria, por exemplo, pedir um número do pai da criança, ou sei lá, da avó da criança, de algum outro responsável. Mas aí isso só significaria que, se são 500 mil crianças, vai ter 1 milhão de ligações.

**Speaker 2:** Qual número vocês teriam?

**Speaker 1:** 8.

**Speaker 2:** 8.

**Speaker 1:** Aqui. Entra 1 tentativa de contato por dia só, durante 3 dias consecutivos, em horário diferente. Com telefone, e-mail e WhatsApp.

**Speaker 1:** Só que ele fala aqui depois: fluxo inteiramente manual e repetitivo, com WhatsApp automatizado e rastreado.

**Speaker 2:** Não, mas eu acho que essa parada de horários diferentes—

**Speaker 1:** É, diferentes, pô. Esse negócio é conseguir ficar em cima do cara e monitorar, conseguir monitorar exatamente, pô. É um negócio que é manual.

**Speaker 1:** Então, pô, se você consegue, né, fazer um CRMzão por trás disso daí e falar: "cara, eu estou em cima desse cara aqui, vou chinar ele", aí, pô, já, já consigo prever o outro cara que vai conseguir vir para essa vaga, já dou um pré-aviso ali, alguma coisa assim.

**Speaker 2:** Cara, a gente sabia de como é que a gente ia ganhar? Se a gente, tipo, descobrisse, ligasse e— assim que eu descobri, o grupo ganhou. A gente, eles ligaram para alguém, a gente perstiu um acesso para descobrir qual que é a melhor maneira de entrar em contato com essa pessoa.

**Speaker 2:** Para entender, tipo, a causa raiz da dor, que é, tipo, por que que é difícil entrar em contato com essa pessoa, e qual que é a melhor maneira, e por que que ela troca de número, entendeu? Tipo, será que a gente tem acesso a alguma pessoa dessas?

**Speaker 1:** Eu acho que é dívida.

**Speaker 2:** O quê?

**Speaker 1:** Porque, pô, muitas vezes você, pô, se eles, se eles entram em contato por meio de ligação, às vezes a pessoa acha que—

**Speaker 2:** Não, mas acho que a gente tem que, tipo, realmente ligar para a pessoa e tentar, tipo, adivinhar, descobrir: será que a gente tem acesso?

**Speaker 1:** Tipo, pô, eu não tenho. Só se vocês conhecerem alguém que estuda em alguma escola que a gente falava, pô, tipo, chique.

**Speaker 2:** Tira para cá, linha, me pega.

**Speaker 1:** Cara, eu preciso de uma gritaria.

**Speaker 2:** Aí. Caralho, mano.

**Speaker 1:** Dudu, me filma aqui que eu vou ligar para a carinha.

**Speaker 2:** Ah, cara, eu preciso pegar uma água.

**Speaker 1:** Peraí, peraí. Vem comigo. Eu já gravei um conteúdo, sabe?

**Speaker 2:** Não, eu quero ganhar, você tá ligado.

**Speaker 1:** Eu quero ganhar.

**Speaker 2:** Você tá ligado?

**Speaker 1:** Eu acho que vai trabalhar essa porra aí, cara.

**Speaker 2:** Quê? Não, peraí, eu vou ligar para a carinha.

**Speaker 1:** Eu precisava do ponto de, de, de som, cara.

**Speaker 2:** É verdade.

**Speaker 1:** Vem de carinha.

**Speaker 2:** Entender nada.

**Speaker 1:** Tô ligando para ele.

**Speaker 2:** Vou ligar para a minha mãe para ligar para a carinha.

**Speaker 1:** Pô, mas eu acho que o que ia otimizar mais o processo era não precisar entrar em contato.

**Speaker 2:** Mas como que, como que, tipo, não entraria em contato?

**Speaker 1:** É fazer a verificação na hora.

**Speaker 2:** Como assim, na hora?

**Speaker 1:** Tipo, meio que: "ô, mãe, a carinha está aí?"

**Speaker 2:** Está.

**Speaker 1:** Chama, chama ela aí, chama ela aí do celular.

**Speaker 2:** A carinha tem filho, né?

**Speaker 1:** Filho e autista. Tem uma filha, uma jovem, um filho autista.

**Speaker 2:** Chama ela aí, chama ela aí.

**Speaker 1:** Tá filmando ele aí.

**Speaker 2:** Peraí.

**Speaker 1:** Não, você fala comigo também.

**Speaker 2:** Não, tá, tá.

**Speaker 3:** O que que eu vou? Sei que que o Felipe está pronto, ele está te chamando. O que que tu quer?

**Speaker 3:** Vem cá.

**Speaker 3:** Ele quer falar com você, é verdade. Fala.

**Speaker 2:** Ô, carinha, é, a gente está vendo aqui um problema, é, e aí eu queria entender uma, uma coisa com você. É, você troca muito de número de telefone? Eu estou aqui num evento que a gente está tentando endereçar o, o problema de entrar em contato, é, com pessoas que moram mais em comunidades e tal, e aí a gente está vendo que às vezes as pessoas trocam de número de WhatsApp, trocam de e-mail.

**Speaker 2:** Você já troca de telefone? E por que você troca de telefone?

**Speaker 2:** Por que que isso acontece? Tipo assim, por exemplo, alguém precisa entrar em contato para alguma coisa do seu filho.

**Speaker 2:** Ele entra em contato, é, no seu número, em algum familiar seu? Como é que isso acontece?

**Speaker 3:** Meu número.

**Speaker 2:** E você troca de número?

**Speaker 3:** Você também pode mudar. Você troca de número de vários jeitos. O quê?

**Speaker 3:** Eu não te entendo. Perde o telefone?

**Speaker 3:** Mas você sabe que dá para aproveitar o mesmo número. Com o espirro do túnel.

**Speaker 3:** Ela ri. Fala verdade, carinha.

**Speaker 3:** Não, porque às vezes eu troco de número porque eu perco o telefone e não tenho nem por que posso recuperar o mesmo número. Elas não fazem portabilidade, aí ela compra outro telefone e bota outro número.

**Speaker 3:** Ela já trocou de número umas 10 vezes desde que ela está aqui. É, ele, acho que eles não avisam direito que ela pode fazer portabilidade, entendeu?

**Speaker 2:** Mas aí, além, tipo assim, além de número, é, tem alguma outra maneira de entrar em contato com você? Ou é só número, WhatsApp, ligação?

**Speaker 3:** Só WhatsApp mesmo, ligação.

**Speaker 2:** E aí, tipo assim, acontece às vezes, é, quando você troca de número, tipo, como que alguém sabe qual que é o seu número novo?

**Speaker 3:** Porque eu só passo o meu número para as pessoas.

**Speaker 2:** Vocês sempre passam número novo.

**Speaker 3:** Não, passam em algum lugar que precisa saber. Aí a gente confunde tudo.

**Speaker 2:** É.

**Speaker 3:** Você está estudando o nosso problema, cara.

**Speaker 2:** Não, está bom, está bom. Acho que eu entendi.

**Speaker 1:** Peraí.

**Speaker 2:** Porque ela, porque é o mesmo assim quanto, sei lá. É, e tem algum, algum número que da sua família?

**Speaker 1:** Não, não, não.

**Speaker 2:** Tem. Não, mas ela falou que ela só usa WhatsApp e telefone. É o mesmo, é padrão.

**Speaker 2:** É.

**Speaker 3:** A mãe dela quer ver o número.

**Speaker 2:** Não, mas ela não estuda.

**Speaker 3:** Ela não perdeu o telefone. Só que se ela perder ela não entra tudo, porque ela não perdeu nada de nada.

**Speaker 2:** Não, ô, é, ô, carinha, carinha.

**Speaker 3:** Felipe, é, também tem uma coisa. Eu acho que a portabilidade só é feita se o telefone é pós-pago. Eu acho que o dela é pré-pago.

**Speaker 3:** Você não tem uma conta no final do mês que você paga. É, entendeu?

**Speaker 2:** Mas peraí, ô.

**Speaker 3:** Como é que você usa? Eu acho que eles não podem usar o mesmo número porque só é para pós-pago, eu acho. Que é isso?

**Speaker 3:** Aí ela acaba que ela perde, aí ela tem que pegar um telefone e pegar outro número.

**Speaker 2:** E, e assim, pergunta para elas se tem algum horário melhor para atender. Tipo assim, quando que você acha que você atende melhor? Ou é o dia todo está tranquilo?

**Speaker 2:** Tem?

**Speaker 3:** É, ela fala que é a hora que me liga.

**Speaker 2:** Tá. Não, está bom. Está ótimo.

**Speaker 2:** Obrigado, carinha. Obrigado.

**Speaker 3:** A Camila é a arte da carinha para se deliciar.

**Speaker 2:** Vou pagar, vou pagar. Beijo, mãe.

**Speaker 3:** Beijo, tchau.

**Speaker 1:** E aí, ela ajudou em alguma coisa ou porra nenhuma?

**Speaker 2:** Só o conteúdo já ajudou para te botar na apresentação.

**Speaker 1:** Imagina que fosse conteúdo.

**Speaker 2:** Mas, então, a carinha, não, ajudou. Porque, tipo assim, eu entendi isso, que ela sempre compra número pós-pago.

**Speaker 1:** Não, mas é, entendeu?

**Speaker 2:** É o chip.

**Speaker 1:** É pós-pago.

**Speaker 2:** Pós-pago.

**Speaker 1:** Ah, e troca o número.

**Speaker 2:** É.

**Speaker 1:** Ah, não, é pré-pago.

**Speaker 2:** Pré-pago. Cada 3, ele falou que ele falou, faz muito sentido, que a cada 3 meses você, é, você.

**Speaker 1:** Você não compra o crédito, você pega o número. Ele é bloqueado.

**Speaker 2:** É pré-pago, é isso. Cara, então de repente, é.

**Speaker 1:** E-mail não muda.

**Speaker 2:** Eu acho que a solução é.

**Speaker 1:** Mas é só um acesso. O problema é encontrar, tipo, você confiar que as pessoas ali têm a cultura de acesso.

**Speaker 2:** É, acho que as pessoas não acessam e-mail. Então, mano, mas eu acho que assim, tem duas opções: ou é WhatsApp, ligação, ou é bater na porta de casa, entendeu? Endereço.

**Speaker 1:** Cara, será que não dá para botar mais de um responsável, tipo, mais de uma pessoa para estar informando?

**Speaker 2:** Mas todo mundo troca de número. Dá para fazer isso, entendeu? Só que, tipo, eu acho que a solução é isso, três coisas: o número dela, explicar para ela que se ela trocar de número, ela vai ter que.

**Speaker 1:** O Red Bull.

**Speaker 2:** O quê?

**Speaker 1:** Porque o Red Bull também, cara.

**Speaker 2:** Mas.

**Speaker 1:** Ó, então é o seguinte: número 1, é, pré-pago que ela troca. Aí botar um segundo número pré-pago da família. E eu acho que a gente vai ter que botar uma solução de, cara, é, pensar se dá para bater na porta da casa da pessoa, de alguma maneira.

**Speaker 2:** Com alguma coisa de atualização mensal.

**Speaker 1:** Ah, é. No começo do mês vem uma.

**Speaker 2:** Tipo assim, de meio que, pô, isso é, isso é uma maneira que aí ela consegue ficar toda hora testando se o contato ele está ativo.

**Speaker 1:** Sim.

**Speaker 1:** Ué, mas e se ele não tiver mais? Aí ele só vai, ele só vai mandar mensagem.

**Speaker 2:** Não, mas aí vai ser, vai descobrir antes, entendeu?

**Speaker 1:** Exato.

**Speaker 2:** Você vai descobrir antes que aquele contato não está, não está ativo.

**Speaker 1:** Não, mas não é que o, eu acho que o número do WhatsApp recebe a mensagem, mas você não sabe se a pessoa tem acesso a ele.

**Speaker 2:** Não, mas se não respondeu já é o sinal, entendeu? Se não respondeu já é o sinal.

**Speaker 1:** É, isso é uma boa, pô. Se o WhatsApp não, se o cara não respondeu o WhatsApp, já.

**Speaker 2:** É, tipo, no período crítico, que é, tipo, 15 dias antes, já começa a testar, entendeu? Já começa para dar sinalização.

**Speaker 1:** Mas tem que ser antes.

**Speaker 2:** É, pode ser antes. Não, mas já é, então. É, tá, está indo bem.

**Speaker 1:** Pô, você está indo no caminho certo.

**Speaker 2:** É, cara, agora eu acho que é o seguinte.

**Speaker 1:** Vai falando aí, vai falando aí.

**Speaker 2:** Não, que você falou o negócio do dashboard, já é muita coisa para endereçar nessa merda, né?

**Speaker 1:** Cara, eu acho que a gente tem que escolher um.

**Speaker 2:** Você tem que escolher 8 horas.

**Speaker 1:** Uma dor, não. Eu não acho que a gente tem que fazer tudo, muito de tudo. Se escolher uma dor, já está muito forte essa dor.

**Speaker 2:** Não, a gente tem que escolher umas duas, duas.

**Speaker 1:** A gente falou, a gente falou uns 5 problemas ao longo aqui desse evento.

**Speaker 2:** Eu sei, mas tipo, a gente não vai resolver com um produto em 10, em 5 horas, 5 dores.

**Speaker 1:** É, não, não.

**Speaker 2:** Não, mas a parada é mostrar visualmente como a gente vai fazer.

**Speaker 1:** Está bom, mas sei lá, eu acho que tem que escolher uma coisa.

**Speaker 2:** Esse CRM.

**Speaker 1:** Destrinchar.

**Speaker 2:** É, não, também não.

**Speaker 1:** Quer dizer, escolher a dor.

**Speaker 2:** A dor, a dor de receber.

**Speaker 1:** A dor de receber. Pode ser, tipo.

**Speaker 2:** Ah, tem esse aqui, ó.

**Speaker 1:** Pode ter um painel, tipo, você sabe aquele negócio de restaurante, que você vai recebendo pessoas na fila. Sexta pessoa, quinta pessoa, oitava pessoa, porque a pessoa já vai segurando a mão. E ela vai recebendo atualização direto no WhatsApp, atualização.

**Speaker 1:** Cada 10 ela recebe, tipo, quando ela vira top 10, ela recebe, top 5 recebe, top 2.

**Speaker 2:** Vamos ver como é que é o site. Não, cara, eu acho que é o seguinte, ó. Ah, mas tem que entender a jornada, ó.

**Speaker 2:** CPF, tá, isso aqui foda.

**Speaker 1:** Eu vou tentar me matricular.

**Speaker 2:** Ah, classificação em data publicada no Diário Oficial. Mais resultados no site.

**Speaker 1:** Diário Oficial é legal.

**Speaker 1:** Ó, vamos ver aqui, ó, a gente tem o site.

**Speaker 2:** Cara, eu acho que a gente já pode passar para construir alguma coisa.

**Speaker 1:** Vambora, manda a bala.

**Speaker 2:** Cara.

**Speaker 1:** Vai começar por onde?

**Speaker 2:** Eu vou fazer, não, então eu tenho uma abordagem brava que é a seguinte, tipo assim.

**Speaker 1:** Vamos tentar antes, para ele fazer a sua.

**Speaker 2:** Do Claude, sem.
