import type { StatusDisplay, StatusTone } from '../lib/status'

const toneClasses: Record<StatusTone, string> = {
  up: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  down: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  checking: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  paused: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

// Status is always a colored dot *and* a text label, never color alone.
export function StatusBadge({ status }: { status: StatusDisplay }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[status.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.label}
    </span>
  )
}
