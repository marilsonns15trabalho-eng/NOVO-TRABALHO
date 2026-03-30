#!/usr/bin/env python3
import argparse
import json
import os
import re
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_DB_PATH = r"c:\LPE\data\lpe_database.db"
DEFAULT_PASSWORD = "123456"
REPORT_FILE = "legacy_lpe_import_report.json"


def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def env_value(name: str, loaded: dict[str, str]) -> str | None:
    return os.getenv(name) or loaded.get(name)


def normalize_string(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def normalize_email(value: Any) -> str | None:
    cleaned = normalize_string(value)
    return cleaned.lower() if cleaned else None


def is_valid_email(value: str | None) -> bool:
    if not value:
        return False
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value))


def normalize_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return value in (1, "1", "true", "TRUE", "True", "t", "T", "yes", "sim")


def as_date(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text[:10] if text else None


def as_timestamp(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def as_number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_objectives(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    text = str(value).strip()
    if not text:
        return []

    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    return [item.strip() for item in text.split(",") if item.strip()]


def sqlite_rows(path: str, query: str) -> list[dict[str, Any]]:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        cur.execute(query)
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


class SupabaseImporter:
    def __init__(self, base_url: str, service_role_key: str, execute: bool) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_role_key = service_role_key
        self.execute = execute
        self._auth_users_cache: dict[str, str] | None = None

    def _request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        body: Any = None,
        prefer: str | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        if query:
            url = f"{url}?{urllib.parse.urlencode(query, doseq=True)}"

        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer

        payload = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(url, data=payload, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request) as response:
                content = response.read().decode("utf-8")
                if not content:
                    return None
                return json.loads(content)
        except urllib.error.HTTPError as error:
            message = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{method} {path} failed: {error.code} {message}") from error

    def rest_upsert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        on_conflict: str,
        return_columns: str = "*",
    ) -> list[dict[str, Any]]:
        if not rows:
            return []

        if not self.execute:
            return rows

        result = self._request(
            "POST",
            f"/rest/v1/{table}",
            query={"on_conflict": on_conflict, "select": return_columns},
            body=rows,
            prefer="resolution=merge-duplicates,return=representation",
        )
        return result or []

    def load_auth_users(self) -> dict[str, str]:
        if self._auth_users_cache is not None:
            return self._auth_users_cache

        if not self.execute:
            self._auth_users_cache = {}
            return self._auth_users_cache

        page = 1
        users: dict[str, str] = {}
        while True:
            result = self._request(
                "GET",
                "/auth/v1/admin/users",
                query={"page": page, "per_page": 1000},
            ) or {}
            batch = result.get("users") or result.get("data") or []
            if not batch:
                break
            for user in batch:
                email = normalize_email(user.get("email"))
                user_id = user.get("id")
                if email and user_id:
                    users[email] = user_id
            next_page = result.get("next_page") or result.get("nextPage")
            if not next_page:
                break
            page = int(next_page)

        self._auth_users_cache = users
        return users

    def get_or_create_auth_user(self, email: str, name: str) -> str:
        users = self.load_auth_users()
        existing = users.get(email)
        if existing:
            return existing

        if not self.execute:
            return f"dry-run-auth-{email}"

        result = self._request(
            "POST",
            "/auth/v1/admin/users",
            body={
                "email": email,
                "password": DEFAULT_PASSWORD,
                "email_confirm": True,
                "user_metadata": {
                    "name": name,
                    "display_name": name,
                },
            },
        ) or {}

        user = result.get("user") or result
        user_id = user.get("id")
        if not user_id:
            raise RuntimeError(f"Nao foi possivel criar o auth user para {email}.")

        users[email] = user_id
        return user_id


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Importa apenas os alunos aproveitaveis do banco legado LPE."
    )
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help="Caminho do banco SQLite legado.")
    parser.add_argument("--execute", action="store_true", help="Executa a importacao de verdade.")
    parser.add_argument("--report", default=REPORT_FILE, help="Arquivo JSON de relatorio.")
    args = parser.parse_args()

    env_local = load_env_file(Path(".env.local"))
    supabase_url = env_value("NEXT_PUBLIC_SUPABASE_URL", env_local) or env_value("SUPABASE_URL", env_local)
    service_role_key = env_value("SUPABASE_SERVICE_ROLE_KEY", env_local)

    if not supabase_url or not service_role_key:
        print(
            "Variaveis ausentes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
            file=sys.stderr,
        )
        return 1

    if not Path(args.db).exists():
        print(f"Banco SQLite nao encontrado em: {args.db}", file=sys.stderr)
        return 1

    importer = SupabaseImporter(supabase_url, service_role_key, args.execute)
    legacy_students = sqlite_rows(args.db, "SELECT * FROM alunos ORDER BY id")

    grouped_by_email: dict[str, list[dict[str, Any]]] = {}
    invalid_or_missing: list[dict[str, Any]] = []
    for student in legacy_students:
        email = normalize_email(student.get("email"))
        if not is_valid_email(email):
            invalid_or_missing.append(
                {
                    "legacy_lpe_id": int(student["id"]),
                    "name": normalize_string(student.get("nome")) or f"Aluno {student['id']}",
                    "email": student.get("email"),
                }
            )
            continue
        grouped_by_email.setdefault(email, []).append(student)

    duplicate_groups = []
    usable_students: list[dict[str, Any]] = []
    for email, items in grouped_by_email.items():
        if len(items) > 1:
            duplicate_groups.append(
                {
                    "email": email,
                    "legacy_lpe_ids": [int(item["id"]) for item in items],
                    "names": [normalize_string(item.get("nome")) or f"Aluno {item['id']}" for item in items],
                }
            )
            continue
        usable_students.append(items[0])

    report: dict[str, Any] = {
        "mode": "execute" if args.execute else "dry-run",
        "default_password": DEFAULT_PASSWORD,
        "legacy_students_total": len(legacy_students),
        "students_selected_for_import": len(usable_students),
        "students_skipped_missing_or_invalid_email": invalid_or_missing,
        "students_skipped_duplicate_email_groups": duplicate_groups,
        "students_ready": [],
    }

    for student in usable_students:
        legacy_student_id = int(student["id"])
        name = normalize_string(student.get("nome")) or f"Aluno legado {legacy_student_id}"
        email = normalize_email(student.get("email"))
        if not email:
            continue

        auth_user_id = importer.get_or_create_auth_user(email, name)
        importer.rest_upsert(
            "user_profiles",
            [
                {
                    "id": auth_user_id,
                    "role": "aluno",
                    "display_name": name,
                    "must_change_password": True,
                    "is_super_admin": False,
                }
            ],
            on_conflict="id",
            return_columns="id",
        )

        student_payload = {
            "legacy_lpe_id": legacy_student_id,
            "linked_auth_user_id": auth_user_id,
            "name": name,
            "email": email,
            "phone": normalize_string(student.get("telefone")),
            "cellphone": normalize_string(student.get("telefone")),
            "cpf": normalize_string(student.get("cpf")),
            "birth_date": as_date(student.get("data_nascimento")),
            "gender": normalize_string(student.get("genero")),
            "profession": normalize_string(student.get("profissao")),
            "zip_code": normalize_string(student.get("cep")),
            "address": normalize_string(student.get("endereco")),
            "city": normalize_string(student.get("cidade")),
            "emergency_contact": normalize_string(student.get("contato_emergencia")),
            "emergency_phone": normalize_string(student.get("telefone_emergencia")),
            "join_date": as_date(student.get("data_cadastro")),
            "start_date": as_date(student.get("data_cadastro")),
            "status": "ativo" if normalize_bool(student.get("ativo")) else "inativo",
            "notes": normalize_string(student.get("observacoes")),
            "objectives": parse_objectives(student.get("objetivos")),
            "desired_weight": as_number(student.get("peso_desejado")),
            "group": normalize_string(student.get("grupo")),
            "modality": normalize_string(student.get("modalidade")),
            "created_at": as_timestamp(student.get("data_cadastro")),
            "updated_at": as_timestamp(student.get("data_ultima_atualizacao")),
        }

        importer.rest_upsert(
            "students",
            [student_payload],
            on_conflict="legacy_lpe_id",
            return_columns="id,legacy_lpe_id,email",
        )

        report["students_ready"].append(
            {
                "legacy_lpe_id": legacy_student_id,
                "name": name,
                "email": email,
            }
        )

    report["result_counts"] = {
        "students_imported": len(report["students_ready"]),
        "students_skipped_missing_or_invalid_email": len(invalid_or_missing),
        "duplicate_email_groups_skipped": len(duplicate_groups),
    }

    report_path = Path(args.report)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(report["result_counts"], ensure_ascii=False, indent=2))
    print(f"Relatorio salvo em {report_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
