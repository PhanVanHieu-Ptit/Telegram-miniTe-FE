import { callApi, type CallDTO } from '@/services/call.api'
import { Sidebar } from '@/components/sidebar'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { Avatar, Empty, Spin, Typography } from 'antd'
import { ArrowLeft, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video, Phone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const { Text } = Typography

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatCallTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const callDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (callDay.getTime() === today.getTime()) return 'Today'
  if (callDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
}

function groupByDate(calls: CallDTO[]): { label: string; items: CallDTO[] }[] {
  const map = new Map<string, CallDTO[]>()
  for (const call of calls) {
    const label = formatDateLabel(call.createdAt)
    const group = map.get(label) ?? []
    group.push(call)
    map.set(label, group)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CallHistoryPage() {
  const { t } = useTranslation()
  const currentUser = useAuthStore((s) => s.user)
  const conversations = useChatStore((s) => s.conversations)

  const [calls, setCalls] = useState<CallDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    callApi
      .getHistory()
      .then(setCalls)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Build a flat member map: userId → { fullName, avatarUrl }
  const memberMap = useMemo(() => {
    const map = new Map<string, { fullName: string; avatarUrl: string | null }>()
    for (const convo of conversations) {
      for (const m of convo.members) {
        if (!map.has(m.id)) {
          map.set(m.id, { fullName: m.fullName, avatarUrl: m.avatarUrl })
        }
      }
    }
    return map
  }, [conversations])

  const grouped = useMemo(() => groupByDate(calls), [calls])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <div className="hidden md:flex w-[320px] flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main panel */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 bg-black/20 backdrop-blur-xl">
          <Link
            to="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-base font-semibold text-white">{t('call_history')}</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          ) : calls.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Empty
                description={
                  <span className="text-secondary text-sm">{t('call_history_empty')}</span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {grouped.map(({ label, items }) => (
                <section key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary px-1">
                    {label}
                  </p>
                  <div className="space-y-1">
                    {items.map((call) => (
                      <CallItem
                        key={call.id}
                        call={call}
                        currentUserId={currentUser?.id ?? ''}
                        memberMap={memberMap}
                        t={t}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── CallItem ──────────────────────────────────────────────────────────────────

interface CallItemProps {
  call: CallDTO
  currentUserId: string
  memberMap: Map<string, { fullName: string; avatarUrl: string | null }>
  t: (key: string, opts?: Record<string, string>) => string
}

function CallItem({ call, currentUserId, memberMap, t }: CallItemProps) {
  const isOutgoing = call.callerId === currentUserId
  const otherUserId = isOutgoing ? call.receiverId : call.callerId
  const other = memberMap.get(otherUserId)
  const otherName = other?.fullName ?? t('unknown')
  const otherAvatar = other?.avatarUrl ?? undefined

  const isMissed = call.status === 'missed'
  const isRejected = call.status === 'rejected'
  const isEnded = call.status === 'ended' || call.status === 'ongoing'

  const DirectionIcon = isMissed
    ? PhoneMissed
    : isOutgoing
    ? PhoneOutgoing
    : PhoneIncoming

  const iconColor = isMissed || isRejected ? 'text-red-400' : 'text-emerald-400'

  const typeKey = call.callType === 'video' ? t('video') : t('audio')
  const callLabel = isOutgoing
    ? t('outgoing_call', { type: typeKey })
    : t('incoming_call_history', { type: typeKey })

  let statusLine: string
  if (isMissed) {
    statusLine = t('call_missed')
  } else if (isRejected) {
    statusLine = t('call_rejected')
  } else if (isEnded && call.duration > 0) {
    statusLine = formatDuration(call.duration)
  } else {
    statusLine = call.status.charAt(0).toUpperCase() + call.status.slice(1)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5">
      {/* Direction icon */}
      <div className={`flex-shrink-0 ${iconColor}`}>
        <DirectionIcon className="h-4 w-4" strokeWidth={1.5} />
      </div>

      {/* Avatar */}
      <Avatar
        size={40}
        src={otherAvatar}
        style={{
          backgroundColor: '#5B8DEF',
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {otherAvatar ? undefined : otherName.slice(0, 2).toUpperCase()}
      </Avatar>

      {/* Info */}
      <div className="flex flex-1 flex-col min-w-0">
        <Text
          strong
          style={{ color: 'white', fontSize: 14, lineHeight: '1.3' }}
          ellipsis
        >
          {otherName}
        </Text>
        <div className="flex items-center gap-1.5 mt-0.5">
          {call.callType === 'video' ? (
            <Video className="h-3 w-3 text-secondary flex-shrink-0" strokeWidth={1.5} />
          ) : (
            <Phone className="h-3 w-3 text-secondary flex-shrink-0" strokeWidth={1.5} />
          )}
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {callLabel}
            {' · '}
            <span className={isMissed || isRejected ? 'text-red-400' : 'text-emerald-400'}>
              {statusLine}
            </span>
          </Text>
        </div>
      </div>

      {/* Time */}
      <Text
        style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}
      >
        {formatCallTime(call.createdAt)}
      </Text>
    </div>
  )
}
