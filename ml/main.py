"""
Main Command-Line Interface for Athlete Eligibility Prediction Simulator.

Runs exclusively in the terminal. Supports both command-line arguments and interactive mode.
"""

import sys
import argparse
from pathlib import Path
from datetime import date
from typing import Optional, List

CURRENT_DIR = str(Path(__file__).resolve().parent)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Support running directly via python main.py or python -m ml.main
try:
    from .config import load_database_config, DatabaseConfig, ModelCoefficients, EligibilityThresholds
    from .database import get_db_connection
    from .data_loader import load_athletes_data, AthleteProfile, AttendanceLog, FitnessRecord, PerformanceRecord
    from .feature_engineering import extract_features_for_athlete
    from .simulator import SimulatedLinearModel
    from .eligibility import EligibilityEvaluator, AthleteEligibilityDecision
    from .utils import validate_date_string, format_score_val, render_ascii_table, sort_decisions
except ImportError:
    from config import load_database_config, DatabaseConfig, ModelCoefficients, EligibilityThresholds
    from database import get_db_connection
    from data_loader import load_athletes_data, AthleteProfile, AttendanceLog, FitnessRecord, PerformanceRecord
    from feature_engineering import extract_features_for_athlete
    from simulator import SimulatedLinearModel
    from eligibility import EligibilityEvaluator, AthleteEligibilityDecision
    from utils import validate_date_string, format_score_val, render_ascii_table, sort_decisions


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sports Academy - Standalone Athlete Eligibility Simulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --date 2027-06-15
  python main.py --date 2027-06-15 --sport Athletics --verbose
  python main.py --self-test
  python main.py (interactive prompt)
        """
    )
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="Prediction date in YYYY-MM-DD format (e.g. 2027-06-15)."
    )
    parser.add_argument(
        "--sport",
        type=str,
        default=None,
        help="Filter predictions to a specific sport (e.g. Athletics, Swimming)."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of athletes to evaluate."
    )
    parser.add_argument(
        "--env-file",
        type=str,
        default=None,
        help="Explicit path to environment file (overrides default server/.env detection)."
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Display detailed per-athlete metrics, observation counts, and decision rationale."
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run isolated mathematical and threshold validation unit tests."
    )
    return parser.parse_args()


def run_self_test() -> int:
    """Runs isolated synthetic unit test suite without needing an active database."""
    print("=" * 80)
    print("RUNNING ISOLATED SIMULATOR SELF-TEST")
    print("=" * 80)

    target_date = date(2027, 6, 15)
    model = SimulatedLinearModel()
    evaluator = EligibilityEvaluator()

    # Fixture 1: High performing eligible athlete
    ath_eligible = AthleteProfile(
        id=101,
        athlete_code="ATH-101",
        full_name="Arjun Sharma",
        sport="Athletics",
        sport_id=1,
        gender="male",
        height_cm=180.0,
        weight_kg=70.0,  # BMI = 21.6 (optimal)
        medical_status="fit",
        attendance_history=[
            AttendanceLog(attendance_date=date(2026, 1, i), status="present")
            for i in range(1, 25)
        ],
        fitness_history=[
            FitnessRecord(assessment_date=date(2026, 1, 10), overall_fitness_score=82.0),
            FitnessRecord(assessment_date=date(2026, 2, 10), overall_fitness_score=85.0),
            FitnessRecord(assessment_date=date(2026, 3, 10), overall_fitness_score=88.0),
        ],
        performance_history=[
            PerformanceRecord(record_date=date(2026, 1, 15), metric_name="100m Sprint", metric_value=11.2, performance_score=84.0),
            PerformanceRecord(record_date=date(2026, 2, 15), metric_name="100m Sprint", metric_value=11.0, performance_score=86.0),
            PerformanceRecord(record_date=date(2026, 3, 15), metric_name="100m Sprint", metric_value=10.9, performance_score=89.0),
        ],
    )

    feat_1 = extract_features_for_athlete(ath_eligible, target_date)
    res_1 = model.simulate_athlete(feat_1)
    dec_1 = evaluator.evaluate(res_1)

    assert dec_1.status == "ELIGIBLE", f"Expected ELIGIBLE, got {dec_1.status}"
    assert dec_1.overall_predicted_score is not None and dec_1.overall_predicted_score >= 80.0
    print("  [PASS] Test 1: Full-data eligible athlete correctly evaluated as ELIGIBLE.")

    # Fixture 2: Ineligible athlete due to poor attendance
    ath_poor_att = AthleteProfile(
        id=102,
        athlete_code="ATH-102",
        full_name="Rohan Verma",
        sport="Badminton",
        sport_id=2,
        gender="male",
        height_cm=175.0,
        weight_kg=68.0,
        medical_status="fit",
        attendance_history=[
            AttendanceLog(attendance_date=date(2026, 1, i), status="absent" if i % 2 == 0 else "present")
            for i in range(1, 20)
        ],
        fitness_history=[
            FitnessRecord(assessment_date=date(2026, 2, 1), overall_fitness_score=75.0),
        ],
        performance_history=[
            PerformanceRecord(record_date=date(2026, 2, 1), metric_name="Agility Drill", metric_value=15.0, performance_score=72.0),
        ],
    )
    feat_2 = extract_features_for_athlete(ath_poor_att, target_date)
    res_2 = model.simulate_athlete(feat_2)
    dec_2 = evaluator.evaluate(res_2)

    assert dec_2.status == "NOT ELIGIBLE", f"Expected NOT ELIGIBLE, got {dec_2.status}"
    print("  [PASS] Test 2: Low-attendance athlete correctly evaluated as NOT ELIGIBLE.")

    # Fixture 3: Athlete with missing fitness assessments (Insufficient Data policy)
    ath_missing = AthleteProfile(
        id=103,
        athlete_code="ATH-103",
        full_name="Pooja Patel",
        sport="Swimming",
        sport_id=3,
        gender="female",
        height_cm=165.0,
        weight_kg=58.0,
        medical_status="fit",
        attendance_history=[
            AttendanceLog(attendance_date=date(2026, 1, i), status="present")
            for i in range(1, 15)
        ],
        fitness_history=[],  # No fitness history
        performance_history=[
            PerformanceRecord(record_date=date(2026, 1, 15), metric_name="50m Freestyle", metric_value=28.5, performance_score=80.0),
        ],
    )
    feat_3 = extract_features_for_athlete(ath_missing, target_date)
    res_3 = model.simulate_athlete(feat_3)
    dec_3 = evaluator.evaluate(res_3)

    assert dec_3.status == "INSUFFICIENT DATA", f"Expected INSUFFICIENT DATA, got {dec_3.status}"
    assert dec_3.overall_predicted_score is None
    print("  [PASS] Test 3: Athlete with missing pillar correctly tagged as INSUFFICIENT DATA.")

    # Fixture 4: Determinism test (same input must yield identical output)
    feat_repeat = extract_features_for_athlete(ath_eligible, target_date)
    res_repeat = model.simulate_athlete(feat_repeat)
    dec_repeat = evaluator.evaluate(res_repeat)
    assert dec_1.overall_predicted_score == dec_repeat.overall_predicted_score
    print("  [PASS] Test 4: Simulator produces 100% deterministic identical outputs.")

    print("\nAll self-test assertions passed successfully!")
    return 0


def main() -> int:
    args = parse_arguments()

    if args.self_test:
        return run_self_test()

    # Date resolution
    date_str = args.date
    if not date_str:
        print("SPORTS ACADEMY - ATHLETE ELIGIBILITY SIMULATOR")
        print("Mode: Interactive Terminal Execution")
        try:
            date_str = input("Enter prediction date (YYYY-MM-DD): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            return 1

    try:
        target_date = validate_date_string(date_str)
    except ValueError as err:
        sys.stderr.write(f"\n[ERROR] {err}\n")
        return 1

    # Load configuration securely
    config = load_database_config(args.env_file)

    # Print Report Header
    print("\n" + "=" * 90)
    print("SPORTS ACADEMY - ATHLETE ELIGIBILITY SIMULATOR")
    print("=" * 90)
    print(f"Prediction date : {target_date.strftime('%Y-%m-%d')}")
    print(f"Data source     : MySQL Database '{config.name}' on {config.host}:{config.port}")
    print(f"Config loaded   : {config.loaded_from or 'System Environment'}")
    print("Model           : Simulated Multiple Linear Regression")
    if args.sport:
        print(f"Sport Filter    : {args.sport}")
    print("=" * 90 + "\n")

    # Connect to database
    try:
        with get_db_connection(config) as connection:
            print("Connecting to database and querying historical records...")
            athletes = load_athletes_data(
                connection=connection,
                cutoff_date=target_date.strftime("%Y-%m-%d"),
                sport_filter=args.sport,
                limit=args.limit,
            )
    except Exception as e:
        sys.stderr.write(
            f"\n[ERROR] Database connection failed: {e}\n"
            "Unable to access real athlete data from database.\n"
            "Run 'python main.py --self-test' to verify model calculations in isolated test mode,\n"
            "or verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in your environment file.\n"
        )
        return 1

    if not athletes:
        print(f"No active athletes found in database matching criteria (Sport: {args.sport or 'All'}).")
        return 0

    print(f"Successfully retrieved {len(athletes)} active athlete records.\n")

    # Run simulations
    model = SimulatedLinearModel()
    evaluator = EligibilityEvaluator()
    decisions: List[AthleteEligibilityDecision] = []
    simulation_results = []

    for ath in athletes:
        features = extract_features_for_athlete(ath, target_date)
        sim_res = model.simulate_athlete(features)
        decision = evaluator.evaluate(sim_res)
        decisions.append(decision)
        simulation_results.append(sim_res)

    # Sort results: ELIGIBLE first, then score descending
    sorted_decisions = sort_decisions(decisions)

    # Prepare and render terminal table
    headers = [
        "Athlete",
        "Sport",
        "Attendance",
        "Fitness",
        "Performance",
        "Weight Score",
        "Score",
        "Eligibility",
        "Confidence"
    ]

    rows = []
    for d in sorted_decisions:
        rows.append([
            d.athlete_name,
            d.sport,
            format_score_val(d.predicted_attendance_pct, is_percent=True),
            format_score_val(d.predicted_fitness_score),
            format_score_val(d.predicted_performance_score),
            format_score_val(d.predicted_weight_suitability),
            format_score_val(d.overall_predicted_score),
            d.status,
            d.confidence,
        ])

    table_output = render_ascii_table(headers, rows)
    print(table_output)

    # Print summary counts
    eligible_count = sum(1 for d in decisions if d.status == "ELIGIBLE")
    not_eligible_count = sum(1 for d in decisions if d.status == "NOT ELIGIBLE")
    insufficient_count = sum(1 for d in decisions if d.status == "INSUFFICIENT DATA")

    print("\nEVALUATION SUMMARY:")
    print(f"  Total Athletes Evaluated : {len(decisions)}")
    print(f"  Eligible                 : {eligible_count}")
    print(f"  Not Eligible             : {not_eligible_count}")
    print(f"  Insufficient Data        : {insufficient_count}")

    # Detailed Breakdown & Explanations
    print("\n" + "-" * 90)
    print("DECISION RATIONALE & RELIABILITY EXPLANATIONS:")
    print("-" * 90)

    for idx, d in enumerate(sorted_decisions, start=1):
        print(f"\n[{idx}] {d.athlete_name} ({d.sport}) - {d.status}")
        print(f"    Confidence  : {d.confidence} (Score: {d.confidence_score:.1f}/100)")
        print(f"    Explanation : {d.explanation}")
        if d.strengths:
            print(f"    Strengths   : {'; '.join(d.strengths)}")
        if d.concerns:
            print(f"    Concerns    : {'; '.join(d.concerns)}")
        if d.used_fallback_weights:
            print("    Note        : Weight suitability unavailable; redistributed weights across remaining pillars.")

    # Verbose Breakdown if requested
    if args.verbose:
        print("\n" + "=" * 90)
        print("DETAILED HISTORICAL VS PREDICTED METRICS (VERBOSE MODE):")
        print("=" * 90)
        for res in simulation_results:
            feat = res.features
            print(f"\n* Athlete ID {res.athlete_id}: {res.athlete_name}")
            att_type = "Simulated Trend" if feat.is_predicted_attendance else "Historical Mean"
            fit_type = "Simulated Trend" if feat.is_predicted_fitness else "Historical Mean"
            perf_type = "Simulated Trend" if feat.is_predicted_performance else "Historical Mean"
            print(f"  - Attendance  : {format_score_val(res.attendance_pct, True)} ({feat.attendance_data_points} sessions logged, Mode: {att_type})")
            print(f"  - Fitness     : {format_score_val(res.fitness_score)} ({feat.fitness_data_points} assessments, Mode: {fit_type})")
            print(f"  - Performance : {format_score_val(res.performance_score)} ({feat.performance_data_points} records, Mode: {perf_type})")
            print(f"  - Weight/BMI  : {feat.weight_note}")
            print(f"  - Coefficients: {res.coefficients_used}")

    print("\n" + "=" * 90)
    print("SIMULATION MODEL SPECIFICATION & ASSUMPTIONS:")
    print("  1. Deterministic Linear Combination: Intercept + W_att*Att + W_fit*Fit + W_perf*Perf + W_wt*Wt")
    print("  2. Feature coefficients: Attendance 0.20, Fitness 0.35, Performance 0.35, Weight Suitability 0.10.")
    print("  3. Fallback coefficients (when BMI/weight is N/A): Attendance 0.25, Fitness 0.40, Performance 0.35.")
    print("  4. Strict cutoff: Only observations logged strictly on or before the requested prediction date are used.")
    print("  5. Missing data policy: If any primary pillar has zero prior observations, status is INSUFFICIENT DATA.")
    print("=" * 90 + "\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
