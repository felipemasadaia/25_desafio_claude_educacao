import Link from "next/link";
import { SeletorTema } from "./componentes/tema";

/**
 * Porta de entrada.
 *
 * As duas faces compartilham o motor, não o público. Em vez de uma
 * navegação lateral que faz a família tropeçar num painel de rede, a raiz
 * pergunta uma vez quem chegou e some do caminho.
 */
export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-end px-4 md:px-6">
        <SeletorTema />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-2xl">
          <h1 className="text-h1 font-semibold leading-tight">Carteira de creches</h1>
          <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            Processo seletivo de creche do Rio de Janeiro. Duas ferramentas sobre a mesma base
            de dados.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Porta
              href="/familia"
              titulo="Sou família"
              descricao="Monte uma carteira de até 5 creches calibrada para a sua rotina, antes de se inscrever no matrícula.rio."
              acao="Montar minha carteira"
            />
            <Porta
              href="/painel"
              titulo="Sou da SME"
              descricao="Descasamento entre oferta e demanda, vacância crônica e déficit territorial por CRE."
              acao="Abrir o painel da rede"
            />
          </div>

          <p className="mt-8 text-label leading-relaxed" style={{ color: "var(--muted)" }}>
            Protótipo sobre dados anonimizados de 2021 a 2025 da Secretaria Municipal de
            Educação. Não substitui a inscrição no matrícula.rio.
          </p>
        </div>
      </main>
    </div>
  );
}

function Porta({
  href,
  titulo,
  descricao,
  acao,
}: {
  href: string;
  titulo: string;
  descricao: string;
  acao: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl p-5 transition-colors"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <span className="text-h3 font-semibold">{titulo}</span>
      <span className="mt-1.5 flex-1 text-label leading-relaxed" style={{ color: "var(--muted)" }}>
        {descricao}
      </span>
      <span className="mt-4 text-sm font-medium" style={{ color: "var(--brand)" }}>
        {acao} →
      </span>
    </Link>
  );
}
