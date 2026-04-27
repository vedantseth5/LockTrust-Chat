import React, { useEffect, useRef, useState, useCallback } from 'react'
import { adminApi } from '../api/adminApi'
import toast from 'react-hot-toast'
import { User, Channel, DmConversation, Message, DirectMessage } from '../types'

type Tab = 'users' | 'channels' | 'dms'
type LoginStep = 'phone' | 'otp'

const COUNTRY_CODES = [
  { label: '🇺🇸 +1',   value: '+1'  },
  { label: '🇬🇧 +44',  value: '+44' },
  { label: '🇮🇳 +91',  value: '+91' },
  { label: '🇦🇺 +61',  value: '+61' },
  { label: '🇩🇪 +49',  value: '+49' },
  { label: '🇫🇷 +33',  value: '+33' },
  { label: '🇸🇬 +65',  value: '+65' },
  { label: '🇦🇪 +971', value: '+971'},
  { label: '🇯🇵 +81',  value: '+81' },
]

const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
const selectCls = "bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition flex-shrink-0"
const btnPrimary = "w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"

// ── Admin login ───────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<LoginStep>('phone')
  const [cc, setCc] = useState('+1')
  const [phoneNum, setPhoneNum] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const fullPhone = cc + phoneNum.replace(/[^0-9]/g, '')

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await adminApi.login(cc, phoneNum)
      setStep('otp')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await adminApi.verifyOtp(fullPhone, otp)
      const { accessToken, user } = res.data
      if (user?.role !== 'ADMIN') { toast.error('Not an admin account'); return }
      sessionStorage.setItem('lt_admin_token', accessToken)
      sessionStorage.setItem('lt_admin_phone', fullPhone)
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-[#0f1923] flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#00B8D4 1px, transparent 1px), linear-gradient(90deg, #00B8D4 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <img src="/logo.png" alt="LockTrust" className="w-48 h-48 object-contain drop-shadow-2xl" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="LockTrust" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-gray-900">LockTrust</span>
          </div>
          {step === 'phone' ? (
            <form onSubmit={handlePhone}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin sign in</h2>
              <p className="text-gray-400 text-sm mb-7">We'll send a one-time code to your phone</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Admin phone</label>
                  <div className="flex gap-2">
                    <select value={cc} onChange={e => setCc(e.target.value)} className={selectCls}>
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={i} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <input type="tel" value={phoneNum} onChange={e => setPhoneNum(e.target.value)}
                      placeholder="0000000000" required autoFocus className={inputCls} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtp}>
              <button type="button" onClick={() => setStep('phone')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your phone</h2>
              <p className="text-gray-400 text-sm mb-1">We sent a 6-digit code to</p>
              <p className="text-gray-900 font-semibold text-sm mb-7">{fullPhone}</p>
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">One-time code</label>
                <input type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6} autoFocus
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition" />
              </div>
              <p className="text-xs text-gray-400 mb-5 text-center">In dev mode, the code is printed in the backend terminal</p>
              <button type="submit" disabled={loading || otp.length !== 6} className={btnPrimary}>
                {loading ? 'Verifying…' : 'Verify & continue →'}
              </button>
              <button type="button" onClick={() => adminApi.login(cc, phoneNum).then(() => toast.success('OTP resent!'))}
                className="w-full text-sm text-brand-500 hover:text-brand-600 font-medium mt-4 transition-colors">
                Resend code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Search bar (global, lives in header) ──────────────────────────────────────

type SearchResults = { messages: any[]; dms: any[]; users: User[] }

function GlobalSearch({ onGoToChannel, onGoToDm }: {
  onGoToChannel: (id: number) => void
  onGoToDm: (id: number) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!q.trim()) { setResults(null); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setOpen(true)
      try {
        const res = await adminApi.search(q)
        setResults(res.data)
      } catch { toast.error('Search failed') }
      finally { setLoading(false) }
    }, 300)
  }, [q])

  const total = results ? results.messages.length + results.dms.length + results.users.length : 0

  function handleGoToChannel(id: number) { setOpen(false); setQ(''); onGoToChannel(id) }
  function handleGoToDm(id: number) { setOpen(false); setQ(''); onGoToDm(id) }

  return (
    <div ref={wrapperRef} className="relative w-80">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search messages, users, DMs…"
          className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition"
        />
        {q && (
          <button onClick={() => { setQ(''); setResults(null); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[520px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching…</div>
          )}

          {!loading && results && total === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{q}"</div>
          )}

          {!loading && results && total > 0 && (
            <div className="divide-y divide-gray-100">

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">People</span>
                  </div>
                  {results.users.map((u: User) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: u.avatarColor }}>
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{u.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{u.phone}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        u.presence === 'ONLINE' ? 'bg-green-100 text-green-600' :
                        u.presence === 'AWAY' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>{u.presence}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Channel messages */}
              {results.messages.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channel Messages</span>
                  </div>
                  {results.messages.map((m: any) => (
                    <button key={m.id} onClick={() => handleGoToChannel(m.channelId)}
                      className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition group">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: m.senderAvatarColor || '#ccc' }}>
                        {m.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{m.senderName}</span>
                          <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{highlight(m.content, q)}</p>
                      </div>
                      <span className="text-xs text-brand-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1">
                        Open →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* DMs */}
              {results.dms.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direct Messages</span>
                  </div>
                  {results.dms.map((m: any) => (
                    <button key={m.id} onClick={() => handleGoToDm(m.conversationId)}
                      className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition group">
                      {/* Avatars for both participants */}
                      <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                        {(m.participantNames || []).slice(0, 2).map((name: string, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {m.conversationLabel || m.participantNames?.join(' & ') || 'DM'}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-0.5">{m.senderName} said:</p>
                        <p className="text-sm text-gray-600 truncate">{highlight(m.content, q)}</p>
                      </div>
                      <span className="text-xs text-brand-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1">
                        Open →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function highlight(text: string, q: string) {
  if (!q.trim()) return <>{text}</>
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}

// ── Admin shell ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminPhone, setAdminPhone] = useState<string | null>(sessionStorage.getItem('lt_admin_phone'))
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem('lt_admin_token'))
  const [tab, setTab] = useState<Tab>('users')
  const [jumpToChannelId, setJumpToChannelId] = useState<number | null>(null)
  const [jumpToDmId, setJumpToDmId] = useState<number | null>(null)

  function handleLogout() {
    sessionStorage.removeItem('lt_admin_token')
    sessionStorage.removeItem('lt_admin_phone')
    setLoggedIn(false); setAdminPhone(null)
  }

  function handleSuccess() {
    setAdminPhone(sessionStorage.getItem('lt_admin_phone'))
    setLoggedIn(true)
  }

  function goToChannel(id: number) { setJumpToChannelId(id); setTab('channels') }
  function goToDm(id: number) { setJumpToDmId(id); setTab('dms') }

  if (!loggedIn) return <AdminLogin onSuccess={handleSuccess} />

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Left sidebar — blue, full height */}
      <div className="w-52 flex flex-col flex-shrink-0" style={{ backgroundColor: '#0f1923' }}>
        {/* Sidebar header */}
        <div className="px-4 py-3 flex items-center gap-2.5 border-b flex-shrink-0" style={{ borderColor: '#1e2d3d' }}>
          <img src="/logo.png" alt="LockTrust" className="w-6 h-6 object-contain" />
          <span className="text-white font-bold text-sm">LockTrust</span>
          <span className="text-xs text-white/60 font-semibold bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20 ml-auto">ADMIN</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col pt-2 flex-1">
          {([['users','Users'],['channels','Channels'],['dms','Direct Messages']] as [Tab,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-left px-4 py-2.5 text-sm font-medium transition border-r-2 ${
                tab === t
                  ? 'text-white border-[#00B8D4] bg-[#1a2738]'
                  : 'text-[#6b7e94] border-transparent hover:text-[#c9d4df] hover:bg-[#1a2738]'
              }`}>
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom: signed-in phone + sign out */}
        <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: '#1e2d3d' }}>
          <p className="text-[#c9d4df] text-xs truncate mb-1">{adminPhone}</p>
          <button onClick={handleLogout} className="text-xs text-[#6b7e94] hover:text-white transition">
            Sign out
          </button>
        </div>
      </div>

      {/* Right content — white top bar + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* White top bar with search */}
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <p className="text-gray-900 font-semibold text-sm capitalize">{tab}</p>
          <GlobalSearch onGoToChannel={goToChannel} onGoToDm={goToDm} />
        </header>

        <main className="flex-1 overflow-hidden">
          {tab === 'users' && <UsersTab />}
          {tab === 'channels' && <ChannelsTab jumpToId={jumpToChannelId} onJumpDone={() => setJumpToChannelId(null)} />}
          {tab === 'dms' && <DmsTab jumpToId={jumpToDmId} onJumpDone={() => setJumpToDmId(null)} />}
        </main>
      </div>
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await adminApi.listUsers()
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingPane />

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-gray-900 font-semibold text-lg mb-4">Users ({users.length})</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: u.avatarColor }}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-900 font-medium">{u.displayName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{u.phone}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.role === 'ADMIN' ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-100 text-gray-500'
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${
                    u.presence === 'ONLINE' ? 'text-green-500' :
                    u.presence === 'AWAY' ? 'text-yellow-500' :
                    u.presence === 'DND' ? 'text-red-500' : 'text-gray-400'
                  }`}>{u.presence}</span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Channels tab ──────────────────────────────────────────────────────────────

function ChannelsTab({ jumpToId, onJumpDone }: { jumpToId: number | null; onJumpDone: () => void }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selected, setSelected] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    adminApi.listChannels()
      .then(r => setChannels(r.data))
      .catch(() => toast.error('Failed to load channels'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (jumpToId && channels.length > 0) {
      const ch = channels.find(c => c.id === jumpToId)
      if (ch) { openChannel(ch); onJumpDone() }
    }
  }, [jumpToId, channels])

  async function openChannel(ch: Channel) {
    setSelected(ch); setMsgLoading(true)
    try {
      const res = await adminApi.channelMessages(ch.id)
      setMessages(res.data)
    } catch { toast.error('Failed to load messages') }
    finally { setMsgLoading(false) }
  }

  if (loading) return <LoadingPane />

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 overflow-y-auto flex-shrink-0 bg-white">
        <div className="p-4 border-b border-gray-100">
          <p className="text-gray-900 font-semibold text-sm">All Channels ({channels.length})</p>
        </div>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => openChannel(ch)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
              selected?.id === ch.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-400">{ch.isPrivate ? '🔒' : '#'}</span>
              <span className="truncate">{ch.name}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{ch.memberCount} members</div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
              <span className="text-gray-400">{selected.isPrivate ? '🔒' : '#'}</span>
              <span className="text-gray-900 font-semibold">{selected.name}</span>
              {selected.isPrivate && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 ml-1">Private</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgLoading ? <LoadingPane /> : messages.length === 0
                ? <p className="text-gray-400 text-sm text-center mt-12">No messages</p>
                : messages.map(m => <AdminMessage key={m.id} msg={m} />)
              }
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a channel to view messages</div>
        )}
      </div>
    </div>
  )
}

// ── DMs tab ───────────────────────────────────────────────────────────────────

function DmsTab({ jumpToId, onJumpDone }: { jumpToId: number | null; onJumpDone: () => void }) {
  const [convs, setConvs] = useState<DmConversation[]>([])
  const [selected, setSelected] = useState<DmConversation | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    adminApi.listDmConversations()
      .then(r => setConvs(r.data))
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (jumpToId && convs.length > 0) {
      const conv = convs.find(c => c.id === jumpToId)
      if (conv) { openConv(conv); onJumpDone() }
    }
  }, [jumpToId, convs])

  async function openConv(conv: DmConversation) {
    setSelected(conv); setMsgLoading(true)
    try {
      const res = await adminApi.dmMessages(conv.id)
      setMessages(res.data)
    } catch { toast.error('Failed to load messages') }
    finally { setMsgLoading(false) }
  }

  function convLabel(conv: DmConversation) {
    return conv.name || conv.participants.map(p => p.displayName).join(' & ')
  }

  if (loading) return <LoadingPane />

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 overflow-y-auto flex-shrink-0 bg-white">
        <div className="p-4 border-b border-gray-100">
          <p className="text-gray-900 font-semibold text-sm">All DMs ({convs.length})</p>
        </div>
        {convs.map(conv => (
          <button key={conv.id} onClick={() => openConv(conv)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
              selected?.id === conv.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <div className="text-sm font-medium truncate">{convLabel(conv)}</div>
            <div className="text-xs text-gray-400 mt-0.5 truncate">
              {conv.participants.map(p => p.displayName).join(', ')}
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="px-5 py-3 border-b border-gray-200 bg-white">
              <p className="text-gray-900 font-semibold">{convLabel(selected)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Between {selected.participants.map(p => p.displayName).join(' & ')}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgLoading ? <LoadingPane /> : messages.length === 0
                ? <p className="text-gray-400 text-sm text-center mt-12">No messages</p>
                : messages.map(m => <AdminMessage key={m.id} msg={m as any} />)
              }
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation to view messages</div>
        )}
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function AdminMessage({ msg }: { msg: any }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: msg.senderAvatarColor || '#ccc' }}>
        {(msg.senderName || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-gray-900 text-sm font-semibold">{msg.senderName}</span>
          <span className="text-gray-400 text-xs">{new Date(msg.createdAt).toLocaleString()}</span>
          {msg.edited && <span className="text-gray-400 text-xs">(edited)</span>}
        </div>
        <p className={`text-sm mt-0.5 ${msg.deleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>{msg.content}</p>
      </div>
    </div>
  )
}

function LoadingPane() {
  return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
}
