import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActiveChannel } from '../../store/channelSlice'
import { setActiveConv } from '../../store/dmSlice'
import UserAvatar from '../shared/UserAvatar'
import CreateChannelModal from '../channel/CreateChannelModal'
import BrowseChannelsModal from '../channel/BrowseChannelsModal'
import NewDmModal from '../dm/NewDmModal'
import StatusModal from '../user/StatusModal'
import SearchBar from '../search/SearchBar'
import clsx from 'clsx'
import Tooltip from '../shared/Tooltip'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { user } = useSelector((s: RootState) => s.auth)
  const { channels, activeChannelId, unread: channelUnread, mentions: channelMentions } = useSelector((s: RootState) => s.channel)
  const { conversations, activeConvId, unread: dmUnread } = useSelector((s: RootState) => s.dm)
  const allUsers = useSelector((s: RootState) => s.users.users)

  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showBrowseChannels, setShowBrowseChannels] = useState(false)
  const [showNewDm, setShowNewDm] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [channelsCollapsed, setChannelsCollapsed] = useState(false)
  const [dmsCollapsed, setDmsCollapsed] = useState(false)

  // Only show channels the user is a member of
  const myChannels = channels.filter(c => user && c.memberIds.includes(user.id))
  // Count joinable public channels
  const joinableCount = channels.filter(c => !c.isPrivate && user && !c.memberIds.includes(user.id)).length

  function selectChannel(id: number) {
    dispatch(setActiveChannel(id))
    dispatch(setActiveConv(null))
  }

  function selectConv(id: number) {
    dispatch(setActiveConv(id))
    dispatch(setActiveChannel(null))
  }

  function getConvName(conv: typeof conversations[0]) {
    if (conv.isGroup) return conv.name || 'Group'
    const other = conv.participants.find(p => p.id !== user?.id)
    return other?.displayName || 'Unknown'
  }

  function getConvUser(conv: typeof conversations[0]) {
    return conv.participants.find(p => p.id !== user?.id) || conv.participants[0]
  }

  return (
    <div className="w-64 bg-sidebar h-full flex flex-col select-none">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="LockTrust" className="w-7 h-7 object-contain flex-shrink-0" />
          <div>
            <div className="text-white font-bold text-sm leading-tight">LockTrust</div>
            <div className="text-sidebar-muted text-xs truncate max-w-[140px]">{user?.displayName}</div>
          </div>
        </div>
        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" title="Connected" />
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <SearchBar />
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">

        {/* Channels section */}
        <div className="mb-2">
          <div
            className="flex items-center justify-between px-4 py-1 cursor-pointer group"
            onClick={() => setChannelsCollapsed(v => !v)}
          >
            <span className="text-sidebar-muted text-xs font-semibold uppercase tracking-wider group-hover:text-sidebar-text transition-colors">
              {channelsCollapsed ? '▶' : '▼'} Channels
            </span>
            <button
              onClick={e => { e.stopPropagation(); setShowCreateChannel(true) }}
              className="text-sidebar-muted hover:text-white text-lg leading-none w-5 h-5 flex items-center justify-center rounded"
              title="Create channel"
            >
              +
            </button>
          </div>

          {!channelsCollapsed && (
            <>
              {myChannels.map(ch => {
                const hasUnread = (channelUnread[ch.id] || 0) > 0
                const mentionCount = channelMentions[ch.id] || 0
                const isActive = activeChannelId === ch.id
                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChannel(ch.id)}
                    className={clsx(
                      'w-full text-left px-4 py-1.5 flex items-center gap-2 rounded-md mx-1 transition-colors text-sm',
                      isActive
                        ? 'bg-sidebar-active text-white'
                        : hasUnread
                          ? 'text-white hover:bg-sidebar-hover'
                          : 'text-sidebar-text hover:bg-sidebar-hover'
                    )}
                  >
                    <span className={clsx(isActive || hasUnread ? 'text-white' : 'text-sidebar-muted')}>
                      {ch.isPrivate ? '🔒' : '#'}
                    </span>
                    <span className={clsx('flex-1 truncate', hasUnread && !isActive && 'font-bold')}>
                      {ch.name}
                    </span>
                    {mentionCount > 0 && !isActive && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        @{mentionCount}
                      </span>
                    )}
                  </button>
                )
              })}

              <button
                onClick={() => setShowBrowseChannels(true)}
                className="w-full text-left px-4 py-1.5 flex items-center gap-2 text-sidebar-muted hover:text-sidebar-text text-xs mx-1 rounded-md hover:bg-sidebar-hover transition-colors"
              >
                <span className="text-base leading-none">🔍</span>
                <span>Browse channels</span>
                {joinableCount > 0 && (
                  <span className="ml-auto bg-sidebar-muted/30 text-sidebar-muted text-xs rounded-full px-1.5 py-0.5">
                    {joinableCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Direct Messages section */}
        <div className="mb-2">
          <div
            className="flex items-center justify-between px-4 py-1 cursor-pointer group"
            onClick={() => setDmsCollapsed(v => !v)}
          >
            <span className="text-sidebar-muted text-xs font-semibold uppercase tracking-wider group-hover:text-sidebar-text transition-colors">
              {dmsCollapsed ? '▶' : '▼'} Direct Messages
            </span>
            <button
              onClick={e => { e.stopPropagation(); setShowNewDm(true) }}
              className="text-sidebar-muted hover:text-white text-lg leading-none w-5 h-5 flex items-center justify-center rounded"
              title="New DM"
            >
              +
            </button>
          </div>

          {!dmsCollapsed && conversations.map(conv => {
            const other = getConvUser(conv)
            const otherFull = allUsers.find(u => u.id === other?.id)
            const statusMsg = otherFull?.customStatusMessage
            return (
              <button
                key={conv.id}
                onClick={() => selectConv(conv.id)}
                className={clsx(
                  'w-full text-left px-4 py-1.5 flex items-center gap-2 rounded-md mx-1 transition-colors text-sm group/dm',
                  activeConvId === conv.id
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover'
                )}
              >
                {other && (
                  <UserAvatar
                    displayName={other.displayName}
                    avatarColor={other.avatarColor}
                    size="xs"
                    presence={otherFull?.presence || other.presence}
                  />
                )}
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <span className={clsx('truncate', dmUnread[conv.id] > 0 && activeConvId !== conv.id && 'font-bold text-white')}>
                    {getConvName(conv)}
                  </span>
                  {statusMsg && (
                    <Tooltip text={statusMsg}>
                      <span className="w-1.5 h-1.5 rounded-full bg-sidebar-muted flex-shrink-0 opacity-60" />
                    </Tooltip>
                  )}
                </div>
                {dmUnread[conv.id] > 0 && activeConvId !== conv.id && (
                  <span className="bg-brand-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                    {dmUnread[conv.id]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* User profile bar */}
      {user && (
        <button
          onClick={() => setShowStatus(true)}
          className="flex items-center gap-3 px-4 py-3 border-t border-sidebar-border hover:bg-sidebar-hover transition-colors group"
        >
          <UserAvatar
            displayName={user.displayName}
            avatarColor={user.avatarColor}
            size="sm"
            presence={user.presence}
          />
          <div className="flex-1 text-left min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.displayName}</div>
            <div className="text-sidebar-muted text-xs truncate">
              {user.customStatusMessage
                ? user.customStatusMessage
                : user.presence === 'ONLINE' ? 'Active'
                : user.presence === 'AWAY' ? 'Away'
                : user.presence === 'DND' ? 'Do not disturb'
                : 'Offline'}
            </div>
          </div>
          <svg className="w-4 h-4 text-sidebar-muted group-hover:text-sidebar-text transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      )}

      <CreateChannelModal open={showCreateChannel} onClose={() => setShowCreateChannel(false)} />
      <BrowseChannelsModal open={showBrowseChannels} onClose={() => setShowBrowseChannels(false)} />
      <NewDmModal open={showNewDm} onClose={() => setShowNewDm(false)} />
      <StatusModal open={showStatus} onClose={() => setShowStatus(false)} />
    </div>
  )
}
