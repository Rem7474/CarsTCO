import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onCancel={onCancel}
      className="rounded-2xl border border-border bg-white p-0 shadow-xl backdrop:bg-ink/40"
    >
      <div className="w-80 p-5">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-[10px] border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="rounded-[10px] bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-dark"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
