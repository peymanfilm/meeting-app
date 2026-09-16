import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            danger ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'
          }`}
        >
          <AlertTriangle size={28} />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
