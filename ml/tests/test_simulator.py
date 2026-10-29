"""
Unit Tests for Standalone Athlete Eligibility Simulator.

Tests mathematical simulation determinism, eligibility thresholds, weight suitability,
date cutoff enforcement, missing data policies, and read-only query safeguards.
"""

import unittest
from datetime import date
import sys
from pathlib import Path

# Add ml folder to sys.path
ML_DIR = str(Path(__file__).resolve().parent.parent)
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

from config import (
    ModelCoefficients,
    EligibilityThresholds,
    load_database_config,
    SPORT_BMI_RANGES,
)
from database import validate_read_only_query, ReadOnlyViolationError
from data_loader import AthleteProfile, AttendanceLog, FitnessRecord, PerformanceRecord, InjuryRecord
from feature_engineering import (
    calculate_weight_suitability,
    estimate_future_metric,
    extract_features_for_athlete,
)
from simulator import SimulatedLinearModel
from eligibility import EligibilityEvaluator
from utils import validate_date_string, format_score_val, render_ascii_table, sort_decisions


class TestConfigAndSecurity(unittest.TestCase):
    """Verifies credential masking, config loading, and read-only query validator."""

    def test_database_config_masks_password(self):
        config = load_database_config()
        repr_str = repr(config)
        self.assertNotIn(config.password, repr_str if config.password else "non_empty")
        if config.password:
            self.assertIn("********", repr_str)

    def test_read_only_query_validator_accepts_select(self):
        valid_queries = [
            "SELECT * FROM athletes WHERE is_active = 1",
            "SELECT a.id, COUNT(*) FROM attendance GROUP BY a.id",
            "  select id, name from sports  ",
        ]
        for q in valid_queries:
            try:
                validate_read_only_query(q)
            except ReadOnlyViolationError:
                self.fail(f"Valid query failed read-only validation: {q}")

    def test_read_only_query_validator_rejects_mutations(self):
        forbidden_queries = [
            "INSERT INTO athletes (name) VALUES ('Test')",
            "UPDATE athletes SET is_active = 0",
            "DELETE FROM attendance WHERE id = 1",
            "DROP TABLE performance_records",
            "ALTER TABLE users ADD COLUMN fake INT",
            "TRUNCATE TABLE fitness_assessments",
        ]
        for q in forbidden_queries:
            with self.assertRaises(ReadOnlyViolationError):
                validate_read_only_query(q)


class TestWeightSuitability(unittest.TestCase):
    """Verifies sport-specific BMI evaluation."""

    def test_missing_measurements_returns_none(self):
        score, reason = calculate_weight_suitability(None, 70.0, "Athletics")
        self.assertIsNone(score)
        self.assertIn("not recorded", reason)

        score, reason = calculate_weight_suitability(180.0, None, "Athletics")
        self.assertIsNone(score)

    def test_optimal_athletics_bmi(self):
        # Height 180cm, Weight 68kg -> BMI 21.0 (optimal range 18.5 - 22.5)
        score, reason = calculate_weight_suitability(180.0, 68.0, "Athletics")
        self.assertIsNotNone(score)
        self.assertGreaterEqual(score, 90.0)
        self.assertIn("optimal range", reason)

    def test_exceeding_optimal_bmi_penalized(self):
        # Height 170cm, Weight 95kg -> BMI 32.9 (far above optimal)
        score, reason = calculate_weight_suitability(170.0, 95.0, "Athletics")
        self.assertIsNotNone(score)
        self.assertLess(score, 60.0)
        self.assertIn("exceeds optimal maximum", reason)


class TestSimulatedModelDeterminism(unittest.TestCase):
    """Verifies that the linear model produces identical, deterministic scores."""

    def setUp(self):
        self.target_date = date(2027, 6, 15)
        self.model = SimulatedLinearModel()
        self.evaluator = EligibilityEvaluator()

        self.athlete = AthleteProfile(
            id=1,
            athlete_code="ATH-001",
            full_name="Vikram Singh",
            sport="Athletics",
            sport_id=1,
            gender="male",
            height_cm=182.0,
            weight_kg=72.0,
            medical_status="fit",
            attendance_history=[
                AttendanceLog(attendance_date=date(2026, 3, i), status="present")
                for i in range(1, 26)
            ],
            fitness_history=[
                FitnessRecord(assessment_date=date(2026, 1, 15), overall_fitness_score=80.0),
                FitnessRecord(assessment_date=date(2026, 2, 15), overall_fitness_score=84.0),
                FitnessRecord(assessment_date=date(2026, 3, 15), overall_fitness_score=88.0),
            ],
            performance_history=[
                PerformanceRecord(record_date=date(2026, 1, 20), metric_name="Sprint", metric_value=11.5, performance_score=82.0),
                PerformanceRecord(record_date=date(2026, 2, 20), metric_name="Sprint", metric_value=11.2, performance_score=85.0),
                PerformanceRecord(record_date=date(2026, 3, 20), metric_name="Sprint", metric_value=11.0, performance_score=88.0),
            ],
        )

    def test_identical_runs_produce_identical_scores(self):
        feat1 = extract_features_for_athlete(self.athlete, self.target_date)
        res1 = self.model.simulate_athlete(feat1)
        dec1 = self.evaluator.evaluate(res1)

        feat2 = extract_features_for_athlete(self.athlete, self.target_date)
        res2 = self.model.simulate_athlete(feat2)
        dec2 = self.evaluator.evaluate(res2)

        self.assertEqual(res1.overall_predicted_score, res2.overall_predicted_score)
        self.assertEqual(dec1.status, dec2.status)
        self.assertEqual(dec1.confidence, dec2.confidence)

    def test_future_cutoff_ignores_future_records(self):
        """Verifies that records logged AFTER target_date are strictly ignored."""
        early_target = date(2026, 2, 1)

        feat_early = extract_features_for_athlete(self.athlete, early_target)
        # On 2026-02-01, only the 1st fitness assessment (Jan 15) and 1st performance record exist
        self.assertEqual(feat_early.fitness_data_points, 1)
        self.assertEqual(feat_early.fitness_score, 80.0)
        self.assertEqual(feat_early.performance_data_points, 1)
        self.assertEqual(feat_early.performance_score, 82.0)


class TestEligibilityDecisions(unittest.TestCase):
    """Verifies eligibility status classification and missing data handling."""

    def setUp(self):
        self.target_date = date(2027, 6, 15)
        self.model = SimulatedLinearModel()
        self.evaluator = EligibilityEvaluator()

    def test_missing_data_returns_insufficient_data(self):
        athlete_no_fitness = AthleteProfile(
            id=2,
            athlete_code="ATH-002",
            full_name="Deepak Rao",
            sport="Badminton",
            sport_id=2,
            gender="male",
            height_cm=175.0,
            weight_kg=68.0,
            medical_status="fit",
            attendance_history=[AttendanceLog(date(2026, 1, 1), "present")],
            fitness_history=[],  # Zero fitness records
            performance_history=[PerformanceRecord(date(2026, 1, 1), "Smash", 200.0, 75.0)],
        )
        feat = extract_features_for_athlete(athlete_no_fitness, self.target_date)
        res = self.model.simulate_athlete(feat)
        dec = self.evaluator.evaluate(res)

        self.assertEqual(dec.status, "INSUFFICIENT DATA")
        self.assertIsNone(dec.overall_predicted_score)
        self.assertIn("Fitness Assessment", dec.explanation)

    def test_active_injury_causes_not_eligible(self):
        athlete_injured = AthleteProfile(
            id=3,
            athlete_code="ATH-003",
            full_name="Neha Sharma",
            sport="Athletics",
            sport_id=1,
            gender="female",
            height_cm=168.0,
            weight_kg=56.0,
            medical_status="injured",
            attendance_history=[AttendanceLog(date(2026, 1, i), "present") for i in range(1, 20)],
            fitness_history=[FitnessRecord(date(2026, 1, 10), 85.0)],
            performance_history=[PerformanceRecord(date(2026, 1, 15), "100m", 12.0, 85.0)],
            injuries=[
                InjuryRecord(
                    injury_date=date(2026, 1, 20),
                    injury_type="Hamstring Strain",
                    recovery_status="recovering",
                    availability_status="unfit",
                )
            ],
        )
        feat = extract_features_for_athlete(athlete_injured, self.target_date)
        res = self.model.simulate_athlete(feat)
        dec = self.evaluator.evaluate(res)

        self.assertEqual(dec.status, "NOT ELIGIBLE")
        self.assertIn("Active injury", dec.explanation)


class TestUtils(unittest.TestCase):
    """Verifies date parsing and table formatting."""

    def test_valid_date_parsing(self):
        d = validate_date_string("2027-06-15")
        self.assertEqual(d, date(2027, 6, 15))

    def test_invalid_date_format_raises_error(self):
        with self.assertRaises(ValueError):
            validate_date_string("15-06-2027")
        with self.assertRaises(ValueError):
            validate_date_string("2027/06/15")
        with self.assertRaises(ValueError):
            validate_date_string("not-a-date")

    def test_ascii_table_rendering(self):
        headers = ["Col A", "Col B"]
        rows = [["Val 1", "Val 2"], ["Val 3", "Val 4"]]
        table = render_ascii_table(headers, rows)
        self.assertIn("Col A", table)
        self.assertIn("Val 1", table)
        self.assertTrue(table.startswith("+"))
        self.assertTrue(table.endswith("+"))


if __name__ == "__main__":
    unittest.main()
