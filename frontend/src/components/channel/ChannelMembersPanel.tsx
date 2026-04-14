import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { User } from '../../types'
import { channelApi } from '../../api/channelApi'
import UserAvatar from '../shared/UserAvatar'
import Tooltip from '../shared/Tooltip'

interface Props {
  channelId: number
  onClose: () => void
}

export default function ChannelMembersPanel({ channelId, onClose }: Props) {
  const allUsers = useSelector((s: RootState) => s.users.users)
  const [members, setMembers] = useState<User[]>([])

  useEffect(() => {
    channelApi.getMembers(channelId).then(res => setMembers(res.data))
  }, [channelId])

  const enriched = members.map(m => allUsers.find(u => u.id === m.id) || m)

  return (
    <div className="w-64 border-l border-gray-200 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">Members ({members.length})</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {enriched.map(user => {
          const presenceLabel: Record<string, string> = { ONLINE: 'Online', AWAY: 'Away', DND: 'Do not disturb', OFFLINE: 'Offline' }
          return (
            <div key={user.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 group/member">
              <UserAvatar
                displayName={user.displayName}
                avatarColor={user.avatarColor}
                size="sm"
                presence={user.presence}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{user.displayName}</span>
                  {user.customStatusMessage && (
                    <Tooltip text={user.customStatusMessage}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    </Tooltip>
                  )}
                </div>
                <div className="text-xs text-gray-400">{presenceLabel[user.presence || 'OFFLINE'] || 'Offline'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
