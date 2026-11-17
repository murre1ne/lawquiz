import { useState, useMemo } from 'react'
import { matchingItems } from '../data/matchingData'
import type { MatchingItem } from '../data/trainerTypes'

// ── Алгоритм Фишера-Йетса ───────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Генерация раунда: 5 случайных пар, независимо перемешанных ──────
interface MatchRound {
  items: MatchingItem[]        // 5 терминов в оригинальном порядке (левая колонка)
  shuffledDefs: MatchingItem[] // те же 5 объектов, но перемешаны (правая колонка)
}

function generateMatchRound(): MatchRound {
  const items = shuffleArray(matchingItems).slice(0, 5)
  const shuffledDefs = shuffleArray([...items])
  return { items, shuffledDefs }
}

// ── История сопоставлений ────────────────────────────────────────────
interface PairResult {
  termId: string
  defId: string
  isCorrect: boolean
}

interface MatchingInteractiveProps {
  onExit: () => void
}

export function MatchingInteractive({ onExit }: MatchingInteractiveProps) {
  const [roundKey, setRoundKey] = useState(0)
  const round = useMemo(() => generateMatchRound(), [roundKey])

  // ID выбранного термина и определения
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null)

  // Уже зафиксированные пары
  const [results, setResults] = useState<PairResult[]>([])

  // Анимация последнего выбора
  const [lastResult, setLastResult] = useState<boolean | null>(null)

  // Завершён ли раунд
  const isCompleted = results.length === round.items.length

  const matchedTermIds = new Set(results.map((r) => r.termId))
  const matchedDefIds = new Set(results.map((r) => r.defId))
  const score = results.filter((r) => r.isCorrect).length

  // ── Клик по термину ────────────────────────────────────────────────
  const handleTermClick = (id: string) => {
    if (matchedTermIds.has(id)) return
    setSelectedTermId((prev) => (prev === id ? null : id))
    setLastResult(null)
  }

  // ── Клик по определению ────────────────────────────────────────────
  const handleDefClick = (id: string) => {
    if (matchedDefIds.has(id)) return
    const newDefId = selectedDefId === id ? null : id
    setSelectedDefId(newDefId)
    setLastResult(null)

    // Если уже выбран термин — фиксируем пару
    if (selectedTermId && newDefId) {
      const isCorrect = selectedTermId === newDefId
      const pair: PairResult = {
        termId: selectedTermId,
        defId: newDefId,
        isCorrect,
      }
      setResults((prev) => [...prev, pair])
      setLastResult(isCorrect)
      setSelectedTermId(null)
      setSelectedDefId(null)
    }
  }

  // ── Перезапуск ─────────────────────────────────────────────────────
  const handleRestart = () => {
    setResults([])
    setSelectedTermId(null)
    setSelectedDefId(null)
    setLastResult(null)
    setRoundKey((k) => k + 1)
  }

  // ── Утилиты стилей ─────────────────────────────────────────────────
  const getTermClass = (id: string) => {
    const matched = results.find((r) => r.termId === id)
    if (matched) return matched.isCorrect ? 'match-card term-card matched-correct' : 'match-card term-card matched-wrong'
    if (selectedTermId === id) return 'match-card term-card selected'
    return 'match-card term-card'
  }

  const getDefClass = (id: string) => {
    const matched = results.find((r) => r.defId === id)
    if (matched) return matched.isCorrect ? 'match-card def-card matched-correct' : 'match-card def-card matched-wrong'
    if (selectedDefId === id) return 'match-card def-card selected'
    return 'match-card def-card'
  }

  // ── Рендер экрана результатов ───────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="interactive-container">
        <div className="interactive-top-bar">
          <button type="button" className="interactive-back-btn" onClick={onExit}>
            <span aria-hidden="true">←</span>
            <span>В меню тренажёра</span>
          </button>
          <span className="interactive-mode-badge match-badge">
            Режим: Соедини термин и определение
          </span>
        </div>

        <div className="quiz-result-card glass-panel">
          <div className="result-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {score === 5 ? '🏆' : score >= 3 ? '🎯' : '📚'}
            </span>
            <h3 className="result-title">Раунд завершён!</h3>
            <p className="result-subtitle">
              {score === 5
                ? 'Все пары верны! Отличное знание правовых терминов!'
                : score >= 3
                ? 'Хороший результат! Несколько терминов стоит повторить.'
                : 'Рекомендуем изучить термины в Правовой библиотеке.'}
            </p>
          </div>

          <div className="result-score-block">
            <div className="result-score-circle match-score-circle">
              <span className="result-score-num">{score}</span>
              <span className="result-score-total">/ 5</span>
            </div>
            <span className="result-score-label">Верных пар</span>
          </div>

          {/* Разбор пар раунда */}
          <div className="result-review-section">
            <h4 className="result-review-heading">Разбор терминов этого раунда:</h4>
            <div className="result-review-list">
              {results.map((r, idx) => {
                const item = round.items.find((it) => it.id === r.termId)!
                const chosenDef = round.shuffledDefs.find((it) => it.id === r.defId)!
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
                      <span className="review-article">{item.article}</span>
                    </div>
                    <p className="review-question">
                      <strong>Термин:</strong> {item.term}
                    </p>
                    {!r.isCorrect && (
                      <div className="review-answer-details">
                        <div>
                          <span className="review-detail-label">Вы выбрали: </span>
                          <span className="text-wrong">{chosenDef.definition}</span>
                        </div>
                        <div>
                          <span className="review-detail-label">Правильно: </span>
                          <span className="text-correct">{item.definition}</span>
                        </div>
                      </div>
                    )}
                    <p className="match-explanation">{item.explanation}</p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="feedback-adilet-link"
                    >
                      <span>Источник ({item.source} {item.article})</span>
                      <span aria-hidden="true">↗</span>
                    </a>
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
              <span>Новый раунд (5 случайных пар)</span>
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

  // ── Рендер игровой доски ───────────────────────────────────────────
  return (
    <div className="interactive-container">
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onExit}>
          <span aria-hidden="true">←</span>
          <span>В меню тренажёра</span>
        </button>
        <span className="interactive-mode-badge match-badge">
          Режим: Соедини термин и определение
        </span>
      </div>

      {/* Прогресс */}
      <div className="glass-panel match-panel">
        <div className="quiz-progress-section">
          <div className="quiz-progress-label">
            <span>Пар соединено: {results.length} из {round.items.length}</span>
            {lastResult !== null && (
              <span
                className={lastResult ? 'match-flash-correct' : 'match-flash-wrong'}
                aria-live="polite"
              >
                {lastResult ? '✓ Верно!' : '✗ Неверно'}
              </span>
            )}
          </div>
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill match-fill"
              style={{ width: `${(results.length / round.items.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="match-hint">
          Выберите термин слева, затем подходящее определение справа.
        </p>

        {/* Игровое поле: 2 колонки */}
        <div className="match-board">
          {/* Левая колонка — Термины */}
          <div className="match-col match-col-terms">
            <div className="match-col-heading">Термины</div>
            {round.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={getTermClass(item.id)}
                onClick={() => handleTermClick(item.id)}
                disabled={matchedTermIds.has(item.id)}
              >
                <span className="match-card-text">{item.term}</span>
                {matchedTermIds.has(item.id) && (
                  <span className="match-card-check" aria-hidden="true">
                    {results.find((r) => r.termId === item.id)?.isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Правая колонка — Определения (перемешаны) */}
          <div className="match-col match-col-defs">
            <div className="match-col-heading">Определения</div>
            {round.shuffledDefs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={getDefClass(item.id)}
                onClick={() => handleDefClick(item.id)}
                disabled={matchedDefIds.has(item.id)}
              >
                <span className="match-card-text">{item.definition}</span>
                {matchedDefIds.has(item.id) && (
                  <span className="match-card-check" aria-hidden="true">
                    {results.find((r) => r.defId === item.id)?.isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
