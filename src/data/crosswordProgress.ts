import { CROSSWORD_COMPLETION_XP } from './crosswordData'
import { LEGAL_CASE_XP_REWARD } from './legalCasesData'
import { CONTRACT_ANALYSIS_XP_REWARD } from './contractAnalysisData'
import { LEGAL_CHAT_CASE_XP_REWARD } from './legalChatCases'
import {
  PENALTY_ACHIEVEMENT_XP_REWARD,
  PENALTY_CALCULATOR_TASK_ID,
} from './penaltyCalculatorData'

/**
 * Единая система начисления опыта (XP), уровней и локального прогресса Law Quiz KZ.
 * Расширяет существующее хранилище localStorage ('lqkz-crossword-progress-v1')
 * без сброса и без потери ранее накопленных пользователем XP, уровня и достижений.
 */

export type InteractiveTaskType =
  | 'quiz'
  | 'truth-or-myth'
  | 'matching'
  | 'sorting'
  | 'crossword'
  | 'fortune-wheel'
  | 'timed-quiz'
  | 'chat-case'
  | 'contract-errors'
  | 'contract-analysis'
  | 'legal-scenario'
  | 'penalty-calculator'

export const XP_REWARDS = {
  quiz: 20,
  truthOrMyth: 15,
  matching: 15,
  sorting: 15,
  crossword: CROSSWORD_COMPLETION_XP, // 25 XP за правильное заполнение всех слов кроссворда
  fortuneWheel: 20,
  timedQuiz: 20,
  chatCase: LEGAL_CHAT_CASE_XP_REWARD, // 20 XP за завершение одного кейса
  contractErrors: 20,
  contractAnalysis: CONTRACT_ANALYSIS_XP_REWARD, // 20 XP за завершение одного договора
  legalScenario: LEGAL_CASE_XP_REWARD, // 25 XP за завершение одного дела «Выбери развитие событий»
  penaltyCalculator: PENALTY_ACHIEVEMENT_XP_REWARD, // 30 XP за решение всех 3 дел и достижение «Мастер юридических расчётов»
} as const

/** Существующие базовые параметры формулы уровней Law Quiz KZ (без изменений для >= 225 XP) */
export const BASE_USER_XP = 420
const LEVEL_OFFSET_BASE = 225
const XP_PER_LEVEL = 300
const BASE_LEVEL_NUM = 2

export const PROGRESS_STORAGE_KEY = 'lqkz-crossword-progress-v1'
export const PROGRESS_META_KEY = 'lqkz-progress-meta-v1'
export const ACHIEVEMENTS_KEY = 'lqkz-achievements-v1'

interface ProgressMeta {
  /** 'legacy' — сохраняет исходный базовый опыт 420 XP до ручного сброса; 'fresh' — после ручного сброса старт с 0 XP */
  baselineMode: 'legacy' | 'fresh'
  resetAt?: string
}

export function loadProgressMeta(): ProgressMeta {
  try {
    const raw = window.localStorage.getItem(PROGRESS_META_KEY)
    if (!raw) return { baselineMode: 'legacy' }
    const parsed = JSON.parse(raw) as Partial<ProgressMeta>
    return {
      baselineMode: parsed.baselineMode === 'fresh' ? 'fresh' : 'legacy',
      resetAt: typeof parsed.resetAt === 'string' ? parsed.resetAt : undefined,
    }
  } catch {
    return { baselineMode: 'legacy' }
  }
}

export function isFreshProgressMode(): boolean {
  return loadProgressMeta().baselineMode === 'fresh'
}

export function getActiveBaseXP(): number {
  return isFreshProgressMode() ? 0 : BASE_USER_XP
}

/**
 * Безопасный полный сброс ТОЛЬКО игрового прогресса пользователя.
 * НЕ вызывает localStorage.clear() — настройки темы ('lqkz-theme'),
 * звука и визуальных уведомлений ('lqkz-notification-settings-v1') сохраняются!
 */
export function resetAllGameProgress(): CrosswordProgressMap {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
    window.localStorage.removeItem(ACHIEVEMENTS_KEY)
    const meta: ProgressMeta = {
      baselineMode: 'fresh',
      resetAt: new Date().toISOString(),
    }
    window.localStorage.setItem(PROGRESS_META_KEY, JSON.stringify(meta))
  } catch {
    /* localStorage может быть недоступен */
  }
  return {}
}

export interface CrosswordPuzzleProgress {
  bestScore: number
  completed: boolean
  /** Уникальные номера слов кроссворда */
  solvedWordNumbers: number[]
  xpEarned: number
  lastPlayedAt: string
  /** Последний открытый этап (0-based) для «Пошагового разбора договоров» */
  currentStep?: number
  /** Максимально открытый этап (0-based), чтобы возвращение назад не сбрасывало прогресс */
  maxUnlockedStep?: number
  /** Тип интерактива для единого учёта XP */
  taskType?: InteractiveTaskType
  /** Дата первого фактического завершения задания (ISO) */
  completedAt?: string
}

export type CrosswordProgressMap = Record<string, CrosswordPuzzleProgress>

export interface AwardXPPayload {
  taskId: string
  taskType: InteractiveTaskType
  amount: number
  completedAt?: string
  bestScore?: number
  solvedWordNumbers?: number[]
  currentStep?: number
  maxUnlockedStep?: number
}

export interface AwardXPResult {
  nextMap: CrosswordProgressMap
  xpGainedNow: number
  alreadyCompleted: boolean
  totalXp: number
  previousLevel: number
  newLevel: number
  leveledUp: boolean
}

export interface XPProgressInfo {
  totalXp: number
  earnedLocalXp: number
  currentLevel: number
  progressPercent: number
  xpIntoCurrentLevel: number
  xpForNextLevel: number
  remainingToNextLevel: number
}

export function loadCrosswordProgress(): CrosswordProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
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
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* локальное хранилище может быть недоступно */
  }
}

/** Сумма всех локально заработанных XP по всем сохранённым заданиям (включая старые записи) */
export function getEarnedLocalXP(map?: CrosswordProgressMap): number {
  const source = map ?? loadCrosswordProgress()
  return Object.values(source).reduce((sum, entry) => {
    const val = typeof entry?.xpEarned === 'number' && Number.isFinite(entry.xpEarned)
      ? Math.max(0, entry.xpEarned)
      : 0
    return sum + val
  }, 0)
}

/** Получение общего накопленного опыта пользователя (базовый до сброса + локальный, после сброса — с 0) */
export function getUserXP(map?: CrosswordProgressMap): number {
  return getActiveBaseXP() + getEarnedLocalXP(map)
}

/**
 * Расчёт текущего уровня пользователя по существующей формуле Law Quiz KZ:
 * - 0..224 XP (после сброса): Уровень 1;
 * - >= 225 XP: точная существующая формула floor((totalXp - 225) / 300) + 2.
 */
export function getUserLevel(xpOrMap?: number | CrosswordProgressMap): number {
  const totalXp = typeof xpOrMap === 'number' ? xpOrMap : getUserXP(xpOrMap)
  if (totalXp < LEVEL_OFFSET_BASE) {
    return 1
  }
  const levelOffset = totalXp - LEVEL_OFFSET_BASE
  return Math.floor(levelOffset / XP_PER_LEVEL) + BASE_LEVEL_NUM
}

/** Получение прогресса до следующего уровня по существующей формуле Law Quiz KZ */
export function getXPProgress(xpOrMap?: number | CrosswordProgressMap): XPProgressInfo {
  const activeBase = getActiveBaseXP()
  const earnedLocalXp =
    typeof xpOrMap === 'number' ? Math.max(0, xpOrMap - activeBase) : getEarnedLocalXP(xpOrMap)
  const totalXp = typeof xpOrMap === 'number' ? Math.max(0, xpOrMap) : activeBase + earnedLocalXp

  if (totalXp < LEVEL_OFFSET_BASE) {
    const progressPercent = Math.min(100, Math.round((totalXp / LEVEL_OFFSET_BASE) * 100))
    return {
      totalXp,
      earnedLocalXp,
      currentLevel: 1,
      progressPercent,
      xpIntoCurrentLevel: totalXp,
      xpForNextLevel: LEVEL_OFFSET_BASE,
      remainingToNextLevel: LEVEL_OFFSET_BASE - totalXp,
    }
  }

  const levelOffset = totalXp - LEVEL_OFFSET_BASE
  const currentLevel = Math.floor(levelOffset / XP_PER_LEVEL) + BASE_LEVEL_NUM
  const xpIntoCurrentLevel = levelOffset % XP_PER_LEVEL
  const progressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / XP_PER_LEVEL) * 100))

  return {
    totalXp,
    earnedLocalXp,
    currentLevel,
    progressPercent,
    xpIntoCurrentLevel,
    xpForNextLevel: XP_PER_LEVEL,
    remainingToNextLevel: XP_PER_LEVEL - xpIntoCurrentLevel,
  }
}

/** Проверка, завершено ли уникальное задание и получена ли за него награда */
export function isTaskCompleted(map: CrosswordProgressMap, taskId: string): boolean {
  return Boolean(map[taskId]?.completed)
}

/** Количество уникальных завершённых заданий в локальном хранилище */
export function getCompletedTasksCount(map: CrosswordProgressMap): number {
  return Object.values(map).filter((entry) => Boolean(entry?.completed)).length
}

/**
 * Центральная функция начисления опыта (XP).
 * Гарантирует:
 * - однократное начисление по уникальному taskId;
 * - сохранение всех старых данных и накопленного XP;
 * - автоматический расчёт повышения уровня;
 * - мгновенную запись в localStorage.
 */
export function awardXP(
  currentMap: CrosswordProgressMap,
  payload: AwardXPPayload
): AwardXPResult {
  const { taskId, taskType, amount } = payload
  const nowIso = payload.completedAt ?? new Date().toISOString()
  const previousLevel = getUserLevel(currentMap)

  const prev: CrosswordPuzzleProgress = currentMap[taskId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const alreadyCompleted = Boolean(prev.completed)
  const safeAmount = Math.max(0, Math.round(amount))
  const xpGainedNow = alreadyCompleted ? 0 : safeAmount

  const mergedSolved = payload.solvedWordNumbers
    ? Array.from(new Set([...prev.solvedWordNumbers, ...payload.solvedWordNumbers])).sort(
        (a, b) => a - b
      )
    : prev.solvedWordNumbers

  const nextBestScore =
    typeof payload.bestScore === 'number'
      ? Math.max(prev.bestScore, payload.bestScore)
      : prev.bestScore

  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: nextBestScore,
    completed: true,
    solvedWordNumbers: mergedSolved,
    // Сохраняем ранее накопленный XP (включая записи из предыдущих версий)
    xpEarned: alreadyCompleted ? prev.xpEarned : prev.xpEarned + xpGainedNow,
    lastPlayedAt: nowIso,
    taskType: prev.taskType ?? taskType,
    completedAt: prev.completedAt ?? nowIso,
    currentStep:
      typeof payload.currentStep === 'number' ? payload.currentStep : prev.currentStep,
    maxUnlockedStep:
      typeof payload.maxUnlockedStep === 'number'
        ? Math.max(prev.maxUnlockedStep ?? 0, payload.maxUnlockedStep)
        : prev.maxUnlockedStep,
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [taskId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  const totalXp = getUserXP(nextMap)
  const newLevel = getUserLevel(totalXp)

  return {
    nextMap,
    xpGainedNow,
    alreadyCompleted,
    totalXp,
    previousLevel,
    newLevel,
    leveledUp: newLevel > previousLevel,
  }
}

/**
 * Фиксирует результат проверки кроссворда.
 * Награда 25 XP начисляется через единый механизм awardXP() ТОЛЬКО после
 * правильного заполнения всех слов кроссворда. Частичное заполнение XP не даёт,
 * а ранее сохранённый опыт не обнуляется.
 */
export function recordCrosswordResult(
  currentMap: CrosswordProgressMap,
  puzzleId: string,
  solvedWordNumbers: number[],
  totalWords: number
): AwardXPResult & { alreadyMaxed: boolean } {
  const prev: CrosswordPuzzleProgress = currentMap[puzzleId] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const isFullySolved = solvedWordNumbers.length >= totalWords

  if (isFullySolved) {
    const res = awardXP(currentMap, {
      taskId: puzzleId,
      taskType: 'crossword',
      amount: XP_REWARDS.crossword,
      bestScore: totalWords,
      solvedWordNumbers,
    })
    return {
      ...res,
      alreadyMaxed: res.alreadyCompleted,
    }
  }

  // Частичное решение: сохраняем прогресс слов, но XP не начисляем
  const mergedSolved = Array.from(new Set([...prev.solvedWordNumbers, ...solvedWordNumbers])).sort(
    (a, b) => a - b
  )
  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: Math.max(prev.bestScore, solvedWordNumbers.length),
    solvedWordNumbers: mergedSolved,
    lastPlayedAt: new Date().toISOString(),
    taskType: prev.taskType ?? 'crossword',
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [puzzleId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  const totalXp = getUserXP(nextMap)
  const currentLevel = getUserLevel(totalXp)

  return {
    nextMap,
    xpGainedNow: 0,
    alreadyCompleted: prev.completed,
    alreadyMaxed: prev.completed,
    totalXp,
    previousLevel: currentLevel,
    newLevel: currentLevel,
    leveledUp: false,
  }
}

/**
 * Фиксирует завершение интерактивного дела «Выбери развитие событий»
 * через единый механизм awardXP().
 */
export function recordLegalCaseResult(
  currentMap: CrosswordProgressMap,
  caseId: string,
  correctAnswersCount: number
): AwardXPResult {
  return awardXP(currentMap, {
    taskId: caseId,
    taskType: 'legal-scenario',
    amount: XP_REWARDS.legalScenario,
    bestScore: correctAnswersCount,
  })
}

/**
 * Сохраняет текущий и максимально открытый этап изучения конкретного договора
 * в разделе «Пошаговый разбор договоров» без начисления XP до 5-го этапа.
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
    taskType: prev.taskType ?? 'contract-analysis',
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [contractId]: nextEntry,
  }

  saveCrosswordProgress(nextMap)
  return nextMap
}

/**
 * Фиксирует полное изучение договора (все 5 этапов) через единый механизм awardXP().
 */
export function completeContractAnalysis(
  currentMap: CrosswordProgressMap,
  contractId: string,
  totalSteps: number
): AwardXPResult {
  const lastStepIndex = Math.max(0, totalSteps - 1)
  return awardXP(currentMap, {
    taskId: contractId,
    taskType: 'contract-analysis',
    amount: XP_REWARDS.contractAnalysis,
    bestScore: totalSteps,
    currentStep: lastStepIndex,
    maxUnlockedStep: lastStepIndex,
  })
}

/**
 * Фиксирует завершение кейса в формате переписки («Разбор юридических ситуаций»)
 * после прочтения всех сообщений, выбора ответа и просмотра результата через awardXP().
 */
export function recordLegalChatCaseResult(
  currentMap: CrosswordProgressMap,
  caseId: string,
  isCorrect: boolean
): AwardXPResult & { alreadyAwarded: boolean } {
  const res = awardXP(currentMap, {
    taskId: caseId,
    taskType: 'chat-case',
    amount: XP_REWARDS.chatCase,
    bestScore: isCorrect ? 1 : 0,
  })
  return {
    ...res,
    alreadyAwarded: res.alreadyCompleted,
  }
}

/**
 * Возвращает отсортированный список уникальных номеров решённых дел (1..3)
 * из «Калькулятора договорной неустойки».
 */
export function getSolvedPenaltyCaseNumbers(map: CrosswordProgressMap): number[] {
  const entry = map[PENALTY_CALCULATOR_TASK_ID]
  if (!entry || !Array.isArray(entry.solvedWordNumbers)) return []
  return Array.from(
    new Set(entry.solvedWordNumbers.filter((n) => typeof n === 'number' && Number.isInteger(n) && n > 0))
  ).sort((a, b) => a - b)
}

/**
 * Фиксирует правильное решение одного из трёх дел «Калькулятора договорной неустойки».
 * - Повторное решение одного и того же дела не засчитывается повторно.
 * - Прогресс решённых дел (1/3, 2/3, 3/3) сохраняется в едином localStorage.
 * - При решении всех 3 уникальных дел однократно начисляет +30 XP через awardXP().
 */
export function recordPenaltyCaseSolved(
  currentMap: CrosswordProgressMap,
  caseNumber: number,
  totalCases = 3
): AwardXPResult & {
  solvedCaseNumbers: number[]
  justSolvedThisCase: boolean
  allCasesSolved: boolean
} {
  const prevSolved = getSolvedPenaltyCaseNumbers(currentMap)
  const justSolvedThisCase = !prevSolved.includes(caseNumber)
  const mergedSolved = Array.from(new Set([...prevSolved, caseNumber])).sort((a, b) => a - b)
  const allCasesSolved = mergedSolved.length >= totalCases

  if (allCasesSolved) {
    const res = awardXP(currentMap, {
      taskId: PENALTY_CALCULATOR_TASK_ID,
      taskType: 'penalty-calculator',
      amount: XP_REWARDS.penaltyCalculator,
      bestScore: mergedSolved.length,
      solvedWordNumbers: mergedSolved,
    })
    return {
      ...res,
      solvedCaseNumbers: mergedSolved,
      justSolvedThisCase,
      allCasesSolved: true,
    }
  }

  const prev: CrosswordPuzzleProgress = currentMap[PENALTY_CALCULATOR_TASK_ID] ?? {
    bestScore: 0,
    completed: false,
    solvedWordNumbers: [],
    xpEarned: 0,
    lastPlayedAt: '',
  }

  const nextEntry: CrosswordPuzzleProgress = {
    ...prev,
    bestScore: Math.max(prev.bestScore, mergedSolved.length),
    solvedWordNumbers: mergedSolved,
    lastPlayedAt: new Date().toISOString(),
    taskType: 'penalty-calculator',
  }

  const nextMap: CrosswordProgressMap = {
    ...currentMap,
    [PENALTY_CALCULATOR_TASK_ID]: nextEntry,
  }

  saveCrosswordProgress(nextMap)

  const totalXp = getUserXP(nextMap)
  const currentLevel = getUserLevel(totalXp)

  return {
    nextMap,
    xpGainedNow: 0,
    alreadyCompleted: prev.completed,
    totalXp,
    previousLevel: currentLevel,
    newLevel: currentLevel,
    leveledUp: false,
    solvedCaseNumbers: mergedSolved,
    justSolvedThisCase,
    allCasesSolved: false,
  }
}
