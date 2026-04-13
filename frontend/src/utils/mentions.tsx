import React from 'react'

export function parseMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\S+)/g)
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-brand-500 font-semibold cursor-pointer hover:underline">
        {part}
      </span>
    ) : (
      part
    )
  )
}
