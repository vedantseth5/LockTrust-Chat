import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { channelApi } from '../../api/channelApi'
import { updateChannel } from '../../store/channelSlice'
import Modal from '../shared/Modal'
import UserAvatar from '../shared/UserAvatar'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  channelId: number
}

export default function InviteToChannelModal({ open, onClose, channelId }: Props) {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const allUsers = useSelector((s: RootState) => s.users.users)
  const channel = useSelector((s: RootState) => s.channel.channels.find(c => c.id === channelId))
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<number | null>(null)

  const nonMembers = allUsers.filter(u =>
    u.id !== currentUser?.id &&
    !channel?.memberIds.includes(u.id) &&
    (u.displayName.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleAdd(userId: number, displayName: string) {
    setAdding(userId)
    try {
      const res = await channelApi.addMember(channelId, userId)
      dispatch(updateChannel(res.data))
      toast.success(`Added ${displayName} to #${channel?.name}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Invite people to #${channel?.name}`}>
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search people..."
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-0.5">
          {nonMembers.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">
              {allUsers.length === 0 ? 'No other users' : 'Everyone is already a member'}
            </div>
          )}
          {nonMembers.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
              <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="sm" presence={u.presence} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{u.displayName}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>
              <button
                onClick={() => handleAdd(u.id, u.displayName)}
                disabled={adding === u.id}
                className="flex-shrink-0 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {adding === u.id ? 'Adding...' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
