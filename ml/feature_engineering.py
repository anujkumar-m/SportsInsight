"""
Feature Engineering Module for Athlete Eligibility Simulator.

Extracts normalized statistical features from historical observations, computes trend
extrapolations up to the requested prediction date, evaluates weight suitability,
and calculates data reliability indicators.
"""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional, Tuple, List
import numpy as np

import sys
from pathlib import Path

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .data_loader import AthleteProfile
    from .config import SPORT_BMI_RANGES
except ImportError:
    from data_loader import AthleteProfile
    from config import SPORT_BMI_RANGES


@dataclass
class EngineeredFeatures:
    athlete_id: int
    athlete_name: str
    sport: str
    # Features (None indicates missing data / insufficient history)
    attendance_pct: Optional[float]
    attendance_data_points: int
    fitness_score: Optional[float]
    fitness_data_points: int
    performance_score: Optional[float]
    performance_data_points: int
    weight_suitability_score: Optional[float]
    weight_note: str
    # Metadata
    days_since_last_fitness: Optional[int]
    days_since_last_performance: Optional[int]
    confidence_level: str  # 'HIGH', 'MEDIUM', 'LOW'
    confidence_score: float  # 0.0 - 100.0
    is_actively_injured: bool
    injury_reason: Optional[str]
    is_predicted_attendance: bool
    is_predicted_fitness: bool
    is_predicted_performance: bool


def parse_date(date_val) -> date:
    """Normalizes date input from string or date object."""
    if isinstance(date_val, date) and not isinstance(date_val, datetime):
        return date_val
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, str):
        return datetime.strptime(date_val[:10], "%Y-%m-%d").date()
    raise ValueError(f"Cannot parse date: {date_val}")


def calculate_weight_suitability(
    height_cm: Optional[float],
    weight_kg: Optional[float],
    sport_name: str
) -> Tuple[Optional[float], str]:
    """
    Computes a weight suitability score based on sport-specific BMI criteria.
    Returns (score, reason). If data is absent or sport has no valid criterion, returns (None, reason).
    """
    if not height_cm or not weight_kg or height_cm <= 0 or weight_kg <= 0:
        return None, "Height and/or weight measurements not recorded in athlete profile."

    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 2)

    # Lookup sport range
    sport_key = sport_name.lower().strip()
    target_range = SPORT_BMI_RANGES.get(sport_key)

    if not target_range:
        # Check partial match
        for key, rng in SPORT_BMI_RANGES.items():
            if key in sport_key or sport_key in key:
                target_range = rng
                break

    if not target_range:
        # Default athletic range
        target_range = (19.0, 24.5)

    min_bmi, max_bmi = target_range
    mid_bmi = (min_bmi + max_bmi) / 2.0

    if min_bmi <= bmi <= max_bmi:
        # Optimal zone
        deviation_from_center = abs(bmi - mid_bmi)
        max_deviation = (max_bmi - min_bmi) / 2.0
        suitability = 100.0 - (deviation_from_center / (max_deviation or 1.0)) * 10.0
        return round(suitability, 1), f"BMI {bmi} is within optimal range ({min_bmi}-{max_bmi}) for {sport_name}."

    if bmi < min_bmi:
        diff = min_bmi - bmi
        suitability = max(20.0, 90.0 - (diff * 12.0))
        return round(suitability, 1), f"BMI {bmi} is below optimal minimum ({min_bmi}) for {sport_name}."
    else:
        diff = bmi - max_bmi
        suitability = max(20.0, 90.0 - (diff * 10.0))
        return round(suitability, 1), f"BMI {bmi} exceeds optimal maximum ({max_bmi}) for {sport_name}."


def estimate_future_metric(
    dates: List[date],
    values: List[float],
    target_date: date,
    min_val: float = 0.0,
    max_val: float = 100.0
) -> Tuple[float, bool]:
    """
    Forecasts a metric value for target_date using historical observations.
    - If target_date is in the past/present of observations, returns recency-weighted average.
    - If target_date is in the future and >= 3 points exist, uses damped linear regression trend.
    - Returns (estimated_value, is_predicted).
    """
    n = len(values)
    if n == 0:
        raise ValueError("No historical observations available.")

    latest_date = max(dates)
    is_future = target_date > latest_date

    if n == 1:
        return float(values[0]), is_future

    if n == 2 or not is_future:
        # Recency-weighted average (more recent = higher weight)
        weights = np.linspace(1.0, 2.0, n)
        weights /= weights.sum()
        weighted_avg = float(np.sum(np.array(values) * weights))
        return float(np.clip(weighted_avg, min_val, max_val)), is_future

    # If 3 or more observations and predicting future date:
    # Compute linear trend over days
    t0 = min(dates)
    x_days = np.array([(d - t0).days for d in dates], dtype=float)
    y_vals = np.array(values, dtype=float)

    # Linear regression slope: y = m * x + c
    x_mean = np.mean(x_days)
    y_mean = np.mean(y_vals)
    denominator = np.sum((x_days - x_mean) ** 2)

    if denominator == 0:
        slope = 0.0
    else:
        slope = np.sum((x_days - x_mean) * (y_vals - y_mean)) / denominator

    # Project to target date with dampening to prevent unrealistic unbounded extrapolation
    target_days = (target_date - t0).days
    future_span_days = max(0, (target_date - latest_date).days)

    # Dampening factor shrinks slope over long time horizons (halves effect per 180 days)
    dampening = 1.0 / (1.0 + (future_span_days / 180.0))
    latest_val = values[-1]
    raw_delta = slope * (target_days - x_days[-1])
    damped_delta = np.clip(raw_delta * dampening, -18.0, 18.0)

    predicted_val = latest_val + damped_delta
    return float(np.clip(predicted_val, min_val, max_val)), True


def extract_features_for_athlete(
    athlete: AthleteProfile,
    target_date: date
) -> EngineeredFeatures:
    """
    Processes all historical observations for an athlete up to target_date and produces
    the normalized engineered feature vector.
    """
    # 1. Attendance processing
    att_logs = [log for log in athlete.attendance_history if parse_date(log.attendance_date) <= target_date]
    attendance_pct = None
    is_pred_att = False
    if att_logs:
        # Weight statuses: present=1.0, late=0.75, half_day=0.5, leave=0.2, absent=0.0
        status_weights = {
            "present": 1.0,
            "late": 0.75,
            "half_day": 0.5,
            "leave": 0.2,
            "absent": 0.0,
        }
        total_sessions = len(att_logs)
        weighted_score = sum(status_weights.get(l.status, 0.0) for l in att_logs)
        raw_pct = (weighted_score / total_sessions) * 100.0

        if target_date > max(parse_date(l.attendance_date) for l in att_logs) and total_sessions >= 10:
            # Trajectory analysis: compare recent 30 days vs earlier
            recent_cutoff = (max(parse_date(l.attendance_date) for l in att_logs))
            recent_logs = [l for l in att_logs if (recent_cutoff - parse_date(l.attendance_date)).days <= 30]
            if len(recent_logs) >= 5:
                recent_pct = (sum(status_weights.get(l.status, 0.0) for l in recent_logs) / len(recent_logs)) * 100.0
                attendance_pct = round(np.clip(raw_pct * 0.7 + recent_pct * 0.3, 0.0, 100.0), 1)
                is_pred_att = True
            else:
                attendance_pct = round(raw_pct, 1)
        else:
            attendance_pct = round(raw_pct, 1)

    # 2. Fitness processing
    fit_records = [
        f for f in athlete.fitness_history
        if parse_date(f.assessment_date) <= target_date
    ]
    fitness_score = None
    days_since_fit = None
    is_pred_fit = False
    if fit_records:
        fit_records.sort(key=lambda r: parse_date(r.assessment_date))
        dates = [parse_date(r.assessment_date) for r in fit_records]
        scores = [r.overall_fitness_score for r in fit_records]
        val, is_pred_fit = estimate_future_metric(dates, scores, target_date, min_val=0.0, max_val=100.0)
        fitness_score = round(val, 1)
        days_since_fit = (target_date - dates[-1]).days

    # 3. Performance processing
    perf_records = [
        p for p in athlete.performance_history
        if parse_date(p.record_date) <= target_date
    ]
    performance_score = None
    days_since_perf = None
    is_pred_perf = False
    if perf_records:
        perf_records.sort(key=lambda r: parse_date(r.record_date))
        dates = [parse_date(r.record_date) for r in perf_records]
        scores = [r.performance_score for r in perf_records]
        val, is_pred_perf = estimate_future_metric(dates, scores, target_date, min_val=10.0, max_val=100.0)
        performance_score = round(val, 1)
        days_since_perf = (target_date - dates[-1]).days

    # 4. Weight suitability processing
    wt_score, wt_note = calculate_weight_suitability(
        athlete.height_cm,
        athlete.weight_kg,
        athlete.sport
    )

    # 5. Active injury check
    active_injuries = [
        inj for inj in athlete.injuries
        if parse_date(inj.injury_date) <= target_date
        and inj.recovery_status in ("recovering", "chronic")
        and inj.availability_status in ("unfit", "restricted")
    ]
    is_actively_injured = bool(active_injuries) or athlete.medical_status.lower() in ("injured", "unfit")
    injury_reason = None
    if is_actively_injured:
        if active_injuries:
            injury_reason = f"Active injury: {active_injuries[0].injury_type} ({active_injuries[0].recovery_status})"
        else:
            injury_reason = f"Medical status flagged as {athlete.medical_status}"

    # 6. Confidence scoring based on data availability & freshness
    conf_points = 0.0
    if attendance_pct is not None:
        conf_points += min(30.0, len(att_logs) * 2.0)
    if fitness_score is not None:
        recency_penalty = min(15.0, (days_since_fit or 0) / 30.0) if days_since_fit else 0.0
        conf_points += max(5.0, min(35.0, len(fit_records) * 15.0) - recency_penalty)
    if performance_score is not None:
        recency_penalty = min(15.0, (days_since_perf or 0) / 30.0) if days_since_perf else 0.0
        conf_points += max(5.0, min(35.0, len(perf_records) * 12.0) - recency_penalty)

    final_conf_score = round(float(np.clip(conf_points, 10.0, 98.0)), 1)
    if final_conf_score >= 75.0:
        confidence_level = "HIGH"
    elif final_conf_score >= 45.0:
        confidence_level = "MEDIUM"
    else:
        confidence_level = "LOW"

    return EngineeredFeatures(
        athlete_id=athlete.id,
        athlete_name=athlete.full_name,
        sport=athlete.sport,
        attendance_pct=attendance_pct,
        attendance_data_points=len(att_logs),
        fitness_score=fitness_score,
        fitness_data_points=len(fit_records),
        performance_score=performance_score,
        performance_data_points=len(perf_records),
        weight_suitability_score=wt_score,
        weight_note=wt_note,
        days_since_last_fitness=days_since_fit,
        days_since_last_performance=days_since_perf,
        confidence_level=confidence_level,
        confidence_score=final_conf_score,
        is_actively_injured=is_actively_injured,
        injury_reason=injury_reason,
        is_predicted_attendance=is_pred_att,
        is_predicted_fitness=is_pred_fit,
        is_predicted_performance=is_pred_perf,
    )
