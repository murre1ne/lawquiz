/**
 * Типы данных для интерактивного раздела «Тренажёр знаний»
 * Проект: Law Quiz KZ
 */

export interface TestQuestion {
  id: string
  question: string
  options: [string, string, string, string] // ровно 4 варианта ответа
  correctAnswerIndex: number // индекс верного ответа (0..3)
  explanation: string
  category: string
  source: string
  article: string
  sourceUrl: string
  needsReview?: boolean
}

export interface TruthOrMythItem {
  id: string
  statement: string
  isTruth: boolean // true = Правда, false = Миф
  explanation: string
  category: string
  source: string
  article: string
  sourceUrl: string
  needsReview?: boolean
}

export type TrainerMode = 'quiz' | 'truthOrMyth' | 'matching' | 'sorting' | null

// ── Соединяшки (Matching) ──────────────────────────────────────────

export interface MatchingItem {
  id: string
  term: string
  definition: string
  explanation: string
  category: string
  source: string
  article: string
  sourceUrl: string
  needsReview?: boolean
}

// ── Распределение по категориям (Sorting) ─────────────────────────

export interface SortingCategory {
  id: string
  label: string
  color: string
}

export interface SortingCard {
  id: string
  label: string
  description: string
  correctCategoryId: string
  explanation: string
  source: string
  sourceUrl: string
  needsReview?: boolean
}
