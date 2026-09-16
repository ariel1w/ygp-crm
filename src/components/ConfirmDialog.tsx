"use client";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// The app's own "Are you sure?" step, used instead of the browser popup so
// every destructive action looks and behaves the same.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-label={title}
        dir="auto"
      >
        <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-foreground whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="btn btn-secondary" autoFocus>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`btn ${danger ? "btn-danger" : "btn-primary"} disabled:opacity-50`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
