import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { getActivity, type ActivityEntry } from '../../api/admin'
import styles from './ActivitySection.module.scss'

const TYPE_FILTERS = [
  { value: '', label: 'Alle' },
  { value: 'approval', label: 'Godkendelser' },
  { value: 'rejection', label: 'Afvisninger' },
  { value: 'note', label: 'Noter' },
] as const

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'long' })
const timeFormatter = new Intl.DateTimeFormat('da-DK', { timeStyle: 'short' })

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function groupByDate(entries: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const map = new Map<string, ActivityEntry[]>()
  for (const entry of entries) {
    const key = entry.created_at.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }
  return map
}

function getInitials(name: string | null): string {
  if (!name) return 'A'
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

interface Props {}

export default function ActivitySection(_: Props) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'' | 'approval' | 'rejection' | 'note'>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getActivity()
      .then(setEntries)
      .catch((err: Error) => {
        if (err.message.includes('401')) {
          sessionStorage.removeItem('admin_token')
          navigate('/login')
          return
        }
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [navigate])

  const filtered = useMemo(() => {
    let result = entries
    if (typeFilter) result = result.filter((e) => e.type === typeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.company_name.toLowerCase().includes(q) ||
          (e.admin_name ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [entries, typeFilter, searchQuery])

  const todayCount = useMemo(() => entries.filter((e) => isToday(e.created_at)).length, [entries])
  const approvalCount = useMemo(() => entries.filter((e) => e.type === 'approval').length, [entries])
  const rejectionCount = useMemo(() => entries.filter((e) => e.type === 'rejection').length, [entries])
  const noteCount = useMemo(() => entries.filter((e) => e.type === 'note').length, [entries])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  function formatDayHeader(dateKey: string): string {
    const d = new Date(dateKey + 'T12:00:00')
    if (isToday(dateKey + 'T12:00:00')) return `I dag — ${dateFormatter.format(d)}`
    return dateFormatter.format(d)
  }

  return (
    <div className={styles.container}>
      {/* Metrics */}
      <div className={styles.metrics}>
        {[
          { label: 'Handlinger i dag', value: todayCount },
          { label: 'Godkendelser', value: approvalCount },
          { label: 'Afvisninger', value: rejectionCount },
          { label: 'Noter tilføjet', value: noteCount },
        ].map((m) => (
          <div key={m.label} className={styles.metricCard}>
            <span className={styles.metricCard__label}>{m.label}</span>
            <span className={styles.metricCard__value}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterPills}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={styles.filterPill}
              data-active={typeFilter === f.value || undefined}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          type="text"
          placeholder="Søg firma eller admin…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && <InlineAlert tone="danger">{error}</InlineAlert>}

      {isLoading ? (
        <div className={styles.spinnerWrapper}>
          <Spinner aria-label="Indlæser aktivitetslog" />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>Ingen aktivitet fundet.</p>
      ) : (
        <div className={styles.timeline}>
          {[...grouped.entries()].map(([dateKey, dayEntries]) => (
            <div key={dateKey}>
              <div className={styles.dayHeader}>{formatDayHeader(dateKey)}</div>
              {dayEntries.map((entry, i) => (
                <div key={`${entry.registration_id}-${entry.created_at}-${i}`} className={styles.entry}>
                  <div className={styles.entry__dot} data-type={entry.type} />
                  <div
                    className={styles.entry__avatar}
                    style={{ background: avatarColor(entry.admin_name) }}
                  >
                    {getInitials(entry.admin_name)}
                  </div>
                  <div className={styles.entry__body}>
                    <div className={styles.entry__text}>
                      <strong>{entry.admin_name ?? 'Admin'}</strong>
                      {entry.type === 'approval' && (
                        <> godkendte <strong>{entry.company_name}</strong></>
                      )}
                      {entry.type === 'rejection' && (
                        <> afviste <strong>{entry.company_name}</strong></>
                      )}
                      {entry.type === 'note' && (
                        <> tilføjede en note til <strong>{entry.company_name}</strong></>
                      )}
                      {entry.type !== 'note' && (
                        <span
                          className={styles.entry__badge}
                          data-type={entry.type}
                        >
                          {entry.type === 'approval' ? 'Godkendt' : 'Afvist'}
                        </span>
                      )}
                    </div>
                    {entry.content && (
                      <div
                        className={styles.entry__note}
                        data-type={entry.type}
                      >
                        {entry.content}
                      </div>
                    )}
                    <span className={styles.entry__time}>
                      {timeFormatter.format(new Date(entry.created_at))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const AVATAR_COLORS = [
  '#38025c', '#185fa5', '#00875a', '#854f0b', '#a32d2d',
  '#3b6d11', '#5b4fcf', '#0e6b7a',
]

function avatarColor(name: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
