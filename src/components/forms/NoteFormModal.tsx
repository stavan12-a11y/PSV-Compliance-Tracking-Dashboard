import { useEffect, useState } from 'react';
import { usePSV } from '../../store/PSVContext';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { todayISO } from '../../utils/dates';

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  psvId: string;
  /** Provide to edit an existing note. */
  noteId?: string;
}

export function NoteFormModal({ open, onClose, psvId, noteId }: NoteFormModalProps) {
  const { getPSV, addNote, updateNote } = usePSV();
  const psv = getPSV(psvId);
  const existing = noteId ? psv?.notes?.find((n) => n.id === noteId) : undefined;
  const editing = Boolean(existing);

  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setDate(existing.date);
      setText(existing.text);
    } else {
      setDate(todayISO());
      setText('');
    }
  }, [open, existing]);

  const canSave = text.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    const payload = { date, text: text.trim() };
    if (editing && existing) {
      updateNote(psvId, existing.id, payload);
    } else {
      addNote(psvId, payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={editing ? 'Edit note' : 'Add note'}
      description="A note on this safety. It does not change the due date."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {editing ? 'Save changes' : 'Add note'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Date" required>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note" required>
          <textarea
            className="input min-h-[96px] resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything you want to remember about this safety"
          />
        </Field>
      </div>
    </Modal>
  );
}
