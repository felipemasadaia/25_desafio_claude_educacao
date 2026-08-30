import type { Metadata } from "next";
import { SeletorTema } from "../componentes/tema";

export const metadata: Metadata = {
  title: "Monte sua carteira de creches · Rio de Janeiro",
  description:
    "Monte uma carteira de até 5 creches calibrada para a sua realidade, antes de se inscrever no matrícula.rio.",
};

/**
 * Casca da face da família.
 *
 * Sem navegação para o painel: a mãe que abre isso no celular, na fila,
 * não tem por que ser oferecida um painel de planejamento de rede. Uma
 * tarefa só, uma coluna só. As ressalvas ficam no rodapé porque a família
 * precisa lê-las antes de decidir.
 */
export default function LayoutFamilia({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 flex h-14 items-center justify-between px-4"
        style={{
          zIndex: "var(--z-sticky)",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p className="text-sm font-semibold">Carteira de creches</p>
        <SeletorTema />
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="mt-auto px-4 py-6"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="text-sm font-semibold">Sobre estes números</h2>
          <p
            className="mt-1.5 max-w-[70ch] text-label leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            As chances vêm dos processos seletivos de creche de 2021 a 2025 da Secretaria
            Municipal de Educação do Rio, anonimizados, e são sempre calculadas apenas com
            processos anteriores ao ano avaliado. São faixas, não garantia: servem para
            comparar opções, não para prever o seu resultado. Acessibilidade não entra na
            conta — confirme direto com a creche. Este é um protótipo e{" "}
            <strong>não substitui a inscrição no matrícula.rio</strong>.
          </p>
        </div>
      </footer>
    </div>
  );
}
