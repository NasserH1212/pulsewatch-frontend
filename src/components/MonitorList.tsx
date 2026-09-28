import type { Monitor } from '../api/types'
import { getMonitorStatusDisplay } from '../lib/status'
import { RelativeTime } from './RelativeTime'
import { StatusBadge } from './StatusBadge'

export function MonitorList({ monitors }: { monitors: Monitor[] }) {
  if (monitors.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">No monitors yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
              Name
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
              Type
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
              Target
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
              Status
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
              Last checked
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {monitors.map((monitor) => (
            <tr key={monitor.id}>
              <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{monitor.name}</td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{monitor.type}</td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{monitor.target}</td>
              <td className="px-4 py-2">
                <StatusBadge status={getMonitorStatusDisplay(monitor)} />
              </td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                <RelativeTime iso={monitor.lastCheckedAt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
