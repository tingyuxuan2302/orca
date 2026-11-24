import { sanitizeRepoMonogramText } from './repo-icon'

// Words that say nothing about which project this is, so they never supply a letter.
const FILLER_WORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'and',
  'js',
  'ts',
  'jsx',
  'tsx',
  'py',
  'rb',
  'rs',
  'io',
  'com',
  'org',
  'net',
  'dev',
  'git'
])

function nameWords(displayName: string): string[] {
  const words = displayName
    // Split camelCase and letter/digit boundaries so `myApp2` reads as my / App / 2.
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{L})(\p{N})|(\p{N})(\p{L})/gu, '$1$3 $2$4')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word.toLowerCase()))
  // A name made only of filler (e.g. `dev`) still needs letters.
  return meaningful.length > 0 ? meaningful : words
}

const isConsonant = (character: string): boolean =>
  /\p{L}/u.test(character) && !/[AEIOUY]/.test(character)

/**
 * Pick the letters a person would: initials for multi-word names, the first two letters for one
 * word, then other letters from the name so it differs from letters other projects already show.
 */
export function suggestRepoMonogram(displayName: string, taken: Iterable<string> = []): string {
  const used = new Set(Array.from(taken, (text) => text.toUpperCase()))
  const words = nameWords(displayName)
  if (words.length === 0) {
    return '?'
  }
  const [first, ...rest] = words.map((word) => Array.from(word.toUpperCase()))
  const lead = first[0]
  const later = first.slice(1)
  const candidates = [
    ...(rest.length > 0 ? rest.map((word) => lead + word[0]) : []),
    lead + (later[0] ?? ''),
    // Consonants carry a word's shape (`orca` → OR, OC), so they beat vowels as fallbacks.
    ...later.filter(isConsonant).map((character) => lead + character),
    ...later.map((character) => lead + character),
    ...rest.map((word) => word[0] + (word[1] ?? '')),
    lead
  ]
  const valid = candidates
    .map((candidate) => sanitizeRepoMonogramText(candidate))
    .filter((candidate): candidate is string => candidate !== null)
  return valid.find((candidate) => !used.has(candidate)) ?? valid[0] ?? '?'
}
