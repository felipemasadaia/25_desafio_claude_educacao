"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeletorTema } from "./tema";

/**
 * Navegação lateral.
 *
 * No desktop é uma coluna fixa à esquerda. No celular vira barra inferior:
 * sidebar fixa numa tela de 375px comeria metade da largura, e a face da
 * família é feita para ser usada em pé, no celular. Mesma navegação, mesma
 * ordem, sem roubar espaço do conteúdo.
 */

const ROTAS = [
  {
    href: "/",
    rotulo: "Para famílias",
    descricao: "Monte sua carteira",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/painel",
    rotulo: "Painel da SME",
    descricao: "Planejamento da rede",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function NavegacaoLateral() {
  const caminho = usePathname();

  return (
    <>
      {/* Desktop: coluna fixa à esquerda. */}
      <nav
        aria-label="Seções"
        className="fixed inset-y-0 left-0 hidden w-60 flex-col px-3 py-4 md:flex"
        style={{
          zIndex: "var(--z-sticky)",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="px-2 pb-5 pt-1">
          <p className="text-h3 font-semibold leading-tight">Carteira de creches</p>
          <p className="mt-0.5 text-label" style={{ color: "var(--muted)" }}>
            Rio de Janeiro
          </p>
        </div>

        <ul className="flex flex-col gap-1">
          {ROTAS.map((r) => {
            const ativo = caminho === r.href;
            return (
              <li key={r.href}>
                <Link
                  href={r.href}
                  aria-current={ativo ? "page" : undefined}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                  style={{
                    background: ativo ? "var(--brand-suave)" : "transparent",
                    color: ativo ? "var(--brand)" : "var(--muted)",
                  }}
                >
                  <span className="h-[18px] w-[18px] shrink-0">{r.icone}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{r.rotulo}</span>
                    <span
                      className="truncate text-label"
                      style={{ color: ativo ? "var(--brand)" : "var(--muted)", opacity: 0.8 }}
                    >
                      {r.descricao}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto px-2 pt-4">
          <SeletorTema />
        </div>
      </nav>

      {/* Celular: barra superior enxuta só com o tema. */}
      <header
        className="sticky top-0 flex h-14 items-center justify-between px-4 md:hidden"
        style={{
          zIndex: "var(--z-sticky)",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p className="text-sm font-semibold">Carteira de creches</p>
        <SeletorTema />
      </header>

      {/* Celular: navegação na base, onde o polegar alcança. */}
      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 flex md:hidden"
        style={{
          zIndex: "var(--z-sticky)",
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {ROTAS.map((r) => {
          const ativo = caminho === r.href;
          return (
            <Link
              key={r.href}
              href={r.href}
              aria-current={ativo ? "page" : undefined}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: ativo ? "var(--brand)" : "var(--muted)" }}
            >
              <span className="h-5 w-5">{r.icone}</span>
              <span className="text-label font-medium">{r.rotulo}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
