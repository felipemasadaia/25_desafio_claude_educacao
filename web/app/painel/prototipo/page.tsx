import { PrototipoPainelSecretaria } from "../../componentes/prototipo-painel-secretaria";

export const metadata = {
  title: "Protótipo · Sala de decisão da SME",
  description: "Três enquadramentos para priorizar intervenções territoriais na rede.",
};

type Props = {
  searchParams: Promise<{ variant?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { variant } = await searchParams;
  const inicial = variant === "B" || variant === "C" ? variant : "A";

  return <PrototipoPainelSecretaria varianteInicial={inicial} />;
}
