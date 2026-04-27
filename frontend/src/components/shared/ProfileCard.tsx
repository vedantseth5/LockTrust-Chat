import React, { useEffect, useRef, useState } from 'react'
import { User } from '../../types'

interface Props {
  user: User
  anchorRef: React.RefObject<HTMLElement>
  onClose: () => void
}

export default function ProfileCard({ user, anchorRef, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' })

  // Position the card smartly based on available space
  useEffect(() => {
    const anchor = anchorRef.current
    const card = cardRef.current
    if (!anchor || !card) return

    const anchorRect = anchor.getBoundingClientRect()
    const cardW = 280
    const cardH = 200
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top: number
    let left: number

    // Prefer opening to the right, fallback left
    if (anchorRect.right + cardW + margin <= vw) {
      left = anchorRect.right + margin
    } else {
      left = anchorRect.left - cardW - margin
    }

    // Prefer opening downward from anchor top, fallback upward
    if (anchorRect.top + cardH <= vh) {
      top = anchorRect.top
    } else {
      top = anchorRect.bottom - cardH
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, vw - cardW - 8))
    top = Math.max(8, Math.min(top, vh - cardH - 8))

    setStyle({ position: 'fixed', top, left, width: cardW, visibility: 'visible', zIndex: 9999 })
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const presenceLabel: Record<string, string> = {
    ONLINE: 'Active now', AWAY: 'Away', DND: 'Do not disturb', OFFLINE: 'Offline'
  }
  const presenceColor: Record<string, string> = {
    ONLINE: 'bg-green-500', AWAY: 'bg-yellow-400', DND: 'bg-red-500', OFFLINE: 'bg-gray-400'
  }

  return (
    <div
      ref={cardRef}
      style={style}
      className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Color banner */}
      <div className="h-12" style={{ backgroundColor: user.avatarColor + '33' }} />

      <div className="px-4 pb-4 -mt-6">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-sm mb-2"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{user.displayName}</p>
            {user.title && <p className="text-xs text-gray-500 mt-0.5">{user.title}</p>}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${presenceColor[user.presence] || 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">{presenceLabel[user.presence] || 'Offline'}</span>
          </div>
        </div>

        {user.customStatusMessage && (
          <p className="text-xs text-gray-500 mt-1.5 italic">"{user.customStatusMessage}"</p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <p className="text-xs text-gray-400">{user.email}</p>
          {user.timezone && user.timezone !== 'UTC' && (
            <p className="text-xs text-gray-400">🕐 {user.timezone}</p>
          )}
        </div>
      </div>
    </div>
  )
}
