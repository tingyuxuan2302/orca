import { describe, expect, it } from 'vitest'
import { softMarkColors } from './repo-badge-color'

describe('softMarkColors', () => {
  it('washes the fill and shifts the letters toward the theme', () => {
    expect(softMarkColors('#ef4444', 'dark')).toEqual({
      background: 'rgba(239, 68, 68, 0.16)',
      foreground: '#f47c7c'
    })
    expect(softMarkColors('#ef4444', 'light')).toEqual({
      background: 'rgba(239, 68, 68, 0.16)',
      foreground: '#a73030'
    })
  })

  it('treats invalid input as the neutral default', () => {
    expect(softMarkColors('nope', 'dark').background).toBe('rgba(115, 115, 115, 0.16)')
  })
})
