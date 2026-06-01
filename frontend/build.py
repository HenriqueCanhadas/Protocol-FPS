#!/usr/bin/env python3
"""
build.py — Script de build do PROTOCOL FPS Frontend

Substitui os placeholders %%VAR%% no config.js pelas variáveis de
ambiente reais (fornecidas pelo CI: Netlify, Vercel, GitHub Actions).

Uso (rodado automaticamente pelo netlify.toml / vercel.json):
    python build.py

Para GitHub Pages, adicione ao .github/workflows/deploy-frontend.yml:
    - run: cd frontend && python build.py
    env:
      SUPABASE_URL:      ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).parent

VARS = {
    '%%SUPABASE_URL%%':      os.environ.get('SUPABASE_URL', ''),
    '%%SUPABASE_ANON_KEY%%': os.environ.get('SUPABASE_ANON_KEY', ''),
}

missing = [k for k, v in VARS.items() if not v]
if missing:
    print(f"[ERROR] Variáveis de ambiente ausentes: {missing}")
    print("        Configure-as no painel do seu host (Netlify / Vercel)")
    print("        ou como GitHub Secrets se usar GitHub Pages.")
    sys.exit(1)

config_path = HERE / 'config.js'
content = config_path.read_text()

for placeholder, value in VARS.items():
    content = content.replace(placeholder, value)

config_path.write_text(content)
print(f"[OK] config.js atualizado com sucesso.")
print(f"     SUPABASE_URL: {VARS['%%SUPABASE_URL%%'][:40]}...")