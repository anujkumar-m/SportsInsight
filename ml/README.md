# Sports Academy — Standalone Athlete Eligibility Prediction Simulator

A command-line machine-learning-style athlete eligibility simulator located in the isolated `ml/` directory. It reads historical athlete data from the existing MySQL / TiDB Cloud database, estimates future performance pillars through trend analysis, and simulates eligibility decisions using a deterministic multiple-linear-regression-style mathematical model.

> **Zero Modifications Guarantee**: This directory and its contents are completely isolated. No files outside `ml/` (backend, frontend, database schemas, configs, or package files) have been touched or modified.

---

## 1. Folder Structure

```
ml/
├── README.md                 # Complete documentation and user guide
├── requirements.txt          # Python lightweight dependencies
├── .env.example              # Reference database environment configuration
├── .gitignore                # Python and environment ignores
├── main.py                   # Terminal CLI & interactive entry point
├── config.py                 # Safe environment loading & model hyperparameters
├── database.py               # Secure PyMySQL connection & read-only enforcement
├── data_loader.py            # Historical data queries with cutoff date enforcement
├── feature_engineering.py    # Trend extrapolation, BMI suitability & confidence scoring
├── simulator.py              # Simulated multiple linear regression model
├── eligibility.py            # Eligibility rules, threshold checks & explanations
├── utils.py                  # Terminal ASCII table formatting & date validation
└── tests/
    └── test_simulator.py     # Isolated unit test suite (13 automated test cases)
```

---

## 2. Environment Configuration & Security

The simulator connects to the existing Sports Academy database without copying, modifying, or creating duplicate credentials.

### Automatic Environment Discovery
When executed, the simulator scans the following locations in order:
1. Custom path specified via CLI argument `--env-file <path>`.
2. Path specified in the `ML_ENV_FILE` environment variable.
3. `../server/.env` (default when running inside `ml/`).
4. `./server/.env` (when running from the repository root).
5. Local `ml/.env` (if custom override is provided).

### Required Environment Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_HOST` | Hostname or IP address of the MySQL / TiDB Cloud server | `localhost` |
| `DB_PORT` | Port number of the database server | `3306` (or `4000` for TiDB) |
| `DB_NAME` | Database schema name | `sports_academy` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD`| Database user password | `""` |
| `DB_SSL` | Enable TLS/SSL connection (`true` / `false`) | Auto-enabled for cloud hosts |
| `DB_SSL_REJECT_UNAUTHORIZED` | Enforce strict CA certificate validation | `false` |

### Security Guarantees
- **Credential Masking**: Database passwords are never printed in terminal outputs, debug messages, exceptions, logs, or reports.
- **Read-Only Enforcement**: All queries are strictly verified by `validate_read_only_query()` before execution. Mutation statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`) are unconditionally rejected.
- **Missing Credentials Handling**: If credentials are missing or the database cannot be reached, the application halts with a diagnostic message and never fabricates fake athlete records.

---

## 3. Installation

Ensure Python 3.9+ is installed:

```bash
# Navigate to the ml folder
cd ml

# Install minimal lightweight dependencies
pip install -r requirements.txt
```

---

## 4. Usage

### Interactive Mode
Run the simulator without arguments to enter interactive mode:

```bash
python main.py
```
You will be prompted to enter the prediction date:
```
Enter prediction date (YYYY-MM-DD): 2027-06-15
```

### Command-Line Execution with Specific Date
Provide the `--date` argument in `YYYY-MM-DD` format:

```bash
python main.py --date 2027-06-15
```

### Filtering by Sport
Filter predictions for athletes in a specific sport:

```bash
python main.py --date 2027-06-15 --sport Athletics
```

### Verbose Mode (Detailed Metrics Breakdown)
Display individual feature modes (Historical vs Simulated Trend), observation counts, data freshness, and exact coefficients:

```bash
python main.py --date 2027-06-15 --verbose
```

### Limiting Evaluated Athletes
```bash
python main.py --date 2027-06-15 --limit 10
```

### Overriding the Environment File
```bash
python main.py --date 2027-06-15 --env-file /path/to/custom/.env
```

### Running the Isolated Self-Test
Runs synthetic unit tests without requiring an active database connection:

```bash
python main.py --self-test
```

Or run the full test suite with unittest:

```bash
python -m unittest tests/test_simulator.py
```

---

## 5. Mathematical Model Specification

The application implements a transparent, deterministic **Simulated Multiple Linear Regression Model**. It does not claim to be a black-box trained neural network, but rather behaves like an interpretable scoring function aligned with the Sports Academy system.

### Mathematical Formula
$$\text{Predicted Score} = \beta_0 + \beta_{\text{att}} \cdot X_{\text{att}} + \beta_{\text{fit}} \cdot X_{\text{fit}} + \beta_{\text{perf}} \cdot X_{\text{perf}} + \beta_{\text{wt}} \cdot X_{\text{wt}}$$

Where inputs are normalized to $[0.0, 100.0]$:
- $X_{\text{att}}$: Predicted or historical attendance consistency percentage.
- $X_{\text{fit}}$: Predicted or historical overall fitness conditioning score.
- $X_{\text{perf}}$: Predicted or historical sport-specific performance score.
- $X_{\text{wt}}$: Weight suitability score based on sport-specific optimal BMI reference ranges.

### Standard Model Coefficients
| Component | Symbol | Value | Rationale |
| :--- | :--- | :--- | :--- |
| **Intercept** | $\beta_0$ | `0.0` | Baseline origin |
| **Attendance** | $\beta_{\text{att}}$ | `0.20` | Consistency and training commitment |
| **Fitness** | $\beta_{\text{fit}}$ | `0.35` | Physical endurance, agility, and stamina |
| **Performance** | $\beta_{\text{perf}}$ | `0.35` | Technical skill and match performance |
| **Weight Suitability** | $\beta_{\text{wt}}$ | `0.10` | Athletic BMI alignment for the specific sport |

### Dynamic Weight Fallback Policy
If an athlete's height or weight is unrecorded, or if the sport has no valid body composition standard, the weight suitability score is set to `N/A`. The model dynamically re-allocates weights across the three pillars to preserve scoring integrity:
- $\beta_{\text{att}} = 0.25$
- $\beta_{\text{fit}} = 0.40$
- $\beta_{\text{perf}} = 0.35$

---

## 6. Historical vs. Future Date Predictions

### Strict Historical Cutoff Rule
To preserve causal integrity, **no observations dated after the requested prediction date are queried or utilized**.
- Past dates query records where `date <= prediction_date`.
- Future dates query only available historical evidence up to the target date.

### Trend Extrapolation Methodology
- **$\ge 3$ Historical Data Points**: A linear regression slope ($m = \frac{\sum (x - \bar{x})(y - \bar{y})}{\sum (x - \bar{x})^2}$) calculates the trajectory over time. To avoid runaway or unrealistic forecasts over distant future dates, a hyperbolic damping factor is applied:
  $$\Delta_{\text{damped}} = \frac{m \cdot \Delta t}{1 + \frac{\Delta t_{\text{future}}}{180}}$$
  The resulting value is clamped to $[0.0, 100.0]$.
- **1–2 Historical Data Points**: A recency-weighted average is calculated.
- **0 Historical Data Points**: The metric is marked as `None`, triggering the Missing Data Policy.

---

## 7. Eligibility Evaluation & Thresholds

| Decision Status | Criteria |
| :--- | :--- |
| **`ELIGIBLE`** | Predicted Score $\ge 70.0$, Attendance $\ge 75.0\%$, Fitness $\ge 60.0$, Performance $\ge 50.0$, and NO active disabling injuries. *(Athletes with Score $\ge 85.0$ are flagged as Strongly Cleared).* |
| **`NOT ELIGIBLE`** | Predicted Score $< 70.0$, Attendance $< 75.0\%$, Fitness $< 60.0$, or Active Disabling Injury. |
| **`INSUFFICIENT DATA`**| Missing one or more foundational pillars (Attendance, Fitness, or Performance) prior to the prediction date. |

### Weight Suitability Standards (BMI Reference Ranges)
- **Athletics / Running**: $18.5 - 22.5$
- **Badminton**: $19.0 - 23.0$
- **Swimming**: $20.0 - 24.0$
- **Football / Soccer**: $20.5 - 24.5$
- **Basketball**: $21.0 - 25.0$
- **Cricket**: $20.0 - 25.0$
- **Tennis**: $20.0 - 24.0$
- **General / Other**: $19.0 - 24.5$

---

## 8. Troubleshooting

### Connection Refused (`WinError 10061` / `ECONNREFUSED`)
- **TiDB Cloud**: Free-tier TiDB clusters may pause after periods of inactivity. Log into the TiDB Cloud console and resume the cluster, or verify that your current client IP is added to the cluster's IP Access List (CIDR `0.0.0.0/0` for development).
- **Local MySQL**: If connecting locally, ensure the MySQL Windows service is running (`Get-Service MySQL` in PowerShell).

### Authentication Failure (`Error 1045`)
- Verify that `DB_USER` and `DB_PASSWORD` in `server/.env` correspond to active credentials.

### Verifying Model Logic without Live Database
Run the built-in isolated test suite:
```bash
python main.py --self-test
```
