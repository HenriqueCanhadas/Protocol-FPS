#!/usr/bin/env python3
"""
serve.py — Servidor de desenvolvimento do PROTOCOL FPS Frontend

Lê as variáveis do arquivo ../.env (ou .env na raiz do projeto)
e injeta-as no config.js substituindo os placeholders %%VAR%%.
Sobe um servidor HTTP local na porta 8080 com hot-reload simulado.

Uso:
    cd frontend/
    python serve.py
    # ou: python serve.py --port 3000

Acesse: http://localhost:8080
"""
import http.server
import socketserver
import os
import re
import sys
import argparse
from pathlib import Path

# ── Carrega .env ──────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    env = {}
    if not env_path.exists():
        print(f"[WARN] Arquivo .env não encontrado em {env_path}")
        return env
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, val = line.partition('=')
        env[key.strip()] = val.strip().strip('"').strip("'")
    return env

# ── Busca .env subindo na árvore de diretórios ─────────────────
def find_env() -> Path:
    here = Path(__file__).parent
    for candidate in [here / '.env', here.parent / '.env']:
        if candidate.exists():
            return candidate
    return here.parent / '.env'   # fallback

ENV = load_env(find_env())

SUPABASE_URL      = ENV.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = ENV.get('SUPABASE_ANON_KEY', '')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("[WARN] SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas no .env")
    print("       Certifique-se de que o .env está na raiz do projeto.")

# ── Handler que injeta as variáveis no config.js ───────────────
class FPSHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/index.html'

        # Serve config.js com placeholders substituídos
        if self.path == '/config.js':
            self._serve_config()
            return

        super().do_GET()

    def _serve_config(self):
        config_path = Path(__file__).parent / 'config.js'
        try:
            content = config_path.read_text()
        except FileNotFoundError:
            self.send_error(404, "config.js não encontrado")
            return

        content = content.replace('%%SUPABASE_URL%%',      SUPABASE_URL)
        content = content.replace('%%SUPABASE_ANON_KEY%%', SUPABASE_ANON_KEY)

        data = content.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        # Suprime logs para recursos estáticos comuns
        if any(ext in args[0] for ext in ['.css', '.js', '.ico', '.png']):
            return
        super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser(description='PROTOCOL FPS Dev Server')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()

    os.chdir(Path(__file__).parent)

    print(f"\n  ██████╗ ██████╗  ██████╗ ████████╗ ██████╗  ██████╗ ██╗")
    print(f"  ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝ ██║")
    print(f"  ██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║██║      ██║")
    print(f"  ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║██║      ██║")
    print(f"  ██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚██████╗ ███████╗")
    print(f"  ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝\n")
    print(f"  Dev server rodando em → http://localhost:{args.port}")
    print(f"  Supabase URL: {'✓ OK' if SUPABASE_URL else '✗ AUSENTE'}")
    print(f"  Anon Key    : {'✓ OK' if SUPABASE_ANON_KEY else '✗ AUSENTE'}")
    print(f"\n  Rotas disponíveis:")
    print(f"    /                → Dashboard")
    print(f"    /novo_produto.html → Adicionar produto")
    print(f"    /usuario.html   → Conta\n")
    print(f"  Pressione Ctrl+C para parar.\n")

    with socketserver.TCPServer(('', args.port), FPSHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n  Servidor encerrado.')


if __name__ == '__main__':
    main()