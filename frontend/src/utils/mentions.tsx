import React from 'react'
import { User } from '../types'

// Build a regex that matches @DisplayName for any user in the list,
// longest names first so "Alice Smith" is matched before "Alice".
function buildMentionRegex(users: User[]): RegExp {
  if (users.length === 0) return /(?!)/  // never matches
  const escaped = users
    .map(u => u.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
  return new RegExp(`(@(?:${escaped.join('|')}))(?=\\s|$|[^\\w])`, 'g')
}

export function parseMentions(
  content: string,
  users: User[] = [],
  currentUserId?: number,
  onMentionClick?: (user: User, anchor: HTMLElement) => void
): React.ReactNode {
  if (users.length === 0) return content

  const regex = buildMentionRegex(users)
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  regex.lastIndex = 0
  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) parts.push(content.slice(last, match.index))

    const token = match[1]           // e.g. "@Alice Smith"
    const name = token.slice(1)      // "Alice Smith"
    const user = users.find(u => u.displayName === name)!
    const isSelf = user.id === currentUserId

    parts.push(
      <span
        key={match.index}
        className={
          isSelf
            ? 'bg-yellow-100 text-yellow-800 font-semibold rounded px-1 cursor-pointer hover:bg-yellow-200 transition-colors'
            : 'bg-brand-50 text-brand-700 font-semibold rounded px-1 cursor-pointer hover:bg-brand-100 transition-colors'
        }
        onClick={e => onMentionClick?.(user, e.currentTarget as HTMLElement)}
      >
        {token}
      </span>
    )
    last = match.index + match[0].length
  }

  if (last < content.length) parts.push(content.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}
