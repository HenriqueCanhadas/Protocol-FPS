"""
app.py — PROTOCOL FPS · Flask Backend
Serve o React (SPA) em desenvolvimento e expõe a config via /api/config.

SEGURANÇA:
  - /api/config  → retorna APENAS as variáveis públicas do Supabase.
  - /api/trigger-coleta → dispara o workflow do GitHub Actions.
    O GITHUB_TOKEN permanece exclusivamente no servidor; nunca vai ao browser.
  - /api/remover → remove produtos/coletas usando a SUPABASE_SERVICE_KEY.
    A SERVICE_KEY ignora RLS e NUNCA vai ao browser (só o servidor a usa).

Variáveis lidas do .env (raiz do projeto):
  SUPABASE_URL, SUPABASE_ANON_KEY    → usadas pelo frontend
  SUPABASE_SERVICE_KEY               → usada SOMENTE por /api/remover (server-side)
  GITHUB_TOKEN, GITHUB_OWNER,
  GITHUB_REPO, GITHUB_WORKFLOW       → usadas SOMENTE por /api/trigger-coleta
"""
import os
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from flask import Flask, send_from_directory, jsonify, send_file, request
from dotenv import load_dotenv

# Carrega .env da raiz do projeto
_ROOT = Path(__file__).resolve().parent
for candidate in [_ROOT / ".env", _ROOT.parent / ".env"]:
    if candidate.exists():
        load_dotenv(candidate)
        break

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")

# ── Variáveis públicas (retornadas ao frontend) ────────────────
_PUBLIC_CONFIG = {
    "SUPABASE_URL":      os.getenv("SUPABASE_URL",      ""),
    "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY", ""),
}

# ── Variáveis privadas (somente no servidor) ───────────────────
_SUPABASE_URL         = os.getenv("SUPABASE_URL",         "")
_SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
_GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN",    "")
_GITHUB_OWNER    = os.getenv("GITHUB_OWNER",    "")
_GITHUB_REPO     = os.getenv("GITHUB_REPO",     "")
_GITHUB_WORKFLOW = os.getenv("GITHUB_WORKFLOW", "coletar.yml")


def _supabase_delete(table, column, ids):
    """
    DELETE server-side via PostgREST usando a SERVICE_KEY (ignora RLS).
    Retorna a quantidade de linhas efetivamente removidas.
    """
    valores = ",".join('"' + str(i).replace('"', "") + '"' for i in ids)
    url = f"{_SUPABASE_URL}/rest/v1/{table}?{column}=in.({valores})"
    req = urllib.request.Request(
        url,
        headers={
            "apikey":        _SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
            "Prefer":        "return=representation",  # devolve as linhas removidas
            "Content-Type":  "application/json",
        },
        method="DELETE",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode() or "[]")
        return len(data)


# ── API ────────────────────────────────────────────────────────

@app.route("/api/config")
def api_config():
    """
    Retorna apenas as variáveis públicas necessárias para o frontend React.
    GitHub credentials NÃO são incluídas aqui.
    """
    return jsonify(_PUBLIC_CONFIG)


@app.route("/api/trigger-coleta", methods=["POST"])
def api_trigger_coleta():
    """
    Dispara o workflow_dispatch do GitHub Actions.
    GITHUB_TOKEN permanece no servidor — nunca é enviado ao browser.
    """
    if not _GITHUB_TOKEN or not _GITHUB_OWNER or not _GITHUB_REPO:
        return jsonify({
            "error": "Variáveis GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO "
                     "não configuradas no .env"
        }), 500

    api_url = (
        f"https://api.github.com/repos/{_GITHUB_OWNER}/{_GITHUB_REPO}"
        f"/actions/workflows/{_GITHUB_WORKFLOW}/dispatches"
    )
    body = json.dumps({"ref": "main"}).encode()

    req = urllib.request.Request(
        api_url,
        data=body,
        headers={
            "Accept":               "application/vnd.github+json",
            "Authorization":        f"Bearer {_GITHUB_TOKEN}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type":         "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15):
            # 204 No Content = sucesso
            return jsonify({"ok": True}), 200

    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        code = exc.code
        if code == 401:
            detail = "Token inválido ou expirado (401)."
        elif code == 404:
            detail = f'Workflow "{_GITHUB_WORKFLOW}" não encontrado (404).'
        elif code == 422:
            detail = 'Branch "main" não encontrada (422).'
        return jsonify({"error": detail}), code

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/remover", methods=["POST"])
def api_remover():
    """
    Remove produtos ('produto') ou registros de histórico ('historico')
    usando a SERVICE_KEY (ignora RLS). Limpa as FKs antes de apagar o alvo.

    Body JSON: { "tipo": "produto" | "historico", "ids": [...] }
    """
    if not _SUPABASE_URL or not _SUPABASE_SERVICE_KEY:
        return jsonify({
            "error": "SUPABASE_URL / SUPABASE_SERVICE_KEY não configuradas no .env"
        }), 500

    payload = request.get_json(silent=True) or {}
    tipo = payload.get("tipo")
    ids  = payload.get("ids") or []

    if tipo not in ("produto", "historico"):
        return jsonify({"error": "tipo inválido (use 'produto' ou 'historico')"}), 400
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "nenhum id informado"}), 400

    try:
        if tipo == "historico":
            # FK: remove alertas que referenciam estes registros de histórico
            _supabase_delete("alertas", "historico_id", ids)
            removidos = _supabase_delete("historico_precos", "id", ids)
        else:  # produto
            _supabase_delete("alertas", "item_id", ids)
            _supabase_delete("historico_precos", "item_id", ids)
            removidos = _supabase_delete("itens", "id", ids)
        return jsonify({"ok": True, "removed": removidos}), 200

    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        return jsonify({"error": detail}), exc.code
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── SPA catch-all ──────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    # Paridade com o Vercel: em produção o rewrite exclui /api/ ("/((?!api/).*)").
    # Rotas /api/* não atendidas pelos handlers acima NÃO devem cair no SPA — o
    # correto é 404 JSON (como o Vercel faria), e não servir o index.html.
    if path.startswith("api/"):
        return jsonify({"error": "Endpoint de API não encontrado"}), 404

    dist = Path(app.static_folder)
    target = dist / path
    if path and target.exists():
        return send_from_directory(str(dist), path)
    index = dist / "index.html"
    if index.exists():
        return send_file(str(index))
    return (
        "<h2>Build do React não encontrado.</h2>"
        "<p>Execute <code>cd frontend && npm install && npm run build</code></p>",
        404,
    )


# ── Dev helper ─────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PROTOCOL FPS Flask Dev Server")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    print(f"\n  PROTOCOL FPS — Flask Backend")
    print(f"  http://{args.host}:{args.port}")
    print(f"\n  ── Supabase (público) ──────────────────────────")
    print(f"  SUPABASE_URL  : {'✓ OK' if _PUBLIC_CONFIG['SUPABASE_URL']      else '✗ AUSENTE'}")
    print(f"  ANON_KEY      : {'✓ OK' if _PUBLIC_CONFIG['SUPABASE_ANON_KEY'] else '✗ AUSENTE'}")
    print(f"  SERVICE_KEY   : {'✓ OK' if _SUPABASE_SERVICE_KEY              else '✗ AUSENTE'}")
    print(f"\n  ── GitHub Actions (servidor) ────────────────────")
    print(f"  GITHUB_TOKEN  : {'✓ OK' if _GITHUB_TOKEN else '✗ AUSENTE'}")
    print(f"  GITHUB_OWNER  : {_GITHUB_OWNER  or '✗ AUSENTE'}")
    print(f"  GITHUB_REPO   : {_GITHUB_REPO   or '✗ AUSENTE'}")
    print(f"  GITHUB_WORKFLOW: {_GITHUB_WORKFLOW}")
    print(f"\n  Pressione Ctrl+C para parar.\n")

    app.run(host=args.host, port=args.port, debug=True)