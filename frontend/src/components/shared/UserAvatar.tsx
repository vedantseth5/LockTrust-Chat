import React from 'react'
import { getInitials } from '../../utils/avatar'
import clsx from 'clsx'

interface Props {
  displayName: string
  avatarColor: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  presence?: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

const presenceColors: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-400',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-400',
}

export default function UserAvatar({ displayName, avatarColor, size = 'md', presence, className, onClick }: Props) {
  return (
    <div
      className={clsx('relative flex-shrink-0', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div
        className={clsx('rounded-lg flex items-center justify-center font-bold text-white select-none', sizes[size])}
        style={{ backgroundColor: avatarColor }}
      >
        {getInitials(displayName)}
      </div>
      {presence && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            size === 'xs' ? 'w-2 h-2' : 'w-3 h-3',
            presenceColors[presence] || 'bg-gray-400'
          )}
        />
      )}
    </div>
  )
}
