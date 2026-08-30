# Contexto do domínio

Recomendador de carteira de creches para o processo seletivo do
matrícula.rio. Duas faces sobre o mesmo motor: a família que vai se
inscrever, e a SME que planeja a rede.

Fonte: `CIT-SME-RJ/dadoscreche` — 5 processos anonimizados (2021–2025).

## Glossário

Termos usados de forma consistente em código, interface e testes. Não
renomear sem atualizar este arquivo e a spec.

- **Unidade** — creche ou escola que oferece vaga de creche. Identificada
  pelo código da unidade (`esc_codigo` / `DESIGNACAO`).
- **Âncora de localização** — ponto de referência marcado pela família no
  mapa (casa, trabalho, casa de parente). Distinto de âncora da carteira.
- **Alcance** — conjunto de unidades que a família consegue frequentar,
  derivado das âncoras de localização e do modal declarado.
- **Chance** — probabilidade estimada de a família conseguir vaga naquela
  unidade, considerando a pontuação dela. Propriedade do par
  (família, unidade), nunca da unidade sozinha.
- **Encaixe** — adequação da unidade à rotina: trajeto, grupamento,
  horário. (Acessibilidade *não* entra — ver "Limites conhecidos".)
- **Carteira** — o conjunto de até 5 unidades recomendado, com ordem e papéis.
- **Papel** — função de cada unidade na carteira: `sonho`, `equilibrio`
  ou `ancora`.
- **Âncora da carteira** — unidade com chance **histórica** ≥50% e amostra
  confiável. É a aposta segura. Propriedade da unidade, deliberadamente
  não do perfil: se a pontuação criasse âncora, "aposta segura" deixaria
  de significar "esta unidade costuma ter vaga".
- **Piso da carteira** — a menor chance entre as opções. É o que o
  algoritmo otimiza (excluindo o sonho, que é a aposta declarada da família).
- **Grupamento** — faixa etária curricular (Berçário, Maternal I, Maternal II).
- **Déficit territorial** — não existe âncora da carteira dentro do alcance
  da família. Declarado, nunca mascarado.

## Invariantes que os testes protegem

O motor (`web/lib/recomendador/`) é módulo puro, sem I/O. É a costura
principal de teste — 63 testes em `web/lib/`, mais 15 guarda-corpos de
dados em `scripts/test_catalogo.py`.

1. **Não-vazamento temporal.** Toda chance apresentada é calculada só com
   processos anteriores ao ano avaliado — tanto `chance_hist` quanto o
   recorte grupamento × horário, que é o número que a família de fato vê.
   Os testes conferem o catálogo **contra a base bruta**, não contra o
   texto do script: a primeira versão do teste procurava uma string no
   fonte e deixou passar um vazamento real.
2. **Âncora sempre**, quando existir uma no alcance. Vale +11 a +15pp,
   replicado em 2023, 2024 e 2025.
3. **Otimizar o piso, não o spread.** Diversificação por diversificação foi
   testada e **rejeitada** — o sinal trocava conforme o limiar e não
   replicava entre anos. Não reintroduzir.
4. **Nada fora do alcance**, em nenhuma hipótese.
5. **Déficit é declarado**, com a melhor chance real, sem relaxar o limiar.
6. **Teto de 5.**
7. **A ordem das âncoras de localização é peso.**

## Limites conhecidos

Declarados na interface, não escondidos.

- **Acessibilidade não entra no encaixe.** As bases não trazem o atributo
  por unidade; derivá-lo do tipo seria inventar dado. A família é avisada
  para confirmar com a creche.
- **A chance é faixa qualitativa, nunca número pontual.** A simulação
  acerta a direção e erra a magnitude.
- **A probabilidade agregada não trata as opções como independentes.** As
  filas são correlacionadas; há peso decrescente e teto explícito.
- **Sem roteirização.** O alcance é distância com ajuste por modal.
- **Os dados são anonimizados** e o próprio material da SME avisa que os
  indicadores não representam a realidade. As conclusões são sobre a
  *estrutura* do problema.

## Onde as coisas ficam

```
scripts/build_catalogo.py     pipeline: bases da SME -> web/data/creches.json
scripts/test_catalogo.py      costura 2: guarda-corpo de dados
web/lib/recomendador/         costura 1: o motor (puro)
web/lib/cobertura.ts          cobertura territorial para o painel
web/app/componentes/          as duas faces
PRODUCT.md / DESIGN.md        registro, princípios e sistema visual
```
