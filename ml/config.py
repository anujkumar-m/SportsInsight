"""
Configuration Module for Standalone Athlete Eligibility Simulator.

Loads database configuration securely from the existing server/.env file or a path
specified by the ML_ENV_FILE environment variable. Never prints or exposes credentials.
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Dict, Tuple
from dotenv import load_dotenv


@dataclass(frozen=True)
class DatabaseConfig:
    host: str
    port: int
    name: str
    user: str
    password: str
    use_ssl: bool
    ssl_reject_unauthorized: bool
    loaded_from: Optional[str] = None

    def __repr__(self) -> str:
        """Safe string representation that never exposes database passwords."""
        masked_pwd = "********" if self.password else "(empty)"
        return (
            f"DatabaseConfig(host='{self.host}', port={self.port}, "
            f"name='{self.name}', user='{self.user}', password='{masked_pwd}', "
            f"use_ssl={self.use_ssl}, loaded_from='{self.loaded_from}')"
        )


@dataclass(frozen=True)
class ModelCoefficients:
    """Documented coefficients for the simulated multiple linear regression model."""
    intercept: float = 0.0
    attendance_coef: float = 0.20
    fitness_coef: float = 0.35
    performance_coef: float = 0.35
    weight_coef: float = 0.10

    # Fallback weights when weight suitability cannot be defensibly calculated
    fallback_attendance_coef: float = 0.25
    fallback_fitness_coef: float = 0.40
    fallback_performance_coef: float = 0.35


@dataclass(frozen=True)
class EligibilityThresholds:
    """Configurable eligibility evaluation thresholds derived from project standards."""
    min_overall_score: float = 70.0
    strongly_eligible_score: float = 85.0
    min_attendance_pct: float = 75.0
    min_fitness_score: float = 60.0
    min_performance_score: float = 50.0


# Sport-specific optimal BMI reference ranges (min_bmi, max_bmi)
# Used exclusively to calculate weight suitability when athlete height and weight exist
SPORT_BMI_RANGES: Dict[str, Tuple[float, float]] = {
    "athletics": (18.5, 22.5),
    "running": (18.5, 22.0),
    "badminton": (19.0, 23.0),
    "swimming": (20.0, 24.0),
    "football": (20.5, 24.5),
    "soccer": (20.5, 24.5),
    "basketball": (21.0, 25.0),
    "cricket": (20.0, 25.0),
    "tennis": (20.0, 24.0),
    "table tennis": (19.0, 23.5),
    "volleyball": (20.5, 24.5),
}


def find_env_file(custom_path: Optional[str] = None) -> Optional[Path]:
    """
    Locates the environment file safely without modifying any directory or file.
    Priority:
    1. Explicit custom_path argument
    2. ML_ENV_FILE environment variable
    3. ../server/.env (standard project structure when running from ml/)
    4. ./server/.env (when running from repository root)
    5. ./.env (local ml/.env override if created)
    """
    candidates = []
    if custom_path:
        candidates.append(Path(custom_path))
    env_var_path = os.environ.get("ML_ENV_FILE")
    if env_var_path:
        candidates.append(Path(env_var_path))

    # Candidate locations relative to current working directory or file
    file_dir = Path(__file__).resolve().parent
    candidates.extend([
        file_dir.parent / "server" / ".env",
        file_dir / ".env",
        Path.cwd() / "server" / ".env",
        Path.cwd() / ".env",
    ])

    for path in candidates:
        if path.is_file():
            return path.resolve()
    return None


def load_database_config(custom_env_path: Optional[str] = None) -> DatabaseConfig:
    """
    Loads database connection parameters from the detected environment file.
    Does not write, modify, or cache credentials on disk.
    """
    env_path = find_env_file(custom_env_path)
    loaded_from = str(env_path) if env_path else None

    if env_path:
        load_dotenv(dotenv_path=env_path, override=False)

    host = os.environ.get("DB_HOST", "localhost")
    port_str = os.environ.get("DB_PORT", "3306")
    try:
        port = int(port_str)
    except ValueError:
        port = 3306

    name = os.environ.get("DB_NAME", "sports_academy")
    user = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "")

    # Check SSL configuration
    db_ssl_val = os.environ.get("DB_SSL", "").strip().lower()
    is_cloud_host = (
        "tidbcloud.com" in host or
        (host not in ("localhost", "127.0.0.1", "::1") and not host.startswith("192.168."))
    )
    use_ssl = (
        db_ssl_val in ("true", "1") or
        (db_ssl_val not in ("false", "0") and is_cloud_host)
    )

    reject_unauth_val = os.environ.get("DB_SSL_REJECT_UNAUTHORIZED", "").strip().lower()
    ssl_reject_unauth = reject_unauth_val in ("true", "1")

    return DatabaseConfig(
        host=host,
        port=port,
        name=name,
        user=user,
        password=password,
        use_ssl=use_ssl,
        ssl_reject_unauthorized=ssl_reject_unauth,
        loaded_from=loaded_from,
    )
