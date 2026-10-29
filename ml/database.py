"""
Database Connection & Read-Only Query Layer.

Handles secure connection to the existing MySQL / TiDB Cloud database, supports SSL/TLS,
enforces strictly read-only operations, and ensures credentials are never leaked.
"""

import ssl
import sys
from contextlib import contextmanager
from typing import Generator, Any, Optional
import pymysql
from pymysql.cursors import DictCursor

try:
    import certifi
    CERTIFI_CA_BUNDLE = certifi.where()
except ImportError:
    CERTIFI_CA_BUNDLE = None

from pathlib import Path

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .config import DatabaseConfig
except ImportError:
    from config import DatabaseConfig


class ReadOnlyViolationError(Exception):
    """Raised if an operation attempts to mutate the database."""
    pass


def validate_read_only_query(query: str) -> None:
    """Verifies that an SQL query is strictly read-only."""
    cleaned = query.strip().upper()
    forbidden_verbs = (
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
        "CREATE", "TRUNCATE", "REPLACE", "GRANT", "REVOKE"
    )
    for verb in forbidden_verbs:
        # Check if verb appears at the beginning of any statement
        if cleaned.startswith(verb) or f" {verb} " in cleaned:
            raise ReadOnlyViolationError(
                f"Security check failed: Mutation operation '{verb}' is strictly prohibited."
            )


def build_ssl_context(config: DatabaseConfig) -> Optional[ssl.SSLContext]:
    """Builds a secure SSL context compatible with TiDB Cloud and standard MySQL."""
    if not config.use_ssl:
        return None

    cafile = CERTIFI_CA_BUNDLE
    try:
        if cafile:
            ctx = ssl.create_default_context(cafile=cafile)
        else:
            ctx = ssl.create_default_context()
    except Exception:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

    if not config.ssl_reject_unauthorized:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    else:
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED

    return ctx


@contextmanager
def get_db_connection(config: DatabaseConfig) -> Generator[pymysql.Connection, None, None]:
    """
    Context manager that yields an active PyMySQL connection.
    Enforces autocommit and handles safe resource cleanup.
    """
    ssl_ctx = build_ssl_context(config)

    connect_kwargs = {
        "host": config.host,
        "port": config.port,
        "user": config.user,
        "password": config.password,
        "database": config.name,
        "cursorclass": DictCursor,
        "autocommit": True,
        "charset": "utf8mb4",
        "connect_timeout": 8,
        "read_timeout": 15,
        "write_timeout": 15,
    }

    if ssl_ctx is not None:
        connect_kwargs["ssl"] = ssl_ctx

    connection = None
    try:
        connection = pymysql.connect(**connect_kwargs)
        yield connection
    except pymysql.err.OperationalError as e:
        error_code = e.args[0] if e.args else None
        if error_code == 1045:
            sys.stderr.write(
                "\n[ERROR] Database authentication failed: Access denied for configured user.\n"
                "Please verify that the DB_USER and DB_PASSWORD variables in your environment file are valid.\n"
            )
        elif error_code in (2003, 2002):
            sys.stderr.write(
                f"\n[ERROR] Unable to reach MySQL server at {config.host}:{config.port}.\n"
                "Possible reasons:\n"
                "  1. The server or TiDB Cloud cluster is currently paused or stopped.\n"
                "  2. An IP allowlist is preventing connection from your network.\n"
                "  3. Local MySQL is not running or the firewall is blocking port 3306/4000.\n"
            )
        elif error_code == 1049:
            sys.stderr.write(
                f"\n[ERROR] Database '{config.name}' was not found on the MySQL server.\n"
                "Please verify the DB_NAME setting in your environment file.\n"
            )
        else:
            sys.stderr.write(f"\n[ERROR] MySQL operational error (Code {error_code}).\n")
        raise
    except Exception as e:
        sys.stderr.write(f"\n[ERROR] Unexpected database error: {type(e).__name__}\n")
        raise
    finally:
        if connection is not None and connection.open:
            try:
                connection.close()
            except Exception:
                pass


def execute_read_query(connection: pymysql.Connection, query: str, params: Optional[tuple] = None) -> list:
    """Executes a parameterized read-only query and returns a list of dictionary rows."""
    validate_read_only_query(query)
    with connection.cursor() as cursor:
        cursor.execute(query, params or ())
        return cursor.fetchall()
