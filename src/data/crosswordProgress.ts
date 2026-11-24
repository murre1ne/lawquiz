import { CROSSWORD_XP_PER_WORD } from './crosswordData'
import { LEGAL_CASE_XP_REWARD } from './legalCasesData'
import { CONTRACT_ANALYSIS_XP_REWARD } from './contractAnalysisData'
import { LEGAL_CHAT_CASE_XP_REWARD } from './legalChatCases'

/**
 * Единое локальное сохранение прогресса и защита от повторного начисления XP
 * (кроссворды + «Выбери развитие событий» + «Пошаговый разбор договоров» + «Разбор юридических ситуаций»).
 * Хранится исключительно в localStorage браузера без регистрации и backend.
 */

export interface CrosswordPuzzleProgress {
  bestScore: number
  completed: boolean
  /** Уникальные номера слов, за которые опыт уже был начислен */
  solvedWordNumbers: number[]
  xpEarned: number
  lastPlayedAt: string
  /** Последний открытый этап (0-based) для «Пошагового разбора договоров» */
  currentStep?: number
  /** Максимально открытый этап (0-based), чтобы возвращение назад не сбрасывало прогресс */
  maxUnlockedStep?: number
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

/**
 * Фиксирует завершение интерактивного дела «Выбери развитие событий» в том же
 * существующем хранилище прогресса без создания отдельной системы XP.
 * Награда за завершение дела начисляется однократно (повторное прохождение не дублирует XP).
 */
export function recordLegalCaseResult(
  currentMap: CrosswordProgressMap,
  caseId: string,
  correctAnswersCount: number
): {
  nextMap: CrosswordProgressMap
  xpGainedNow: number
  alreadyCompleted: boolean
} {
  const prev: CrosswordPuzzleProgress = currentMap[caseId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const alreadyCompleted = prev.completed
  const xpGainedNow = alreadyCompleted ? 0 : LEGAL_CASE_XP_REWARD

  const nextEntry: CrosswordPuzzleProgress = {
    bestScore: Math.max(prev.bestScore, correctAnswersCount),
    completed: true,
    solvedWordNumbers: prev.solvedWordNumbers,
    xpEarned: alreadyCompleted ? prev.xpEarned : LEGAL_CASE_XP_REWARD,
    lastPlayedAt: new Date().toISOString(),
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [caseId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  return {
    nextMap,
    xpGainedNow,
    alreadyCompleted,
  }
}

/**
 * Сохраняет текущий и максимально открытый этап изучения конкретного договора
 * в разделе «Пошаговый разбор договоров» без сброса статуса пройденных этапов
 * и без потери уже начисленного XP.
 */
export function saveContractAnalysisStep(
  currentMap: CrosswordProgressMap,
  contractId: string,
  stepIndex: number,
  maxUnlockedStep: number
): CrosswordProgressMap {
  const prev: CrosswordPuzzleProgress = currentMap[contractId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const preservedMax = Math.max(
    prev.maxUnlockedStep ?? 0,
    maxUnlockedStep,
    stepIndex
  )

  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: Math.max(prev.bestScore, preservedMax + 1),
    currentStep: stepIndex,
    maxUnlockedStep: preservedMax,
    lastPlayedAt: new Date().toISOString(),
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [contractId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)
  return nextMap
}

/**
 * Фиксирует полное изучение договора (все 5 этапов) в общем локальном хранилище.
 * Награда XP начисляется однократно при первом завершении договора;
 * повторное прохождение («Повторить разбор») не дублирует XP.
 */
export function completeContractAnalysis(
  currentMap: CrosswordProgressMap,
  contractId: string,
  totalSteps: number
): {
  nextMap: CrosswordProgressMap
  xpGainedNow: number
  alreadyCompleted: boolean
} {
  const prev: CrosswordPuzzleProgress = currentMap[contractId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const alreadyCompleted = prev.completed
  const xpGainedNow = alreadyCompleted ? 0 : CONTRACT_ANALYSIS_XP_REWARD
  const lastStepIndex = Math.max(0, totalSteps - 1)

  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: Math.max(prev.bestScore, totalSteps),
    completed: true,
    xpEarned: alreadyCompleted ? prev.xpEarned : CONTRACT_ANALYSIS_XP_REWARD,
    currentStep: lastStepIndex,
    maxUnlockedStep: lastStepIndex,
    lastPlayedAt: new Date().toISOString(),
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [contractId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  return {
    nextMap,
    xpGainedNow,
    alreadyCompleted,
  }
}

/**
 * Фиксирует ответ пользователя в тренажёре «Юридические кейсы в формате переписки»
 * (встроен в карточку «Разбор юридических ситуаций»).
 * XP начисляется строго один раз за первое верное решение конкретного кейса —
 * повторное прохождение не дублирует награду.
 */
export function recordLegalChatCaseResult(
  currentMap: CrosswordProgressMap,
  caseId: string,
  isCorrect: boolean
): {
  nextMap: CrosswordProgressMap
  xpGainedNow: number
  alreadyAwarded: boolean
} {
  const prev: CrosswordPuzzleProgress = currentMap[caseId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const alreadyAwarded = prev.completed && prev.xpEarned >= LEGAL_CHAT_CASE_XP_REWARD
  const shouldAwardNow = isCorrect && !alreadyAwarded
  const xpGainedNow = shouldAwardNow ? LEGAL_CHAT_CASE_XP_REWARD : 0

  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: Math.max(prev.bestScore, isCorrect ? 1 : 0),
    completed: prev.completed || isCorrect,
    xpEarned: shouldAwardNow ? LEGAL_CHAT_CASE_XP_REWARD : prev.xpEarned,
    lastPlayedAt: new Date().toISOString(),
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [caseId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  return {
    nextMap,
    xpGainedNow,
    alreadyAwarded,
  }
}
