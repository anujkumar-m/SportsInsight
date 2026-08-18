import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';

export default function ImportAthleteModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // ─── Download Sample CSV Template ───────────────────────────
  const handleDownloadSample = () => {
    const sampleHeaders = [
      'First Name',
      'Last Name',
      'Email',
      'Gender',
      'Date of Birth',
      'Sport',
      'Category',
      'Phone',
      'Height (cm)',
      'Weight (kg)',
      'Blood Group',
      'Medical Status',
      'Academy Name',
      'City',
      'State',
      'Guardian Name',
      'Guardian Phone'
    ];

    const sampleRows = [
      [
        'Aarav',
        'Sharma',
        'aarav.sharma@example.com',
        'male',
        '2007-06-15',
        'Athletics',
        'U-17 Boys',
        '9876543210',
        '175',
        '65',
        'O+',
        'fit',
        'State Sports Academy',
        'Mumbai',
        'Maharashtra',
        'Rajesh Sharma',
        '9876543211'
      ],
      [
        'Ananya',
        'Verma',
        'ananya.verma@example.com',
        'female',
        '2008-04-20',
        'Badminton',
        'U-17 Girls',
        '9876543212',
        '162',
        '52',
        'B+',
        'fit',
        'State Sports Academy',
        'Bengaluru',
        'Karnataka',
        'Sunita Verma',
        '9876543213'
      ],
      [
        'Rohan',
        'Patel',
        'rohan.patel@example.com',
        'male',
        '2006-09-10',
        'Swimming',
        'Senior Men',
        '9876543214',
        '180',
        '72',
        'A+',
        'fit',
        'State Sports Academy',
        'Ahmedabad',
        'Gujarat',
        'Mahesh Patel',
        '9876543215'
      ]
    ];

    const csvContent =
      '\uFEFF' +
      [
        sampleHeaders.map(h => `"${h}"`).join(','),
        ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_athlete_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample athlete template downloaded!');
  };

  // ─── Parse CSV Helper ───────────────────────────────────────
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new Error('CSV must contain at least a header line and one data row.');

    // Function to parse single CSV line taking quotes into account
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const headerMap = {};

    rawHeaders.forEach((h, idx) => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.includes('firstname') || clean === 'first') headerMap['first_name'] = idx;
      else if (clean.includes('lastname') || clean === 'last') headerMap['last_name'] = idx;
      else if (clean.includes('name') && !headerMap['first_name']) headerMap['first_name'] = idx;
      else if (clean.includes('email') || clean === 'mail') headerMap['email'] = idx;
      else if (clean.includes('gender') || clean === 'sex') headerMap['gender'] = idx;
      else if (clean.includes('dob') || clean.includes('birth') || clean.includes('dateofbirth')) headerMap['date_of_birth'] = idx;
      else if (clean.includes('sport')) headerMap['sport_name'] = idx;
      else if (clean.includes('category') || clean === 'agegroup') headerMap['category_name'] = idx;
      else if (clean.includes('phone') || clean.includes('mobile') || clean === 'contact') headerMap['phone'] = idx;
      else if (clean.includes('height')) headerMap['height_cm'] = idx;
      else if (clean.includes('weight')) headerMap['weight_kg'] = idx;
      else if (clean.includes('blood')) headerMap['blood_group'] = idx;
      else if (clean.includes('medical') || clean.includes('medstatus')) headerMap['medical_status'] = idx;
      else if (clean.includes('academy')) headerMap['academy_name'] = idx;
      else if (clean.includes('city')) headerMap['city'] = idx;
      else if (clean.includes('state')) headerMap['state'] = idx;
      else if (clean.includes('guardianname') || clean.includes('parent')) headerMap['guardian_name'] = idx;
      else if (clean.includes('guardianphone') || clean.includes('parentphone')) headerMap['guardian_phone'] = idx;
    });

    const parsedAthletes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every(v => v === '')) continue; // Skip blank lines

      const athlete = {};
      Object.keys(headerMap).forEach((key) => {
        const colIdx = headerMap[key];
        athlete[key] = values[colIdx] || '';
      });

      // Basic validation
      if (!athlete.first_name && !athlete.last_name) {
        athlete.first_name = `Athlete ${i}`;
      }

      parsedAthletes.push(athlete);
    }

    return parsedAthletes;
  };

  // ─── File Selection ─────────────────────────────────────────
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a valid .csv file.');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const athletes = parseCSVText(text);
        if (athletes.length === 0) {
          throw new Error('No valid athlete records found in CSV file.');
        }
        setParsedData(athletes);
        toast.success(`Successfully parsed ${athletes.length} athlete records.`);
      } catch (err) {
        setParseError(err.message || 'Failed to parse CSV file.');
        setParsedData([]);
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Error reading the CSV file.');
      setParsing(false);
    };
    reader.readAsText(selectedFile);
  };

  // ─── Execute Import ─────────────────────────────────────────
  const handleExecuteImport = async () => {
    if (!parsedData.length) {
      toast.error('No athlete records to import.');
      return;
    }

    setImporting(true);
    try {
      toast.loading(`Importing ${parsedData.length} athletes...`, { id: 'import-toast' });
      const res = await athleteService.importData(parsedData);
      
      const createdCount = res.data?.data?.created ?? res.data?.created ?? parsedData.length;
      const failedCount = res.data?.data?.failed ?? res.data?.failed ?? 0;

      if (failedCount > 0) {
        toast.success(`Import complete: ${createdCount} created, ${failedCount} skipped.`, { id: 'import-toast' });
      } else {
        toast.success(`All ${createdCount} athletes imported successfully!`, { id: 'import-toast' });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err.response?.data?.message || 'Failed to import athletes.', { id: 'import-toast' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Upload className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Import Athletes via CSV</h3>
              <p className="text-xs text-muted-foreground">
                Batch upload athlete records using a standard CSV spreadsheet file.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Action Row: Sample Template & Format Info */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="size-4 text-primary" />
                Need the correct CSV format?
              </span>
              <p className="text-muted-foreground">
                Download the official template pre-filled with sample athlete data and exact headers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
            >
              <Download className="size-3.5" />
              Download Sample CSV
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
              {parsing ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {file ? file.name : 'Click to upload or drag & drop CSV file'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {file ? `${(file.size / 1024).toFixed(1)} KB — Click to change file` : 'Supports standard UTF-8 .csv files with header row'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Preview: {parsedData.length} records ready to import
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Showing first {Math.min(parsedData.length, 5)} rows
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-secondary/70 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2">Athlete Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">DOB</th>
                      <th className="px-3 py-2">Sport</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30">
                        <td className="px-3 py-1.5 font-medium text-foreground">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.email || 'Auto-generated'}</td>
                        <td className="px-3 py-1.5 capitalize text-muted-foreground">{row.gender || 'male'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.date_of_birth || '—'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.sport_name || 'General'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.category_name || 'Open'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Format Reference Guide */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5 text-[11px] text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1">
              <HelpCircle className="size-3.5 text-primary" /> Supported CSV Column Headers:
            </p>
            <p className="leading-relaxed">
              <code className="text-primary font-mono">First Name</code>, <code className="text-primary font-mono">Last Name</code>, <code className="text-primary font-mono">Email</code>, <code className="text-primary font-mono">Gender</code> (male/female), <code className="text-primary font-mono">Date of Birth</code> (YYYY-MM-DD), <code className="text-primary font-mono">Sport</code>, <code className="text-primary font-mono">Category</code>, <code className="text-primary font-mono">Phone</code>, <code className="text-primary font-mono">Height (cm)</code>, <code className="text-primary font-mono">Weight (kg)</code>, <code className="text-primary font-mono">Blood Group</code>, <code className="text-primary font-mono">Medical Status</code> (fit/unfit/injured).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!parsedData.length || importing}
            onClick={handleExecuteImport}
            leftIcon={importing ? Loader2 : Upload}
          >
            {importing ? 'Importing Athletes...' : `Import ${parsedData.length} Athletes`}
          </Button>
        </div>
      </div>
    </div>
  );
}
