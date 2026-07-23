import { useEffect, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { todayISO } from '../../utils/dates';
import { psvDisplayName } from '../../utils/psvDisplay';

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
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !psv) return;
    if (existing) {
      setDate(existing.date);
      setNote(existing.note ?? '');
      return;
    }
    setDate(todayISO());
    setNote('');
  }, [open, psv, existing]);

  if (!psv) return null;

  const handleSave = () => {
    if (editing && existing) {
      updateHistoryEvent(psvId, existing.id, {
        date,
        note: note.trim() || undefined,
        description: 'Valve replaced — new unit installed',
      });
    } else {
      recordReplacement(psvId, {
        date,
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
          : `Log when a new valve was installed for ${psvDisplayName(psv)}. Serial numbers are not tracked.`
      }
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            {editing ? 'Save changes' : 'Save replacement'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Replacement date" required>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <textarea
            className="input min-h-[4.5rem]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Vendor, PO number, work order, etc."
          />
        </Field>
        {!editing && (
          <p className="text-xs text-slate-500">
            The due date resets from the replacement date (+ 3 years). Only the replacement date is
            recorded — no serial number is required.
          </p>
        )}
      </div>
    </Modal>
  );
}
