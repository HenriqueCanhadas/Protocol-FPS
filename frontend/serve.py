#!/usr/bin/env python3
"""
serve.py — Servidor de desenvolvimento do PROTOCOL FPS Frontend

Lê as variáveis do arquivo ../.env e injeta-as no config.js
substituindo os placeholders %%VAR%% em tempo real.

Uso:
    cd frontend/
    python serve.py
    python serve.py --port 3000

Acesse: http://localhost:8080
"""
import http.server
import socketserver
import os
import sys
import argparse
from pathlib import Path


# ── Carrega .env ──────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    env = {}
    if not env_path.exists():
        print(f"[WARN] Arquivo .env não encontrado em {env_path}")
        return env
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, val = line.partition('=')
        env[key.strip()] = val.strip().strip('"').strip("'")
    return env


def find_env() -> Path:
    here = Path(__file__).parent
    for candidate in [here / '.env', here.parent / '.env']:
        if candidate.exists():
            return candidate
    return here.parent / '.env'


ENV = load_env(find_env())

SUPABASE_URL      = ENV.get('SUPABASE_URL',      '')
SUPABASE_ANON_KEY = ENV.get('SUPABASE_ANON_KEY', '')
GITHUB_TOKEN      = ENV.get('GITHUB_TOKEN',      '')
GITHUB_OWNER      = ENV.get('GITHUB_OWNER',      '')
GITHUB_REPO       = ENV.get('GITHUB_REPO',       '')
GITHUB_WORKFLOW   = ENV.get('GITHUB_WORKFLOW',   'coletar.yml')

_SILENT_EXTS  = ('.css', '.js', '.ico', '.png', '.woff', '.woff2', '.svg')
_SILENT_PATHS = ('/favicon.ico',)


# ── Handler ───────────────────────────────────────────────────
class FPSHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/index.html'

        if self.path == '/config.js':
            self._serve_config()
            return

        if self.path == '/favicon.ico':
            ico = Path(__file__).parent / 'favicon.ico'
            if ico.exists():
                self._serve_file(ico, 'image/x-icon')
            else:
                self.send_response(204)
                self.end_headers()
            return

        super().do_GET()

    def _serve_file(self, path: Path, content_type: str):
        data = path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type',   content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control',  'public, max-age=3600')
        self.end_headers()
        self.wfile.write(data)

    def _serve_config(self):
        config_path = Path(__file__).parent / 'config.js'
        try:
            content = config_path.read_text(encoding='utf-8')
        except FileNotFoundError:
            self.send_error(404, "config.js não encontrado")
            return

        # Substitui todos os placeholders
        replacements = {
            '%%SUPABASE_URL%%':      SUPABASE_URL,
            '%%SUPABASE_ANON_KEY%%': SUPABASE_ANON_KEY,
            '%%GITHUB_TOKEN%%':      GITHUB_TOKEN,
            '%%GITHUB_OWNER%%':      GITHUB_OWNER,
            '%%GITHUB_REPO%%':       GITHUB_REPO,
            '%%GITHUB_WORKFLOW%%':   GITHUB_WORKFLOW,
        }
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)

        data = content.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type',   'application/javascript; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control',  'no-cache')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        first = str(args[0]) if args else ''
        if any(ext in first for ext in _SILENT_EXTS):
            return
        if any(p in first for p in _SILENT_PATHS):
            return
        super().log_message(fmt, *args)

    def log_error(self, fmt, *args):
        first = str(args[0]) if args else ''
        msg   = str(args[1]) if len(args) > 1 else ''
        if ('404' in first or '304' in first) and 'favicon' in msg.lower():
            return
        super().log_error(fmt, *args)


# ── Ponto de entrada ──────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='PROTOCOL FPS Dev Server')
    parser.add_argument('--port', type=int, default=8080)
    parsed = parser.parse_args()

    os.chdir(Path(__file__).parent)

    favicon_ok = (Path(__file__).parent / 'favicon.ico').exists()

    print(f"\n  ██████╗ ██████╗  ██████╗ ████████╗ ██████╗  ██████╗ ██╗")
    print(f"  ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝ ██║")
    print(f"  ██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║██║      ██║")
    print(f"  ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║██║      ██║")
    print(f"  ██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚██████╗ ███████╗")
    print(f"  ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝\n")
    print(f"  Dev server     → http://localhost:{parsed.port}")
    print(f"  Python          {sys.version.split()[0]}")
    print(f"  Supabase URL  : {'✓ OK'       if SUPABASE_URL      else '✗ AUSENTE'}")
    print(f"  Anon Key      : {'✓ OK'       if SUPABASE_ANON_KEY else '✗ AUSENTE'}")
    print(f"  favicon.ico   : {'✓ presente' if favicon_ok        else '✗ ausente (204 silencioso)'}")
    print(f"\n  GitHub Actions (COLETAR AGORA):")
    print(f"    GITHUB_TOKEN    : {'✓ OK' if GITHUB_TOKEN else '✗ AUSENTE — adicione ao .env'}")
    print(f"    GITHUB_OWNER    : {GITHUB_OWNER  or '✗ AUSENTE — adicione ao .env'}")
    print(f"    GITHUB_REPO     : {GITHUB_REPO   or '✗ AUSENTE — adicione ao .env'}")
    print(f"    GITHUB_WORKFLOW : {GITHUB_WORKFLOW}")
    print(f"\n  Rotas:")
    print(f"    /                  → Dashboard")
    print(f"    /novo_produto.html → Adicionar produto")
    print(f"    /usuario.html      → Conta")
    print(f"\n  Pressione Ctrl+C para parar.\n")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', parsed.port), FPSHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n  Servidor encerrado.')


if __name__ == '__main__':
    main()