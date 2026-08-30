import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProvedorTema, SCRIPT_TEMA } from "./componentes/tema";
import { NavegacaoLateral } from "./componentes/cabecalho";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carteira de creches · Rio de Janeiro",
  description:
    "Monte uma carteira de até 5 creches calibrada para a sua realidade, antes de se inscrever no matrícula.rio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Antes da primeira pintura: sem isso, quem escolheu escuro leva flash branco. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full">
        <ProvedorTema>
          <NavegacaoLateral />
          {/* Desloca o conteúdo pela largura da sidebar no desktop; no celular
              a barra fica na base, então só reserva espaço embaixo. */}
          <div className="flex min-h-full flex-col pb-[56px] md:pb-0 md:pl-60">
            <main className="flex-1">{children}</main>
            <Rodape />
          </div>
        </ProvedorTema>
      </body>
    </html>
  );
}

function Rodape() {
  return (
    <footer
      className="mt-auto px-4 py-6"
      style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="mx-auto max-w-4xl md:mx-0 md:max-w-[70ch]">
        <h2 className="text-sm font-semibold">Sobre estes números</h2>
        <p
          className="mt-1.5 max-w-[70ch] text-label leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Dados dos processos seletivos de creche de 2021 a 2025 da Secretaria Municipal de
          Educação do Rio de Janeiro, anonimizados. O próprio material da SME avisa que os
          indicadores não representam a realidade exata — servem para ilustrar as dinâmicas do
          processo. As conclusões aqui são sobre a <strong>estrutura</strong> do problema, não
          sobre magnitudes absolutas. A chance histórica de cada unidade é calculada apenas com
          processos anteriores ao ano avaliado. Protótipo: não substitui a inscrição no
          matrícula.rio.
        </p>
      </div>
    </footer>
  );
}
