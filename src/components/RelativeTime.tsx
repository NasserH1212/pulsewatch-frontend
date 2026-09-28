import { formatRelativeTime } from '../lib/status'

// Relative time in the text, exact time in the hover title.
export function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span>Never</span>

  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()}>
      {formatRelativeTime(iso)}
    </time>
  )
}
