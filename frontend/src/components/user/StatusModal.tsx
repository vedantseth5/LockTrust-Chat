import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from '../../api/userApi'
import { updatePresence, updateUser, logout } from '../../store/authSlice'
import { RootState } from '../../store'
import toast from 'react-hot-toast'
import UserAvatar from '../shared/UserAvatar'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'profile' | 'status'

const presenceOptions: { value: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'; label: string; color: string; desc: string; emoji: string }[] = [
  { value: 'ONLINE',  label: 'Active',          color: 'bg-green-500',  desc: 'Show as active',       emoji: '🟢' },
  { value: 'AWAY',    label: 'Away',             color: 'bg-yellow-400', desc: 'Show as away',         emoji: '🟡' },
  { value: 'DND',     label: 'Do not disturb',   color: 'bg-red-500',    desc: 'Mute notifications',   emoji: '🔴' },
  { value: 'OFFLINE', label: 'Offline',          color: 'bg-gray-400',   desc: 'Appear offline',       emoji: '⚫' },
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

  const [tab, setTab] = useState<Tab>('profile')

  // Profile tab state
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [title, setTitle] = useState(user?.title || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#0099CC')
  const [savingProfile, setSavingProfile] = useState(false)

  // Status tab state
  const [presence, setPresence] = useState<'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'>(
    (user?.presence as 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE') || 'ONLINE'
  )
  const [customMessage, setCustomMessage] = useState(user?.customStatusMessage || '')
  const [savingStatus, setSavingStatus] = useState(false)

  if (!open || !user) return null

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const res = await userApi.updateProfile({ displayName, title, phone, timezone, avatarColor })
      dispatch(updateUser(res.data))
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveStatus() {
    setSavingStatus(true)
    try {
      await userApi.updateStatus(presence, customMessage)
      dispatch(updatePresence({ userId: user!.id, presence, customMessage }))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  function handleLogout() {
    dispatch(logout())
    onClose()
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-gray-900 placeholder-gray-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header — avatar + name */}
        <div className="bg-gradient-to-br from-[#0f1923] to-[#1a2738] px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>

          <div className="flex items-center gap-4">
            {/* Big avatar with color picker trigger */}
            <div className="relative group">
              <UserAvatar
                displayName={displayName || user.displayName}
                avatarColor={avatarColor}
                size="lg"
                presence={presence}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-lg leading-tight truncate">
                {displayName || user.displayName}
              </div>
              {title && <div className="text-white/60 text-sm truncate">{title}</div>}
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${presenceOptions.find(p => p.value === presence)?.color}`} />
                <span className="text-white/60 text-xs capitalize">
                  {presenceOptions.find(p => p.value === presence)?.label}
                  {customMessage && ` — ${customMessage}`}
                </span>
              </div>
            </div>
          </div>

          {/* Avatar color swatches */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {avatarColors.map(c => (
              <button
                key={c}
                onClick={() => setAvatarColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: avatarColor === c ? 'white' : 'transparent',
                }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['profile', 'status'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'text-brand-600 border-b-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'profile' ? 'Edit Profile' : 'Set Status'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-5 space-y-4 max-h-80 overflow-y-auto">

          {tab === 'profile' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Alice Smith"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  value={user.email}
                  disabled
                  className={inputCls + ' bg-gray-50 text-gray-400 cursor-not-allowed'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Job title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Senior Engineer"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className={inputCls}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </>
          )}

          {tab === 'status' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Status message
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="What are you up to?"
                  maxLength={100}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Availability
                </label>
                <div className="space-y-1.5">
                  {presenceOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPresence(opt.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-colors text-left ${
                        presence === opt.value
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.color}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                        <div className="text-xs text-gray-400">{opt.desc}</div>
                      </div>
                      {presence === opt.value && (
                        <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {savingStatus ? 'Saving…' : 'Save status'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 border-t border-gray-100 pt-4">
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
