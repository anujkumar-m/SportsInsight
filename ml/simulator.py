"""
Simulated Multiple Linear Regression Model for Athlete Scoring.

Implements a deterministic, mathematically transparent linear simulation model.
Combines normalized feature inputs with documented regression-style coefficients.
"""

from dataclasses import dataclass
from typing import Optional, Dict
import sys
from pathlib import Path
import numpy as np

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .feature_engineering import EngineeredFeatures
    from .config import ModelCoefficients
except ImportError:
    from feature_engineering import EngineeredFeatures
    from config import ModelCoefficients


@dataclass
class SimulationResult:
    athlete_id: int
    athlete_name: str
    sport: str
    attendance_pct: Optional[float]
    fitness_score: Optional[float]
    performance_score: Optional[float]
    weight_suitability_score: Optional[float]
    overall_predicted_score: Optional[float]
    used_fallback_weights: bool
    coefficients_used: Dict[str, float]
    has_sufficient_data: bool
    missing_features: list
    features: EngineeredFeatures


class SimulatedLinearModel:
    """
    Transparent Simulated Multiple Linear Regression Model.
    
    Formula:
        predicted_score = (
            intercept
            + c_att * attendance_percentage
            + c_fit * fitness_score
            + c_perf * performance_score
            + c_wt * weight_suitability_score
        )
    """

    def __init__(self, coefficients: Optional[ModelCoefficients] = None):
        self.coefs = coefficients or ModelCoefficients()

    def simulate_athlete(self, features: EngineeredFeatures) -> SimulationResult:
        """
        Runs the deterministic linear simulation for a single athlete feature vector.
        """
        missing = []
        if features.attendance_pct is None:
            missing.append("Attendance")
        if features.fitness_score is None:
            missing.append("Fitness Assessment")
        if features.performance_score is None:
            missing.append("Performance Record")

        # If any essential pillar is missing, overall score cannot be synthesized
        if missing:
            return SimulationResult(
                athlete_id=features.athlete_id,
                athlete_name=features.athlete_name,
                sport=features.sport,
                attendance_pct=features.attendance_pct,
                fitness_score=features.fitness_score,
                performance_score=features.performance_score,
                weight_suitability_score=features.weight_suitability_score,
                overall_predicted_score=None,
                used_fallback_weights=False,
                coefficients_used={},
                has_sufficient_data=False,
                missing_features=missing,
                features=features,
            )

        # Determine coefficient weighting depending on weight suitability availability
        if features.weight_suitability_score is not None:
            used_fallback = False
            coef_dict = {
                "intercept": self.coefs.intercept,
                "attendance": self.coefs.attendance_coef,
                "fitness": self.coefs.fitness_coef,
                "performance": self.coefs.performance_coef,
                "weight": self.coefs.weight_coef,
            }
            # Compute linear combination using NumPy
            X = np.array([
                features.attendance_pct,
                features.fitness_score,
                features.performance_score,
                features.weight_suitability_score,
            ], dtype=float)
            W = np.array([
                self.coefs.attendance_coef,
                self.coefs.fitness_coef,
                self.coefs.performance_coef,
                self.coefs.weight_coef,
            ], dtype=float)
            score = self.coefs.intercept + float(np.dot(X, W))
        else:
            used_fallback = True
            coef_dict = {
                "intercept": self.coefs.intercept,
                "attendance": self.coefs.fallback_attendance_coef,
                "fitness": self.coefs.fallback_fitness_coef,
                "performance": self.coefs.fallback_performance_coef,
                "weight": 0.0,
            }
            X = np.array([
                features.attendance_pct,
                features.fitness_score,
                features.performance_score,
            ], dtype=float)
            W = np.array([
                self.coefs.fallback_attendance_coef,
                self.coefs.fallback_fitness_coef,
                self.coefs.fallback_performance_coef,
            ], dtype=float)
            score = self.coefs.intercept + float(np.dot(X, W))

        bounded_score = round(float(np.clip(score, 0.0, 100.0)), 1)

        return SimulationResult(
            athlete_id=features.athlete_id,
            athlete_name=features.athlete_name,
            sport=features.sport,
            attendance_pct=features.attendance_pct,
            fitness_score=features.fitness_score,
            performance_score=features.performance_score,
            weight_suitability_score=features.weight_suitability_score,
            overall_predicted_score=bounded_score,
            used_fallback_weights=used_fallback,
            coefficients_used=coef_dict,
            has_sufficient_data=True,
            missing_features=[],
            features=features,
        )
