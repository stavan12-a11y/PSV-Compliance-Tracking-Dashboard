import { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ComplianceSnapshot } from '../types';
import { formatDate } from '../utils/dates';
import { recentComplianceHistory } from '../utils/complianceHistory';

interface ComplianceTrendPanelProps {
  history: ComplianceSnapshot[] | undefined;
  days?: number;
}

export function ComplianceTrendPanel({ history, days = 30 }: ComplianceTrendPanelProps) {
  const trend = useMemo(() => recentComplianceHistory(history, days), [history, days]);

  const latest = trend[trend.length - 1];
  const previous = trend.length > 1 ? trend[trend.length - 2] : null;
  const delta = latest && previous ? latest.complianceRate - previous.complianceRate : 0;

  const chart = useMemo(() => {
    if (trend.length < 2) return null;
    const width = 560;
    const height = 120;
    const padX = 8;
    const padY = 12;
    const rates = trend.map((t) => t.complianceRate);
    const min = Math.max(0, Math.min(...rates) - 5);
    const max = Math.min(100, Math.max(...rates) + 5);
    const span = max - min || 1;

    const points = trend
      .map((t, i) => {
        const x = padX + (i / (trend.length - 1)) * (width - padX * 2);
        const y = padY + (1 - (t.complianceRate - min) / span) * (height - padY * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return { width, height, points, min, max };
  }, [trend]);

  if (!trend.length) {
    return (
      <section className="card p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Compliance % Trend
        </h3>
        <p className="mt-3 text-sm text-slate-500">
          Daily compliance tracking will appear here once valve data is loaded.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Compliance % Trend
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Last {trend.length} day{trend.length === 1 ? '' : 's'} · included in Excel export
          </p>
        </div>
        {latest && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{latest.complianceRate}%</p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-slate-500">
              {delta !== 0 ? (
                delta > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                )
              ) : null}
              <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : ''}>
                {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : 'no change'} vs prior day
              </span>
            </p>
          </div>
        )}
      </div>

      {chart && (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-28 w-full min-w-[280px]"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-maroon-700"
              points={chart.points}
            />
          </svg>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Compliant %</th>
              <th className="px-3 py-2">Installed</th>
              <th className="px-3 py-2">Compliant</th>
              <th className="px-3 py-2">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...trend].reverse().slice(0, 7).map((row) => (
              <tr key={row.date}>
                <td className="px-3 py-2 text-slate-700">{formatDate(row.date)}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">{row.complianceRate}%</td>
                <td className="px-3 py-2 text-slate-600">{row.installed}</td>
                <td className="px-3 py-2 text-slate-600">{row.compliant}</td>
                <td className="px-3 py-2 text-slate-600">{row.overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
