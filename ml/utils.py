"""
Utility Functions for Terminal Formatting, Date Validation, and Sorting.

Provides clean tabular rendering without external bloated dependencies.
"""

import sys
from pathlib import Path
from datetime import datetime, date
from typing import List, Optional, Any

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .eligibility import AthleteEligibilityDecision
except ImportError:
    from eligibility import AthleteEligibilityDecision


def validate_date_string(date_str: str) -> date:
    """
    Validates and parses a YYYY-MM-DD date string.
    Raises ValueError with descriptive message if format or date values are invalid.
    """
    clean_str = date_str.strip()
    if len(clean_str) != 10 or clean_str[4] != "-" or clean_str[7] != "-":
        raise ValueError(
            f"Invalid date format '{date_str}'. Expected 'YYYY-MM-DD' (e.g. 2027-06-15)."
        )
    try:
        return datetime.strptime(clean_str, "%Y-%m-%d").date()
    except ValueError as e:
        raise ValueError(f"Invalid calendar date '{date_str}': {e}")


def format_score_val(val: Optional[float], is_percent: bool = False) -> str:
    """Formats numeric values with one decimal place, or 'N/A' if missing."""
    if val is None:
        return "N/A"
    return f"{val:.1f}%" if is_percent else f"{val:.1f}"


def render_ascii_table(headers: List[str], rows: List[List[str]]) -> str:
    """
    Generates a properly formatted ASCII table with border lines and column alignment.
    """
    if not headers:
        return ""

    num_cols = len(headers)
    col_widths = [len(h) for h in headers]

    for row in rows:
        for idx in range(min(num_cols, len(row))):
            col_widths[idx] = max(col_widths[idx], len(str(row[idx])))

    # Add 2 spaces padding per column
    col_widths = [w + 2 for w in col_widths]

    def build_separator(char_left="+", char_mid="+", char_right="+", fill="-") -> str:
        parts = [fill * w for w in col_widths]
        return char_left + char_mid.join(parts) + char_right

    def build_row(cells: List[str]) -> str:
        formatted_cells = []
        for idx, w in enumerate(col_widths):
            val = str(cells[idx]) if idx < len(cells) else ""
            formatted_cells.append(f" {val.ljust(w - 2)} ")
        return "|" + "|".join(formatted_cells) + "|"

    lines = [
        build_separator(),
        build_row(headers),
        build_separator(),
    ]

    for row in rows:
        lines.append(build_row(row))

    lines.append(build_separator())
    return "\n".join(lines)


def sort_decisions(decisions: List[AthleteEligibilityDecision]) -> List[AthleteEligibilityDecision]:
    """
    Sorts decisions:
    1. ELIGIBLE first (highest score to lowest)
    2. NOT ELIGIBLE second (highest score to lowest, then None)
    3. INSUFFICIENT DATA third
    """
    status_order = {
        "ELIGIBLE": 0,
        "NOT ELIGIBLE": 1,
        "INSUFFICIENT DATA": 2,
    }

    def sort_key(d: AthleteEligibilityDecision):
        order = status_order.get(d.status, 99)
        # Invert score for descending order; None scores sort last
        score = -(d.overall_predicted_score if d.overall_predicted_score is not None else -999.0)
        return (order, score, d.athlete_name)

    return sorted(decisions, key=sort_key)
