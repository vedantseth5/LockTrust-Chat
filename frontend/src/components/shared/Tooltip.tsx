import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  children: React.ReactNode
}

export default function Tooltip({ text, children }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  function show() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPos({
      top: r.top - 8,        // above the trigger
      left: r.left + r.width / 2,
    })
    setVisible(true)
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center"
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[9999] -translate-x-1/2 -translate-y-full pointer-events-none"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg max-w-[200px] truncate">
            {text}
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
