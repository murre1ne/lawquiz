import { useState, useMemo } from 'react'
import { sortingCards, sortingCategories } from '../data/sortingData'
import type { SortingCard } from '../data/trainerTypes'

// ── Алгоритм Фишера-Йетса ───────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Генерация раунда: 10 случайных карточек ─────────────────────────
function generateSortingRound(): SortingCard[] {
  return shuffleArray(sortingCards).slice(0, 10)
}

// ── Результат для одной карточки ────────────────────────────────────
interface CardResult {
  card: SortingCard
  chosenCategoryId: string
  isCorrect: boolean
}

interface SortingInteractiveProps {
  onExit: () => void
}

export function SortingInteractive({ onExit }: SortingInteractiveProps) {
  const [roundKey, setRoundKey] = useState(0)
  const cards = useMemo(() => generateSortingRound(), [roundKey])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<CardResult[]>([])
  const [chosenCategoryId, setChosenCategoryId] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const currentCard = cards[currentIndex]
  const correctCategory = sortingCategories.find(
    (c) => c.id === currentCard.correctCategoryId
  )!

  const score = results.filter((r) => r.isCorrect).length

  // ── Выбор категории ─────────────────────────────────────────────────
  const handleCategorySelect = (categoryId: string) => {
    if (isAnswered) return
    setChosenCategoryId(categoryId)
    const isCorrect = categoryId === currentCard.correctCategoryId
    setResults((prev) => [
      ...prev,
      { card: currentCard, chosenCategoryId: categoryId, isCorrect },
    ])
    setIsAnswered(true)
  }

  // ── Следующая карточка ──────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((i) => i + 1)
      setChosenCategoryId(null)
      setIsAnswered(false)
    } else {
      setIsCompleted(true)
    }
  }

  // ── Перезапуск ─────────────────────────────────────────────────────
  const handleRestart = () => {
    setResults([])
    setCurrentIndex(0)
    setChosenCategoryId(null)
    setIsAnswered(false)
    setIsCompleted(false)
    setRoundKey((k) => k + 1)
  }

  // ── Экран результатов ───────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="interactive-container">
        <div className="interactive-top-bar">
          <button type="button" className="interactive-back-btn" onClick={onExit}>
            <span aria-hidden="true">←</span>
            <span>В меню тренажёра</span>
          </button>
          <span className="interactive-mode-badge sort-badge">
            Режим: Распредели по категориям
          </span>
        </div>

        <div className="quiz-result-card glass-panel">
          <div className="result-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {score >= 9 ? '🏆' : score >= 6 ? '🎯' : '📚'}
            </span>
            <h3 className="result-title">Распределение завершено!</h3>
            <p className="result-subtitle">
              {score >= 9
                ? 'Превосходно! Вы отлично знаете правовые категории!'
                : score >= 6
                ? 'Хороший результат! Несколько категорий стоит повторить.'
                : 'Рекомендуем изучить классификации в Правовой библиотеке.'}
            </p>
          </div>

          <div className="result-score-block">
            <div className="result-score-circle sort-score-circle">
              <span className="result-score-num">{score}</span>
              <span className="result-score-total">/ 10</span>
            </div>
            <span className="result-score-label">Верных распределений</span>
          </div>

          {/* Разбор карточек */}
          <div className="result-review-section">
            <h4 className="result-review-heading">Разбор карточек этого раунда:</h4>
            <div className="result-review-list">
              {results.map((r, idx) => {
                const correctCat = sortingCategories.find(
                  (c) => c.id === r.card.correctCategoryId
                )!
                const chosenCat = sortingCategories.find(
                  (c) => c.id === r.chosenCategoryId
                )!
                return (
                  <div
                    key={idx}
                    className={`review-item ${r.isCorrect ? 'review-correct' : 'review-wrong'}`}
                  >
                    <div className="review-item-header">
                      <span className="review-item-num">#{idx + 1}</span>
                      <span className="review-status-tag">
                        {r.isCorrect ? 'Верно' : 'Ошибка'}
                      </span>
                      <span className="review-article">{r.card.source}</span>
                    </div>
                    <p className="review-question">{r.card.label}</p>
                    <div className="review-answer-details">
                      {!r.isCorrect && (
                        <div>
                          <span className="review-detail-label">Вы выбрали: </span>
                          <span className="text-wrong">{chosenCat.label}</span>
                        </div>
                      )}
                      <div>
                        <span className="review-detail-label">Правильно: </span>
                        <span className="text-correct">{correctCat.label}</span>
                      </div>
                    </div>
                    <p className="match-explanation">{r.card.explanation}</p>
                    {r.card.sourceUrl && (
                      <a
                        href={r.card.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="feedback-adilet-link"
                      >
                        <span>Проверить в «Әділет» ({r.card.source})</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="result-actions-row">
            <button
              type="button"
              className="interactive-action-btn primary"
              onClick={handleRestart}
            >
              <span aria-hidden="true">🔄</span>
              <span>Новый раунд (10 карточек)</span>
            </button>
            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={onExit}
            >
              <span>Вернуться в тренажёр</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Рендер игровой карточки ─────────────────────────────────────────
  const isCorrectAnswer = chosenCategoryId === currentCard.correctCategoryId

  return (
    <div className="interactive-container">
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onExit}>
          <span aria-hidden="true">←</span>
          <span>В меню тренажёра</span>
        </button>
        <span className="interactive-mode-badge sort-badge">
          Режим: Распредели по категориям
        </span>
      </div>

      <div className="quiz-card glass-panel">
        {/* Прогресс */}
        <div className="quiz-progress-section">
          <div className="quiz-progress-label">
            <span>Карточка {currentIndex + 1} из {cards.length}</span>
            <span className="quiz-progress-cat">{correctCategory.label}</span>
          </div>
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill sort-fill"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Карточка понятия */}
        <div className="sort-concept-box">
          <div className="sort-concept-label">Правовое понятие или ситуация</div>
          <h3 className="sort-concept-title">{currentCard.label}</h3>
          {currentCard.description && (
            <p className="sort-concept-desc">{currentCard.description}</p>
          )}
        </div>

        {/* 4 кнопки-категории */}
        <div className="sort-categories-grid">
          {sortingCategories.map((cat) => {
            let cls = 'sort-cat-btn'
            if (isAnswered) {
              if (cat.id === currentCard.correctCategoryId) {
                cls += ' cat-correct'
              } else if (cat.id === chosenCategoryId) {
                cls += ' cat-wrong'
              } else {
                cls += ' cat-dimmed'
              }
            }
            return (
              <button
                key={cat.id}
                type="button"
                className={cls}
                onClick={() => handleCategorySelect(cat.id)}
                disabled={isAnswered}
                style={
                  !isAnswered ? { borderColor: cat.color + '55' } : undefined
                }
              >
                <span
                  className="sort-cat-dot"
                  style={{ background: cat.color }}
                  aria-hidden="true"
                />
                <span>{cat.label}</span>
                {isAnswered && cat.id === currentCard.correctCategoryId && (
                  <span className="sort-cat-icon" aria-hidden="true">✓</span>
                )}
                {isAnswered && cat.id === chosenCategoryId && cat.id !== currentCard.correctCategoryId && (
                  <span className="sort-cat-icon" aria-hidden="true">✗</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Блок обратной связи */}
        {isAnswered && (
          <div
            className={`quiz-feedback-box ${isCorrectAnswer ? 'feedback-correct' : 'feedback-wrong'}`}
          >
            <div className="feedback-status-row">
              <span className="feedback-icon" aria-hidden="true">
                {isCorrectAnswer ? '✓' : '✗'}
              </span>
              <span className="feedback-verdict">
                {isCorrectAnswer ? 'Верно!' : 'Неверно!'}
              </span>
              <span className="feedback-article-pill">
                Категория: {correctCategory.label}
              </span>
            </div>

            <p className="feedback-explanation">{currentCard.explanation}</p>

            <div className="feedback-source-row">
              <a
                href={currentCard.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="feedback-adilet-link"
              >
                <span>{currentCard.source} — проверить в «Әділет»</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="quiz-next-row">
              <button
                type="button"
                className="quiz-next-btn"
                onClick={handleNext}
              >
                <span>
                  {currentIndex + 1 < cards.length
                    ? 'Следующая карточка'
                    : 'Посмотреть результат'}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
