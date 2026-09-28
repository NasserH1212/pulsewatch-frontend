import type { MonitorSummary } from '../lib/status'

const tiles: { key: keyof MonitorSummary; label: string; accent: string }[] = [
  { key: 'total', label: 'Total', accent: 'text-slate-900 dark:text-slate-100' },
  { key: 'up', label: 'Up', accent: 'text-green-600 dark:text-green-400' },
  { key: 'down', label: 'Down', accent: 'text-red-600 dark:text-red-400' },
  { key: 'paused', label: 'Paused', accent: 'text-slate-500 dark:text-slate-400' },
]

export function SummaryTiles({ summary }: { summary: MonitorSummary }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{tile.label}</p>
          <p className={`text-2xl font-semibold ${tile.accent}`}>{summary[tile.key]}</p>
        </div>
      ))}
    </div>
  )
}
