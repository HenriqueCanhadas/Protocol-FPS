"""
app.py — PROTOCOL FPS · Flask Backend
Serve o React (SPA) em desenvolvimento e expõe a config via /api/config.
Em produção (Vercel), o React é servido como estático e o Flask fica como
servidor de desenvolvimento local apenas.

Uso:
    cd protocol-fps-react/
    python app.py
    python app.py --port 5000

Acesse: http://localhost:5000
"""
import os
import argparse
from pathlib import Path
from flask import Flask, send_from_directory, jsonify, send_file
from dotenv import load_dotenv

# Carrega .env da raiz do projeto (um nível acima, onde vive o .env do PROTOCOL FPS)
_ROOT = Path(__file__).resolve().parent
for candidate in [_ROOT / ".env", _ROOT.parent / ".env"]:
    if candidate.exists():
        load_dotenv(candidate)
        break

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")

# ── Configuração injetada via .env ─────────────────────────────
CONFIG = {
    "SUPABASE_URL":      os.getenv("SUPABASE_URL",      ""),
    "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY", ""),
    "GITHUB_TOKEN":      os.getenv("GITHUB_TOKEN",      ""),
    "GITHUB_OWNER":      os.getenv("GITHUB_OWNER",      ""),
    "GITHUB_REPO":       os.getenv("GITHUB_REPO",       ""),
    "GITHUB_WORKFLOW":   os.getenv("GITHUB_WORKFLOW",   "coletar.yml"),
}


# ── API ────────────────────────────────────────────────────────
@app.route("/api/config")
def api_config():
    """Expõe variáveis de ambiente seguras para o frontend React."""
    return jsonify(CONFIG)


# ── SPA catch-all ──────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    dist = Path(app.static_folder)
    target = dist / path
    if path and target.exists():
        return send_from_directory(str(dist), path)
    # Todas as rotas não encontradas → index.html (React Router)
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
    print(f"\n  SUPABASE_URL  : {'✓ OK' if CONFIG['SUPABASE_URL']      else '✗ AUSENTE'}")
    print(f"  ANON_KEY      : {'✓ OK' if CONFIG['SUPABASE_ANON_KEY']  else '✗ AUSENTE'}")
    print(f"  GITHUB_TOKEN  : {'✓ OK' if CONFIG['GITHUB_TOKEN']       else '✗ AUSENTE'}")
    print(f"  GITHUB_OWNER  : {CONFIG['GITHUB_OWNER']  or '✗ AUSENTE'}")
    print(f"  GITHUB_REPO   : {CONFIG['GITHUB_REPO']   or '✗ AUSENTE'}")
    print(f"  GITHUB_WORKFLOW: {CONFIG['GITHUB_WORKFLOW']}")
    print(f"\n  Pressione Ctrl+C para parar.\n")

    app.run(host=args.host, port=args.port, debug=True)
