"""
Pré-processa as bases da SME num catálogo único consumido pelo app.

Saída: web/data/creches.json
  - uma entrada por unidade que recebeu inscrição de creche (872 unidades)
  - geolocalização, CRE, microárea, bairro
  - dificuldade histórica (taxa de sucesso 2021-2024, out-of-sample)
  - matrículas por grupamento/horário em 2025
  - agregados por bairro para o painel da SME

Rodar: .venv/bin/python scripts/build_catalogo.py
"""

import json
import unicodedata
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
BASES = RAIZ / "dados_sme" / "Bases IC_ ClassificadoseFila"
OFERTA = RAIZ / "dados_sme" / "OferecimentosEvagas"
SAIDA = RAIZ / "web" / "data"

SUCESSO = ["Confirmado", "Ativo", "Selecionado", "Selecionado da lista"]
ANO_ALVO = 2025           # ano avaliado
MIN_OPCOES_HIST = 30      # amostra mínima para confiar na dificuldade histórica


def norm(texto):
    """Normaliza texto para chave de junção: sem acento, maiúsculo, sem espaço extra."""
    if pd.isna(texto):
        return None
    s = unicodedata.normalize("NFKD", str(texto))
    s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(s.upper().split())


def carrega_inscricoes():
    return pd.read_csv(
        BASES / "01_QueryA_InscricoesPorAno.csv.gz",
        sep=";", encoding="utf-8-sig", compression="gzip", low_memory=False,
    )


def carrega_geo():
    x = pd.read_excel(OFERTA / "Unidades_Unificadas_com_Localizacao.xlsx")
    x["cod"] = x["DESIGNACAO"].astype(str).str.strip()
    return x


def carrega_matriculas_2025():
    """Planilha tem cabeçalho em 2 níveis: grupamento x horário, e Aluno/Turma."""
    v = pd.read_excel(OFERTA / "totaalunoscreche2025.xlsx", header=[0, 1])
    v.columns = [
        " ".join(str(c) for c in col if "Unnamed" not in str(c)).strip()
        for col in v.columns
    ]
    v = v.iloc[1:]  # descarta a linha de rótulos remanescente
    v["cod"] = v["Designação"].astype(str).str.strip()

    # colunas sem sufixo .1 são contagem de ALUNOS; com .1 são TURMAS
    grupos = ["Berçário", "Maternal I", "Maternal II"]
    saida = {}
    for _, linha in v.iterrows():
        detalhe = {}
        for g in grupos:
            for h in ["Integral", "Parcial"]:
                valor = pd.to_numeric(linha.get(f"{g} {h}"), errors="coerce")
                if pd.notna(valor) and valor > 0:
                    detalhe[f"{g}|{h}"] = int(valor)
        if detalhe:
            saida[linha["cod"]] = detalhe
    return saida


def main():
    print("carregando inscrições...")
    a = carrega_inscricoes()
    a["ok"] = a["situacao"].isin(SUCESSO)
    a["unidade"] = a["unidade"].astype(str).str.strip()

    # --- dificuldade histórica: calculada SÓ com anos anteriores (sem vazamento) ---
    print("calculando dificuldade histórica (2021-2024)...")
    hist = (
        a[a["ano"] < ANO_ALVO]
        .groupby("unidade")
        .agg(n_hist=("ok", "size"), taxa_hist=("ok", "mean"))
        .reset_index()
    )
    hist["confiavel"] = hist["n_hist"] >= MIN_OPCOES_HIST

    # --- demanda observada no ano alvo ---
    atual = (
        a[a["ano"] == ANO_ALVO]
        .groupby("unidade")
        .agg(
            opcoes_2025=("ok", "size"),
            criancas_2025=("aluno_anon", "nunique"),
            sucesso_2025=("ok", "sum"),
        )
        .reset_index()
    )
    atual["taxa_2025"] = atual["sucesso_2025"] / atual["opcoes_2025"]

    # --- oferta por grupamento/horário, direto das inscrições ---
    perfil = (
        a[a["ano"] == ANO_ALVO]
        .groupby(["unidade", "grupamento", "horario"])
        .agg(opcoes=("ok", "size"), taxa=("ok", "mean"))
        .reset_index()
    )

    print("juntando geolocalização...")
    geo = carrega_geo()
    matriculas = carrega_matriculas_2025()

    nomes = (
        a.groupby("unidade")["nome_unidade"]
        .agg(lambda s: s.mode().iloc[0] if len(s.mode()) else None)
        .to_dict()
    )

    base = hist.merge(atual, on="unidade", how="outer")
    base = base.merge(geo[["cod", "CRE", "microárea", "BAIRRO", "RUA",
                           "LATITUDE", "LONGITUDE", "Tipo"]],
                      left_on="unidade", right_on="cod", how="left")

    # só unidades que de fato receberam inscrição de creche
    base = base[base["unidade"].isin(set(a["unidade"]))]

    unidades = []
    for _, r in base.iterrows():
        cod = r["unidade"]
        det = perfil[perfil["unidade"] == cod]
        unidades.append({
            "codigo": cod,
            "nome": nomes.get(cod),
            "tipo": r.get("Tipo"),
            "cre": None if pd.isna(r.get("CRE")) else int(r["CRE"]),
            "microarea": None if pd.isna(r.get("microárea")) else str(r["microárea"]),
            "bairro": r.get("BAIRRO"),
            "endereco": r.get("RUA"),
            "lat": None if pd.isna(r.get("LATITUDE")) else round(float(r["LATITUDE"]), 6),
            "lng": None if pd.isna(r.get("LONGITUDE")) else round(float(r["LONGITUDE"]), 6),
            # dificuldade histórica out-of-sample
            "chance_hist": None if pd.isna(r.get("taxa_hist")) else round(float(r["taxa_hist"]), 4),
            "n_hist": 0 if pd.isna(r.get("n_hist")) else int(r["n_hist"]),
            "confiavel": bool(r.get("confiavel", False)),
            # demanda observada
            "opcoes_2025": 0 if pd.isna(r.get("opcoes_2025")) else int(r["opcoes_2025"]),
            "criancas_2025": 0 if pd.isna(r.get("criancas_2025")) else int(r["criancas_2025"]),
            "taxa_2025": None if pd.isna(r.get("taxa_2025")) else round(float(r["taxa_2025"]), 4),
            # oferta
            "matriculas": matriculas.get(cod, {}),
            "por_grupamento": [
                {
                    "grupamento": d["grupamento"],
                    "horario": d["horario"],
                    "opcoes": int(d["opcoes"]),
                    "chance": round(float(d["taxa"]), 4),
                }
                for _, d in det.iterrows()
            ],
        })

    com_geo = sum(1 for u in unidades if u["lat"] is not None)
    confiaveis = sum(1 for u in unidades if u["confiavel"])
    print(f"  {len(unidades)} unidades | {com_geo} com lat/long | {confiaveis} com histórico confiável")

    # --- agregados por bairro (painel da SME) ---
    print("agregando por bairro...")
    a25 = a[a["ano"] == ANO_ALVO].copy()
    a25["bairro_norm"] = a25["bairro"].map(norm)
    insc = a25.groupby(["prm_id", "plm_id", "ipl_id"]).agg(
        bairro=("bairro_norm", "first"),
        n_opcoes=("opcao", "size"),
        ok=("ok", "any"),
    ).reset_index()

    bairros = []
    for nome_b, g in insc.groupby("bairro"):
        if not nome_b or len(g) < 30:
            continue
        bairros.append({
            "bairro": nome_b,
            "inscricoes": int(len(g)),
            "media_opcoes": round(float(g["n_opcoes"].mean()), 2),
            "so_uma_opcao": round(float((g["n_opcoes"] == 1).mean()), 4),
            "taxa_sucesso": round(float(g["ok"].mean()), 4),
        })
    bairros.sort(key=lambda b: -b["inscricoes"])
    print(f"  {len(bairros)} bairros com >=30 inscrições")

    # --- régua de pontuação vigente ---
    c = pd.read_csv(BASES / "03_QueryC_PerguntasComDescricao.csv", sep=";", encoding="utf-8-sig")
    regua = [
        {
            "perg_id": int(r["perg_id"]),
            "texto": str(r["pergunta_texto"]).strip(),
            "pontos": int(r["perg_pontuacao"]),
        }
        for _, r in c[c["ano"] == ANO_ALVO].sort_values("perg_pontuacao", ascending=False).iterrows()
    ]

    # --- métricas globais para o painel ---
    todas = a.groupby(["ano", "prm_id", "plm_id", "ipl_id"]).agg(
        n_opcoes=("opcao", "size"), ok=("ok", "any")
    ).reset_index()
    por_ano = [
        {
            "ano": int(ano),
            "inscricoes": int(len(g)),
            "media_opcoes": round(float(g["n_opcoes"].mean()), 3),
            "so_uma_opcao": round(float((g["n_opcoes"] == 1).mean()), 4),
            "taxa_sucesso": round(float(g["ok"].mean()), 4),
        }
        for ano, g in todas.groupby("ano")
    ]

    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / "creches.json"
    with open(destino, "w", encoding="utf-8") as f:
        json.dump({
            "ano_alvo": ANO_ALVO,
            "gerado_de": "CIT-SME-RJ/dadoscreche (dados anonimizados)",
            "unidades": unidades,
            "bairros": bairros,
            "regua_pontuacao": regua,
            "serie_anual": por_ano,
        }, f, ensure_ascii=False, separators=(",", ":"))

    mb = destino.stat().st_size / 1024 / 1024
    print(f"\nescrito: {destino}  ({mb:.1f} MB)")


if __name__ == "__main__":
    main()
