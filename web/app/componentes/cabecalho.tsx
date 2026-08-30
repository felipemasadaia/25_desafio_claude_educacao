"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeletorTema } from "./tema";

const ROTAS = [
  { href: "/", rotulo: "Para famílias" },
  { href: "/painel", rotulo: "Painel da SME" },
];

export function Cabecalho() {
  const caminho = usePathname();

  return (
    <header
      className="sticky top-0 px-4"
      style={{
        zIndex: "var(--z-sticky)",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {ROTAS.map((r) => {
            const ativo = caminho === r.href;
            return (
              <Link
                key={r.href}
                href={r.href}
                aria-current={ativo ? "page" : undefined}
                className="flex min-h-9 items-center rounded-lg px-3 text-[0.8125rem] font-medium transition-colors"
                style={{
                  background: ativo ? "var(--brand-suave)" : "transparent",
                  color: ativo ? "var(--brand)" : "var(--muted)",
                }}
              >
                {r.rotulo}
              </Link>
            );
          })}
        </div>
        <SeletorTema />
      </div>
    </header>
  );
}
