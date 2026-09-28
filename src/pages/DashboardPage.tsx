import { useAuth } from '../auth/AuthContext'
import { MonitorList } from '../components/MonitorList'
import { SummaryTiles } from '../components/SummaryTiles'
import { useLiveMonitorUpdates } from '../hooks/useLiveMonitorUpdates'
import { useMonitors } from '../hooks/useMonitors'
import { summarizeMonitors } from '../lib/status'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { data: monitors, isLoading, isError } = useMonitors()
  useLiveMonitorUpdates()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">PulseWatch</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {user.name} · {user.role}
              </span>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading monitors…</p>}
        {isError && <p role="alert" className="text-red-600">Couldn't load monitors. Please try again.</p>}

        {monitors && (
          <>
            <SummaryTiles summary={summarizeMonitors(monitors)} />
            <MonitorList monitors={monitors} />
          </>
        )}
      </main>
    </div>
  )
}
