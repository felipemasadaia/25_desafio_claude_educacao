import type { Metadata } from "next";
import { SeletorTema } from "../componentes/tema";
import { AbasPainel } from "../componentes/abas-painel";

export const metadata: Metadata = {
  title: "Painel da SME · Carteira de creches",
  description:
    "Descasamento entre oferta e demanda, vacância crônica e déficit territorial por CRE.",
};

/**
 * Casca da face da SME.
 *
 * Ferramenta interna de planejamento: largura cheia para tabela e mapa,
 * identificação explícita de que é uso interno, e a ressalva
 * metodológica — que é outra conversa que a da família. Aqui o risco não
 * é decidir errado a creche do filho, é ler magnitude onde o dado só
 * sustenta estrutura.
 */
export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 flex h-14 items-center justify-between gap-4 px-4 md:px-6"
        style={{
          zIndex: "var(--z-sticky)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex min-w-0 items-center gap-4">
          <p className="hidden shrink-0 truncate text-sm font-semibold sm:block">Painel da rede</p>
          <AbasPainel />
        </div>
        <SeletorTema />
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="mt-auto px-4 py-6 md:px-6"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <h2 className="text-sm font-semibold">Nota metodológica</h2>
        <p className="mt-1.5 max-w-[80ch] text-label leading-relaxed" style={{ color: "var(--muted)" }}>
          Base: 5 processos seletivos de creche (2021–2025), anonimizados. O próprio material
          da SME avisa que os indicadores não representam a realidade exata. As leituras aqui
          são sobre a <strong>estrutura</strong> do problema — onde há descasamento, vacância
          crônica e déficit territorial — não sobre magnitudes absolutas. Chance histórica por
          unidade usa apenas processos anteriores ao ano avaliado. Alcance é distância com
          ajuste por modal, sem roteirização.
        </p>
      </footer>
    </div>
  );
}
