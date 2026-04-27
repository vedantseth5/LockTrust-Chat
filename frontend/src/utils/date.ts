import { format, isToday, isYesterday, parseISO } from 'date-fns'

export function formatMessageTime(iso: string): string {
  const d = parseISO(iso)
  return format(d, 'h:mm a')
}

export function formatMessageDate(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

export function formatFull(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy h:mm a')
}
