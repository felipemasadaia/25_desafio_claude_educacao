"use client";

import { useId, useRef, useState } from "react";
import { Botao } from "./ui";

/**
 * Busca de endereço ou CEP dentro do município do Rio.
 *
 * É um atalho para posicionar o pino, não um requisito: endereço de
 * comunidade, rua sem número e conjunto sem cadastro simplesmente não
 * geocodificam. Quando não acha, o texto empurra a família para o mapa em vez
 * de acusar erro — o pino é que vale.
 */

type Sugestao = { rotulo: string; lat: number; lng: number };

type Estado =
  | { fase: "parado" }
  | { fase: "buscando" }
  | { fase: "achou"; sugestoes: Sugestao[] }
  | { fase: "vazio" }
  | { fase: "erro"; mensagem: string };

/** Corta "Rio de Janeiro, RJ, Região Sudeste, 20000-000, Brasil" do fim. */
function encurta(rotulo: string) {
  const partes = rotulo.split(",").map((p) => p.trim());
  const uteis = partes.filter(
    (p) => !/^(brasil|regi[ãa]o \w+|\d{5}-?\d{3}|RJ)$/i.test(p),
  );
  return uteis.slice(0, 4).join(", ");
}

export function BuscaEndereco({
  aoEscolher,
  rotuloAncora,
}: {
  aoEscolher: (lat: number, lng: number) => void;
  rotuloAncora: string;
}) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "parado" });
  const idCampo = useId();
  const emVoo = useRef<AbortController | null>(null);

  async function buscar() {
    const consulta = texto.trim();
    if (consulta.length < 3) return;

    emVoo.current?.abort();
    const controle = new AbortController();
    emVoo.current = controle;
    setEstado({ fase: "buscando" });

    try {
      const resposta = await fetch(
        `/api/geocodificar?q=${encodeURIComponent(consulta)}`,
        { signal: controle.signal },
      );
      const dados = (await resposta.json()) as { sugestoes: Sugestao[]; erro?: string };
      if (dados.erro) {
        setEstado({ fase: "erro", mensagem: dados.erro });
        return;
      }
      setEstado(
        dados.sugestoes.length > 0
          ? { fase: "achou", sugestoes: dados.sugestoes }
          : { fase: "vazio" },
      );
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === "AbortError") return;
      setEstado({
        fase: "erro",
        mensagem: "Não consegui buscar agora. Marque o ponto direto no mapa.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idCampo} className="text-label font-medium" style={{ color: "var(--muted)" }}>
        Buscar endereço ou CEP <span style={{ fontWeight: 400 }}>(opcional)</span>
      </label>
      <div className="flex gap-2">
        <input
          id={idCampo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void buscar();
            }
          }}
          placeholder="Rua Uruguaiana 100, ou 20050-092"
          inputMode="text"
          autoComplete="street-address"
          enterKeyHint="search"
          className="min-h-[44px] min-w-0 flex-1 rounded-lg px-3 text-body outline-none"
          style={{
            background: "var(--elevated)",
            color: "var(--ink)",
            border: "1px solid var(--border-controle)",
          }}
        />
        <Botao
          variante="secundario"
          onClick={() => void buscar()}
          disabled={texto.trim().length < 3 || estado.fase === "buscando"}
        >
          {estado.fase === "buscando" ? "Buscando…" : "Buscar"}
        </Botao>
      </div>

      <div aria-live="polite" className="text-sm">
        {estado.fase === "achou" && (
          <ul className="flex flex-col gap-1.5">
            {estado.sugestoes.map((s) => (
              <li key={`${s.lat},${s.lng}`}>
                <button
                  type="button"
                  onClick={() => {
                    aoEscolher(s.lat, s.lng);
                    setEstado({ fase: "parado" });
                    setTexto(encurta(s.rotulo));
                  }}
                  className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-body transition-colors"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--ink)",
                  }}
                >
                  {encurta(s.rotulo)}
                </button>
              </li>
            ))}
          </ul>
        )}

        {estado.fase === "vazio" && (
          <p style={{ color: "var(--muted)" }}>
            Não encontrei esse endereço no município do Rio. Arraste o pino
            “{rotuloAncora}” no mapa até o ponto certo — é ele que vale.
          </p>
        )}

        {estado.fase === "erro" && (
          <p style={{ color: "var(--chance-baixa)" }}>{estado.mensagem}</p>
        )}
      </div>
    </div>
  );
}
