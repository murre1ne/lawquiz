import { useState } from 'react'
import { QuizInteractive } from './QuizInteractive'
import { TruthOrMythInteractive } from './TruthOrMythInteractive'
import { MatchingInteractive } from './MatchingInteractive'
import { SortingInteractive } from './SortingInteractive'
import type { TrainerMode } from '../data/trainerTypes'
import {
  XP_REWARDS,
  isTaskCompleted,
  type AwardXPPayload,
  type CrosswordProgressMap,
} from '../data/crosswordProgress'

export interface TaskAwardFeedback {
  xpGainedNow: number
  alreadyCompleted: boolean
  leveledUp: boolean
  newLevel: number
}

interface TrainerPageProps {
  progressMap: CrosswordProgressMap
  onAwardXP: (payload: AwardXPPayload) => TaskAwardFeedback
  onBackToHome: () => void
}

const MODE_LABELS: Record<Exclude<TrainerMode, null>, string> = {
  quiz: 'Тесты по ГК РК',
  truthOrMyth: 'Правда или миф?',
  matching: 'Соедини термин и определение',
  sorting: 'Распредели по категориям',
}

export function TrainerPage({
  progressMap,
  onAwardXP,
  onBackToHome,
}: TrainerPageProps) {
  const [activeMode, setActiveMode] = useState<TrainerMode>(null)

  const quizDone = isTaskCompleted(progressMap, 'trainer-quiz')
  const truthDone = isTaskCompleted(progressMap, 'trainer-truth-or-myth')
  const matchingDone = isTaskCompleted(progressMap, 'trainer-matching')
  const sortingDone = isTaskCompleted(progressMap, 'trainer-sorting')

  const handleOpenMode = (mode: Exclude<TrainerMode, null>) => {
    setActiveMode(mode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToModes = () => {
    setActiveMode(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section
      className="content-section trainer-standalone-page"
      id="trainer-page"
      aria-labelledby="trainer-page-heading"
    >
      <div className="section-container">
        {/* Верхняя панель навигации отдельной страницы тренажёра */}
        <div className="interactive-top-bar library-page-topbar">
          {activeMode === null ? (
            <button type="button" className="interactive-back-btn" onClick={onBackToHome}>
              <span aria-hidden="true">←</span>
              <span>На главную страницу</span>
            </button>
          ) : (
            <button type="button" className="interactive-back-btn" onClick={handleBackToModes}>
              <span aria-hidden="true">←</span>
              <span>К списку интерактивов</span>
            </button>
          )}
          <span className="interactive-mode-badge library-page-badge">
            {activeMode === null
              ? 'Тренажёр знаний · 4 интерактивных формата'
              : `Тренажёр знаний · ${MODE_LABELS[activeMode]}`}
          </span>
        </div>

        {/* Заголовок отдельной страницы */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">02 / 05</span>
              <span className="section-category-tag">САМОПРОВЕРКА И ЗАКРЕПЛЕНИЕ</span>
            </div>
            <h1 id="trainer-page-heading" className="section-main-title trainer-page-title">
              Тренажёр знаний
            </h1>
            <p className="section-main-desc">
              Интерактивные задания для изучения и закрепления знаний по гражданскому праву Республики Казахстан
            </p>
          </div>
          <div className="section-header-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        {/* Каталог четырёх существующих интерактивов */}
        {activeMode === null && (
          <>
            <div className="trainer-grid">
              {/* 1 — Тесты по ГК РК */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">
                    {quizDone ? 'Пройдено ✓ · 10 вопросов' : `10 вопросов · +${XP_REWARDS.quiz} XP`}
                  </span>
                </div>
                <h2 className="card-heading">Тесты по ГК РК</h2>
                <p className="edu-card-desc">
                  Проверьте свои знания по ключевым институтам гражданского права Казахстана. Случайная выборка 10 вопросов из банка 50 заданий с подробным объяснением каждого ответа.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => handleOpenMode('quiz')}
                    aria-label="Начать тестирование по ГК РК"
                  >
                    <span>Начать тестирование</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 2 — Правда или миф? */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">
                    {truthDone
                      ? 'Пройдено ✓ · 5 утверждений'
                      : `5 утверждений · +${XP_REWARDS.truthOrMyth} XP`}
                  </span>
                </div>
                <h2 className="card-heading">Правда или миф?</h2>
                <p className="edu-card-desc">
                  Экспресс-раунд на юридическую интуицию: отличите реальные статьи ГК РК от популярных правовых заблуждений. 5 случайных утверждений с обоснованием норм.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => handleOpenMode('truthOrMyth')}
                    aria-label="Начать режим Правда или миф"
                  >
                    <span>Играть раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 3 — Соедини термин и определение */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">
                    {matchingDone
                      ? 'Пройдено ✓ · 5 терминов'
                      : `5 терминов · +${XP_REWARDS.matching} XP`}
                  </span>
                </div>
                <h2 className="card-heading">Соедини термин и определение</h2>
                <p className="edu-card-desc">
                  Упражнения на сопоставление юридических понятий с их нормативными формулировками по ГК РК. Термины и определения перемешиваются независимо.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => handleOpenMode('matching')}
                    aria-label="Начать соединение терминов с определениями"
                  >
                    <span>Начать раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 4 — Распредели по категориям */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">
                    {sortingDone
                      ? 'Пройдено ✓ · 10 карточек'
                      : `10 карточек · +${XP_REWARDS.sorting} XP`}
                  </span>
                </div>
                <h2 className="card-heading">Распредели по категориям</h2>
                <p className="edu-card-desc">
                  Задания на распределение правовых объектов, видов сделок и обязательств по четырём институтам ГК РК: вещное право, обязательственное, субъекты, сделки.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => handleOpenMode('sorting')}
                    aria-label="Начать распределение по категориям"
                  >
                    <span>Начать раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>
                Все четыре интерактива подключены к банку из 200 проверенных правовых элементов по Гражданскому кодексу РК с перемешиванием и ссылками на «Әділет».
              </span>
            </div>
          </>
        )}

        {activeMode === 'quiz' && (
          <QuizInteractive
            onExit={handleBackToModes}
            onComplete={(score) =>
              onAwardXP({
                taskId: 'trainer-quiz',
                taskType: 'quiz',
                amount: XP_REWARDS.quiz,
                bestScore: score,
              })
            }
          />
        )}
        {activeMode === 'truthOrMyth' && (
          <TruthOrMythInteractive
            onExit={handleBackToModes}
            onComplete={(score) =>
              onAwardXP({
                taskId: 'trainer-truth-or-myth',
                taskType: 'truth-or-myth',
                amount: XP_REWARDS.truthOrMyth,
                bestScore: score,
              })
            }
          />
        )}
        {activeMode === 'matching' && (
          <MatchingInteractive
            alreadyCompletedBefore={matchingDone}
            onExit={handleBackToModes}
            onComplete={(score) =>
              onAwardXP({
                taskId: 'trainer-matching',
                taskType: 'matching',
                amount: XP_REWARDS.matching,
                bestScore: score,
              })
            }
          />
        )}
        {activeMode === 'sorting' && (
          <SortingInteractive
            onExit={handleBackToModes}
            onComplete={(score) =>
              onAwardXP({
                taskId: 'trainer-sorting',
                taskType: 'sorting',
                amount: XP_REWARDS.sorting,
                bestScore: score,
              })
            }
          />
        )}
      </div>
    </section>
  )
}
