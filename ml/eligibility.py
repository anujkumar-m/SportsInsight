"""
Eligibility Decision Engine for Athlete Eligibility Simulator.

Evaluates simulated athlete metrics against project criteria to determine eligibility
status: ELIGIBLE, NOT ELIGIBLE, or INSUFFICIENT DATA, with actionable explanations.
"""

import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .simulator import SimulationResult
    from .config import EligibilityThresholds
except ImportError:
    from simulator import SimulationResult
    from config import EligibilityThresholds


@dataclass
class AthleteEligibilityDecision:
    athlete_id: int
    athlete_name: str
    sport: str
    predicted_attendance_pct: Optional[float]
    predicted_fitness_score: Optional[float]
    predicted_performance_score: Optional[float]
    predicted_weight_suitability: Optional[float]
    overall_predicted_score: Optional[float]
    status: str  # 'ELIGIBLE', 'NOT ELIGIBLE', 'INSUFFICIENT DATA'
    confidence: str  # 'HIGH', 'MEDIUM', 'LOW'
    confidence_score: float
    explanation: str
    strengths: List[str]
    concerns: List[str]
    is_actively_injured: bool
    used_fallback_weights: bool


class EligibilityEvaluator:
    """Evaluates eligibility using project-defined standards and missing-data policies."""

    def __init__(self, thresholds: Optional[EligibilityThresholds] = None):
        self.thresholds = thresholds or EligibilityThresholds()

    def evaluate(self, result: SimulationResult) -> AthleteEligibilityDecision:
        """
        Determines the eligibility decision for an athlete simulation result.
        """
        features = result.features

        # 1. Missing Data Policy Check
        if not result.has_sufficient_data or result.overall_predicted_score is None:
            missing_str = ", ".join(result.missing_features)
            explanation = (
                f"Insufficient historical evidence prior to prediction date. "
                f"Missing required observations for: {missing_str}."
            )
            return AthleteEligibilityDecision(
                athlete_id=result.athlete_id,
                athlete_name=result.athlete_name,
                sport=result.sport,
                predicted_attendance_pct=result.attendance_pct,
                predicted_fitness_score=result.fitness_score,
                predicted_performance_score=result.performance_score,
                predicted_weight_suitability=result.weight_suitability_score,
                overall_predicted_score=None,
                status="INSUFFICIENT DATA",
                confidence="LOW",
                confidence_score=features.confidence_score,
                explanation=explanation,
                strengths=[],
                concerns=[f"Missing {m}" for m in result.missing_features],
                is_actively_injured=features.is_actively_injured,
                used_fallback_weights=result.used_fallback_weights,
            )

        # 2. Check Disqualifying Conditions (Injuries / Medical)
        concerns = []
        strengths = []

        if features.is_actively_injured:
            concerns.append(features.injury_reason or "Medical clearance unavailable due to active injury.")

        # 3. Check Metric Thresholds
        att = result.attendance_pct
        fit = result.fitness_score
        perf = result.performance_score
        score = result.overall_predicted_score

        if att < self.thresholds.min_attendance_pct:
            concerns.append(f"Predicted attendance ({att}%) below required threshold ({self.thresholds.min_attendance_pct}%).")
        else:
            strengths.append(f"Strong attendance consistency ({att}%).")

        if fit < self.thresholds.min_fitness_score:
            concerns.append(f"Predicted fitness score ({fit}) below minimum threshold ({self.thresholds.min_fitness_score}).")
        else:
            strengths.append(f"Solid athletic fitness conditioning ({fit}/100).")

        if perf < self.thresholds.min_performance_score:
            concerns.append(f"Predicted performance score ({perf}) below baseline ({self.thresholds.min_performance_score}).")
        else:
            strengths.append(f"Competitive historical performance score ({perf}/100).")

        if score < self.thresholds.min_overall_score:
            concerns.append(f"Overall predicted score ({score}) below required eligibility bar ({self.thresholds.min_overall_score}).")
        else:
            strengths.append(f"Overall composite score ({score}) meets selection qualification standard.")

        # 4. Decision Synthesis
        if features.is_actively_injured or concerns:
            status = "NOT ELIGIBLE"
            explanation = "; ".join(concerns)
        else:
            status = "ELIGIBLE"
            if score >= self.thresholds.strongly_eligible_score:
                explanation = (
                    f"Strongly cleared for selection. High multi-dimensional rating ({score}/100) "
                    f"with excellent attendance ({att}%) and fitness ({fit}/100)."
                )
            else:
                explanation = (
                    f"Meets all eligibility criteria. Overall predicted score of {score} clears "
                    f"the {self.thresholds.min_overall_score} qualification bar."
                )

        return AthleteEligibilityDecision(
            athlete_id=result.athlete_id,
            athlete_name=result.athlete_name,
            sport=result.sport,
            predicted_attendance_pct=result.attendance_pct,
            predicted_fitness_score=result.fitness_score,
            predicted_performance_score=result.performance_score,
            predicted_weight_suitability=result.weight_suitability_score,
            overall_predicted_score=score,
            status=status,
            confidence=features.confidence_level,
            confidence_score=features.confidence_score,
            explanation=explanation,
            strengths=strengths,
            concerns=concerns,
            is_actively_injured=features.is_actively_injured,
            used_fallback_weights=result.used_fallback_weights,
        )
