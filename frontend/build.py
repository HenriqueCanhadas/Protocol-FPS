#!/usr/bin/env python3
"""
build.py — Script de build do PROTOCOL FPS Frontend

Substitui os placeholders %%VAR%% no config.js pelas variáveis de
ambiente reais (fornecidas pelo CI: Netlify, Vercel, GitHub Actions).

Uso (rodado automaticamente pelo netlify.toml):
    python build.py

Variáveis de ambiente necessárias:
    SUPABASE_URL        — URL do projeto Supabase
    SUPABASE_ANON_KEY   — Chave pública do Supabase
    GITHUB_TOKEN        — PAT do GitHub com permissão actions:write
    GITHUB_OWNER        — Usuário/org do GitHub (ex: HenriqueCanhadas)
    GITHUB_REPO         — Nome do repositório (ex: protocol-fps)
    GITHUB_WORKFLOW     — Nome do workflow (ex: coletar.yml)
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).parent

VARS = {
    '%%SUPABASE_URL%%':      os.environ.get('SUPABASE_URL',      ''),
    '%%SUPABASE_ANON_KEY%%': os.environ.get('SUPABASE_ANON_KEY', ''),
    '%%GITHUB_TOKEN%%':      os.environ.get('GITHUB_TOKEN',      ''),
    '%%GITHUB_OWNER%%':      os.environ.get('GITHUB_OWNER',      ''),
    '%%GITHUB_REPO%%':       os.environ.get('GITHUB_REPO',       ''),
    '%%GITHUB_WORKFLOW%%':   os.environ.get('GITHUB_WORKFLOW',   'coletar.yml'),
}

# Só Supabase é obrigatório para o build; GitHub é avisado mas não bloqueia
required = ['%%SUPABASE_URL%%', '%%SUPABASE_ANON_KEY%%']
missing_required = [k for k in required if not VARS[k]]
missing_optional = [k for k in VARS if k not in required and not VARS[k]]

if missing_required:
    print(f"[ERROR] Variáveis obrigatórias ausentes: {missing_required}")
    print("        Configure-as no painel do seu host (Netlify / Vercel).")
    sys.exit(1)

if missing_optional:
    print(f"[WARN]  Variáveis opcionais ausentes: {missing_optional}")
    print("        O botão COLETAR AGORA não funcionará sem GITHUB_TOKEN/OWNER/REPO/WORKFLOW.")

config_path = HERE / 'config.js'
content = config_path.read_text()

for placeholder, value in VARS.items():
    content = content.replace(placeholder, value)

config_path.write_text(content)
print(f"[OK] config.js atualizado.")
print(f"     SUPABASE_URL:    {VARS['%%SUPABASE_URL%%'][:40]}...")
print(f"     GITHUB_OWNER:    {VARS['%%GITHUB_OWNER%%'] or '(não configurado)'}")
print(f"     GITHUB_REPO:     {VARS['%%GITHUB_REPO%%']  or '(não configurado)'}")
print(f"     GITHUB_WORKFLOW: {VARS['%%GITHUB_WORKFLOW%%']}")
print(f"     GITHUB_TOKEN:    {'✓ configurado' if VARS['%%GITHUB_TOKEN%%'] else '(não configurado)'}")