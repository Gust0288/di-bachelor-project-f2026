from contextlib import contextmanager
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

from app.core.config import get_settings

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schema.sql"


def get_db_connection():
    settings = get_settings()
    return psycopg2.connect(settings.database_url)


@contextmanager
def get_db_cursor(dict_rows: bool = False):
    connection = get_db_connection()
    cursor_factory = RealDictCursor if dict_rows else None
    cursor = connection.cursor(cursor_factory=cursor_factory)

    try:
        yield connection, cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def init_db(schema_path: Path = SCHEMA_PATH):
    schema_sql = schema_path.read_text(encoding="utf-8")

    with get_db_cursor() as (_, cursor):
        cursor.execute(schema_sql)


def ping_database() -> bool:
    with get_db_cursor() as (_, cursor):
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        return result is not None and result[0] == 1


def seed_admin() -> None:
    from app.core.security import hash_password

    default_admins = [
        ("admin@admin.com", "Admin"),
        ("admin2@admin.com", "Admin 2"),
        ("admin3@admin.com", "Admin 3"),
    ]
    hashed = hash_password("password")

    with get_db_cursor(dict_rows=True) as (_, cursor):
        for email, full_name in default_admins:
            cursor.execute("SELECT id FROM admins WHERE email = %s", (email,))
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO admins (id, email, password_hash, full_name, is_active) "
                    "VALUES (gen_random_uuid(), %s, %s, %s, TRUE)",
                    (email, hashed, full_name),
                )


if __name__ == "__main__":
    init_db()
