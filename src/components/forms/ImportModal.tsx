import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileUp, Loader2 } from 'lucide-react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { exportToExcel } from '../../utils/excelExport';
import {
  downloadImportTemplate,
  exportBackupJSON,
  parseExcelFile,
  type ImportResult,
} from '../../utils/excelImport';
import type { AppData } from '../../types';

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, replaceData } = usePSV();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setResult(null);
    setError(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadReport = async () => {
    setExporting(true);
    setError(null);
    try {
      await exportToExcel(data);
    } catch {
      setError('Could not create the Excel report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const onExcelSelected = async (file: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const r = await parseExcelFile(file);
      if (r.counts.psvs === 0) {
        setError('No PSV rows were found. Check that the sheet matches the import template columns.');
      } else {
        setResult(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  const applyImport = () => {
    if (!result) return;
    const merged: AppData = {
      equipment: [...data.equipment, ...result.data.equipment],
      locations: [...data.locations, ...result.data.locations],
      psvs: [...data.psvs, ...result.data.psvs],
    };
    replaceData(merged);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      title="Import data"
      description="Upload new PSV rows, or download a blank template. For a full snapshot of your data, use Download Excel report."
      footer={
        <button className="btn-secondary" onClick={handleClose}>
          Close
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Download Excel report</h3>
              <p className="mt-1 text-sm text-slate-600">
                Full export with 5 sheets: All PSVs, Installed, Out for Service, Overdue, and Upcoming Due.
              </p>
              <p className="mt-1 text-xs text-slate-500">File name: PSV-Full-Report-*.xlsx</p>
            </div>
            <button
              className="btn-primary shrink-0"
              onClick={handleDownloadReport}
              disabled={exporting || data.psvs.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Download report
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Step 1 · Blank import template
            </h3>
            <button className="btn-secondary" onClick={() => downloadImportTemplate()}>
              <Download className="h-4 w-4" />
              Download import template
            </button>
          </div>
          <p className="text-sm text-slate-500">
            For adding new PSVs only — one example row plus instructions. Not your live data export.
            File name: PSV-Import-Template.xlsx
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            Step 2 · Upload your file
          </h3>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onExcelSelected(f);
            }}
          />
          <button
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-slate-500 transition-colors hover:border-maroon-300 hover:bg-maroon-50/40"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <FileUp className="h-6 w-6" />
            )}
            <span className="text-sm font-semibold">
              {fileName || 'Choose an Excel or CSV file…'}
            </span>
          </button>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Ready to import <strong>{result.counts.psvs}</strong> PSV(s) across{' '}
                  <strong>{result.counts.equipment}</strong> equipment and{' '}
                  <strong>{result.counts.locations}</strong> location(s).
                </span>
              </div>
              {result.warnings.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {result.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={applyImport}>
                  Add to existing data
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            JSON backup
          </h3>
          <p className="mb-3 text-sm text-slate-500">
            Save a complete, lossless backup of everything (including full history).
          </p>
          <button className="btn-secondary" onClick={() => exportBackupJSON(data)}>
            <Download className="h-4 w-4" />
            Export backup (JSON)
          </button>
        </section>
      </div>
    </Modal>
  );
}
