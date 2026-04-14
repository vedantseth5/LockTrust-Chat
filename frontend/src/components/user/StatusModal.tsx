import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from '../../api/userApi'
import { updatePresence, updateUser, logout } from '../../store/authSlice'
import { updateUserPresence } from '../../store/usersSlice'
import { RootState } from '../../store'
import toast from 'react-hot-toast'
import UserAvatar from '../shared/UserAvatar'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'status' | 'profile'

const presenceOptions: { value: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'; label: string; color: string }[] = [
  { value: 'ONLINE',  label: 'Active',          color: 'bg-green-500'  },
  { value: 'AWAY',    label: 'Away',             color: 'bg-yellow-400' },
  { value: 'DND',     label: 'Do not disturb',   color: 'bg-red-500'    },
  { value: 'OFFLINE', label: 'Offline',          color: 'bg-gray-400'   },
]

const avatarColors = [
  '#0099CC', '#7C3AED', '#059669', '#DC2626', '#D97706',
  '#DB2777', '#2563EB', '#0D9488', '#7C2D12', '#374151',
]

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
]

export default function StatusModal({ open, onClose }: Props) {
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)

  const [tab, setTab] = useState<Tab>('status')
  const [presence, setPresence] = useState<'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'>(
    (user?.presence as 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE') ?? 'ONLINE'
  )
  const [customMessage, setCustomMessage] = useState(user?.customStatusMessage ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [title, setTitle] = useState(user?.title || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#0099CC')
  const [savingProfile, setSavingProfile] = useState(false)
  const msgRef = useRef<HTMLInputElement>(null)

  // Sync local state when Redux user updates (e.g. auto-ONLINE on connect)
  useEffect(() => {
    if (user?.presence) setPresence(user.presence as 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE')
    if (user?.customStatusMessage !== undefined) setCustomMessage(user.customStatusMessage || '')
  }, [user?.presence, user?.customStatusMessage])

  if (!open || !user) return null

  async function applyPresence(value: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE') {
    setPresence(value)
    try {
      await userApi.updateStatus(value, customMessage)
      dispatch(updatePresence({ userId: user!.id, presence: value, customMessage }))
      dispatch(updateUserPresence({ userId: user!.id, presence: value, customMessage }))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function applyMessage() {
    const msg = customMessage.trim()
    try {
      await userApi.updateStatus(presence, msg)
      dispatch(updatePresence({ userId: user!.id, presence, customMessage: msg }))
      dispatch(updateUserPresence({ userId: user!.id, presence, customMessage: msg }))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const res = await userApi.updateProfile({ displayName, title, phone, timezone, avatarColor })
      dispatch(updateUser(res.data))
      toast.success('Profile updated')
      onClose()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleLogout() {
    dispatch(logout())
    onClose()
  }

  const currentOpt = presenceOptions.find(p => p.value === presence)!
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-gray-900 placeholder-gray-400"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Compact header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <UserAvatar
            displayName={user.displayName}
            avatarColor={user.avatarColor}
            size="sm"
            presence={presence}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${currentOpt.color}`} />
              <span className="text-xs text-gray-400">{currentOpt.label}</span>
              {user.customStatusMessage && (
                <span className="text-xs text-gray-400 truncate">— {user.customStatusMessage}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['status', 'profile'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'status' ? 'Status' : 'Edit Profile'}
            </button>
          ))}
        </div>

        {tab === 'status' && (
          <div className="px-4 py-3 space-y-3">
            {/* Custom message */}
            <input
              ref={msgRef}
              type="text"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              onBlur={applyMessage}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
              placeholder="What's your status?"
              maxLength={100}
              className={inputCls}
            />

            {/* Presence options — click = instant save */}
            <div className="space-y-0.5">
              {presenceOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => applyPresence(opt.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    presence === opt.value
                      ? 'bg-brand-50 text-gray-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.color}`} />
                  <span className="text-sm font-medium">{opt.label}</span>
                  {presence === opt.value && (
                    <svg className="w-3.5 h-3.5 text-brand-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {/* Avatar color swatches */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avatar color</div>
              <div className="flex gap-2 flex-wrap">
                {avatarColors.map(c => (
                  <button
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: avatarColor === c ? '#0099CC' : 'transparent' }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Alice Smith" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
              <input type="text" value={user.email} disabled className={inputCls + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Engineer" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out of LockTrust
          </button>
        </div>
      </div>
    </div>
  )
}
