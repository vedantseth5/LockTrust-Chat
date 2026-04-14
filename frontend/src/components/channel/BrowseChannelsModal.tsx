import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { channelApi } from '../../api/channelApi'
import { addChannel, updateChannel, setActiveChannel } from '../../store/channelSlice'
import { setActiveConv } from '../../store/dmSlice'
import { subscribeToChannel } from '../../socket/socketClient'
import Modal from '../shared/Modal'
import { Channel } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BrowseChannelsModal({ open, onClose }: Props) {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const allChannels = useSelector((s: RootState) => s.channel.channels)
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState<number | null>(null)

  // All public channels visible in the store
  const publicChannels = allChannels.filter(c => !c.isPrivate)
  const filtered = publicChannels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  function isMember(ch: Channel) {
    return currentUser ? ch.memberIds.includes(currentUser.id) : false
  }

  async function handleJoin(ch: Channel) {
    setJoining(ch.id)
    try {
      const res = await channelApi.join(ch.id)
      dispatch(updateChannel(res.data))
      subscribeToChannel(ch.id)
      dispatch(setActiveChannel(ch.id))
      dispatch(setActiveConv(null))
      onClose()
      toast.success(`Joined #${ch.name}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join')
    } finally {
      setJoining(null)
    }
  }

  function handleOpen(ch: Channel) {
    dispatch(setActiveChannel(ch.id))
    dispatch(setActiveConv(null))
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Browse channels">
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search channels..."
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />

        <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-1">
          {filtered.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">No channels found</div>
          )}
          {filtered.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-bold">#</span>
                  <span className="text-sm font-semibold text-gray-900">{ch.name}</span>
                  <span className="text-xs text-gray-400">· {ch.memberCount} members</span>
                </div>
                {ch.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{ch.description}</p>
                )}
              </div>
              {isMember(ch) ? (
                <button
                  onClick={() => handleOpen(ch)}
                  className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  Open
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(ch)}
                  disabled={joining === ch.id}
                  className="flex-shrink-0 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {joining === ch.id ? 'Joining...' : 'Join'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
