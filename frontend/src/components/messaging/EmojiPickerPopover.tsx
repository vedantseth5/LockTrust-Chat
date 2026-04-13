import React, { useEffect, useRef } from 'react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPickerPopover({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-8 z-50 shadow-xl rounded-xl overflow-hidden">
      <EmojiPicker
        onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
        height={350}
        width={300}
        searchDisabled={false}
        skinTonesDisabled
        previewConfig={{ showPreview: false }}
      />
    </div>
  )
}
