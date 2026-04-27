import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import Modal from '../shared/Modal'
import UserAvatar from '../shared/UserAvatar'
import { dmApi } from '../../api/dmApi'
import { addConversation, setActiveConv } from '../../store/dmSlice'
import { setActiveChannel } from '../../store/channelSlice'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewDmModal({ open, onClose }: Props) {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const allUsers = useSelector((s: RootState) => s.users.users)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const filtered = allUsers.filter(u =>
    u.id !== currentUser?.id &&
    (u.displayName.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  )

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleOpen() {
    if (!selected.length) return
    setLoading(true)
    try {
      const res = await dmApi.createConversation(selected)
      dispatch(addConversation(res.data))
      dispatch(setActiveConv(res.data.id))
      dispatch(setActiveChannel(null))
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to open DM')
    } finally {
      setLoading(false)
      setSelected([])
      setSearch('')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Message">
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people..."
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(id => {
              const u = allUsers.find(u => u.id === id)!
              return (
                <span key={id} className="flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-medium px-2 py-1 rounded-full">
                  {u.displayName}
                  <button onClick={() => toggle(id)} className="hover:text-brand-900 font-bold">×</button>
                </span>
              )
            })}
          </div>
        )}

        <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
          {filtered.map(user => (
            <button
              key={user.id}
              onClick={() => toggle(user.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                selected.includes(user.id) ? 'bg-brand-50' : 'hover:bg-gray-50'
              }`}
            >
              <UserAvatar displayName={user.displayName} avatarColor={user.avatarColor} size="sm" presence={user.presence} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user.displayName}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
              {selected.includes(user.id) && (
                <span className="text-brand-600 font-bold text-lg">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpen}
          disabled={!selected.length || loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Opening...' : 'Open'}
        </button>
      </div>
    </Modal>
  )
}
