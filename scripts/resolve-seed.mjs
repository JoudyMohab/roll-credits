// Resolves scripts/seed-raw.txt (a raw "[x]/[ ] title" checklist) against TMDB.
// Run with: node scripts/resolve-seed.mjs
// Requires VITE_TMDB_API_KEY in .env (repo root).
//
// Output:
//   src/data/seed-resolved.json  — confidently matched items, auto-imported on first run
//   src/data/seed-review.json    — ambiguous / unresolved items for manual review in-app

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true })

const API_KEY = process.env.VITE_TMDB_API_KEY
if (!API_KEY) {
  console.error('Missing VITE_TMDB_API_KEY in .env — cannot resolve seed data.')
  process.exit(1)
}

const TODAY = new Date('2026-09-01')

// Known spelling/typo corrections the user confirmed are unambiguous.
const TYPO_MAP = {
  'the exoricist': 'the exorcist',
  poltegereist: 'poltergeist',
  midsommrt: 'midsommar',
  atonment: 'atonement',
  'ferris bullers day off': "ferris bueller's day off",
  'bridge to teribithia': 'bridge to terabithia',
  'la llorana': 'la llorona',
  'gunes akimbo': 'guns akimbo',
  'napoleon dinamite': 'napoleon dynamite',
  'irreplacable you': 'irreplaceable you',
  'geralds game': "gerald's game",
  'isnt it romantic': "isn't it romantic",
  'mama mia': 'mamma mia!',
  'hachi: a dogs tale': "hachi: a dog's tale",
  'hotel infreno': 'hotel inferno',
  'gold finch': 'the goldfinch',
  us: 'us',
  'highschool musical': 'high school musical',
  'highschool musical 2': 'high school musical 2',
  'highschool musical 3: senior year': 'high school musical 3: senior year',
  'adventures of babysitting': 'adventures in babysitting',
  "a baby's day out": "baby's day out",
  'infinity polar bear': 'infinitely polar bear',
  'fast x part 1': 'fast x',
  'my sister is a keeper': "my sister's keeper",
  'whats eating gilberts grape': "what's eating gilbert grape",
  'gossip girls': 'gossip girl',
  outerbanks: 'outer banks',
  'im not okay with this': 'i am not okay with this',
}

// Titles with a bare trailing year and no parentheses, e.g. "awake 2007".
const BARE_YEAR_SUFFIX = /^(.*\S)\s+(\d{4})$/

function stripAnnotations(raw) {
  let title = raw.trim()
  let upcoming = false
  let yearHint = null
  const parenMatch = title.match(/\(([^)]+)\)\s*$/)
  if (parenMatch) {
    const inner = parenMatch[1].trim().toLowerCase()
    if (/^\d{4}$/.test(inner)) {
      yearHint = Number(inner)
    } else if (inner.includes('soon') || inner.includes('upcoming')) {
      upcoming = true
    }
    title = title.slice(0, parenMatch.index).trim()
  }
  if (yearHint === null) {
    const bareYear = title.match(BARE_YEAR_SUFFIX)
    if (bareYear) {
      const y = Number(bareYear[2])
      if (y >= 1900 && y <= TODAY.getFullYear() + 5) {
        title = bareYear[1]
        yearHint = y
      }
    }
  }
  return { title, upcoming, yearHint }
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’".,!?:;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function titleSimilarity(query, candidate) {
  const a = normalize(query)
  const b = normalize(candidate)
  if (!a || !b) return 0
  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 90
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return Math.max(0, (1 - dist / maxLen) * 100)
}

async function tmdbGet(pathname, params) {
  const url = new URL(`https://api.themoviedb.org/3${pathname}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${pathname}`)
  return res.json()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function searchType(mediaType, query) {
  const data = await tmdbGet(mediaType === 'movie' ? '/search/movie' : '/search/tv', {
    query,
    include_adult: 'false',
  })
  return data.results.map((r) => ({
    id: r.id,
    mediaType,
    title: mediaType === 'movie' ? r.title : r.name,
    date: mediaType === 'movie' ? r.release_date : r.first_air_date,
    genreIds: r.genre_ids ?? [],
    popularity: r.popularity ?? 0,
    voteCount: r.vote_count ?? 0,
    posterPath: r.poster_path ?? null,
  }))
}

function scoreCandidate(query, yearHint, candidate) {
  let score = titleSimilarity(query, candidate.title)
  const year = candidate.date ? Number(candidate.date.slice(0, 4)) : null
  if (yearHint && year) {
    score += Math.abs(year - yearHint) <= 1 ? 15 : -12
  }
  // vote_count is a much better "this is the one everyone means" signal than the
  // popularity field (which is a volatile trending score) — a title with 400x the
  // votes of a same-named obscurity is almost certainly the intended match.
  const popularityBonus = Math.log10(1 + candidate.voteCount) * 10 + Math.log10(1 + candidate.popularity) * 3
  score += Math.min(55, popularityBonus)
  return score
}

async function resolveItem(rawTitle, declaredType, watched) {
  const { title: stripped, upcoming: upcomingFlag, yearHint } = stripAnnotations(rawTitle)
  const normalizedKey = stripped.toLowerCase()
  const corrected = TYPO_MAP[normalizedKey] ?? stripped

  const otherType = declaredType === 'movie' ? 'tv' : 'movie'
  const [primary, secondary] = await Promise.all([
    searchType(declaredType, corrected).catch(() => []),
    searchType(otherType, corrected).catch(() => []),
  ])

  const scored = [...primary, ...secondary]
    .map((c) => ({ ...c, score: scoreCandidate(corrected, yearHint, c) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  const second = scored.find((c) => c.id !== best?.id || c.mediaType !== best?.mediaType)

  const base = { rawTitle, declaredType, watched, correctedTitle: corrected, upcomingFlag }

  if (!best) {
    return { ...base, status: 'unresolved', candidates: [] }
  }

  const confidentGap = second ? best.score - second.score : 99
  const bestSim = titleSimilarity(corrected, best.title)
  const year = best.date ? Number(best.date.slice(0, 4)) : null
  const isUpcoming = upcomingFlag || (year !== null && year > TODAY.getFullYear()) || !best.date

  if (bestSim >= 85 && best.score >= 95 && confidentGap >= 15) {
    return {
      ...base,
      status: 'resolved',
      mediaType: best.mediaType,
      tmdbId: best.id,
      title: best.title,
      year,
      genreIds: best.genreIds,
      upcoming: isUpcoming,
    }
  }

  if (best.score >= 55) {
    return {
      ...base,
      status: 'ambiguous',
      candidates: scored.slice(0, 5).map((c) => ({
        mediaType: c.mediaType,
        tmdbId: c.id,
        title: c.title,
        year: c.date ? Number(c.date.slice(0, 4)) : null,
        posterPath: c.posterPath,
        score: Math.round(c.score),
      })),
    }
  }

  return {
    ...base,
    status: 'unresolved',
    candidates: scored.slice(0, 3).map((c) => ({
      mediaType: c.mediaType,
      tmdbId: c.id,
      title: c.title,
      year: c.date ? Number(c.date.slice(0, 4)) : null,
      posterPath: c.posterPath,
      score: Math.round(c.score),
    })),
  }
}

async function processInBatches(items, batchSize, worker) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(worker))
    results.push(...batchResults)
    process.stdout.write(`\rResolved ${Math.min(i + batchSize, items.length)}/${items.length}`)
    await sleep(120)
  }
  console.log()
  return results
}

function parseSeedFile(text) {
  const lines = text.split(/\r?\n/)
  const items = []
  let section = null
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed === 'MOVIES') {
      section = 'movie'
      continue
    }
    if (trimmed === 'SHOWS') {
      section = 'tv'
      continue
    }
    const match = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)$/)
    if (match && section) {
      items.push({ rawTitle: match[2].trim(), declaredType: section, watched: match[1].toLowerCase() === 'x' })
    }
  }
  return items
}

async function main() {
  const seedPath = path.join(__dirname, 'seed-raw.txt')
  const items = parseSeedFile(readFileSync(seedPath, 'utf-8'))
  console.log(`Parsed ${items.length} seed items.`)

  const resolved = await processInBatches(items, 6, (item) => resolveItem(item.rawTitle, item.declaredType, item.watched))

  const ok = resolved.filter((r) => r.status === 'resolved')
  const ambiguous = resolved.filter((r) => r.status === 'ambiguous')
  const unresolved = resolved.filter((r) => r.status === 'unresolved')

  // Dedupe resolved entries that point at the same TMDB item (declared duplicates in the list).
  const dedupMap = new Map()
  for (const r of ok) {
    const key = `${r.mediaType}-${r.tmdbId}`
    const existing = dedupMap.get(key)
    if (!existing) {
      dedupMap.set(key, { ...r, rawTitles: [r.rawTitle] })
    } else {
      existing.watched = existing.watched || r.watched
      existing.rawTitles.push(r.rawTitle)
    }
  }
  const deduped = [...dedupMap.values()]

  const dataDir = path.join(ROOT, 'src', 'data')
  writeFileSync(path.join(dataDir, 'seed-resolved.json'), JSON.stringify(deduped, null, 2))
  writeFileSync(path.join(dataDir, 'seed-review.json'), JSON.stringify([...ambiguous, ...unresolved], null, 2))

  console.log(`\nResolved: ${deduped.length} (from ${ok.length} matches, ${ok.length - deduped.length} deduped)`)
  console.log(`Ambiguous: ${ambiguous.length}`)
  console.log(`Unresolved: ${unresolved.length}`)
  console.log('\nWrote src/data/seed-resolved.json and src/data/seed-review.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
