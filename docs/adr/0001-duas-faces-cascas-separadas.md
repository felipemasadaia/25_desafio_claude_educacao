# ADR-0001 — Duas faces, cascas separadas sobre o mesmo motor

Data: 2026-08-30
Status: aceito

## Contexto

O produto tem dois públicos sobre a mesma base de dados: a família que vai
se inscrever no processo seletivo, e a SME que planeja a rede.

Até aqui os dois viviam sob a mesma casca — uma navegação lateral única,
um cabeçalho único, um rodapé único, alternando entre `/` e `/painel`.
Funcionava, mas comunicava a coisa errada: as duas faces liam como duas
abas do mesmo produto.

Elas não são. Os públicos não se sobrepõem, os dispositivos não se
sobrepõem, e o risco de errar é de natureza diferente em cada uma:

- A família decide **uma** creche para **um** filho, no celular,
  provavelmente sem familiaridade com o vocabulário do processo. Errar
  aqui é a criança ficar sem vaga.
- A SME decide **onde investir** na rede inteira, no desktop, com fluência
  no domínio. Errar aqui é ler magnitude absoluta onde o dado anonimizado
  só sustenta leitura de estrutura.

Uma navegação compartilhada ainda oferecia à mãe no celular um "Painel da
SME" que não é para ela, e enquadrava a ferramenta de planejamento como
uma variação da ferramenta de inscrição.

## Decisão

Separar as **cascas**, mantendo o **motor** compartilhado.

- `web/lib/recomendador/` continua sendo módulo puro único, sem I/O,
  consumido pelas duas faces. Não há duplicação de regra de negócio.
- `app/layout.tsx` guarda só o que as duas faces têm mesmo em comum:
  fontes, tokens de tema, reset.
- `app/familia/` e `app/painel/` têm cada uma o seu layout, cabeçalho,
  rodapé, metadata e densidade.
- `app/page.tsx` vira porta de entrada: pergunta uma vez quem chegou e
  sai do caminho. Não é nenhuma das duas faces.
- A navegação lateral compartilhada (`componentes/cabecalho.tsx`) foi
  removida.

O rodapé, que era um só, virou dois — porque são ressalvas diferentes. A
família precisa saber que a chance é faixa e que acessibilidade não entra
no encaixe. A SME precisa saber que a leitura é estrutural e não de
magnitude. Servir o mesmo texto aos dois era servir o texto errado a
ambos.

## Consequências

**A favor.** Cada face evolui na sua densidade sem negociar com a outra.
Um agente trabalhando na face da família não toca arquivo da SME. Os
limites conhecidos são declarados no vocabulário de quem lê.

**Contra.** `componentes/ui.tsx` continua compartilhado e vira ponto de
acoplamento — mudança de assinatura ali afeta as duas faces. Enquanto for
só primitivo de UI (`Botao`, `Campo`, `Opcoes`, `SinalChance`), o custo é
menor que duplicar. Se começar a acumular regra de uma face só, é sinal
de que precisa quebrar em `ui-familia` / `ui-painel`.

Há duplicação deliberada de casca (dois cabeçalhos, dois rodapés). É
duplicação de apresentação, não de regra — e é ela que permite os dois
tons de voz.
