export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const COLORS = [
  '#0099CC', '#00B8D4', '#26A69A', '#42A5F5',
  '#7E57C2', '#EC407A', '#EF5350', '#FF7043',
  '#8D6E63', '#78909C', '#66BB6A', '#FFA726',
]

export function colorFromId(id: number): string {
  return COLORS[id % COLORS.length]
}
