"use client";

import { formataDistancia, tituloCase } from "@/lib/formato";
import type { ItemCarteira } from "@/lib/recomendador/tipos";
import { BarraEncaixe, Botao, SeloPapel, SinalChance } from "./ui";

/**
 * Cartão de unidade — o componente central da face da família.
 *
 * Chance e encaixe ocupam colunas visualmente separadas e nunca colapsam num
 * número único: é o que permite à família discordar de forma informada.
 */
export function CartaoUnidade({
  item,
  posicao,
  onTrocar,
  onSubir,
  onDescer,
  primeiro,
  ultimo,
}: {
  item: ItemCarteira;
  posicao: number;
  onTrocar?: () => void;
  onSubir?: () => void;
  onDescer?: () => void;
  primeiro?: boolean;
  ultimo?: boolean;
}) {
  const u = item.unidade;

  return (
    <article
      className="rounded-xl p-4 transition-shadow"
      style={{
        background: "var(--elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sombra)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="tnum mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[0.8125rem] font-semibold"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
            aria-label={`Opção ${posicao}`}
          >
            {posicao}
          </span>
          <div className="min-w-0">
            <h3 className="text-[1.0625rem] font-semibold leading-snug">
              {tituloCase(u.nome)}
            </h3>
            <p className="mt-0.5 text-[0.8125rem]" style={{ color: "var(--muted)" }}>
              {[tituloCase(u.tipo), tituloCase(u.bairro)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <SeloPapel papel={item.papel} />
      </div>

      {/* Os dois eixos, lado a lado e rotulados. Nunca um número só. */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p
            className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            Chance de vaga
          </p>
          <SinalChance faixa={item.faixa} />
        </div>
        <div>
          <p
            className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            Encaixe na rotina
          </p>
          <BarraEncaixe valor={item.encaixe} />
        </div>
      </div>

      <p className="mt-3 text-[0.8125rem] leading-relaxed" style={{ color: "var(--ink)" }}>
        {item.explicacao}
      </p>

      <div
        className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[0.75rem]"
        style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
      >
        <span className="tnum">
          {formataDistancia(item.distanciaKm)} de{" "}
          <strong style={{ fontWeight: 600 }}>
            {item.justificadaPor.rotulo.toLowerCase()}
          </strong>
        </span>
        <span className="tnum">~{item.minutos} min</span>
        {!u.confiavel && (
          <span style={{ color: "var(--chance-baixa)" }}>
            Histórico curto — chance menos confiável
          </span>
        )}
      </div>

      {(onTrocar || onSubir || onDescer) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onSubir && (
            <Botao variante="secundario" tamanho="sm" onClick={onSubir} disabled={primeiro}>
              ↑ Subir
            </Botao>
          )}
          {onDescer && (
            <Botao variante="secundario" tamanho="sm" onClick={onDescer} disabled={ultimo}>
              ↓ Descer
            </Botao>
          )}
          {onTrocar && (
            <Botao variante="fantasma" tamanho="sm" onClick={onTrocar}>
              Trocar esta opção
            </Botao>
          )}
        </div>
      )}
    </article>
  );
}
