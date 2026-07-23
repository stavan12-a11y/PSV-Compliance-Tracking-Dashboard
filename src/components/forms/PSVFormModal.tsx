import { useEffect, useMemo, useRef, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { STATUS_LABELS } from '../../utils/compliance';
import { todayISO } from '../../utils/dates';
import { COMMERCIAL_BOILER_DEFAULT_LABEL, psvDisplayName } from '../../utils/psvDisplay';
import type { PSVDatasheet, PSVStatus } from '../../types';

interface PSVFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Provide to edit an existing PSV. */
  psvId?: string;
  /** Pre-selected location when adding from a location page. */
  presetLocationId?: string;
}

type TrackingMode = 'standard' | 'on_site' | 'use_and_replace';

const EMPTY_DATASHEET: PSVDatasheet = {
  make: '',
  model: '',
  setPressure: 0,
  pressureUnit: 'PSIG',
  capacity: '',
  inletSize: '',
  outletSize: '',
  serviceMedium: '',
  nationalBoardNumber: '',
};

export function PSVFormModal({ open, onClose, psvId, presetLocationId }: PSVFormModalProps) {
  const { data, getPSV, addPSV, updatePSV, updateDatasheet } = usePSV();
  const editing = Boolean(psvId);
  const existing = psvId ? getPSV(psvId) : undefined;

  const [serialNumber, setSerialNumber] = useState('');
  const [inventoryId, setInventoryId] = useState('');
  const [tag, setTag] = useState('');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState<PSVStatus>('inventory');
  const [statusDate, setStatusDate] = useState(todayISO());
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('standard');
  const [sheet, setSheet] = useState<PSVDatasheet>(EMPTY_DATASHEET);
  const formSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      formSessionRef.current = null;
      return;
    }

    const sessionKey = psvId ? `edit:${psvId}` : `add:${presetLocationId ?? 'new'}`;
    if (formSessionRef.current === sessionKey) return;
    formSessionRef.current = sessionKey;

    if (existing) {
      setSerialNumber(existing.serialNumber);
      setInventoryId(existing.inventoryId ?? '');
      setTag(
        existing.tag?.trim() ||
          (existing.useAndReplace ? COMMERCIAL_BOILER_DEFAULT_LABEL : ''),
      );
      setLocationId(existing.locationId);
      setStatus(existing.status);
      setTrackingMode(
        existing.useAndReplace ? 'use_and_replace' : existing.servicedOnSite ? 'on_site' : 'standard',
      );
      setSheet({ ...EMPTY_DATASHEET, ...existing.datasheet });
    } else {
      setSerialNumber('');
      setInventoryId('');
      setTag('');
      setLocationId(presetLocationId ?? '');
      setStatus('inventory');
      setStatusDate(todayISO());
      setTrackingMode('standard');
      setSheet(EMPTY_DATASHEET);
    }
  }, [open, psvId, presetLocationId, existing]);

  // If locations load after the modal opens, fill in a default location without resetting the form.
  useEffect(() => {
    if (!open || psvId || locationId) return;
    const fallback = presetLocationId ?? data.locations[0]?.id ?? '';
    if (fallback) setLocationId(fallback);
  }, [open, psvId, presetLocationId, data.locations, locationId]);

  const locationOptions = useMemo(
    () =>
      data.locations.map((l) => {
        const eq = data.equipment.find((e) => e.id === l.equipmentId);
        return { id: l.id, label: `${eq?.name ?? 'Equipment'} — ${l.name}` };
      }),
    [data.locations, data.equipment],
  );

  const set = <K extends keyof PSVDatasheet>(key: K, value: PSVDatasheet[K]) =>
    setSheet((s) => ({ ...s, [key]: value }));

  const isCommercialBoiler = trackingMode === 'use_and_replace';
  const isSpecialMode = trackingMode !== 'standard';

  const selectTrackingMode = (mode: TrackingMode) => {
    setTrackingMode(mode);
    if (mode === 'use_and_replace') {
      setSerialNumber('');
      setInventoryId('');
      setTag((current) => current.trim() || COMMERCIAL_BOILER_DEFAULT_LABEL);
    }
  };

  const canSave =
    locationId !== '' && (isCommercialBoiler || serialNumber.trim() !== '');

  const handleSave = () => {
    if (!canSave) return;
    const cleaned: PSVDatasheet = { ...sheet, setPressure: Number(sheet.setPressure) || 0 };
    const servicedOnSite = trackingMode === 'on_site';
    const useAndReplace = isCommercialBoiler;
    const trimmedSerial = serialNumber.trim();
    const commercialLabel = tag.trim() || COMMERCIAL_BOILER_DEFAULT_LABEL;
    if (editing && existing) {
      updatePSV(existing.id, {
        serialNumber: useAndReplace ? '' : trimmedSerial,
        inventoryId: useAndReplace ? undefined : inventoryId.trim() || undefined,
        tag: useAndReplace ? commercialLabel : tag.trim() || undefined,
        locationId,
        servicedOnSite: useAndReplace ? undefined : servicedOnSite || undefined,
        useAndReplace: useAndReplace || undefined,
      });
      updateDatasheet(existing.id, cleaned);
    } else {
      addPSV({
        serialNumber: useAndReplace ? undefined : trimmedSerial,
        inventoryId: useAndReplace ? undefined : inventoryId.trim() || undefined,
        tag: useAndReplace ? commercialLabel : tag.trim(),
        locationId,
        datasheet: cleaned,
        status,
        servicedOnSite,
        useAndReplace,
        statusDate,
      });
    }
    onClose();
  };

  const modalTitle = editing
    ? `Edit PSV ${existing ? psvDisplayName(existing) : ''}`
    : isCommercialBoiler
      ? 'Add commercial boiler valve'
      : 'Add a PSV';
  const modalDescription = isCommercialBoiler
    ? 'Name this safety, pick a location, and optionally add valve specs (make, model, pressure, etc.). No serial number required.'
    : 'Serial number, assignment, tracking type, and datasheet / nameplate information.';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={modalTitle}
      description={modalDescription}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {editing ? 'Save changes' : 'Add PSV'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <p className="text-sm font-bold text-slate-800">How is this valve tracked?</p>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input
              type="radio"
              name="trackingMode"
              className="mt-0.5"
              checked={trackingMode === 'standard'}
              onChange={() => selectTrackingMode('standard')}
            />
            <span className="text-sm">
              <span className="font-semibold text-slate-800">Standard (spare swap)</span>
              <span className="block text-xs text-slate-500">
                Installed / inventory / out-for-service with a spare valve at the location.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input
              type="radio"
              name="trackingMode"
              className="mt-0.5"
              checked={trackingMode === 'on_site'}
              onChange={() => selectTrackingMode('on_site')}
            />
            <span className="text-sm">
              <span className="font-semibold text-slate-800">Serviced on site (no spare)</span>
              <span className="block text-xs text-slate-500">
                Recertified in place; due date is measured from the last service date.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <input
              type="radio"
              name="trackingMode"
              className="mt-0.5"
              checked={trackingMode === 'use_and_replace'}
              onChange={() => selectTrackingMode('use_and_replace')}
            />
            <span className="text-sm">
              <span className="font-semibold text-slate-800">Commercial boiler (use &amp; replace)</span>
              <span className="block text-xs text-slate-600">
                Buy a new valve when due — no spare, no recert cycle. Record each replacement in
                history; due date resets from the replacement date.
              </span>
            </span>
          </label>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isCommercialBoiler && (
            <>
              <Field label="Serial Number (S/N)" required>
                <input className="input" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. CV-1001" />
              </Field>
              <Field label="Inventory ID">
                <input className="input" value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} placeholder="e.g. INV-PSV-0042" />
              </Field>
              <Field label="PSV / Service Tag">
                <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. BLR-001-PSV-A" />
              </Field>
            </>
          )}
          {isCommercialBoiler && (
            <div className="sm:col-span-2">
              <Field label="Safety name">
                <input
                  className="input"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={COMMERCIAL_BOILER_DEFAULT_LABEL}
                />
              </Field>
            </div>
          )}
          <Field label="Assigned Location" required>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="" disabled>
                Select a location…
              </option>
              {locationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {!editing && !isSpecialMode && (
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <Field label="Initial Status">
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value as PSVStatus)}>
                  {(Object.keys(STATUS_LABELS) as PSVStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={status === 'installed' ? 'Installation Date' : 'Status Date'}>
                <input type="date" className="input" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
              </Field>
            </div>
          )}
          {!editing && isSpecialMode && (
            <Field label={trackingMode === 'use_and_replace' ? 'Installation Date' : 'Initial Service Date'}>
              <input type="date" className="input" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
            </Field>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            {isCommercialBoiler ? 'Safety valve info (optional)' : 'Datasheet'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Make / Manufacturer">
              <input className="input" value={sheet.make} onChange={(e) => set('make', e.target.value)} placeholder="e.g. Consolidated" />
            </Field>
            <Field label="Model Number">
              <input className="input" value={sheet.model} onChange={(e) => set('model', e.target.value)} placeholder="e.g. 1900-30JM" />
            </Field>
            <Field label="Set Pressure">
              <input type="number" className="input" value={sheet.setPressure} onChange={(e) => set('setPressure', Number(e.target.value))} />
            </Field>
            <Field label="Pressure Unit">
              <input className="input" value={sheet.pressureUnit} onChange={(e) => set('pressureUnit', e.target.value)} placeholder="PSIG" />
            </Field>
            <Field label={isCommercialBoiler ? 'Rating' : 'Capacity'}>
              <input className="input" value={sheet.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="e.g. 12,500 lb/hr" />
            </Field>
            <Field label="Inlet Size">
              <input className="input" value={sheet.inletSize} onChange={(e) => set('inletSize', e.target.value)} placeholder='e.g. 2"' />
            </Field>
            <Field label="Outlet Size">
              <input className="input" value={sheet.outletSize} onChange={(e) => set('outletSize', e.target.value)} placeholder='e.g. 3"' />
            </Field>
            {!isCommercialBoiler && (
              <>
                <Field label="Service Medium">
                  <input className="input" value={sheet.serviceMedium ?? ''} onChange={(e) => set('serviceMedium', e.target.value)} placeholder="Steam / Air / Water" />
                </Field>
                <Field label="National Board No.">
                  <input className="input" value={sheet.nationalBoardNumber ?? ''} onChange={(e) => set('nationalBoardNumber', e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
