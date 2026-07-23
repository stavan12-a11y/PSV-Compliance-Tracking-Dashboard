import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  Pencil,
  Plus,
  ToggleRight,
  RefreshCw,
  Trash2,
  Wrench,
} from 'lucide-react';
import { usePSV } from '../store/PSVContext';
import { getCompliance, lastReplacementDate, lastServiceDate } from '../utils/compliance';
import { sortEventsNewestFirst, statusChangeEvents, useAndReplaceHistory } from '../utils/events';
import { exportPSVToExcel } from '../utils/excelExport';
import { psvDisplayName, psvPrimaryLabel } from '../utils/psvDisplay';
import { formatDate, formatDateTime, relativeDays, RECERT_INTERVAL_YEARS } from '../utils/dates';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ComplianceBadge, StatusBadge } from '../components/Badges';
import { PSVFormModal } from '../components/forms/PSVFormModal';
import { EventFormModal } from '../components/forms/EventFormModal';
import { RepairFormModal } from '../components/forms/RepairFormModal';
import { ReplacementFormModal } from '../components/forms/ReplacementFormModal';
import type { PSVDatasheet, PSVEvent, PSVRepairRecord } from '../types';

export function PSVDetailPage() {
  const { psvId = '' } = useParams();
  const navigate = useNavigate();
  const { data, getPSV, getLocation, getEquipment, deletePSV, deleteHistoryEvent, deleteRepairRecord } =
    usePSV();

  const psv = getPSV(psvId);
  const location = psv ? getLocation(psv.locationId) : undefined;
  const equipment = location ? getEquipment(location.equipmentId) : undefined;

  const [editPSV, setEditPSV] = useState(false);
  const [addEvent, setAddEvent] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [addRepair, setAddRepair] = useState(false);
  const [editRepairId, setEditRepairId] = useState<string | null>(null);
  const [showReplace, setShowReplace] = useState(false);
  const [editReplacementId, setEditReplacementId] = useState<string | null>(null);

  const sortedEvents = useMemo(() => {
    if (!psv) return [];
    if (psv.useAndReplace) {
      return sortEventsNewestFirst(useAndReplaceHistory(psv.events));
    }
    return sortEventsNewestFirst(statusChangeEvents(psv.events));
  }, [psv]);

  const sortedRepairs = useMemo(() => {
    if (!psv?.repairHistory?.length) return [];
    return [...psv.repairHistory].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.recordedAt < b.recordedAt ? 1 : -1;
    });
  }, [psv]);

  if (!psv) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500">PSV not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const compliance = getCompliance(psv);
  const useAndReplace = Boolean(psv.useAndReplace);
  const certAnchorLabel = useAndReplace
    ? lastReplacementDate(psv)
      ? 'Last Replacement'
      : 'Installed'
    : psv.servicedOnSite
      ? 'Last Service Date'
      : 'Last Install Date';
  const certAnchorValue = useAndReplace
    ? formatDate(lastReplacementDate(psv) ?? compliance.lastInstallDate)
    : formatDate(
        psv.servicedOnSite ? lastServiceDate(psv) ?? compliance.lastInstallDate : compliance.lastInstallDate,
      );
  const dueBasis = useAndReplace ? 'replacement' : psv.servicedOnSite ? 'service' : 'install';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          ...(equipment ? [{ label: equipment.name, to: `/equipment/${equipment.id}` }] : []),
          ...(location ? [{ label: location.name, to: `/location/${location.id}` }] : []),
          { label: psvDisplayName(psv) },
        ]}
      />

      {useAndReplace ? (
        <>
          <div className="card overflow-hidden">
            <div className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-800/70">
                    {psvPrimaryLabel(psv)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-900">{psvDisplayName(psv)}</h2>
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-sm font-semibold text-orange-900">
                      Use &amp; Replace
                    </span>
                    <ComplianceBadge state={compliance.state} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {equipment?.name} · {location?.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => exportPSVToExcel(data, psv)}
                    title="Export this PSV's datasheet and full history to Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </button>
                  <button className="btn-secondary" onClick={() => setEditPSV(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="btn-primary" onClick={() => setShowReplace(true)}>
                    <RefreshCw className="h-4 w-4" />
                    Record Replacement
                  </button>
                  <button
                    className="btn-secondary text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Delete PSV ${psvDisplayName(psv)}? This cannot be undone.`)) {
                        deletePSV(psv.id);
                        navigate(location ? `/location/${location.id}` : '/');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <CommercialStat label={certAnchorLabel} value={certAnchorValue} />
              <CommercialStat
                label={`Due (${dueBasis} + ${RECERT_INTERVAL_YEARS} yrs)`}
                value={compliance.dueDate ? formatDate(compliance.dueDate) : 'Not installed'}
                sub={compliance.dueDate ? relativeDays(compliance.daysRemaining) : undefined}
                tone={
                  compliance.state === 'overdue'
                    ? 'danger'
                    : compliance.state === 'due_soon'
                      ? 'warn'
                      : 'normal'
                }
              />
              <CommercialStat label="Tracking" value="Commercial boiler · buy new when due" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <section className="card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-maroon-700" />
                <h3 className="text-base font-bold text-slate-900">Safety Valve Info</h3>
              </div>
              <CommercialSpecGrid sheet={psv.datasheet} />
            </section>

            <section className="card flex flex-col p-5 lg:col-span-3">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarClock className="h-4 w-4 text-maroon-700" />
                <h3 className="text-base font-bold text-slate-900">Replacement History</h3>
              </div>
              <CommercialHistoryList
                events={sortedEvents}
                onEdit={(event) => {
                  if (
                    event.type === 'replacement' ||
                    (event.type === 'status-change' && event.status === 'installed')
                  ) {
                    setEditReplacementId(event.id);
                  }
                }}
                onDelete={(eventId) => {
                  if (confirm('Delete this history entry?')) deleteHistoryEvent(psv.id, eventId);
                }}
              />
            </section>
          </div>
        </>
      ) : (
        <>
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {psvPrimaryLabel(psv)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{psvDisplayName(psv)}</h2>
              {psv.inventoryId && (
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sm font-semibold text-sky-800">
                  {psv.inventoryId}
                </span>
              )}
              {psv.tag && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600">
                  {psv.tag}
                </span>
              )}
              <StatusBadge status={psv.status} />
              <ComplianceBadge state={compliance.state} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {equipment?.name} · {location?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              onClick={() => exportPSVToExcel(data, psv)}
              title="Export this PSV's datasheet and full history to Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            <button className="btn-secondary" onClick={() => setEditPSV(true)}>
              <Pencil className="h-4 w-4" />
              Edit PSV
            </button>
            <button
              className="btn-secondary text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Delete PSV ${psvDisplayName(psv)}? This cannot be undone.`)) {
                  deletePSV(psv.id);
                  navigate(location ? `/location/${location.id}` : '/');
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KeyFact icon={Wrench} label={certAnchorLabel} value={certAnchorValue} />
          <KeyFact
            icon={CalendarClock}
            label={`Recert Due (${dueBasis} + ${RECERT_INTERVAL_YEARS} yrs)`}
            value={compliance.dueDate ? formatDate(compliance.dueDate) : 'Not installed'}
            sub={compliance.dueDate ? relativeDays(compliance.daysRemaining) : undefined}
            tone={
              compliance.state === 'overdue'
                ? 'danger'
                : compliance.state === 'due_soon'
                  ? 'warn'
                  : 'normal'
            }
          />
          <KeyFact
            icon={ToggleRight}
            label="Tracking"
            value={
              psv.servicedOnSite
                ? 'Serviced on site'
                : statusText(psv.status)
            }
          />
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-maroon-700" />
          <h3 className="text-lg font-bold text-slate-900">Datasheet</h3>
        </div>
        <DatasheetGrid sheet={psv.datasheet} inventoryId={psv.inventoryId} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card flex min-h-[20rem] flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-maroon-700" />
              <h3 className="text-base font-bold text-slate-900">Status History</h3>
            </div>
            <button className="btn-primary px-2.5 py-1.5 text-xs" onClick={() => setAddEvent(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Entry
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No status history recorded yet.</p>
            ) : (
              <ol className="relative space-y-1 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">
                {sortedEvents.map((event) => (
                  <HistoryItem
                    key={event.id}
                    event={event}
                    onEdit={() => setEditEventId(event.id)}
                    onDelete={() => {
                      if (confirm('Delete this history entry?')) deleteHistoryEvent(psv.id, event.id);
                    }}
                  />
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="card flex min-h-[20rem] flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-maroon-700" />
              <h3 className="text-base font-bold text-slate-900">Repair / Overhaul</h3>
            </div>
            <button className="btn-primary px-2.5 py-1.5 text-xs" onClick={() => setAddRepair(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Repair
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedRepairs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No repair or overhaul records yet.</p>
            ) : (
              <ol className="relative space-y-1 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">
                {sortedRepairs.map((record) => (
                  <RepairItem
                    key={record.id}
                    record={record}
                    onEdit={() => setEditRepairId(record.id)}
                    onDelete={() => {
                      if (confirm('Delete this repair / overhaul entry?')) deleteRepairRecord(psv.id, record.id);
                    }}
                  />
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
        </>
      )}

      <PSVFormModal open={editPSV} psvId={psv.id} onClose={() => setEditPSV(false)} />
      <ReplacementFormModal open={showReplace} psvId={psv.id} onClose={() => setShowReplace(false)} />
      <ReplacementFormModal
        open={editReplacementId !== null}
        psvId={psv.id}
        eventId={editReplacementId ?? undefined}
        onClose={() => setEditReplacementId(null)}
      />
      <EventFormModal open={addEvent} psvId={psv.id} statusChangesOnly onClose={() => setAddEvent(false)} />
      <EventFormModal
        open={editEventId !== null}
        psvId={psv.id}
        eventId={editEventId ?? undefined}
        statusChangesOnly
        onClose={() => setEditEventId(null)}
      />
      <RepairFormModal open={addRepair} psvId={psv.id} onClose={() => setAddRepair(false)} />
      <RepairFormModal
        open={editRepairId !== null}
        psvId={psv.id}
        repairId={editRepairId ?? undefined}
        onClose={() => setEditRepairId(null)}
      />
    </div>
  );
}

function CommercialStat({
  label,
  value,
  sub,
  tone = 'normal',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'normal' | 'warn' | 'danger';
}) {
  const subColor =
    tone === 'danger' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-slate-500';
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
      {sub && <p className={`mt-0.5 text-sm font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

function CommercialSpecGrid({ sheet }: { sheet: PSVDatasheet }) {
  const specs: Array<[string, string]> = [
    ['Make', sheet.make],
    ['Model', sheet.model],
    ['Set pressure', sheet.setPressure ? `${sheet.setPressure} ${sheet.pressureUnit}` : ''],
    ['Rating', sheet.capacity],
    ['Inlet', sheet.inletSize],
    ['Outlet', sheet.outletSize],
  ].filter(([, value]) => value.trim() !== '') as Array<[string, string]>;

  if (specs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        No valve specs on file. Use Edit to add make, model, pressure, and sizes.
      </p>
    );
  }

  return (
    <dl className="space-y-2">
      {specs.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CommercialHistoryList({
  events,
  onEdit,
  onDelete,
}: {
  events: PSVEvent[];
  onEdit: (event: PSVEvent) => void;
  onDelete: (eventId: string) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No installation or replacement recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-2 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">
      {events.map((event) => (
        <HistoryItem
          key={event.id}
          event={event}
          useAndReplace
          onEdit={() => onEdit(event)}
          onDelete={() => onDelete(event.id)}
        />
      ))}
    </ol>
  );
}

function statusText(status: string) {
  return status === 'installed'
    ? 'Installed'
    : status === 'out_for_service'
      ? 'Out for Service'
      : 'In Inventory';
}

function KeyFact({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'normal',
}: {
  icon: typeof Wrench;
  label: string;
  value: string;
  sub?: string;
  tone?: 'normal' | 'warn' | 'danger';
}) {
  const subColor =
    tone === 'danger' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-slate-400';
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

function DatasheetGrid({
  sheet,
  inventoryId,
  commercial = false,
}: {
  sheet: PSVDatasheet;
  inventoryId?: string;
  commercial?: boolean;
}) {
  const rows: Array<[string, string | number | undefined]> = commercial
    ? [
        ['Make / Manufacturer', sheet.make],
        ['Model Number', sheet.model],
        ['Set Pressure', `${sheet.setPressure} ${sheet.pressureUnit}`],
        ['Rating', sheet.capacity],
        ['Inlet Size', sheet.inletSize],
        ['Outlet Size', sheet.outletSize],
      ]
    : [
        ['Inventory ID', inventoryId],
        ['Make / Manufacturer', sheet.make],
        ['Model Number', sheet.model],
        ['Set Pressure', `${sheet.setPressure} ${sheet.pressureUnit}`],
        ['Capacity', sheet.capacity],
        ['Inlet Size', sheet.inletSize],
        ['Outlet Size', sheet.outletSize],
        ['Service Medium', sheet.serviceMedium],
        ['National Board No.', sheet.nationalBoardNumber],
      ];
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-3 ${commercial ? '' : 'sm:grid-cols-2'}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-right text-sm font-semibold text-slate-800">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

const DOT_COLORS: Record<string, string> = {
  installed: 'bg-emerald-500',
  out_for_service: 'bg-amber-500',
  inventory: 'bg-sky-500',
};

function HistoryItem({
  event,
  useAndReplace,
  onEdit,
  onDelete,
}: {
  event: PSVEvent;
  useAndReplace?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dot =
    event.type === 'replacement'
      ? 'bg-orange-500'
      : event.status
        ? DOT_COLORS[event.status]
        : 'bg-slate-400';
  const isCommercialHistoryEvent =
    event.type === 'replacement' ||
    (event.type === 'status-change' && event.status === 'installed');
  const canEdit = !useAndReplace || isCommercialHistoryEvent;
  return (
    <li className="group relative flex gap-3 rounded-lg py-2 pl-1 pr-1 hover:bg-slate-50">
      <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{event.description}</p>
          {canEdit && (
            <div
              className={`flex items-center gap-1 ${
                useAndReplace ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'
              }`}
            >
            <button
              onClick={onEdit}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Edit entry"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
              title="Delete entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          )}
        </div>
        <p className="text-xs font-medium text-slate-600">{formatDate(event.date)}</p>
        {event.note && <p className="mt-0.5 text-xs italic text-slate-500">“{event.note}”</p>}
        <p className="text-[11px] text-slate-400">Recorded {formatDateTime(event.recordedAt)}</p>
      </div>
    </li>
  );
}

function RepairItem({
  record,
  onEdit,
  onDelete,
}: {
  record: PSVRepairRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group relative flex gap-3 rounded-lg py-2 pl-1 pr-1 hover:bg-slate-50">
      <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-white" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{record.description}</p>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onEdit}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Edit entry"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
              title="Delete entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-600">{formatDate(record.date)}</p>
        {(record.vendor || record.workOrder) && (
          <p className="mt-0.5 text-xs text-slate-500">
            {[record.vendor, record.workOrder ? `WO ${record.workOrder}` : ''].filter(Boolean).join(' · ')}
          </p>
        )}
        {record.note && <p className="mt-0.5 text-xs italic text-slate-500">"{record.note}"</p>}
        <p className="text-[11px] text-slate-400">Recorded {formatDateTime(record.recordedAt)}</p>
      </div>
    </li>
  );
}
