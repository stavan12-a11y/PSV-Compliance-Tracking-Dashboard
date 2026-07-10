import { useEffect, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { todayISO } from '../../utils/dates';

interface RepairFormModalProps {
  open: boolean;
  onClose: () => void;
  psvId: string;
  /** Provide to edit an existing repair / overhaul entry. */
  repairId?: string;
}

export function RepairFormModal({ open, onClose, psvId, repairId }: RepairFormModalProps) {
  const { getPSV, addRepairRecord, updateRepairRecord } = usePSV();
  const psv = getPSV(psvId);
  const existing = repairId ? psv?.repairHistory?.find((r) => r.id === repairId) : undefined;
  const editing = Boolean(existing);

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [workOrder, setWorkOrder] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setDate(existing.date);
      setDescription(existing.description);
      setVendor(existing.vendor ?? '');
      setWorkOrder(existing.workOrder ?? '');
      setNote(existing.note ?? '');
    } else {
      setDate(todayISO());
      setDescription('');
      setVendor('');
      setWorkOrder('');
      setNote('');
    }
  }, [open, existing]);

  const canSave = description.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      date,
      description: description.trim(),
      vendor: vendor.trim() || undefined,
      workOrder: workOrder.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (editing && existing) {
      updateRepairRecord(psvId, existing.id, payload);
    } else {
      addRepairRecord(psvId, payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={editing ? 'Edit repair / overhaul' : 'Add repair / overhaul'}
      description="Shop repairs, overhauls, and vendor work — kept separate from install/status history."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {editing ? 'Save changes' : 'Add entry'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Date" required>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Description" required hint="e.g. Full overhaul, bench test, seat lapped">
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the repair or overhaul"
          />
        </Field>
        <Field label="Vendor / Shop">
          <input
            className="input"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Consolidated Service Center"
          />
        </Field>
        <Field label="Work Order / PO">
          <input
            className="input"
            value={workOrder}
            onChange={(e) => setWorkOrder(e.target.value)}
            placeholder="e.g. WO-2024-1182"
          />
        </Field>
        <Field label="Note (optional)">
          <textarea
            className="input min-h-[64px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
