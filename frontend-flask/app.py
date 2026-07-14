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
# Branch alvo do workflow_dispatch. Em dev, aponte para a branch de trabalho
# (ex.: Duplicate-Main) para testar inputs novos ANTES do merge na main —
# o GitHub responde 422 se o workflow da branch alvo não conhecer os inputs.
_GITHUB_BRANCH   = os.getenv("GITHUB_BRANCH",   "main")


def _supabase_get(path):
    """GET server-side via PostgREST com a SERVICE_KEY (ignora RLS)."""
    req = urllib.request.Request(
        f"{_SUPABASE_URL}/rest/v1/{path}",
        headers={
            "apikey":        _SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode() or "[]")


def _usuario_do_token(access_token):
    """
    Valida o access_token do Supabase e retorna (user_id, is_admin).
    Levanta PermissionError se o token for inválido/expirado.
    Pré-migração (tabela usuarios inexistente) → modo legado: todo
    autenticado é tratado como admin (modelo compartilhado antigo).
    """
    req = urllib.request.Request(
        f"{_SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey":        _SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {access_token}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            uid = json.loads(resp.read().decode()).get("id")
    except urllib.error.HTTPError:
        raise PermissionError("Sessão inválida ou expirada — faça login novamente.")
    if not uid:
        raise PermissionError("Sessão inválida ou expirada — faça login novamente.")

    try:
        perfil = _supabase_get(f"usuarios?id=eq.{uid}&select=nivel")
        nivel = perfil[0]["nivel"] if perfil else 1
        return uid, nivel >= 2
    except urllib.error.HTTPError:
        # Tabela usuarios ainda não existe (migração multiusuário pendente)
        return uid, True


def _autorizar_remocao(uid, is_admin, tipo, ids):
    """
    Garante que todos os ids pertencem ao usuário (admin remove qualquer um).
    Levanta PermissionError se algum item for de outro dono.
    Pré-migração (itens sem user_id) → permite (modelo compartilhado antigo).
    """
    if is_admin:
        return
    valores = ",".join('"' + str(i).replace('"', "") + '"' for i in ids)
    try:
        if tipo == "historico":
            linhas = _supabase_get(
                f"historico_precos?id=in.({valores})&select=id,itens(user_id)")
            donos = {(l.get("itens") or {}).get("user_id") for l in linhas}
        else:
            linhas = _supabase_get(f"itens?id=in.({valores})&select=id,user_id")
            donos = {l.get("user_id") for l in linhas}
    except urllib.error.HTTPError:
        return  # coluna user_id ainda não existe (migração pendente)
    if donos - {uid}:
        raise PermissionError(
            "Permissão negada: só é possível remover itens do próprio usuário.")


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

    # Escopo opcional no corpo (mesma semântica do main.py):
    #   item_id                    → coleta pontual (só aquele produto; tem precedência)
    #   item_ids                   → coleta em LISTA (Sprint 14): os itens visíveis
    #                                na lista filtrada do Dashboard — lista JSON ou
    #                                string com IDs separados por vírgula
    #   categoria / loja / user_id → coleta segmentada (combináveis: ex. GPUs
    #                                da Kabum, ou só os itens do usuário logado)
    #   nada                       → coleta completa (todos os monitorados)
    payload   = request.get_json(silent=True) or {}
    item_id   = payload.get("item_id")
    item_ids  = payload.get("item_ids")
    categoria = payload.get("categoria")
    loja      = payload.get("loja")
    user_id   = payload.get("user_id")
    if isinstance(item_ids, (list, tuple)):
        item_ids = ",".join(str(i).strip() for i in item_ids if str(i).strip())
    dispatch  = {"ref": _GITHUB_BRANCH}
    inputs = {}
    if item_id:
        inputs["item_id"] = str(item_id)
    elif item_ids:
        inputs["item_ids"] = str(item_ids)
    else:
        if categoria: inputs["categoria"] = str(categoria)
        if loja:      inputs["loja"]      = str(loja)
        if user_id:   inputs["user_id"]   = str(user_id)
    if inputs:
        dispatch["inputs"] = inputs
    body = json.dumps(dispatch).encode()

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
            detail = (
                f'Dispatch rejeitado (422): branch "{_GITHUB_BRANCH}" inexistente '
                f'OU o workflow dessa branch não define os inputs enviados. '
                f'Ajuste GITHUB_BRANCH no .env (ex.: Duplicate-Main para testar antes do merge).'
            )
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

    # ── Autorização: dono do item ou admin (usuarios.nivel >= 2) ──
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else ""
    if not token:
        return jsonify({"error": "Não autenticado — faça login para remover."}), 401
    try:
        uid, is_admin = _usuario_do_token(token)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 401
    try:
        _autorizar_remocao(uid, is_admin, tipo, ids)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403

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


@app.route("/api/usuarios", methods=["POST"])
def api_usuarios():
    """
    Gestão de usuários — SOMENTE ADMIN (usuarios.nivel >= 2).
    Usa a admin API do Supabase (SERVICE_KEY, só no servidor).

    Body JSON:
      { "acao": "criar",        "email": ..., "senha": ..., "nivel": 1|2 }
      { "acao": "trocar_senha", "user_id": ..., "senha": ... }
      { "acao": "listar" }
      { "acao": "telegram",     "user_id": ..., "ativo": true|false }
      { "acao": "excluir",      "user_id": ... }
    """
    if not _SUPABASE_URL or not _SUPABASE_SERVICE_KEY:
        return jsonify({"error": "SUPABASE_URL / SUPABASE_SERVICE_KEY não configuradas no .env"}), 500

    # ── Autorização: exige sessão de ADMIN (sem modo legado aqui) ──
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else ""
    if not token:
        return jsonify({"error": "Não autenticado — faça login para gerenciar usuários."}), 401
    try:
        uid, is_admin = _usuario_do_token(token)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 401
    if not is_admin:
        return jsonify({"error": "Permissão negada: apenas administradores gerenciam usuários."}), 403

    payload = request.get_json(silent=True) or {}
    acao  = payload.get("acao")
    senha = payload.get("senha") or ""

    if acao not in ("criar", "trocar_senha", "listar", "telegram", "excluir"):
        return jsonify({"error": "acao inválida (use 'criar', 'trocar_senha', 'listar', 'telegram' ou 'excluir')"}), 400
    if acao in ("criar", "trocar_senha") and len(senha) < 8:
        return jsonify({"error": "A senha deve ter pelo menos 8 caracteres."}), 400

    def _admin_api(path, data=None, method="POST"):
        req = urllib.request.Request(
            f"{_SUPABASE_URL}/auth/v1{path}",
            data=json.dumps(data).encode() if data is not None else None,
            headers={
                "apikey":        _SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
                "Content-Type":  "application/json",
            },
            method=method,
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode() or "{}")

    def _supabase_patch(path, data):
        req = urllib.request.Request(
            f"{_SUPABASE_URL}/rest/v1/{path}",
            data=json.dumps(data).encode(),
            headers={
                "apikey":        _SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
                "Content-Type":  "application/json",
            },
            method="PATCH",
        )
        urllib.request.urlopen(req, timeout=15).close()

    try:
        if acao == "listar":
            # Perfis (usuarios) — com fallback caso a migração sprint9
            # (coluna notificar_telegram) ainda não tenha rodado no banco.
            telegram_ok = True
            try:
                perfis = _supabase_get(
                    "usuarios?select=id,email,nome,nivel,notificar_telegram&order=email.asc")
            except urllib.error.HTTPError:
                telegram_ok = False
                perfis = _supabase_get("usuarios?select=id,email,nome,nivel&order=email.asc")

            # Contagem de itens por dono — paginada (teto de 1000 do PostgREST)
            contagem, de = {}, 0
            while True:
                pagina = _supabase_get(f"itens?select=user_id&limit=1000&offset={de}")
                for linha in pagina:
                    dono = linha.get("user_id")
                    contagem[dono] = contagem.get(dono, 0) + 1
                if len(pagina) < 1000:
                    break
                de += 1000

            # auth.users (último acesso, confirmação) — admin API paginada
            auth_map, page = {}, 1
            while True:
                resp = _admin_api(f"/admin/users?page={page}&per_page=100", method="GET")
                users = resp.get("users") or []
                for u in users:
                    auth_map[u.get("id")] = u
                if len(users) < 100:
                    break
                page += 1

            usuarios = []
            for p in perfis:
                au = auth_map.get(p["id"], {})
                usuarios.append({
                    "id":                 p["id"],
                    "email":              p.get("email"),
                    "nome":               p.get("nome"),
                    "nivel":              p.get("nivel", 1),
                    "notificar_telegram": p.get("notificar_telegram") if telegram_ok else None,
                    "itens":              contagem.get(p["id"], 0),
                    "criado_em":          au.get("created_at"),
                    "ultimo_acesso":      au.get("last_sign_in_at"),
                    "confirmado":         bool(au.get("email_confirmed_at")),
                })
            return jsonify({"ok": True, "usuarios": usuarios,
                            "telegram_disponivel": telegram_ok}), 200

        if acao == "telegram":
            user_id = str(payload.get("user_id") or "").strip()
            if not user_id:
                return jsonify({"error": "user_id não informado."}), 400
            ativo = bool(payload.get("ativo"))
            try:
                _supabase_patch(f"usuarios?id=eq.{user_id}", {"notificar_telegram": ativo})
            except urllib.error.HTTPError as exc:
                if exc.code == 400:
                    return jsonify({"error": "Coluna notificar_telegram ausente — rode a "
                                             "migração sprint9_alertas_por_usuario.sql no "
                                             "SQL Editor do Supabase."}), 400
                raise
            return jsonify({"ok": True, "notificar_telegram": ativo}), 200

        if acao == "excluir":
            user_id = str(payload.get("user_id") or "").strip()
            if not user_id:
                return jsonify({"error": "user_id não informado."}), 400
            if user_id == uid:
                return jsonify({"error": "Não é possível excluir a própria conta."}), 400
            alvo = _supabase_get(f"usuarios?id=eq.{user_id}&select=id,email")
            if not alvo:
                return jsonify({"error": "Usuário não encontrado."}), 404

            # Cascata manual (não há ON DELETE CASCADE em itens/histórico/alertas):
            # alertas → historico_precos → itens → conta auth (esta cascateia p/ usuarios)
            item_ids, de = [], 0
            while True:
                pagina = _supabase_get(
                    f"itens?user_id=eq.{user_id}&select=id&limit=1000&offset={de}")
                item_ids += [linha["id"] for linha in pagina]
                if len(pagina) < 1000:
                    break
                de += 1000

            removidos = {"itens": 0, "leituras": 0, "alertas": 0}
            if item_ids:
                removidos["alertas"]  = _supabase_delete("alertas", "item_id", item_ids)
                removidos["leituras"] = _supabase_delete("historico_precos", "item_id", item_ids)
                removidos["itens"]    = _supabase_delete("itens", "id", item_ids)
            _admin_api(f"/admin/users/{user_id}", method="DELETE")

            return jsonify({"ok": True, "email": alvo[0].get("email"),
                            "removed": removidos}), 200

        if acao == "criar":
            email = (payload.get("email") or "").strip().lower()
            nivel = int(payload.get("nivel") or 1)
            if "@" not in email or "." not in email:
                return jsonify({"error": "Email inválido."}), 400
            if nivel not in (1, 2):
                return jsonify({"error": "nivel inválido (1=normal, 2=admin)."}), 400

            novo = _admin_api("/admin/users", {
                "email": email, "password": senha, "email_confirm": True,
            })
            uid = novo.get("id")
            if not uid:
                return jsonify({"error": "Supabase não retornou o id do usuário."}), 502

            # O trigger cria o perfil com nivel 1; promove se for admin
            if nivel == 2:
                req = urllib.request.Request(
                    f"{_SUPABASE_URL}/rest/v1/usuarios?id=eq.{uid}",
                    data=json.dumps({"nivel": 2}).encode(),
                    headers={
                        "apikey":        _SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
                        "Content-Type":  "application/json",
                    },
                    method="PATCH",
                )
                urllib.request.urlopen(req, timeout=15).close()

            return jsonify({"ok": True, "user_id": uid, "nivel": nivel}), 200

        # trocar_senha
        user_id = (payload.get("user_id") or "").strip()
        if not user_id:
            return jsonify({"error": "user_id não informado."}), 400
        _admin_api(f"/admin/users/{user_id}", {"password": senha}, method="PUT")
        return jsonify({"ok": True}), 200

    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        if exc.code == 422 and acao == "criar":
            detail = "Já existe um usuário com esse email (422)."
        return jsonify({"error": detail}), exc.code
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── API: rota inexistente ──────────────────────────────────────
# Paridade com o Vercel (o rewrite de produção exclui /api/ via "/((?!api/).*)").
# Precisa ser rota própria: com static_url_path="" o Flask registra
# "/<path:filename>" (static), que capturaria "/api/..." antes do serve_spa e
# devolveria 404 HTML. Como "/api/<...>" é mais específica, ela vence e responde
# 404 JSON — o mesmo comportamento do Vercel para uma rota de API inexistente.
@app.route("/api/<path:_sub>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def api_not_found(_sub):
    return jsonify({"error": "Endpoint de API não encontrado"}), 404


# ── SPA catch-all ──────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
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


# ── Fallback SPA (deep-links) ──────────────────────────────────
# Com static_url_path="" a rota estática "/<path:filename>" captura rotas como
# "/conta" antes do serve_spa e devolveria 404. Este handler garante a paridade
# com o Vercel (rewrite "/((?!api/).*)"): rota de API inexistente → 404 JSON;
# rota "de página" (sem extensão) → serve o index.html para o React Router assumir;
# arquivo realmente ausente (ex.: /assets/x.js) → mantém 404.
@app.errorhandler(404)
def _spa_fallback(err):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint de API não encontrado"}), 404
    ultimo = request.path.rsplit("/", 1)[-1]
    index = Path(app.static_folder) / "index.html"
    if "." not in ultimo and index.exists():
        return send_file(str(index))
    return err


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
    print(f"  GITHUB_BRANCH : {_GITHUB_BRANCH}"
          + ("  (dispatch fora da main — modo teste)" if _GITHUB_BRANCH != "main" else ""))
    print(f"\n  Pressione Ctrl+C para parar.\n")

    app.run(host=args.host, port=args.port, debug=True)