import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { searchApi } from '../../api/searchApi'
import { dmApi } from '../../api/dmApi'
import { channelApi } from '../../api/channelApi'
import { setActiveChannel, updateChannel } from '../../store/channelSlice'
import { addConversation, setActiveConv } from '../../store/dmSlice'
import { subscribeToChannel } from '../../socket/socketClient'
import toast from 'react-hot-toast'

interface SearchResult {
  messages: { id: number; channelId: number; senderName: string; content: string }[]
  channels: { id: number; name: string; isPrivate: boolean }[]
  users: { id: number; displayName: string; email: string }[]
}

export default function SearchBar() {
  const dispatch = useDispatch()
  const { user } = useSelector((s: RootState) => s.auth)
  const allChannels = useSelector((s: RootState) => s.channel.channels)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timeoutRef.current)
    if (!q.trim()) { setResults(null); setOpen(false); return }
    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchApi.search(q)
        setResults(res.data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  async function handleChannelClick(channelId: number, isPrivate: boolean) {
    setOpen(false); setQuery('')
    const channel = allChannels.find(c => c.id === channelId)
    const isMember = channel && user ? channel.memberIds.includes(user.id) : false

    if (isMember || isPrivate) {
      // Already a member (or private — can't self-join), just navigate
      dispatch(setActiveChannel(channelId))
      dispatch(setActiveConv(null))
      if (isPrivate && !isMember) {
        toast.error('This is a private channel. Ask a member to invite you.')
      }
    } else {
      // Public channel, not a member — auto-join
      try {
        const res = await channelApi.join(channelId)
        dispatch(updateChannel(res.data))
        subscribeToChannel(channelId)
        dispatch(setActiveChannel(channelId))
        dispatch(setActiveConv(null))
        toast.success(`Joined #${res.data.name}`)
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to join channel')
      }
    }
  }

  async function handleUserClick(userId: number) {
    setOpen(false); setQuery('')
    try {
      const res = await dmApi.createConversation([userId])
      dispatch(addConversation(res.data))
      dispatch(setActiveConv(res.data.id))
      dispatch(setActiveChannel(null))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not open DM')
    }
  }

  const hasResults = results && (results.messages.length + results.channels.length + results.users.length) > 0

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-sidebar-hover rounded-lg px-3 py-1.5">
        <svg className="w-3.5 h-3.5 text-sidebar-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search LockTrust"
          className="bg-transparent text-sidebar-text placeholder-sidebar-muted text-xs w-full outline-none"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>}

          {!loading && !hasResults && query && (
            <div className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</div>
          )}

          {results?.channels.length ? (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Channels</div>
              {results.channels.map(ch => {
                const channelInStore = allChannels.find(c => c.id === ch.id)
                const isMember = channelInStore && user ? channelInStore.memberIds.includes(user.id) : false
                return (
                  <button key={ch.id} onClick={() => handleChannelClick(ch.id, ch.isPrivate ?? false)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left">
                    <span className="text-gray-400">{ch.isPrivate ? '🔒' : '#'}</span>
                    <span className="text-sm text-gray-900">{ch.name}</span>
                    {!isMember && !ch.isPrivate && (
                      <span className="ml-auto text-xs text-brand-600 font-medium">Join</span>
                    )}
                    {ch.isPrivate && !isMember && (
                      <span className="ml-auto text-xs text-gray-400">Private</span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : null}

          {results?.messages.length ? (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Messages</div>
              {results.messages.map(msg => (
                <button key={msg.id} onClick={() => handleChannelClick(msg.channelId, false)}
                  className="w-full flex flex-col px-4 py-2 hover:bg-gray-50 text-left">
                  <span className="text-xs font-semibold text-brand-600">{msg.senderName}</span>
                  <span className="text-sm text-gray-700 truncate">{msg.content}</span>
                </button>
              ))}
            </div>
          ) : null}

          {results?.users.length ? (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">People</div>
              {results.users.map(u => (
                <button key={u.id} onClick={() => handleUserClick(u.id)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left">
                  <span className="text-sm font-medium text-gray-900">{u.displayName}</span>
                  <span className="text-xs text-gray-400">{u.email}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
