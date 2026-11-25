import { crosswordPuzzles } from './crosswordData'
import { legalCasesData } from './legalCasesData'
import { contractAnalysisData } from './contractAnalysisData'
import { legalChatCases } from './legalChatCases'
import {
  PENALTY_ACHIEVEMENT_ID,
  PENALTY_ACHIEVEMENT_XP_REWARD,
  PENALTY_CALCULATOR_TASK_ID,
  PENALTY_CASES,
} from './penaltyCalculatorData'
import {
  getCompletedTasksCount,
  getSolvedPenaltyCaseNumbers,
  getXPProgress,
  isTaskCompleted,
  type CrosswordProgressMap,
} from './crosswordProgress'
import type { AchievementRarity } from '../utils/achievementAudio'

/**
 * Единая система «Достижения 2.0» для Law Quiz KZ.
 * 25 достижений в 6 категориях, 4 уровня редкости, секретные награды,
 * автоматическая проверка на основе единого прогресса и сохранение в localStorage.
 */

export type AchievementCategoryId =
  | 'first-steps'
  | 'study-activity'
  | 'game-zone'
  | 'legal-practice'
  | 'xp-levels'
  | 'secret'

export interface AchievementCategoryMeta {
  id: AchievementCategoryId
  label: string
  icon: string
}

export const ACHIEVEMENT_CATEGORIES: AchievementCategoryMeta[] = [
  { id: 'first-steps', label: 'Первые шаги', icon: '🚩' },
  { id: 'study-activity', label: 'Учебная активность', icon: '📚' },
  { id: 'game-zone', label: 'Игровая зона', icon: '🎮' },
  { id: 'legal-practice', label: 'Юридическая практика', icon: '⚖️' },
  { id: 'xp-levels', label: 'Опыт и уровни', icon: '⭐' },
  { id: 'secret', label: 'Секретные', icon: '🎭' },
]

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Обычное',
  uncommon: 'Необычное',
  rare: 'Редкое',
  legendary: 'Легендарное',
}

export interface AchievementMetrics {
  completedTasks: number
  totalAvailableTasks: number
  completedTrainerCount: number
  completedCrosswordsCount: number
  completedGamesCount: number
  completedChatCasesCount: number
  completedContractsCount: number
  completedScenariosCount: number
  contractAuditCompleted: boolean
  solvedPenaltyCasesCount: number
  penaltyCalculatorCompleted: boolean
  completedPracticeCount: number
  quizBestScore: number
  auditBestScore: number
  wheelCompleted: boolean
  timedQuizCompleted: boolean
  totalXp: number
  currentLevel: number
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  category: AchievementCategoryId
  rarity: AchievementRarity
  icon: string
  secret?: boolean
  /** Необязательная награда в XP, отображаемая в карточке и уведомлении достижения */
  xpReward?: number
  /** Необязательная единица измерения прогресса (например, 'XP') */
  progressUnit?: string
  /** Вычисляет текущий прогресс и достигнуто ли условие */
  evaluate: (m: AchievementMetrics) => {
    unlocked: boolean
    current: number
    target: number
  }
}

export interface UnlockedAchievementRecord {
  unlockedAt: string
  /**
   * Флаг просмотра нового достижения на странице «Достижения».
   * `false` — достижение получено недавно и ещё не просмотрено (увеличивает красный счётчик);
   * `true` или `undefined` (для ранее сохранённых записей) — уже просмотрено.
   */
  seen?: boolean
}

export type UnlockedAchievementsMap = Record<string, UnlockedAchievementRecord>

export interface EvaluatedAchievement {
  definition: AchievementDefinition
  unlocked: boolean
  unlockedAt?: string
  current: number
  target: number
  percent: number
}

export const ACHIEVEMENTS_STORAGE_KEY = 'lqkz-achievements-v1'

const TRAINER_TASK_IDS = [
  'trainer-quiz',
  'trainer-truth-or-myth',
  'trainer-matching',
  'trainer-sorting',
] as const

export const TOTAL_UNIQUE_SITE_TASKS =
  TRAINER_TASK_IDS.length + // 4 тренажёра
  crosswordPuzzles.length + // 3 кроссворда
  2 + // Колесо-фортуна + Испытание на время
  legalChatCases.length + // 4 кейса в формате переписки
  1 + // Поиск ошибок в договоре
  contractAnalysisData.length + // 4 пошаговых разбора договоров
  legalCasesData.length // 4 дела «Выбери развитие событий»
// Итого: 22 уникальных задания

export function computeAchievementMetrics(map: CrosswordProgressMap): AchievementMetrics {
  const completedTasks = getCompletedTasksCount(map)
  const completedTrainerCount = TRAINER_TASK_IDS.filter((id) => isTaskCompleted(map, id)).length
  const completedCrosswordsCount = crosswordPuzzles.filter((p) =>
    isTaskCompleted(map, p.id)
  ).length
  const wheelCompleted = isTaskCompleted(map, 'game-fortune-wheel')
  const timedQuizCompleted = isTaskCompleted(map, 'game-timed-quiz')
  const completedGamesCount =
    completedCrosswordsCount + (wheelCompleted ? 1 : 0) + (timedQuizCompleted ? 1 : 0)

  const completedChatCasesCount = legalChatCases.filter((c) =>
    isTaskCompleted(map, c.id)
  ).length
  const completedContractsCount = contractAnalysisData.filter((c) =>
    isTaskCompleted(map, c.id)
  ).length
  const completedScenariosCount = legalCasesData.filter((s) =>
    isTaskCompleted(map, s.id)
  ).length
  const contractAuditCompleted = isTaskCompleted(map, 'practice-contract-errors')
  const solvedPenaltyCasesCount = getSolvedPenaltyCaseNumbers(map).length
  const penaltyCalculatorCompleted =
    isTaskCompleted(map, PENALTY_CALCULATOR_TASK_ID) ||
    solvedPenaltyCasesCount >= PENALTY_CASES.length
  const completedPracticeCount =
    completedChatCasesCount +
    completedContractsCount +
    completedScenariosCount +
    (contractAuditCompleted ? 1 : 0) +
    (penaltyCalculatorCompleted ? 1 : 0)

  const xpInfo = getXPProgress(map)

  return {
    completedTasks,
    totalAvailableTasks: TOTAL_UNIQUE_SITE_TASKS,
    completedTrainerCount,
    completedCrosswordsCount,
    completedGamesCount,
    completedChatCasesCount,
    completedContractsCount,
    completedScenariosCount,
    contractAuditCompleted,
    solvedPenaltyCasesCount,
    penaltyCalculatorCompleted,
    completedPracticeCount,
    quizBestScore: map['trainer-quiz']?.bestScore ?? 0,
    auditBestScore: map['practice-contract-errors']?.bestScore ?? 0,
    wheelCompleted,
    timedQuizCompleted,
    totalXp: xpInfo.totalXp,
    currentLevel: xpInfo.currentLevel,
  }
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  // =========================================================================
  // 1. Первые шаги (4 достижения)
  // =========================================================================
  {
    id: 'ach-first-interactive',
    title: 'Первый шаг в праве',
    description: 'Завершите первый любой интерактив на платформе Law Quiz KZ.',
    category: 'first-steps',
    rarity: 'common',
    icon: '🚩',
    evaluate: (m) => ({
      unlocked: m.completedTasks >= 1,
      current: Math.min(m.completedTasks, 1),
      target: 1,
    }),
  },
  {
    id: 'ach-first-trainer',
    title: 'Разминка юриста',
    description: 'Пройдите любой режим в разделе «Тренажёр знаний».',
    category: 'first-steps',
    rarity: 'common',
    icon: '🧠',
    evaluate: (m) => ({
      unlocked: m.completedTrainerCount >= 1,
      current: Math.min(m.completedTrainerCount, 1),
      target: 1,
    }),
  },
  {
    id: 'ach-first-practice',
    title: 'Первое дело',
    description: 'Завершите первое практическое задание в «Юридической практике».',
    category: 'first-steps',
    rarity: 'common',
    icon: '📋',
    evaluate: (m) => ({
      unlocked: m.completedPracticeCount >= 1,
      current: Math.min(m.completedPracticeCount, 1),
      target: 1,
    }),
  },
  {
    id: 'ach-first-game',
    title: 'Игровой дебют',
    description: 'Завершите первую игру в разделе «Игровая зона».',
    category: 'first-steps',
    rarity: 'common',
    icon: '🎲',
    evaluate: (m) => ({
      unlocked: m.completedGamesCount >= 1,
      current: Math.min(m.completedGamesCount, 1),
      target: 1,
    }),
  },

  // =========================================================================
  // 2. Учебная активность (4 достижения)
  // =========================================================================
  {
    id: 'ach-tasks-5',
    title: 'Уверенный старт',
    description: 'Завершите 5 разных интерактивов в любых разделах сайта.',
    category: 'study-activity',
    rarity: 'common',
    icon: '📚',
    evaluate: (m) => ({
      unlocked: m.completedTasks >= 5,
      current: Math.min(m.completedTasks, 5),
      target: 5,
    }),
  },
  {
    id: 'ach-tasks-10',
    title: 'Системный подход',
    description: 'Завершите 10 разных интерактивов по гражданскому праву РК.',
    category: 'study-activity',
    rarity: 'uncommon',
    icon: '🎓',
    evaluate: (m) => ({
      unlocked: m.completedTasks >= 10,
      current: Math.min(m.completedTasks, 10),
      target: 10,
    }),
  },
  {
    id: 'ach-quiz-perfect',
    title: 'Безупречный тест',
    description: 'Наберите 10 из 10 правильных ответов в режиме «Тесты по ГК РК».',
    category: 'study-activity',
    rarity: 'rare',
    icon: '💯',
    evaluate: (m) => ({
      unlocked: m.quizBestScore >= 10,
      current: Math.min(m.quizBestScore, 10),
      target: 10,
    }),
  },
  {
    id: 'ach-trainer-all',
    title: 'Мастер тренажёра',
    description:
      'Завершите все 4 режима «Тренажёра знаний»: тесты, правду/миф, соединяшки и категории.',
    category: 'study-activity',
    rarity: 'rare',
    icon: '🏅',
    evaluate: (m) => ({
      unlocked: m.completedTrainerCount >= 4,
      current: Math.min(m.completedTrainerCount, 4),
      target: 4,
    }),
  },

  // =========================================================================
  // 3. Игровая зона (5 достижений)
  // =========================================================================
  {
    id: 'ach-first-crossword',
    title: 'Эрудит гражданского права',
    description: 'Правильно заполните все слова в любом юридическом кроссворде.',
    category: 'game-zone',
    rarity: 'common',
    icon: '🧩',
    evaluate: (m) => ({
      unlocked: m.completedCrosswordsCount >= 1,
      current: Math.min(m.completedCrosswordsCount, 1),
      target: 1,
    }),
  },
  {
    id: 'ach-all-crosswords',
    title: 'Гроссмейстер кроссвордов',
    description: 'Правильно решите все 3 юридических кроссворда из каталога.',
    category: 'game-zone',
    rarity: 'rare',
    icon: '👑',
    evaluate: (m) => ({
      unlocked: m.completedCrosswordsCount >= crosswordPuzzles.length,
      current: Math.min(m.completedCrosswordsCount, crosswordPuzzles.length),
      target: crosswordPuzzles.length,
    }),
  },
  {
    id: 'ach-wheel-done',
    title: 'Удача и знания',
    description: 'Пройдите все 10 секторов викторины «Колесо-фортуна».',
    category: 'game-zone',
    rarity: 'uncommon',
    icon: '🎡',
    evaluate: (m) => ({
      unlocked: m.wheelCompleted,
      current: m.wheelCompleted ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: 'ach-timed-done',
    title: 'Точнее секундомера',
    description: 'Успешно завершите все 12 вопросов в «Испытании на время» до истечения таймера.',
    category: 'game-zone',
    rarity: 'uncommon',
    icon: '⏱️',
    evaluate: (m) => ({
      unlocked: m.timedQuizCompleted,
      current: m.timedQuizCompleted ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: 'ach-games-all',
    title: 'Чемпион Игровой зоны',
    description:
      'Завершите все задания Игровой зоны: 3 кроссворда, «Колесо-фортуна» и «Испытание на время».',
    category: 'game-zone',
    rarity: 'legendary',
    icon: '🏆',
    evaluate: (m) => ({
      unlocked: m.completedGamesCount >= 5,
      current: Math.min(m.completedGamesCount, 5),
      target: 5,
    }),
  },

  // =========================================================================
  // 4. Юридическая практика (5 достижений)
  // =========================================================================
  {
    id: 'ach-contract-auditor',
    title: 'Внимательный аудитор',
    description: 'Завершите проверку всех четырёх документов в «Поиске ошибок в учебном договоре».',
    category: 'legal-practice',
    rarity: 'uncommon',
    icon: '🔍',
    evaluate: (m) => ({
      unlocked: m.contractAuditCompleted,
      current: m.contractAuditCompleted ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: 'ach-all-chat-cases',
    title: 'Дипломат переписки',
    description: 'Завершите все 4 юридических кейса в формате переписки.',
    category: 'legal-practice',
    rarity: 'uncommon',
    icon: '💬',
    evaluate: (m) => ({
      unlocked: m.completedChatCasesCount >= legalChatCases.length,
      current: Math.min(m.completedChatCasesCount, legalChatCases.length),
      target: legalChatCases.length,
    }),
  },
  {
    id: 'ach-all-contracts',
    title: 'Знаток договоров',
    description: 'Изучите все 4 договора в разделе «Пошаговый разбор договоров».',
    category: 'legal-practice',
    rarity: 'rare',
    icon: '📜',
    evaluate: (m) => ({
      unlocked: m.completedContractsCount >= contractAnalysisData.length,
      current: Math.min(m.completedContractsCount, contractAnalysisData.length),
      target: contractAnalysisData.length,
    }),
  },
  {
    id: 'ach-all-scenarios',
    title: 'Мастер правовых решений',
    description: 'Пройдите все 4 интерактивных дела «Выбери развитие событий».',
    category: 'legal-practice',
    rarity: 'rare',
    icon: '⚖️',
    evaluate: (m) => ({
      unlocked: m.completedScenariosCount >= legalCasesData.length,
      current: Math.min(m.completedScenariosCount, legalCasesData.length),
      target: legalCasesData.length,
    }),
  },
  {
    id: PENALTY_ACHIEVEMENT_ID,
    title: 'Мастер юридических расчётов',
    description: 'Правильно рассчитай договорную неустойку во всех трёх учебных ситуациях.',
    category: 'legal-practice',
    rarity: 'rare',
    icon: '🧮',
    xpReward: PENALTY_ACHIEVEMENT_XP_REWARD,
    progressUnit: 'дел',
    evaluate: (m) => ({
      unlocked: m.penaltyCalculatorCompleted,
      current: Math.min(m.solvedPenaltyCasesCount, PENALTY_CASES.length),
      target: PENALTY_CASES.length,
    }),
  },
  {
    id: 'ach-practice-all',
    title: 'Практикующий юрист',
    description: 'Завершите все 13 заданий раздела «Юридическая практика».',
    category: 'legal-practice',
    rarity: 'legendary',
    icon: '🏛️',
    evaluate: (m) => ({
      unlocked: m.completedPracticeCount >= 13,
      current: Math.min(m.completedPracticeCount, 13),
      target: 13,
    }),
  },

  // =========================================================================
  // 5. Опыт и уровни (4 достижения)
  // =========================================================================
  {
    id: 'ach-xp-100',
    title: 'Первые сто XP',
    description: 'Накопите 100 XP в единой системе опыта Law Quiz KZ.',
    category: 'xp-levels',
    rarity: 'common',
    icon: '✨',
    progressUnit: 'XP',
    evaluate: (m) => ({
      unlocked: m.totalXp >= 100,
      current: Math.min(m.totalXp, 100),
      target: 100,
    }),
  },
  {
    id: 'ach-level-2',
    title: 'Начинающий правовед',
    description: 'Достигните 2-го уровня пользователя (225 XP).',
    category: 'xp-levels',
    rarity: 'uncommon',
    icon: '📈',
    progressUnit: 'XP',
    evaluate: (m) => ({
      unlocked: m.currentLevel >= 2,
      current: Math.min(m.totalXp, 225),
      target: 225,
    }),
  },
  {
    id: 'ach-xp-300',
    title: 'Золотой фонд знаний',
    description: 'Накопите 300 XP за прохождение учебных интерактивов.',
    category: 'xp-levels',
    rarity: 'rare',
    icon: '💎',
    progressUnit: 'XP',
    evaluate: (m) => ({
      unlocked: m.totalXp >= 300,
      current: Math.min(m.totalXp, 300),
      target: 300,
    }),
  },
  {
    id: 'ach-xp-450',
    title: 'Академик ГК РК',
    description: 'Накопите 450 XP, продемонстрировав системное владение нормами ГК РК.',
    category: 'xp-levels',
    rarity: 'legendary',
    icon: '🌟',
    progressUnit: 'XP',
    evaluate: (m) => ({
      unlocked: m.totalXp >= 450,
      current: Math.min(m.totalXp, 450),
      target: 450,
    }),
  },

  // =========================================================================
  // 6. Секретные (3 достижения — скрыты до разблокировки)
  // =========================================================================
  {
    id: 'ach-secret-triathlon',
    title: 'Правовой триатлон',
    description:
      'Вы проявили разносторонность: завершите минимум по одному заданию в Тренажёре, Практике и Игровой зоне.',
    category: 'secret',
    rarity: 'rare',
    icon: '🎭',
    secret: true,
    evaluate: (m) => {
      const done =
        (m.completedTrainerCount >= 1 ? 1 : 0) +
        (m.completedPracticeCount >= 1 ? 1 : 0) +
        (m.completedGamesCount >= 1 ? 1 : 0)
      return {
        unlocked: done >= 3,
        current: done,
        target: 3,
      }
    },
  },
  {
    id: 'ach-secret-flawless-audit',
    title: 'Глаз-алмаз',
    description:
      'Безошибочный аудит: найдите все 4 из 4 юридических нарушений в «Поиске ошибок в учебном договоре».',
    category: 'secret',
    rarity: 'rare',
    icon: '👁️',
    secret: true,
    evaluate: (m) => ({
      unlocked: m.auditBestScore >= 4,
      current: Math.min(m.auditBestScore, 4),
      target: 4,
    }),
  },
  {
    id: 'ach-secret-perfectionist',
    title: 'Легенда Law Quiz KZ',
    description:
      'Абсолютное прохождение: завершите все 22 уникальных интерактива на образовательной платформе.',
    category: 'secret',
    rarity: 'legendary',
    icon: '🔱',
    secret: true,
    evaluate: (m) => ({
      unlocked: m.completedTasks >= m.totalAvailableTasks,
      current: Math.min(m.completedTasks, m.totalAvailableTasks),
      target: m.totalAvailableTasks,
    }),
  },
]

export function loadUnlockedAchievements(): UnlockedAchievementsMap {
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as UnlockedAchievementsMap
  } catch {
    return {}
  }
}

export function saveUnlockedAchievements(map: UnlockedAchievementsMap): void {
  try {
    window.localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* localStorage может быть недоступен */
  }
}

/**
 * Возвращает количество новых (ещё не просмотренных на странице достижений) наград.
 * Записи без поля `seen` (из прошлых версий хранилища) считаются уже просмотренными.
 */
export function getUnseenAchievementsCount(unlockedMap: UnlockedAchievementsMap): number {
  return Object.values(unlockedMap).filter((record) => record && record.seen === false).length
}

/**
 * Помечает все непросмотренные полученные достижения как просмотренные и сохраняет в localStorage.
 * Возвращает исходную ссылку, если непросмотренных записей не было.
 */
export function markAllAchievementsAsSeen(
  unlockedMap: UnlockedAchievementsMap
): UnlockedAchievementsMap {
  let hasUnseen = false
  for (const record of Object.values(unlockedMap)) {
    if (record && record.seen === false) {
      hasUnseen = true
      break
    }
  }
  if (!hasUnseen) return unlockedMap

  const nextMap: UnlockedAchievementsMap = {}
  for (const [id, record] of Object.entries(unlockedMap)) {
    if (record) {
      nextMap[id] = record.seen === false ? { ...record, seen: true } : record
    }
  }
  saveUnlockedAchievements(nextMap)
  return nextMap
}

/**
 * Централизованная проверка всех 25 достижений по текущему игровому прогрессу.
 * Возвращает обновлённую карту открытых достижений и список строго ВПЕРВЫЕ
 * открытых наград (для последовательного показа уведомлений и воспроизведения звуков).
 */
export function evaluateAndPersistAchievements(
  progressMap: CrosswordProgressMap,
  currentUnlocked: UnlockedAchievementsMap,
  options?: { markNewAsSeen?: boolean }
): {
  nextUnlockedMap: UnlockedAchievementsMap
  newlyUnlocked: AchievementDefinition[]
  evaluatedList: EvaluatedAchievement[]
} {
  const metrics = computeAchievementMetrics(progressMap)
  const nowIso = new Date().toISOString()
  const markNewAsSeen = Boolean(options?.markNewAsSeen)
  const newlyUnlocked: AchievementDefinition[] = []
  let changed = false

  const nextUnlockedMap: UnlockedAchievementsMap = { ...currentUnlocked }

  const evaluatedList: EvaluatedAchievement[] = ACHIEVEMENTS_CATALOG.map((def) => {
    const previouslyUnlocked = Boolean(currentUnlocked[def.id])
    const res = def.evaluate(metrics)
    const isUnlockedNow = previouslyUnlocked || res.unlocked

    if (res.unlocked && !previouslyUnlocked) {
      nextUnlockedMap[def.id] = { unlockedAt: nowIso, seen: markNewAsSeen }
      newlyUnlocked.push(def)
      changed = true
    }

    const current = isUnlockedNow ? res.target : res.current
    const percent =
      res.target > 0 ? Math.min(100, Math.round((current / res.target) * 100)) : 0

    return {
      definition: def,
      unlocked: isUnlockedNow,
      unlockedAt: nextUnlockedMap[def.id]?.unlockedAt,
      current,
      target: res.target,
      percent,
    }
  })

  if (changed) {
    saveUnlockedAchievements(nextUnlockedMap)
  }

  return {
    nextUnlockedMap,
    newlyUnlocked,
    evaluatedList,
  }
}

/** Вычисляет отображаемый список достижений без побочных эффектов записи */
export function evaluateAchievementsView(
  progressMap: CrosswordProgressMap,
  unlockedMap: UnlockedAchievementsMap
): EvaluatedAchievement[] {
  const metrics = computeAchievementMetrics(progressMap)

  return ACHIEVEMENTS_CATALOG.map((def) => {
    const record = unlockedMap[def.id]
    const res = def.evaluate(metrics)
    const unlocked = Boolean(record) || res.unlocked
    const current = unlocked ? res.target : res.current
    const percent =
      res.target > 0 ? Math.min(100, Math.round((current / res.target) * 100)) : 0

    return {
      definition: def,
      unlocked,
      unlockedAt: record?.unlockedAt,
      current,
      target: res.target,
      percent,
    }
  })
}
