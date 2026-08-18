import React, { useState, useEffect } from 'react';
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
  Trophy,
  Eye,
  X,
  Printer,
  FileSpreadsheet,
  FileType,
  Clock,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import performanceService from '../../services/performanceService';
import fitnessService from '../../services/fitnessService';
import attendanceService from '../../services/attendanceService';
import selectionService from '../../services/selectionService';
import athleteService from '../../services/athleteService';
import rankingService from '../../services/rankingService';
import sportService from '../../services/sportService';

export default function ReportsCenter() {
  const [exportingCSV, setExportingCSV] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(null);
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', '30days', '90days', 'year'

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    data: [],
    loading: false,
    reportType: ''
  });

  useEffect(() => {
    async function loadSports() {
      try {
        const res = await sportService.listSports();
        const list = res.data?.sports || res.data || [];
        setSports(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load sports:', err);
      }
    }
    loadSports();
  }, []);

  // Compute date filter boundary
  const getDateFilters = () => {
    if (dateRange === 'all') return {};
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    let fromDate = '';

    if (dateRange === '30days') {
      const past = new Date(now.setDate(now.getDate() - 30));
      fromDate = past.toISOString().split('T')[0];
    } else if (dateRange === '90days') {
      const past = new Date(now.setDate(now.getDate() - 90));
      fromDate = past.toISOString().split('T')[0];
    } else if (dateRange === 'year') {
      const past = new Date(now.setFullYear(now.getFullYear() - 1));
      fromDate = past.toISOString().split('T')[0];
    }
    return { dateFrom: fromDate, dateTo: toDate };
  };

  // Safe date parser to guarantee a clean YYYY-MM-DD string is always extracted
  const parseSafeDate = (...candidates) => {
    for (const c of candidates) {
      if (!c) continue;
      if (typeof c === 'string') {
        const match = c.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
      }
      try {
        const d = new Date(c);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (_) {}
    }
    return new Date().toISOString().split('T')[0];
  };

  // ─── Fetch and Clean Data for Each Report Type ──────────────────────────────
  const fetchReportData = async (reportType) => {
    const dates = getDateFilters();
    const sportFilter = selectedSport || undefined;

    let cleanRows = [];

    switch (reportType) {
      case 'performance': {
        const res = await performanceService.getRecords({
          limit: 1000,
          sportId: sportFilter,
          ...dates
        });
        const records =
          res?.data?.data?.records ||
          res?.data?.records ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        cleanRows = records.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.athlete_name || r.full_name || 'N/A';
          const recDate = parseSafeDate(r.record_date, r.date, r.created_at);
          const score = r.performance_score != null ? Number(r.performance_score).toFixed(1) : '—';
          const improvement = r.improvement_rate != null
            ? (Number(r.improvement_rate) > 0 ? `+${Number(r.improvement_rate).toFixed(1)}%` : `${Number(r.improvement_rate).toFixed(1)}%`)
            : '0.0%';

          return {
            'Date': recDate,
            'Athlete ID': r.athlete_code || `ATH-${String(r.athlete_id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Sport': r.sport_name || 'General',
            'Performance Metric': r.metric_name || 'Standard Benchmark',
            'Recorded Value': r.metric_value != null ? Number(r.metric_value).toFixed(2) : '—',
            'Unit': r.metric_unit || 'units',
            'Score (0-100)': score,
            'Improvement': improvement,
            'Status': Number(score) >= 80 ? 'Exceptional' : Number(score) >= 60 ? 'Satisfactory' : 'Needs Focus',
            'Remarks': r.notes ? r.notes.replace(/[\r\n]+/g, ' ') : 'Standard evaluation completed'
          };
        });
        break;
      }

      case 'fitness': {
        const res = await fitnessService.getAssessments({
          limit: 1000,
          ...dates
        });
        const records =
          res?.data?.data?.assessments ||
          res?.data?.assessments ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        const filtered = selectedSport
          ? records.filter((r) => String(r.sport_id || r.sport_name) === String(selectedSport) || (sports.find(s => String(s.id) === String(selectedSport))?.name === r.sport_name))
          : records;

        cleanRows = filtered.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.athlete_name || 'N/A';
          const assessDate = parseSafeDate(r.assessment_date, r.date, r.created_at);
          const overall = r.overall_fitness_score != null ? Number(r.overall_fitness_score).toFixed(1) : '—';

          return {
            'Date': assessDate,
            'Athlete ID': r.athlete_code || `ATH-${String(r.athlete_id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Sport': r.sport_name || 'General',
            'Strength (pts)': r.strength_score != null ? Number(r.strength_score).toFixed(1) : '—',
            'Endurance (pts)': r.endurance_score != null ? Number(r.endurance_score).toFixed(1) : '—',
            'Stamina (pts)': r.stamina_score != null ? Number(r.stamina_score).toFixed(1) : '—',
            'Agility (pts)': r.agility_score != null ? Number(r.agility_score).toFixed(1) : '—',
            'Flexibility (pts)': r.flexibility_score != null ? Number(r.flexibility_score).toFixed(1) : '—',
            'Speed (pts)': r.speed_score != null ? Number(r.speed_score).toFixed(1) : '—',
            'Overall Score (0-100)': overall,
            'Fitness Rating': Number(overall) >= 85 ? 'Grade A (Elite)' : Number(overall) >= 70 ? 'Grade B (Fit)' : 'Grade C (Developing)',
            'Remarks': r.notes ? r.notes.replace(/[\r\n]+/g, ' ') : 'Assessment logged'
          };
        });
        break;
      }

      case 'attendance': {
        const res = await attendanceService.getRecords({
          limit: 1000,
          ...dates
        });
        const records =
          res?.data?.data?.records ||
          res?.data?.records ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        const filtered = selectedSport
          ? records.filter((r) => String(r.sport_id || r.sport_name) === String(selectedSport) || (sports.find(s => String(s.id) === String(selectedSport))?.name === r.sport_name))
          : records;

        cleanRows = filtered.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.athlete_name || 'N/A';
          const attDate = parseSafeDate(r.attendance_date, r.date, r.created_at);
          const statusRaw = r.status || 'present';
          const formattedStatus = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).replace('_', ' ');

          return {
            'Date': attDate,
            'Athlete ID': r.athlete_code || `ATH-${String(r.athlete_id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Sport': r.sport_name || 'General',
            'Session': r.session || 'Standard',
            'Attendance Status': formattedStatus,
            'Remarks': r.remarks ? r.remarks.replace(/[\r\n]+/g, ' ') : 'Regular training session'
          };
        });
        break;
      }

      case 'selections': {
        const res = await selectionService.getSelections({
          limit: 1000,
          sportId: sportFilter
        });
        const records =
          res?.data?.data?.selections ||
          res?.data?.selections ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        cleanRows = records.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.athlete_name || 'N/A';
          const selDate = parseSafeDate(r.selection_date, r.date, r.created_at);
          const score = r.selection_score != null ? Number(r.selection_score).toFixed(1) : '—';
          const conf = r.confidence_score != null ? `${Number(r.confidence_score).toFixed(0)}%` : '—';
          const statusRaw = r.status || 'pending';
          const formattedStatus = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);

          return {
            'Date': selDate,
            'Athlete ID': r.athlete_code || `ATH-${String(r.athlete_id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Sport': r.sport || r.sport_name || 'General',
            'Category': r.category || 'Open',
            'Program': r.selection_type || 'Annual Academy Trials',
            'Score (0-100)': score,
            'Confidence': conf,
            'Status': formattedStatus,
            'Remarks': r.remarks ? r.remarks.replace(/[\r\n]+/g, ' ') : 'Evaluation processed'
          };
        });
        break;
      }

      case 'athletes': {
        const res = await athleteService.list({
          limit: 1000,
          sport_id: sportFilter
        });
        const records =
          res?.data?.athletes ||
          res?.data?.data?.athletes ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        cleanRows = records.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.full_name || 'N/A';
          const regDate = parseSafeDate(r.registration_date, r.joining_date, r.created_at);
          const genderFormatted = r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : 'N/A';
          const statusRaw = r.current_status || 'active';

          return {
            'Date': regDate,
            'Athlete ID': r.athlete_code || `ATH-${String(r.id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Gender': genderFormatted,
            'Age': r.age || '—',
            'Sport': r.sport_name || 'General',
            'Category': r.category_name || 'Open',
            'Assigned Coach': r.coach_name || 'Unassigned',
            'Status': statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1)
          };
        });
        break;
      }

      case 'rankings': {
        const res = await rankingService.getRankings({
          limit: 1000,
          sportId: sportFilter
        });
        const records =
          res?.data?.rankings ||
          res?.data?.data?.rankings ||
          (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);

        cleanRows = records.map((r, idx) => {
          const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'N/A';
          const rankDate = parseSafeDate(r.rank_date, r.created_at);
          const perf = r.performance_score != null ? Number(r.performance_score).toFixed(1) : '—';
          const fit = r.fitness_score != null ? Number(r.fitness_score).toFixed(1) : '—';
          const cons = r.consistency_score != null ? Number(r.consistency_score).toFixed(1) : '—';
          const totalScore = r.ranking_score != null ? Number(r.ranking_score).toFixed(2) : '—';

          return {
            'Date': rankDate,
            'Rank': `#${r.rank_position || idx + 1}`,
            'Athlete ID': r.athlete_code || `ATH-${String(r.athlete_id || idx + 1).padStart(4, '0')}`,
            'Athlete Name': fullName,
            'Sport': r.sport || 'General',
            'Category': r.category || 'Open',
            'Performance (50%)': perf,
            'Fitness (30%)': fit,
            'Consistency (20%)': cons,
            'Total Score': totalScore,
            'Standing': r.rank_position <= 3 ? 'Podium (Top 3)' : r.rank_position <= 10 ? 'Top 10' : 'Ranked'
          };
        });
        break;
      }

      default:
        cleanRows = [];
    }

    return cleanRows;
  };

  // ─── Export CSV with Excel-Compatible UTF-8 BOM ─────────────────────────────
  const handleExportCSV = async (reportType, reportTitle) => {
    try {
      setExportingCSV(reportType);
      toast.loading(`Preparing ${reportTitle} CSV...`, { id: 'export-toast' });

      const data = await fetchReportData(reportType);

      if (!data || data.length === 0) {
        toast.error('No matching records found for export with current filters.', { id: 'export-toast' });
        return;
      }

      const filename = `SportsInsight_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`;

      // Extract headers from keys
      const headers = Object.keys(data[0]);
      const headerLine = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');

      // Map rows with proper quote escaping
      const rowLines = data.map(row =>
        headers
          .map(h => {
            const val = row[h] != null ? String(row[h]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      // Prepend UTF-8 BOM so Microsoft Excel renders cleanly without garbled characters
      const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${reportTitle} CSV downloaded successfully (${data.length} records)!`, { id: 'export-toast' });
    } catch (err) {
      console.error('Export Error:', err);
      toast.error('Failed to generate CSV export. Please try again.', { id: 'export-toast' });
    } finally {
      setExportingCSV(null);
    }
  };

  // ─── Export PDF with jsPDF & AutoTable ──────────────────────────────────────
  const handleExportPDF = async (reportType, reportTitle) => {
    try {
      setExportingPDF(reportType);
      toast.loading(`Generating ${reportTitle} PDF...`, { id: 'export-toast' });

      const data = await fetchReportData(reportType);

      if (!data || data.length === 0) {
        toast.error('No matching records found for export with current filters.', { id: 'export-toast' });
        return;
      }

      const filename = `SportsInsight_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      // Initialize landscape A4 document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const selectedSportName = selectedSport
        ? sports.find(s => String(s.id) === String(selectedSport))?.name || 'Selected Sport'
        : 'All Sports';
      const timePeriodStr =
        dateRange === '30days' ? 'Last 30 Days' :
        dateRange === '90days' ? 'Last 90 Days' :
        dateRange === 'year' ? 'Last 1 Year' : 'All Time Records';

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, doc.internal.pageSize.width, 65, 'F');

      // Title & Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('SPORTSINSIGHT ACADEMY', 30, 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`${reportTitle.toUpperCase()} — OFFICIAL REPORT`, 30, 48);

      // Metadata on Right Side
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text(`Generated: ${todayStr}`, doc.internal.pageSize.width - 30, 25, { align: 'right' });
      doc.text(`Filter: ${selectedSportName} | ${timePeriodStr}`, doc.internal.pageSize.width - 30, 39, { align: 'right' });
      doc.text(`Total Records: ${data.length}`, doc.internal.pageSize.width - 30, 53, { align: 'right' });

      // Build Table
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(h => item[h] ?? '—'));

      autoTable(doc, {
        startY: 80,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59], // slate-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        margin: { top: 80, bottom: 35, left: 25, right: 25 },
        didDrawPage: (pageData) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Page ${pageData.pageNumber} of ${pageCount}  •  SportsInsight Performance & Talent Intelligence System  •  Confidential Academy Record`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 15,
            { align: 'center' }
          );
        }
      });

      doc.save(filename);
      toast.success(`${reportTitle} PDF downloaded successfully (${data.length} records)!`, { id: 'export-toast' });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: 'export-toast' });
    } finally {
      setExportingPDF(null);
    }
  };

  // ─── Live Preview Modal Handler ─────────────────────────────────────────────
  const handleOpenPreview = async (reportType, title) => {
    setPreviewModal({
      isOpen: true,
      title,
      reportType,
      loading: true,
      data: []
    });

    try {
      const data = await fetchReportData(reportType);
      setPreviewModal({
        isOpen: true,
        title,
        reportType,
        loading: false,
        data
      });
    } catch (err) {
      toast.error('Failed to load report preview.');
      setPreviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Available Report Catalog
  const reportCards = [
    {
      id: 'performance',
      title: 'Performance Metrics Report',
      subtitle: 'Athlete-wise performance benchmarks, recorded metric values, units, benchmark ratings, and improvement rates with recorded dates.',
      icon: Activity,
      iconBg: 'bg-primary/10 text-primary',
      badge: 'Performance & Metrics',
      category: 'Analytics'
    },
    {
      id: 'fitness',
      title: 'Fitness Assessment Summary',
      subtitle: 'Strength, endurance, stamina, agility, flexibility, speed parameters, overall athletic fitness ratings, and assessment dates.',
      icon: BarChart3,
      iconBg: 'bg-cyan-500/10 text-cyan-500',
      badge: 'Physical Conditioning',
      category: 'Fitness'
    },
    {
      id: 'attendance',
      title: 'Attendance & Discipline Logs',
      subtitle: 'Session-wise attendance records (Morning/Evening), exact session dates, attendance statuses, and coach remarks.',
      icon: Calendar,
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      badge: 'Training Compliance',
      category: 'Operations'
    },
    {
      id: 'selections',
      title: 'Scouting & Selection Audit',
      subtitle: 'Trial scores, evaluation programs, review dates, AI confidence ratings, evaluator notes, and selection status history.',
      icon: Award,
      iconBg: 'bg-purple-500/10 text-purple-600',
      badge: 'Scouting & Trials',
      category: 'Talent'
    },
    {
      id: 'rankings',
      title: 'Academy Rankings & Standings',
      subtitle: 'Official leaderboard rankings with composite weights (50% Perf, 30% Fitness, 20% Consistency), rank dates, and standings.',
      icon: Trophy,
      iconBg: 'bg-amber-500/10 text-amber-500',
      badge: 'Leaderboard',
      category: 'Rankings'
    },
    {
      id: 'athletes',
      title: 'Athletes Academy Roster',
      subtitle: 'Active athletic roster directory, sports, categories, age, registration dates, assigned coaches, and academy membership status.',
      icon: Users,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      badge: 'Master Roster',
      category: 'Athletes'
    },
  ];

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Academy Reports & Data Export Center"
        subtitle="Generate, preview, and download structured administrative and athletic reports in CSV and PDF formats with date tracking and data privacy protection."
        breadcrumb="Reports"
      />

      {/* Privacy Notice Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 shrink-0" />
          <span>
            <strong>Data Privacy Guaranteed:</strong> All exported reports contain only official athletic performance data and exclude sensitive personal/medical details.
          </span>
        </div>
        <span className="shrink-0 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Formats Available: RFC-4180 CSV / Printable PDF Document
        </span>
      </div>

      {/* Global Filter Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter size={16} className="text-primary" />
            <span>Filter Report Parameters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sport Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Sport:</span>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Sports</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Time Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Time Records</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last 1 Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isCurrentlyExportingCSV = exportingCSV === card.id;
          const isCurrentlyExportingPDF = exportingPDF === card.id;

          return (
            <div
              key={card.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 hover:border-primary/30"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`grid size-11 place-items-center rounded-xl ${card.iconBg}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground border border-border">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-card-foreground">{card.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(card.id, card.title)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                    title="Preview data table before downloading"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    Preview
                  </button>

                  {/* CSV Export Button */}
                  <button
                    type="button"
                    disabled={isCurrentlyExportingCSV || isCurrentlyExportingPDF}
                    onClick={() => handleExportCSV(card.id, card.title)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary transition disabled:opacity-50"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-500" />
                    {isCurrentlyExportingCSV ? 'CSV...' : 'CSV'}
                  </button>

                  {/* PDF Export Button */}
                  <button
                    type="button"
                    disabled={isCurrentlyExportingCSV || isCurrentlyExportingPDF}
                    onClick={() => handleExportPDF(card.id, card.title)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    <FileType className="size-3.5" />
                    {isCurrentlyExportingPDF ? 'PDF...' : 'PDF'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── PREVIEW MODAL ──────────────────────────────────────────────────────── */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 fade-in">
          <div className="relative w-full max-w-5xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{previewModal.title} — Data Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Showing formatted records with dates and clean nomenclature. Total records: {previewModal.data.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto rounded-xl border border-border bg-background">
              {previewModal.loading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  Fetching and formatting report records...
                </div>
              ) : previewModal.data.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No records found matching the active filters.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-secondary/70 sticky top-0 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      {Object.keys(previewModal.data[0]).map((head) => (
                        <th key={head} className="px-3 py-2.5 whitespace-nowrap">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewModal.data.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-foreground font-medium">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                {previewModal.data.length > 50 ? `Displaying first 50 of ${previewModal.data.length} records. Download CSV/PDF for complete dataset.` : `All ${previewModal.data.length} records displayed.`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-lg border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV(previewModal.reportType, previewModal.title);
                    setPreviewModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary transition"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-500" />
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPDF(previewModal.reportType, previewModal.title);
                    setPreviewModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
                >
                  <FileType className="size-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
