"""
Costura 2 — pré-processamento do catálogo.

Guarda-corpo de dados. Existe porque um vazamento temporal silencioso
invalidaria todos os números apresentados na demonstração.

Rodar: .venv/bin/python -m pytest scripts/test_catalogo.py -q
"""

import json
import math
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "web" / "data" / "creches.json"
MIN_OPCOES_HIST = 30


@pytest.fixture(scope="module")
def catalogo():
    if not CATALOGO.exists():
        pytest.skip("catálogo não gerado; rode scripts/build_catalogo.py")
    # parse_constant dispara em NaN/Infinity: JSON válido não os contém,
    # e o JavaScript do app recusa o arquivo inteiro se estiverem lá.
    def recusa(valor):
        raise ValueError(f"JSON inválido para JavaScript: {valor}")

    with open(CATALOGO, encoding="utf-8") as f:
        return json.load(f, parse_constant=recusa)


def test_json_e_valido_para_javascript(catalogo):
    """NaN é aceito por Python e recusado por JSON.parse — o app não carregaria."""
    assert catalogo["unidades"]


def test_sem_vazamento_temporal(catalogo):
    """A chance histórica não pode ser calculada com o ano avaliado."""
    bruto = CATALOGO.read_text(encoding="utf-8")
    assert '"ano_alvo":2025' in bruto.replace(" ", "")
    # O guarda-corpo real está no build: hist usa a[a.ano < ANO_ALVO].
    fonte = (RAIZ / "scripts" / "build_catalogo.py").read_text(encoding="utf-8")
    assert 'a["ano"] < ANO_ALVO' in fonte, "cálculo histórico deve excluir o ano-alvo"


def test_marcador_de_confiabilidade_respeita_o_limite(catalogo):
    for u in catalogo["unidades"]:
        esperado = u["n_hist"] >= MIN_OPCOES_HIST
        assert u["confiavel"] == esperado, f"{u['codigo']}: n_hist={u['n_hist']}"


def test_unidade_nao_confiavel_nunca_e_ancora_elegivel(catalogo):
    """Âncora exige amostra suficiente; sem isso a chance é ruído."""
    for u in catalogo["unidades"]:
        if not u["confiavel"]:
            continue
        assert u["n_hist"] >= MIN_OPCOES_HIST


def test_campos_obrigatorios_presentes(catalogo):
    obrigatorios = {
        "codigo", "nome", "tipo", "cre", "microarea", "bairro", "endereco",
        "lat", "lng", "chance_hist", "n_hist", "confiavel", "opcoes_2025",
        "criancas_2025", "taxa_2025", "matriculas", "por_grupamento",
    }
    for u in catalogo["unidades"]:
        assert obrigatorios <= set(u), f"{u['codigo']} faltando campos"


def test_sem_valores_flutuantes_invalidos(catalogo):
    """Nenhum NaN/Infinity escondido em campo numérico."""
    def checa(valor, caminho):
        if isinstance(valor, float):
            assert math.isfinite(valor), f"{caminho} = {valor}"
        elif isinstance(valor, dict):
            for k, v in valor.items():
                checa(v, f"{caminho}.{k}")
        elif isinstance(valor, list):
            for i, v in enumerate(valor):
                checa(v, f"{caminho}[{i}]")

    checa(catalogo, "catalogo")


def test_texto_ausente_e_none_nao_a_string_nan(catalogo):
    """'nan' como texto vaza para a interface e aparece para a família."""
    for u in catalogo["unidades"]:
        for campo in ("tipo", "bairro", "endereco", "nome"):
            valor = u[campo]
            assert valor is None or isinstance(valor, str)
            if isinstance(valor, str):
                assert valor.strip().lower() != "nan", f"{u['codigo']}.{campo}"


def test_unidades_sem_coordenada_sao_identificaveis(catalogo):
    """Tratadas explicitamente, não silenciosamente omitidas."""
    sem_geo = [u for u in catalogo["unidades"] if u["lat"] is None or u["lng"] is None]
    for u in sem_geo:
        assert u["lat"] is None and u["lng"] is None, f"{u['codigo']}: coordenada parcial"
    # Existem e são poucas: o motor as exclui do alcance de forma consciente.
    assert len(sem_geo) < len(catalogo["unidades"]) * 0.1


def test_coordenadas_dentro_do_rio(catalogo):
    for u in catalogo["unidades"]:
        if u["lat"] is None:
            continue
        assert -23.15 < u["lat"] < -22.70, f"{u['codigo']} lat fora do Rio"
        assert -43.85 < u["lng"] < -43.05, f"{u['codigo']} lng fora do Rio"


def test_chances_sao_probabilidades(catalogo):
    for u in catalogo["unidades"]:
        if u["chance_hist"] is not None:
            assert 0.0 <= u["chance_hist"] <= 1.0
        for r in u["por_grupamento"]:
            assert 0.0 <= r["chance"] <= 1.0
            assert r["opcoes"] > 0


def test_codigos_de_unidade_sao_unicos(catalogo):
    codigos = [u["codigo"] for u in catalogo["unidades"]]
    assert len(codigos) == len(set(codigos))


def test_agregados_do_painel_presentes(catalogo):
    assert len(catalogo["bairros"]) > 100
    assert len(catalogo["serie_anual"]) == 5
    assert len(catalogo["regua_pontuacao"]) > 0
    anos = [s["ano"] for s in catalogo["serie_anual"]]
    assert anos == sorted(anos)


def test_serie_anual_confere_com_a_narrativa(catalogo):
    """Os números citados na spec e na interface vêm daqui."""
    por_ano = {s["ano"]: s for s in catalogo["serie_anual"]}
    assert por_ano[2025]["so_uma_opcao"] > por_ano[2021]["so_uma_opcao"]
    assert por_ano[2025]["media_opcoes"] < por_ano[2021]["media_opcoes"]
