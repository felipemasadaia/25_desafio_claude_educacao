# Product

## Register

product

## Users

**A família.** Responsável por criança de 0 a 3 anos no Rio de Janeiro, prestes a se
inscrever no matrícula.rio. Usa celular Android modesto, em dados móveis, muitas vezes
com pouco tempo e sob ansiedade — a decisão afeta o próximo ano da criança e a
possibilidade de trabalhar. Letramento digital variável. O trabalho a ser feito:
**escolher até 5 creches sem escolher às cegas.** Hoje 47% preenchem uma única opção.

**O gestor da SME.** Planeja oferta de vagas por CRE e microárea, em desktop, num
contexto analítico. O trabalho a ser feito: **distinguir déficit real de desinformação** —
a fila registra escolhas, não necessidade.

Os dois lados leem o mesmo motor por faces opostas. A ponte entre eles é o limite honesto:
quando não há creche viável ao alcance de uma família, isso vira dado de planejamento.

## Product Purpose

Tornar visível, antes da inscrição, o que decide o resultado: quanta vaga a unidade
costuma ter, quanta gente disputa, e onde **aquela família específica** cai na fila com a
pontuação que ela tem.

Sucesso para a família: sair com uma carteira de até 5 unidades em que cada uma tem papel
declarado, e entender por que — a ponto de conseguir discordar. Sucesso para a SME: ver
onde o recomendador não conseguiu atender ninguém, e tratar isso como déficit territorial
mensurado, não como silêncio.

## Brand Personality

**Sério, direto, tech-simples.** Serviço público que se leva a sério sem a frieza da
repartição — e sem a euforia de produto de startup.

Voz: afirmativa e concreta. Diz "essa unidade é sua aposta segura" e diz "não encontrei
nenhuma opção segura perto de você" com a mesma naturalidade. Nunca promete o que os dados
não sustentam; a chance aparece em faixa qualitativa, nunca como número cravado, porque
cravar "22ª posição" e a família não entrar destrói a confiança no serviço.

Três palavras: **honesto, calmo, preciso.**

## Anti-references

- **Portal de governo antigo.** Formulário denso, azul-institucional, tabela sem
  hierarquia, jargão administrativo. É exatamente o matrícula.rio que este produto corrige.
- **Dashboard SaaS genérico.** Big-number heróico, cards idênticos em grade, gradiente
  roxo, cara de template. Faz serviço público parecer produto de venture capital.
- **App de banco / fintech.** Gamificação, score grande na tela, badges. Transformar chance
  de vaga em "score" banaliza a decisão.
- **Site infantil / escolar.** Lápis de cor, balões, ilustração de criança de mãos dadas.
  Condescendente com quem está resolvendo um problema sério.

A referência positiva é a simplicidade tech do Notion: superfície calma, tipografia fazendo
a hierarquia, cor entrando só onde significa alguma coisa, densidade sem ruído.

## Design Principles

1. **Honestidade acima de cobertura.** Nunca preencher as 5 vagas com unidade inviável.
   Quando não há opção segura, dizer isso — e mostrar qual é a melhor chance real. O
   "não consegui" é informação, não falha a esconder.
2. **Dois eixos que nunca colapsam.** Chance e encaixe ficam visualmente separados em todo
   cartão de unidade. Um número único esconderia o trade-off e tiraria da família a
   capacidade de discordar de forma informada.
3. **Toda recomendação carrega seu motivo.** Uma frase, em português concreto, apontando a
   âncora de localização que a justifica. A interface explica o efeito; nunca a fórmula.
4. **Precisão calibrada à evidência.** Faixa qualitativa, não número pontual. A simulação
   acerta a direção e erra a magnitude — e a interface declara a origem e as limitações dos
   dados em vez de esperar a pergunta.
5. **O celular modesto é o caso base.** Não o desktop com o mapa grande. Mobile-first
   estrutural, sem depender de hover, funcionando com fonte aumentada e conexão ruim.

## Accessibility & Inclusion

- **WCAG 2.2 AA**, verificado em ambos os temas (claro e escuro).
- **Chance nunca comunicada só por cor.** Sempre cor + rótulo textual + forma, para
  daltonismo e para leitura em tela ruim sob luz do sol.
- **Alvos de toque ≥44px**, navegação completa por teclado, foco visível em tudo.
- Funciona com fonte aumentada (zoom 200%) sem quebra de layout ou perda de conteúdo.
- `prefers-reduced-motion` respeitado em toda transição.
- Português claro, sem jargão administrativo. Perguntas puláveis: o formulário nunca trava.
