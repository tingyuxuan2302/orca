import { describe, expect, it } from 'vitest'
import { suggestRepoMonogram } from './repo-monogram'

describe('suggestRepoMonogram', () => {
  it('abbreviates names the way people do', () => {
    expect(suggestRepoMonogram('orca')).toBe('OR')
    expect(suggestRepoMonogram('orca-internal')).toBe('OI')
    expect(suggestRepoMonogram('myApp')).toBe('MA')
    expect(suggestRepoMonogram('terraform_modules')).toBe('TM')
    expect(suggestRepoMonogram('customer-onboarding-flow')).toBe('CO')
    expect(suggestRepoMonogram('x')).toBe('X')
  })

  it('ignores filler words and splits digits off', () => {
    expect(suggestRepoMonogram('next.js')).toBe('NE')
    expect(suggestRepoMonogram('the-platform')).toBe('PL')
    expect(suggestRepoMonogram('web3')).toBe('W3')
    expect(suggestRepoMonogram('dev')).toBe('DE')
  })

  it('steps to another abbreviation when one is taken', () => {
    expect(suggestRepoMonogram('orca', ['OR'])).toBe('OC')
    expect(suggestRepoMonogram('orca-internal', ['OI'])).toBe('OR')
    expect(suggestRepoMonogram('orca', ['or', 'OC'])).toBe('OA')
  })

  it('keeps non-Latin names', () => {
    expect(suggestRepoMonogram('東京')).toBe('東京')
  })
})
