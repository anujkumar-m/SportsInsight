"""
Data Loader Module for Athlete Eligibility Simulator.

Fetches real athlete profiles, attendance logs, fitness assessments, performance records,
and injury statuses from the database, strictly enforcing the historical cutoff date.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import List, Dict, Optional, Any
import sys
from pathlib import Path
import pymysql

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .database import execute_read_query
except ImportError:
    from database import execute_read_query


@dataclass
class AttendanceLog:
    attendance_date: date
    status: str  # 'present', 'absent', 'leave', 'half_day', 'late'


@dataclass
class FitnessRecord:
    assessment_date: date
    overall_fitness_score: float
    strength_score: Optional[float] = None
    endurance_score: Optional[float] = None
    stamina_score: Optional[float] = None
    flexibility_score: Optional[float] = None
    agility_score: Optional[float] = None
    speed_score: Optional[float] = None
    balance_score: Optional[float] = None
    bmi: Optional[float] = None


@dataclass
class PerformanceRecord:
    record_date: date
    metric_name: str
    metric_value: float
    performance_score: float
    improvement_rate: Optional[float] = None


@dataclass
class InjuryRecord:
    injury_date: date
    injury_type: str
    recovery_status: str  # 'recovered', 'recovering', 'chronic'
    availability_status: str  # 'fit', 'unfit', 'restricted'


@dataclass
class AthleteProfile:
    id: int
    athlete_code: str
    full_name: str
    sport: str
    sport_id: Optional[int]
    gender: str
    height_cm: Optional[float]
    weight_kg: Optional[float]
    medical_status: str
    attendance_history: List[AttendanceLog] = field(default_factory=list)
    fitness_history: List[FitnessRecord] = field(default_factory=list)
    performance_history: List[PerformanceRecord] = field(default_factory=list)
    injuries: List[InjuryRecord] = field(default_factory=list)


def load_athletes_data(
    connection: pymysql.Connection,
    cutoff_date: str,
    sport_filter: Optional[str] = None,
    limit: Optional[int] = None
) -> List[AthleteProfile]:
    """
    Retrieves all active athletes and joins historical data up to cutoff_date.
    Avoids Cartesian explosion by querying sub-datasets with athlete_id grouping.
    """
    # 1. Fetch base athlete profiles
    base_sql = """
        SELECT
            a.id,
            a.athlete_code,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS full_name,
            COALESCE(s.name, 'Unassigned') AS sport_name,
            a.sport_id,
            a.gender,
            a.height_cm,
            a.weight_kg,
            COALESCE(a.medical_status, 'fit') AS medical_status
        FROM athletes a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN sports s ON a.sport_id = s.id
        WHERE a.is_active = 1
    """
    params = []
    if sport_filter:
        base_sql += " AND LOWER(s.name) = LOWER(%s)"
        params.append(sport_filter.strip())

    base_sql += " ORDER BY u.first_name ASC, u.last_name ASC"

    if limit and limit > 0:
        base_sql += " LIMIT %s"
        params.append(limit)

    athlete_rows = execute_read_query(connection, base_sql, tuple(params))
    if not athlete_rows:
        return []

    athlete_ids = [row["id"] for row in athlete_rows]
    id_placeholders = ",".join(["%s"] * len(athlete_ids))

    # 2. Fetch attendance logs strictly <= cutoff_date
    att_sql = f"""
        SELECT athlete_id, attendance_date, status
        FROM attendance
        WHERE athlete_id IN ({id_placeholders})
          AND attendance_date <= %s
        ORDER BY attendance_date ASC
    """
    att_rows = execute_read_query(connection, att_sql, tuple(athlete_ids + [cutoff_date]))
    attendance_by_id: Dict[int, List[AttendanceLog]] = {aid: [] for aid in athlete_ids}
    for row in att_rows:
        attendance_by_id[row["athlete_id"]].append(
            AttendanceLog(
                attendance_date=row["attendance_date"],
                status=str(row["status"]).lower() if row["status"] else "absent",
            )
        )

    # 3. Fetch fitness assessments strictly <= cutoff_date
    fit_sql = f"""
        SELECT
            athlete_id,
            assessment_date,
            overall_fitness_score,
            strength_score,
            endurance_score,
            stamina_score,
            flexibility_score,
            agility_score,
            speed_score,
            balance_score,
            bmi
        FROM fitness_assessments
        WHERE athlete_id IN ({id_placeholders})
          AND assessment_date <= %s
        ORDER BY assessment_date ASC
    """
    fit_rows = execute_read_query(connection, fit_sql, tuple(athlete_ids + [cutoff_date]))
    fitness_by_id: Dict[int, List[FitnessRecord]] = {aid: [] for aid in athlete_ids}
    for row in fit_rows:
        fitness_by_id[row["athlete_id"]].append(
            FitnessRecord(
                assessment_date=row["assessment_date"],
                overall_fitness_score=float(row["overall_fitness_score"] or 0),
                strength_score=float(row["strength_score"]) if row["strength_score"] is not None else None,
                endurance_score=float(row["endurance_score"]) if row["endurance_score"] is not None else None,
                stamina_score=float(row["stamina_score"]) if row["stamina_score"] is not None else None,
                flexibility_score=float(row["flexibility_score"]) if row["flexibility_score"] is not None else None,
                agility_score=float(row["agility_score"]) if row["agility_score"] is not None else None,
                speed_score=float(row["speed_score"]) if row["speed_score"] is not None else None,
                balance_score=float(row["balance_score"]) if row["balance_score"] is not None else None,
                bmi=float(row["bmi"]) if row["bmi"] is not None else None,
            )
        )

    # 4. Fetch performance records strictly <= cutoff_date
    perf_sql = f"""
        SELECT
            athlete_id,
            record_date,
            metric_name,
            metric_value,
            performance_score,
            improvement_rate
        FROM performance_records
        WHERE athlete_id IN ({id_placeholders})
          AND record_date <= %s
        ORDER BY record_date ASC
    """
    perf_rows = execute_read_query(connection, perf_sql, tuple(athlete_ids + [cutoff_date]))
    performance_by_id: Dict[int, List[PerformanceRecord]] = {aid: [] for aid in athlete_ids}
    for row in perf_rows:
        performance_by_id[row["athlete_id"]].append(
            PerformanceRecord(
                record_date=row["record_date"],
                metric_name=str(row["metric_name"]),
                metric_value=float(row["metric_value"] or 0),
                performance_score=float(row["performance_score"] or 0),
                improvement_rate=float(row["improvement_rate"]) if row["improvement_rate"] is not None else None,
            )
        )

    # 5. Fetch injuries up to cutoff_date
    inj_sql = f"""
        SELECT
            athlete_id,
            injury_date,
            injury_type,
            recovery_status,
            availability_status
        FROM injuries
        WHERE athlete_id IN ({id_placeholders})
          AND injury_date <= %s
        ORDER BY injury_date DESC
    """
    inj_rows = execute_read_query(connection, inj_sql, tuple(athlete_ids + [cutoff_date]))
    injuries_by_id: Dict[int, List[InjuryRecord]] = {aid: [] for aid in athlete_ids}
    for row in inj_rows:
        injuries_by_id[row["athlete_id"]].append(
            InjuryRecord(
                injury_date=row["injury_date"],
                injury_type=str(row["injury_type"] or "General"),
                recovery_status=str(row["recovery_status"] or "recovered").lower(),
                availability_status=str(row["availability_status"] or "fit").lower(),
            )
        )

    # Construct final domain objects
    athletes = []
    for row in athlete_rows:
        aid = row["id"]
        athletes.append(
            AthleteProfile(
                id=aid,
                athlete_code=row["athlete_code"] or f"ATH-{aid}",
                full_name=row["full_name"].strip() or f"Athlete {aid}",
                sport=row["sport_name"],
                sport_id=row["sport_id"],
                gender=row["gender"] or "unspecified",
                height_cm=float(row["height_cm"]) if row["height_cm"] else None,
                weight_kg=float(row["weight_kg"]) if row["weight_kg"] else None,
                medical_status=row["medical_status"],
                attendance_history=attendance_by_id.get(aid, []),
                fitness_history=fitness_by_id.get(aid, []),
                performance_history=performance_by_id.get(aid, []),
                injuries=injuries_by_id.get(aid, []),
            )
        )

    return athletes
