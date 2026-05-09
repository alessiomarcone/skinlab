import { describe, it, expect } from 'vitest'
import { buildImageUrl } from './sanity'

describe('buildImageUrl', () => {
  const base = 'https://cdn.sanity.io/images/proj/dataset/photo.jpg'

  it('appends webp format', () => {
    expect(buildImageUrl(base)).toContain('fm=webp')
  })

  it('appends width when provided', () => {
    expect(buildImageUrl(base, { w: 800 })).toContain('w=800')
  })

  it('defaults to quality 85', () => {
    expect(buildImageUrl(base)).toContain('q=85')
  })

  it('allows overriding quality', () => {
    expect(buildImageUrl(base, { q: 60 })).toContain('q=60')
  })

  it('preserves original URL protocol and host', () => {
    const result = buildImageUrl(base)
    expect(result.startsWith('https://cdn.sanity.io')).toBe(true)
  })
})
