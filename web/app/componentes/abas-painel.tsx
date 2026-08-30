"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Alternância entre as duas faces do painel da SME.
 *
 * São perguntas distintas, e por isso rotas distintas em vez de abas dentro
 * de uma tela: a operação é o dia a dia ("quem eu chamo agora") e a análise
 * é o planejamento ("onde falta"). O gestor entra na operação e desce para a
 * análise quando a pergunta muda de escala — não a cada rolagem.
 */

const ROTAS = [
  { href: "/painel/operacao", rotulo: "Operação" },
  { href: "/painel", rotulo: "Análise" },
] as const;

export function AbasPainel() {
  const caminho = usePathname();

  return (
    <nav aria-label="Faces do painel" className="flex gap-0.5">
      {ROTAS.map((r) => {
        // `/painel` casaria com tudo por prefixo; exige igualdade exata.
        const ativa = caminho === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={ativa ? "page" : undefined}
            className="flex min-h-[36px] items-center rounded-lg px-3 text-sm font-medium transition-colors"
            style={{
              background: ativa ? "var(--elevated)" : "transparent",
              color: ativa ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${ativa ? "var(--border-controle)" : "transparent"}`,
            }}
          >
            {r.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
