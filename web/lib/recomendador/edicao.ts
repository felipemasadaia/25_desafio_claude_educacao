/**
 * Reavaliação de uma carteira editada pela família.
 *
 * A família mantém o controle da decisão final (pode trocar e reordenar),
 * mas a regra da âncora não pode sumir em silêncio: se a edição removeu a
 * única aposta segura, a interface avisa. Avisar, não bloquear — a spec é
 * explícita em que a família pode manter a creche que ela quer.
 */
import { LIMIAR_ANCORA } from "./motor";
import type { ItemCarteira, Papel } from "./tipos";

export type CarteiraEditada = {
  itens: ItemCarteira[];
  /** A edição deixou a carteira sem nenhuma aposta segura. */
  perdeuAncora: boolean;
};

/** Uma unidade só sustenta o papel de âncora com amostra confiável. */
function podeSerAncora(item: ItemCarteira): boolean {
  return item.unidade.confiavel && (item.unidade.chance_hist ?? 0) >= LIMIAR_ANCORA;
}

/**
 * Recalcula os papéis da carteira depois de uma edição.
 *
 * Os papéis vêm do motor no momento da recomendação; depois que a família
 * troca uma opção, eles ficam defasados — uma carteira sem âncora nenhuma
 * continuaria mostrando "equilíbrio" em tudo, sem sinal do que se perdeu.
 */
export function reavalia(
  itens: ItemCarteira[],
  tinhaAncora: boolean,
): CarteiraEditada {
  let ancoraUsada = false;
  const reavaliados = itens.map((item) => {
    let papel: Papel;
    if (podeSerAncora(item) && !ancoraUsada) {
      papel = "ancora";
      ancoraUsada = true;
    } else if (item.chance < 0.25) {
      papel = "sonho";
    } else {
      papel = "equilibrio";
    }
    return papel === item.papel ? item : { ...item, papel };
  });

  return {
    itens: reavaliados,
    perdeuAncora: tinhaAncora && !ancoraUsada,
  };
}
