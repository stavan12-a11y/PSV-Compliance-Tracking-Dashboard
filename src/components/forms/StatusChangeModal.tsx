import { useEffect, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { STATUS_LABELS } from '../../utils/compliance';
import { todayISO } from '../../utils/dates';
import type { PSVStatus } from '../../types';

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  psvId: string;
  serialNumber: string;
  targetStatus: PSVStatus;
}

export function StatusChangeModal({
  open,
  onClose,
  psvId,
  serialNumber,
  targetStatus,
}: StatusChangeModalProps) {
  const { setStatus } = usePSV();
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setNote('');
    }
  }, [open, targetStatus]);

  const isInstall = targetStatus === 'installed';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Set ${serialNumber} to “${STATUS_LABELS[targetStatus]}”`}
      description="The date below is recorded with the status change in the PSV history."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setStatus(psvId, targetStatus, date, note.trim() || undefined);
              onClose();
            }}
          >
            Record change
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label={isInstall ? 'Installation Date' : 'Effective Date'}
          required
          hint={
            isInstall
              ? 'Recertification due date = this install date + 3 years.'
              : undefined
          }
        >
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <textarea
            className="input min-h-[72px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. swapped in for recert of prior valve"
          />
        </Field>
      </div>
    </Modal>
  );
}
