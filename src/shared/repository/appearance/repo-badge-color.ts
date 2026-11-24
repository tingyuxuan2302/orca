export const REPO_COLORS = [
  '#737373', // neutral
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#8b5cf6', // purple
  '#ec4899' // pink
] as const

export const DEFAULT_REPO_BADGE_COLOR = REPO_COLORS[0]

const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeRepoBadgeColor(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const match = value.trim().match(HEX_COLOR_PATTERN)
  if (!match) {
    return null
  }

  const rawHex = match[1].toLowerCase()
  const hex =
    rawHex.length === 3
      ? rawHex
          .split('')
          .map((part) => part + part)
          .join('')
      : rawHex
  const normalized = `#${hex}`
  return REPO_COLORS.find((repoColor) => repoColor === normalized) ?? normalized
}

export function resolveRepoBadgeColor(value: unknown): string {
  return normalizeRepoBadgeColor(value) ?? DEFAULT_REPO_BADGE_COLOR
}

function hexChannels(hex: string): number[] {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
}

const toHex = (channels: number[]): string =>
  `#${channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`

// Soft tint: a translucent wash of the color with letters in a deeper (light theme) or brighter
// (dark theme) shade of the same hue, so the mark keeps one hue instead of white/black text.
const SOFT_FILL_ALPHA = 0.22
const SOFT_TEXT_SHIFT = 0.3

export type SoftMarkColors = { background: string; foreground: string }

export function softMarkColors(color: unknown, scheme: 'light' | 'dark'): SoftMarkColors {
  const channels = hexChannels(resolveRepoBadgeColor(color))
  const target = scheme === 'dark' ? 255 : 0
  return {
    background: `rgba(${channels.join(', ')}, ${SOFT_FILL_ALPHA})`,
    foreground: toHex(channels.map((value) => value + (target - value) * SOFT_TEXT_SHIFT))
  }
}
