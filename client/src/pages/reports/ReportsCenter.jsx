import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Download,
  Calendar,
  Activity,
  Award,
  Users,
  CheckCircle2,
  Filter,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import performanceService from '../../services/performanceService';
import fitnessService from '../../services/fitnessService';
import attendanceService from '../../services/attendanceService';
import selectionService from '../../services/selectionService';

export default function ReportsCenter() {
  const [exporting, setExporting] = useState(null);

  const handleExportCSV = async (reportType) => {
    try {
      setExporting(reportType);
      toast.loading(`Generating ${reportType} export...`, { id: 'export-toast' });

      let data = [];
      let filename = `sportsinsight_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

      if (reportType === 'performance') {
        const res = await performanceService.getRecords({ limit: 500 });
        const records = res?.data || res?.records || [];
        data = records.map((r) => ({
          ID: r.id,
          Athlete: r.athlete_name || r.full_name || '',
          Code: r.athlete_code || '',
          Sport: r.sport_name || '',
          Date: r.record_date || '',
          Metric: r.metric_name || '',
          Value: r.metric_value || '',
          Unit: r.metric_unit || '',
          Score: r.performance_score || '',
        }));
      } else if (reportType === 'fitness') {
        const res = await fitnessService.getAssessments({ limit: 500 });
        const records = res?.data || res?.assessments || [];
        data = records.map((r) => ({
          ID: r.id,
          Athlete: r.athlete_name || r.full_name || '',
          Code: r.athlete_code || '',
          Date: r.assessment_date || '',
          Strength: r.strength_score || 0,
          Endurance: r.endurance_score || 0,
          Stamina: r.stamina_score || 0,
          Flexibility: r.flexibility_score || 0,
          Agility: r.agility_score || 0,
          OverallFitness: r.overall_fitness_score || 0,
        }));
      } else if (reportType === 'attendance') {
        const res = await attendanceService.getRecords({ limit: 500 });
        const records = res?.data || res?.attendance || [];
        data = records.map((r) => ({
          ID: r.id,
          Athlete: r.athlete_name || r.full_name || '',
          Code: r.athlete_code || '',
          Date: r.attendance_date || '',
          Status: r.status || '',
          Remarks: r.remarks || '',
        }));
      } else if (reportType === 'selections') {
        const res = await selectionService.getHistory({ limit: 500 });
        const records = res?.data || res?.selections || [];
        data = records.map((r) => ({
          ID: r.id,
          Athlete: r.athlete_name || r.full_name || '',
          Code: r.athlete_code || '',
          SelectionType: r.selection_type || '',
          Date: r.selection_date || '',
          SelectionScore: r.selection_score || 0,
          ConfidenceScore: r.confidence_score || 0,
          Status: r.status || '',
        }));
      }

      if (!data || data.length === 0) {
        toast.error('No data available for export', { id: 'export-toast' });
        return;
      }

      // Convert array of objects to CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${reportType.toUpperCase()} CSV report downloaded successfully!`, { id: 'export-toast' });
    } catch (err) {
      toast.error('Failed to generate export report', { id: 'export-toast' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Academy Reports Center"
        subtitle="Centralized intelligence hub for generating, previewing, and exporting academy performance data."
        breadcrumb="Reports"
      />

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Monitoring Report */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Activity className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Ready for Export
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-card-foreground">Performance Metrics Report</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Includes per-athlete performance records, sport-specific metric values, dates, and historical score evaluations.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Format: CSV Spreadsheet</span>
            <button
              type="button"
              disabled={exporting === 'performance'}
              onClick={() => handleExportCSV('performance')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              {exporting === 'performance' ? 'Exporting...' : 'Export Performance CSV'}
            </button>
          </div>
        </div>

        {/* Fitness Assessment Report */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <BarChart3 className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Ready for Export
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-card-foreground">Fitness Assessment Summary</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Strength, endurance, stamina, flexibility, agility ratings, BMI measurements, and overall fitness scores.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Format: CSV Spreadsheet</span>
            <button
              type="button"
              disabled={exporting === 'fitness'}
              onClick={() => handleExportCSV('fitness')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              {exporting === 'fitness' ? 'Exporting...' : 'Export Fitness CSV'}
            </button>
          </div>
        </div>

        {/* Attendance Records Report */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Calendar className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Ready for Export
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-card-foreground">Athlete Attendance Logs</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Daily attendance logs, status markers (present/absent/leave), coach remarks, and compliance statistics.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Format: CSV Spreadsheet</span>
            <button
              type="button"
              disabled={exporting === 'attendance'}
              onClick={() => handleExportCSV('attendance')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              {exporting === 'attendance' ? 'Exporting...' : 'Export Attendance CSV'}
            </button>
          </div>
        </div>

        {/* Selection & AI Audit Log Report */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
                <Award className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Ready for Export
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-card-foreground">Selection Audit & Recommendation History</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                AI selection confidence ratings, selector review history, status recommendations, and final team selections.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Format: CSV Spreadsheet</span>
            <button
              type="button"
              disabled={exporting === 'selections'}
              onClick={() => handleExportCSV('selections')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              {exporting === 'selections' ? 'Exporting...' : 'Export Selection CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
