"use client";

import { Botao } from "./ui";
import { Explicador, ListaPassos, Ressalva } from "./familia-explicadores";

/**
 * Acolhimento — a primeira tela que a família vê.
 *
 * Antes dela o fluxo abria direto no mapa, pedindo um pino sem dizer para
 * quê. Quem chega aqui não escolheu um "recomendador de carteira": chegou
 * porque precisa de creche para o filho. A tela responde, nessa ordem, o que
 * a pessoa pergunta de fato — onde eu estou, o que vou fazer, quanto tempo
 * leva, o que eu levo daqui — e só depois oferece o botão.
 *
 * Nenhum jargão do domínio aparece sem tradução: "carteira" e "âncora" só
 * entram dentro do explicador, onde há espaço para defini-los.
 */
export function BoasVindas({ aoComecar }: { aoComecar: () => void }) {
  return (
    <section className="mt-6 flex flex-col gap-6" aria-labelledby="titulo-boas-vindas">
      <div>
        <p
          className="text-label font-semibold uppercase tracking-wide"
          style={{ color: "var(--brand)" }}
        >
          Creche pública · Rio de Janeiro
        </p>
        <h2 id="titulo-boas-vindas" className="mt-1.5 text-display font-semibold">
          Você entrou no painel de escolha da creche do seu filho
        </h2>
        <p className="mt-3 max-w-[60ch] text-md leading-relaxed">
          Na inscrição do matrícula.rio você pode indicar até{" "}
          <strong>cinco creches</strong>. Quais cinco você escolhe, e em que
          ordem, muda bastante a sua chance de conseguir uma vaga.
        </p>
        <p className="mt-2 max-w-[60ch] text-md leading-relaxed">
          Aqui a gente ajuda você a montar essas cinco. Você responde algumas
          perguntas simples e, no final, mostramos uma lista pronta — com o
          motivo de cada creche estar ali.
        </p>
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-h3 font-semibold">O que você vai fazer</h3>
        <p className="mb-4 mt-1 text-sm" style={{ color: "var(--muted)" }}>
          São três passos. Leva cerca de 3 minutos, e dá para voltar e mudar
          qualquer resposta a qualquer momento.
        </p>
        <ListaPassos
          itens={[
            {
              titulo: "Marcar os lugares do seu dia a dia",
              texto:
                "Sua casa, seu trabalho, a casa de quem ajuda a levar a criança.",
            },
            {
              titulo: "Dizer como você se desloca",
              texto:
                "A pé, de ônibus ou de carro — e a idade e o horário que você precisa.",
            },
            {
              titulo: "Responder sobre a sua situação",
              texto:
                "São os critérios oficiais da Prefeitura, que somam pontos na inscrição.",
            },
          ]}
        />
      </div>

      <div>
        <h3 className="text-h3 font-semibold">O que você recebe no final</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {[
            "Uma lista de até 5 creches, na ordem sugerida para você preencher.",
            "Para cada creche: a chance de conseguir vaga e o quanto ela encaixa na sua rotina.",
            "Uma explicação, em uma frase, do motivo de cada creche estar na lista.",
            "Liberdade total para trocar, reordenar ou ignorar a sugestão.",
          ].map((texto) => (
            <li key={texto} className="flex gap-2.5 text-body leading-relaxed">
              <span aria-hidden="true" style={{ color: "var(--chance-alta)" }}>
                ✓
              </span>
              <span className="flex-1">{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <Explicador pergunta="De onde vêm essas chances?">
        <p>
          Dos processos seletivos de creche da Prefeitura do Rio de 2021 a 2025,
          com os dados das famílias anonimizados. Olhamos quantas pessoas
          pediram cada creche e quantas conseguiram vaga nos anos anteriores.
        </p>
        <p>
          Por isso falamos sempre em <strong>faixa</strong> — “aposta segura”,
          “chance real”, “disputada” — e nunca num número exato tipo “72%”. A
          estimativa acerta bem qual creche é mais fácil que a outra, mas não
          consegue cravar o seu resultado.
        </p>
      </Explicador>

      <Explicador pergunta="Isso já é a minha inscrição?">
        <p>
          Não. Este é um assistente para você decidir com calma antes de se
          inscrever. A inscrição de verdade continua sendo feita no{" "}
          <strong>matrícula.rio</strong>, e nada que você preencher aqui é
          enviado para a Prefeitura.
        </p>
        <p>
          Você não precisa criar conta nem informar dados da criança. Nada do
          que você responder aqui sai do seu aparelho.
        </p>
      </Explicador>

      <Ressalva>
        Um aviso desde já: não sabemos quais creches têm acessibilidade para
        cadeira de rodas ou outras necessidades — esse dado não existe nas bases
        públicas, e a gente prefere avisar a inventar. Se a sua criança precisa
        disso, confirme por telefone com cada creche da lista.
      </Ressalva>

      <div className="flex flex-col gap-2">
        <Botao onClick={aoComecar} className="w-full text-md sm:w-auto sm:self-start sm:px-8">
          Começar
        </Botao>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Você pode parar no meio e voltar sem perder o que preencheu.
        </p>
      </div>
    </section>
  );
}
