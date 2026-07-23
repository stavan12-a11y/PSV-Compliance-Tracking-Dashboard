import { useEffect, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { todayISO } from '../../utils/dates';

interface ReplacementFormModalProps {
  open: boolean;
  onClose: () => void;
  psvId: string;
  /** When set, edits an existing replacement history entry. */
  eventId?: string;
}

export function ReplacementFormModal({ open, onClose, psvId, eventId }: ReplacementFormModalProps) {
  const { getPSV, recordReplacement, updateHistoryEvent } = usePSV();
  const psv = getPSV(psvId);
  const existing = eventId ? psv?.events.find((e) => e.id === eventId && e.type === 'replacement') : undefined;
  const editing = Boolean(existing);

  const [date, setDate] = useState(todayISO());
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !psv) return;
    if (existing) {
      setDate(existing.date);
      setNewSerialNumber(existing.newSerialNumber ?? '');
      setNote(existing.note ?? '');
      return;
    }
    setDate(todayISO());
    setNewSerialNumber('');
    setNote('');
  }, [open, psv, existing]);

  if (!psv) return null;

  const canSave = newSerialNumber.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    const trimmedSerial = newSerialNumber.trim();
    if (editing && existing) {
      const previousSerial = existing.previousSerialNumber ?? psv.serialNumber;
      updateHistoryEvent(psvId, existing.id, {
        date,
        newSerialNumber: trimmedSerial,
        note: note.trim() || undefined,
        description: `Valve replaced — disposed S/N ${previousSerial}, installed S/N ${trimmedSerial}`,
      });
    } else {
      recordReplacement(psvId, {
        date,
        newSerialNumber: trimmedSerial,
        note: note.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit replacement record' : 'Record valve replacement'}
      description={
        editing
          ? `Update the replacement dated ${existing?.date}.`
          : `Commercial boiler valve at this location is replaced with a new unit when due. Current S/N: ${psv.serialNumber}`
      }
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {editing ? 'Save changes' : 'Save replacement'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Replacement date" required>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="New serial number (S/N)" required>
          <input
            className="input"
            value={newSerialNumber}
            onChange={(e) => setNewSerialNumber(e.target.value)}
            placeholder="S/N on the new valve"
            autoFocus={!editing}
          />
        </Field>
        <Field label="Note (optional)">
          <textarea
            className="input min-h-[4.5rem]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Vendor, PO number, disposal note, etc."
          />
        </Field>
        {!editing && (
          <p className="text-xs text-slate-500">
            The previous S/N ({psv.serialNumber}) will be kept in the replacement history. The due date
            resets from the replacement date (+ 3 years).
          </p>
        )}
      </div>
    </Modal>
  );
}
