import type React from 'react'
import { CrosswordCatalog } from './CrosswordCatalog'
import { CrosswordGame } from './CrosswordGame'
import { FortuneWheelGame } from './FortuneWheelGame'
import { TimedQuizGame } from './TimedQuizGame'
import { crosswordPuzzles, type CrosswordPuzzle } from '../data/crosswordData'
import {
  XP_REWARDS,
  isTaskCompleted,
  type AwardXPPayload,
  type CrosswordProgressMap,
} from '../data/crosswordProgress'

export type GamesViewMode =
  | 'menu'
  | 'crosswords-catalog'
  | 'crossword-play'
  | 'wheel-play'
  | 'time-play'

interface GameCard {
  id: string
  title: string
  description: string
  tag: string
  status: string
  icon: React.ReactNode
}

// 4. Игровая зона — существующие 3 карточки
const gameCards: GameCard[] = [
  {
    id: 'game-crossword',
    title: 'Юридический кроссворд',
    description:
      'Интеллектуальная головоломка для повторения и закрепления юридических определений и ключевых понятий гражданского законодательства.',
    tag: 'Слова и термины',
    status: 'Проектирование',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
  },
  {
    id: 'game-wheel',
    title: 'Колесо-фортуна',
    description:
      'Динамичная викторина со случайным выбором одного из 10 секторов по Общей и Особенной частям ГК РК для самопроверки без повторения вопросов.',
    tag: '10 секторов · ГК РК',
    status: 'Доступно',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'game-time',
    title: 'Испытание на время',
    description:
      'Ответьте на 12 вопросов по Общей и Особенной частям Гражданского кодекса РК за 5 минут с подробным разбором каждого ответа.',
    tag: '12 вопросов · 5 минут',
    status: 'Доступно',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

function getGamesViewLabel(view: GamesViewMode): string {
  switch (view) {
    case 'crosswords-catalog':
    case 'crossword-play':
      return 'Юридический кроссворд'
    case 'wheel-play':
      return 'Колесо-фортуна'
    case 'time-play':
      return 'Испытание на время'
    default:
      return '3 игровых формата'
  }
}

interface GamesPageProps {
  gamesView: GamesViewMode
  activeCrosswordId: string | null
  progressMap: CrosswordProgressMap
  onBackToHome: () => void
  onBackToGamesMenu: () => void
  onOpenCrosswordsCatalog: () => void
  onOpenCrosswordPuzzle: (puzzle: CrosswordPuzzle) => void
  onOpenWheelGame: () => void
  onOpenTimedGame: () => void
  onRecordCrosswordResult: (
    puzzleId: string,
    solvedWordNumbers: number[],
    totalWords: number
  ) => { xpGainedNow: number; alreadyMaxed: boolean }
  onAwardTaskXP: (payload: AwardXPPayload) => {
    xpGainedNow: number
    alreadyCompleted: boolean
    leveledUp: boolean
    newLevel: number
  }
}

export function GamesPage({
  gamesView,
  activeCrosswordId,
  progressMap,
  onBackToHome,
  onBackToGamesMenu,
  onOpenCrosswordsCatalog,
  onOpenCrosswordPuzzle,
  onOpenWheelGame,
  onOpenTimedGame,
  onRecordCrosswordResult,
  onAwardTaskXP,
}: GamesPageProps) {
  const completedCrosswordsCount = crosswordPuzzles.filter((puzzle) =>
    isTaskCompleted(progressMap, puzzle.id)
  ).length

  const wheelCompleted = isTaskCompleted(progressMap, 'game-fortune-wheel')
  const timedQuizCompleted = isTaskCompleted(progressMap, 'game-timed-quiz')

  const activeCrossword =
    crosswordPuzzles.find((puzzle) => puzzle.id === activeCrosswordId) ?? null

  return (
    <section
      className="content-section games-standalone-page"
      id="games-page"
      aria-labelledby="games-page-heading"
    >
      <div className="section-container">
        {/* Верхняя панель навигации отдельной страницы игровой зоны */}
        <div className="interactive-top-bar library-page-topbar">
          {gamesView === 'menu' ? (
            <button type="button" className="interactive-back-btn" onClick={onBackToHome}>
              <span aria-hidden="true">←</span>
              <span>На главную страницу</span>
            </button>
          ) : (
            <button type="button" className="interactive-back-btn" onClick={onBackToGamesMenu}>
              <span aria-hidden="true">←</span>
              <span>К списку игр</span>
            </button>
          )}
          <span className="interactive-mode-badge library-page-badge">
            Игровая зона · {getGamesViewLabel(gamesView)}
          </span>
        </div>

        {/* Заголовок отдельной страницы */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">04 / 05</span>
              <span className="section-category-tag">ОБРАЗОВАТЕЛЬНЫЙ ИНТЕРАКТИВ</span>
            </div>
            <h1 id="games-page-heading" className="section-main-title games-page-title">
              Игровая зона
            </h1>
            <p className="section-main-desc">
              Закрепляйте знания по гражданскому праву Республики Казахстан с помощью игровых заданий
            </p>
          </div>
          <div className="section-header-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="15" y1="13" x2="15.01" y2="13" />
              <line x1="18" y1="11" x2="18.01" y2="11" />
              <rect x="2" y="6" width="20" height="12" rx="6" />
            </svg>
          </div>
        </div>

        {/* Каталог трёх существующих карточек игр */}
        {gamesView === 'menu' && (
          <>
            <div className="games-grid">
              {gameCards.map((card, index) => {
                const isCrosswordCard = card.id === 'game-crossword'
                const isWheelCard = card.id === 'game-wheel'
                const isTimeCard = card.id === 'game-time'
                const isInteractiveCard = isCrosswordCard || isWheelCard || isTimeCard
                const handleOpenCard = isCrosswordCard
                  ? onOpenCrosswordsCatalog
                  : isWheelCard
                  ? onOpenWheelGame
                  : isTimeCard
                  ? onOpenTimedGame
                  : undefined

                return (
                  <article
                    key={card.id}
                    className={`edu-card edu-card-tone-${(index + 1) % 3} ${
                      isInteractiveCard ? 'game-card-interactive' : ''
                    }`}
                    onClick={handleOpenCard}
                    role={isInteractiveCard ? 'button' : undefined}
                    tabIndex={isInteractiveCard ? 0 : undefined}
                    onKeyDown={
                      handleOpenCard
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleOpenCard()
                            }
                          }
                        : undefined
                    }
                    aria-label={
                      isCrosswordCard
                        ? 'Открыть каталог юридических кроссвордов'
                        : isWheelCard
                        ? 'Открыть игру Колесо-фортуна'
                        : isTimeCard
                        ? 'Открыть игру Испытание на время'
                        : undefined
                    }
                  >
                    <div className="card-topline">
                      <span className="card-icon-badge" aria-hidden="true">
                        {card.icon}
                      </span>
                      <span className="card-pill-tag">
                        {isCrosswordCard
                          ? `${crosswordPuzzles.length} кроссворда · ${completedCrosswordsCount}/${crosswordPuzzles.length}`
                          : isWheelCard
                          ? wheelCompleted
                            ? 'Пройдено ✓ · 10 секторов'
                            : `10 секторов · +${XP_REWARDS.fortuneWheel} XP`
                          : isTimeCard
                          ? timedQuizCompleted
                            ? 'Пройдено ✓ · 12 вопросов'
                            : `12 вопросов · +${XP_REWARDS.timedQuiz} XP`
                          : card.tag}
                      </span>
                    </div>
                    <h2 className="card-heading">{card.title}</h2>
                    <p className="edu-card-desc">{card.description}</p>
                    <div className="card-action-row">
                      {isCrosswordCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenCrosswordsCatalog()
                          }}
                        >
                          <span>Открыть кроссворды</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isWheelCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenWheelGame()
                          }}
                        >
                          <span>Крутить колесо</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isTimeCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenTimedGame()
                          }}
                        >
                          <span>Открыть испытание</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : (
                        <span className="card-status-pill">
                          <span className="status-dot" aria-hidden="true" />
                          <span>{card.status}</span>
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>
                Все три образовательные игры активны: «Юридический кроссворд», «Колесо-фортуна» (10 секторов) и «Испытание на время» (12 вопросов за 5 минут по ГК РК).
              </span>
            </div>
          </>
        )}

        {gamesView === 'crosswords-catalog' && (
          <CrosswordCatalog
            progressMap={progressMap}
            onSelectPuzzle={onOpenCrosswordPuzzle}
            onBackToGames={onBackToGamesMenu}
          />
        )}

        {gamesView === 'crossword-play' && activeCrossword && (
          <CrosswordGame
            key={activeCrossword.id}
            puzzle={activeCrossword}
            progress={progressMap[activeCrossword.id]}
            onBackToCatalog={onOpenCrosswordsCatalog}
            onRecordResult={onRecordCrosswordResult}
          />
        )}

        {gamesView === 'wheel-play' && (
          <FortuneWheelGame
            onBackToGames={onBackToGamesMenu}
            onComplete={(correctCount) =>
              onAwardTaskXP({
                taskId: 'game-fortune-wheel',
                taskType: 'fortune-wheel',
                amount: XP_REWARDS.fortuneWheel,
                bestScore: correctCount,
              })
            }
          />
        )}

        {gamesView === 'time-play' && (
          <TimedQuizGame
            alreadyCompletedBefore={timedQuizCompleted}
            onBackToGames={onBackToGamesMenu}
            onComplete={(correctCount) =>
              onAwardTaskXP({
                taskId: 'game-timed-quiz',
                taskType: 'timed-quiz',
                amount: XP_REWARDS.timedQuiz,
                bestScore: correctCount,
              })
            }
          />
        )}
      </div>
    </section>
  )
}
