import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { sendTyping } from '../../socket/socketClient'
import { User } from '../../types'
import clsx from 'clsx'

interface Props {
  placeholder: string
  onSend: (content: string) => Promise<void>
  channelId?: number
  channelMembers?: User[]
}

export default function MessageInput({ placeholder, onSend, channelId, channelMembers }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const user = useSelector((s: RootState) => s.auth.user)
  const allUsers = useSelector((s: RootState) => s.users.users)

  // Mention picker state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const mentionStartPos = useRef<number>(-1)

  const mentionPool = channelMembers ?? allUsers
  const mentionResults = mentionQuery !== null
    ? mentionPool.filter(u =>
        u.id !== user?.id &&
        u.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : []

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)
    autoResize()

    if (channelId && user) {
      sendTyping(channelId, user.id, user.displayName, true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        sendTyping(channelId, user.id, user.displayName, false)
      }, 2000)
    }

    // Detect @ mention
    const cursor = e.target.selectionStart ?? val.length
    const upToCursor = val.slice(0, cursor)
    const atMatch = upToCursor.match(/@(\w*)$/)
    if (atMatch) {
      mentionStartPos.current = cursor - atMatch[0].length
      setMentionQuery(atMatch[1])
      setMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  function insertMention(u: User) {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart ?? text.length
    const before = text.slice(0, mentionStartPos.current)
    const after = text.slice(cursor)
    const inserted = `@${u.displayName} `
    const newText = before + inserted + after
    setText(newText)
    setMentionQuery(null)
    // restore cursor after inserted mention
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length
      ta.setSelectionRange(pos, pos)
      ta.focus()
    })
    autoResize()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionQuery !== null && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionResults[mentionIndex]); return }
      if (e.key === 'Escape') { setMentionQuery(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  useEffect(() => {
    textareaRef.current?.focus()
  }, [channelId])

  return (
    <div className="px-4 py-3 relative">
      {/* Mention picker */}
      {mentionQuery !== null && mentionResults.length > 0 && (
        <div className="absolute bottom-full mb-1 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
          {mentionResults.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={e => { e.preventDefault(); insertMention(u) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                i === mentionIndex ? 'bg-brand-50' : 'hover:bg-gray-50'
              )}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: u.avatarColor }}
              >
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900">{u.displayName}</span>
              {u.title && <span className="text-xs text-gray-400 truncate">{u.title}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-100 rounded-xl border border-gray-200 px-4 py-2 focus-within:border-brand-400 focus-within:bg-white transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 text-sm leading-6 max-h-44 scrollbar-thin py-1"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-0.5',
            text.trim() && !sending
              ? 'bg-brand-600 hover:bg-brand-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
          title="Send (Enter)"
        >
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">
        <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line · <strong>@</strong> to mention
      </p>
    </div>
  )
}
