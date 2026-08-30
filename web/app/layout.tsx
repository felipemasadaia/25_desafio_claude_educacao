import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProvedorTema, SCRIPT_TEMA } from "./componentes/tema";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carteira de creches · Rio de Janeiro",
  description:
    "Duas faces sobre o mesmo motor: a família que vai se inscrever e a SME que planeja a rede.",
};

/**
 * Layout raiz: só o que as duas faces têm mesmo em comum — fontes, tema,
 * reset. Casca, navegação e rodapé são de cada face, porque são públicos
 * diferentes. Ver `familia/layout.tsx` e `painel/layout.tsx`.
 */
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
        <ProvedorTema>{children}</ProvedorTema>
      </body>
    </html>
  );
}
