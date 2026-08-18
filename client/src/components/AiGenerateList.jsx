import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { Panel, ScoreBar } from "./widgets";
import dashboardAPI from "../services/dashboard.service";
import { sportService } from "../services/sportService";

const ageGroupOptions = ["All Ages", "10-15", "16-20", "21+"];
const genderOptions = ["All Genders", "Male", "Female"];

function Select({ label, value, onChange, options, valueMap }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      >
        {options.map((o, idx) => (
          <option key={typeof o === 'object' ? o.id : o} value={valueMap ? valueMap[idx] : (typeof o === 'object' ? o.id : o)}>
            {typeof o === 'object' ? o.name : o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AiGenerateList({ scopeNote, predefinedListTypes }) {
  const [listTypes, setListTypes] = useState(predefinedListTypes || []);
  const [sports, setSports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeId, setTypeId] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sportService.listSports({ limit: 100 })
      .then((res) => {
        const list = res.data?.data || res.data?.sports || res.data || [];
        if (Array.isArray(list)) {
          setSports(list);
          if (list.length === 1) {
            setSport(String(list[0].id));
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    sportService.listCategories({ ...(sport ? { sport_id: sport } : {}), limit: 100 })
      .then((res) => {
        const list = res.data?.data || res.data?.categories || res.data || [];
        if (Array.isArray(list)) setCategories(list);
      })
      .catch(() => {});
  }, [sport]);

  useEffect(() => {
    if (!predefinedListTypes || predefinedListTypes.length === 0) {
      dashboardAPI.getListTypes()
        .then((res) => {
          const fetchedTypes = res?.data?.listTypes || res?.listTypes || [];
          setListTypes(fetchedTypes);
          if (fetchedTypes.length > 0) setTypeId(fetchedTypes[0].key || fetchedTypes[0].id);
        })
        .catch(() => {});
    } else if (predefinedListTypes.length > 0) {
      setTypeId(predefinedListTypes[0].key || predefinedListTypes[0].id);
    }
  }, [predefinedListTypes]);

  const listTypeObj = listTypes.find((l) => (l.key || l.id) === typeId);

  async function run() {
    if (!typeId) {
      toast.error('Please select a list type');
      return;
    }

    setLoading(true);
    setRows(null);
    try {
      const payload = {
        listType: typeId,
        sportId: sport,
        categoryId: category,
        gender: gender === "All Genders" ? "" : gender.toLowerCase(),
        ageMin: ageGroup === "10-15" ? "10" : ageGroup === "16-20" ? "16" : ageGroup === "21+" ? "21" : "",
        ageMax: ageGroup === "10-15" ? "15" : ageGroup === "16-20" ? "20" : ageGroup === "21+" ? "" : "",
        dateFrom: from,
        dateTo: to,
      };
      
      Object.keys(payload).forEach((k) => {
        if (!payload[k]) delete payload[k];
      });

      const res = await dashboardAPI.generateAIList(payload);
      const resultData = res?.data || res;
      setRows(resultData?.athletes || []);
      if (!resultData?.athletes || resultData.athletes.length === 0) {
        toast.error("No athletes match the selected filters");
      } else {
        toast.success("AI Athlete List generated successfully!");
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate list');
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => {
    if (!rows || rows.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Rank', 'Athlete Code', 'Name', 'Sport', 'Category', 'Age', 'Gender', 'Coach',
      'Performance Score', 'Fitness Score', 'Attendance Score (%)', 'Selection Score',
      'Confidence Score (%)', 'Reason', 'Suggested Improvement'
    ];

    const csvRows = rows.map((a) => [
      a.rank, `"${a.athleteCode || ''}"`, `"${a.name}"`, `"${a.sport}"`, `"${a.category || ''}"`,
      a.age || '', a.gender || '', `"${a.coach || ''}"`, a.performanceScore || a.performance || 0,
      a.fitnessScore || a.fitness || 0, a.attendanceScore || a.attendance || 0, a.selectionScore || 0,
      a.confidenceScore || a.confidence || 0, `"${a.reason || ''}"`, `"${a.suggestedImprovement || a.suggestion || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(listTypeObj?.label || 'export').replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel/CSV export downloaded!');
  };

  const handleExportPDF = () => {
    if (!rows || rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    window.print();
  };

  return (
    <Panel
      title="AI + ML Generate List"
      description={scopeNote}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
          <Sparkles className="size-3.5" /> Intelligence engine
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Sport</span>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="">{sports.length > 1 ? "All Assigned Sports" : "-- Select Sport --"}</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <Select label="Age group" value={ageGroup} onChange={setAgeGroup} options={ageGroupOptions} />
        <Select label="Gender" value={gender} onChange={setGender} options={genderOptions} />
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="sm:col-span-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Generate list type</span>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            >
              <option value="">-- Select List Type --</option>
              {listTypes.map((l) => (
                <option key={l.key || l.id} value={l.key || l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate
        </button>
        {listTypeObj && (
          <span className="text-xs text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{listTypeObj.label}</span>
          </span>
        )}
        {rows && rows.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary"
            >
              <Download className="size-3.5" /> Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary"
            >
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-5 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <p className="mb-3 text-xs text-muted-foreground">
            {rows.length} athletes ranked based on current filters.
          </p>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Athlete</th>
                <th className="py-2 pr-3">Performance</th>
                <th className="py-2 pr-3">Fitness</th>
                <th className="py-2 pr-3">Attendance</th>
                <th className="py-2 pr-3">Selection</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2">Suggested improvement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id || r.athleteId || r.name} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3 tabular-nums text-muted-foreground">{r.rank}</td>
                  <td className="py-3 pr-3">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.sport} {r.ageGroup ? `· ${r.ageGroup}` : ''} {r.gender ? `· ${r.gender}` : ''}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <ScoreBar value={r.performanceScore || r.performance || 0} />
                  </td>
                  <td className="py-3 pr-3">
                    <ScoreBar value={r.fitnessScore || r.fitness || 0} tone="success" />
                  </td>
                  <td className="py-3 pr-3">
                    <ScoreBar value={r.attendanceScore || r.attendance || 0} tone="warning" />
                  </td>
                  <td className="py-3 pr-3 font-semibold tabular-nums">{r.selectionScore || 0}</td>
                  <td className="py-3 pr-3 tabular-nums text-accent">{(r.confidenceScore || r.confidence || 0)}%</td>
                  <td className="max-w-[220px] py-3 pr-3 text-xs text-muted-foreground">{r.reason}</td>
                  <td className="max-w-[200px] py-3 text-xs text-muted-foreground">{r.suggestedImprovement || r.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows && rows.length === 0 && (
        <p className="mt-5 rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
          No athlete records match these filters. Widen the sport, category or age group selection.
        </p>
      )}
    </Panel>
  );
}
