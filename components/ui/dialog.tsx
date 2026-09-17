import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  titleId?: string
}

export function Dialog({ open, onClose, children, className, titleId }: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
      // Focus the dialog container
      dialogRef.current?.focus()
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        aria-label="Close dialog"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "animate-rise relative w-full max-w-xl rounded-t-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-3xl outline-none",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  className,
  children,
  onClose,
}: {
  className?: string
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-50"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className={cn("text-xl font-semibold text-slate-100", className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("mt-1 text-sm text-slate-400", className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3", className)}>
      {children}
    </div>
  )
}
