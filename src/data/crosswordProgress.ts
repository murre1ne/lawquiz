import { CROSSWORD_XP_PER_WORD } from './crosswordData'

/**
 * Локальное сохранение прогресса кроссвордов и защита от повторного начисления XP
 * Хранится исключительно в localStorage браузера без регистрации и backend.
 */

export interface CrosswordPuzzleProgress {
  bestScore: number
  completed: boolean
  /** Уникальные номера слов, за которые опыт уже был начислен */
  solvedWordNumbers: number[]
  xpEarned: number
  lastPlayedAt: string
}

export type CrosswordProgressMap = Record<string, CrosswordPuzzleProgress>

const STORAGE_KEY = 'lqkz-crossword-progress-v1'

export function loadCrosswordProgress(): CrosswordProgressMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as CrosswordProgressMap
  } catch {
    return {}
  }
}

export function saveCrosswordProgress(map: CrosswordProgressMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* локальное хранилище может быть недоступно */
  }
}

/**
 * Фиксирует результат проверки кроссворда.
 * XP начисляется строго один раз за каждое впервые правильно разгаданное слово
 * данного кроссворда — повторные проверки и повторные прохождения не дублируют XP.
 */
export function recordCrosswordResult(
  currentMap: CrosswordProgressMap,
  puzzleId: string,
  solvedWordNumbers: number[],
  totalWords: number
): {
  nextMap: CrosswordProgressMap
  xpGainedNow: number
  alreadyMaxed: boolean
} {
  const prev: CrosswordPuzzleProgress = currentMap[puzzleId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const previouslySolved = new Set(prev.solvedWordNumbers)
  const newlySolved = solvedWordNumbers.filter((num) => !previouslySolved.has(num))
  const xpGainedNow = newlySolved.length * CROSSWORD_XP_PER_WORD

  const mergedSolved = Array.from(new Set([...prev.solvedWordNumbers, ...solvedWordNumbers])).sort(
    (a, b) => a - b
  )
  const bestScore = Math.max(prev.bestScore, solvedWordNumbers.length)
  const completed = prev.completed || solvedWordNumbers.length >= totalWords

  const nextEntry: CrosswordPuzzleProgress = {
    bestScore,
    completed,
    solvedWordNumbers: mergedSolved,
    xpEarned: mergedSolved.length * CROSSWORD_XP_PER_WORD,
    lastPlayedAt: new Date().toISOString(),
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [puzzleId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  return {
    nextMap,
    xpGainedNow,
    alreadyMaxed: prev.solvedWordNumbers.length >= totalWords,
  }
}
