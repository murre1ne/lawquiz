import { useEffect, useRef, useState } from 'react'
import {
  wheelQuestions,
  type WheelAnswerRecord,
  type WheelGamePhase,
  type WheelQuestion,
  type WheelSectorStatus,
} from '../data/wheelQuestions'
import {
  WHEEL_SECTOR_COUNT,
  WHEEL_SLICE_ANGLE,
  calculateSpinTargetAngle,
  easeOutQuart,
  evaluateWheelResult,
  pickRandomRemainingSector,
  shuffleWheelQuestions,
} from '../utils/wheelLogic'
import { FortuneWheelSvg } from './FortuneWheelSvg'

interface FortuneWheelGameProps {
  onBackToGames: () => void
}

const INITIAL_SECTORS = Array.from({ length: WHEEL_SECTOR_COUNT }, (_, i) => i)

function createInitialStatuses(): WheelSectorStatus[] {
  return Array.from({ length: WHEEL_SECTOR_COUNT }, () => 'available')
}

export function FortuneWheelGame({ onBackToGames }: FortuneWheelGameProps) {
  const [sessionQuestions, setSessionQuestions] = useState<WheelQuestion[]>(() =>
    shuffleWheelQuestions(wheelQuestions)
  )
  const [phase, setPhase] = useState<WheelGamePhase>('idle')
  const [rotation, setRotation] = useState<number>(0)
  const [pointerTick, setPointerTick] = useState<boolean>(false)
  const [remainingSectors, setRemainingSectors] = useState<number[]>(INITIAL_SECTORS)
  const [sectorStatuses, setSectorStatuses] = useState<WheelSectorStatus[]>(createInitialStatuses)
  const [activeSectorIndex, setActiveSectorIndex] = useState<number | null>(null)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<WheelAnswerRecord[]>([])

  const rafIdRef = useRef<number | null>(null)
  const postStopTimerRef = useRef<number | null>(null)
  const tickTimerRef = useRef<number | null>(null)
  const rotationRef = useRef<number>(0)

  const clearTimers = () => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (postStopTimerRef.current !== null) {
      window.clearTimeout(postStopTimerRef.current)
      postStopTimerRef.current = null
    }
    if (tickTimerRef.current !== null) {
      window.clearTimeout(tickTimerRef.current)
      tickTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const correctScore = history.filter((item) => item.isCorrect).length
  const totalQuestions = sessionQuestions.length
  const activeQuestion =
    activeSectorIndex !== null ? sessionQuestions[activeSectorIndex] ?? null : null
  const isAnswered = selectedOptionIndex !== null
  const canSpin = phase === 'idle' && remainingSectors.length > 0

  // Запуск плавного вращения колеса через requestAnimationFrame
  const handleSpin = () => {
    if (!canSpin) return

    const chosenSector = pickRandomRemainingSector(remainingSectors)
    if (chosenSector === null) {
      setPhase('finished')
      return
    }

    clearTimers()
    setPhase('spinning')
    setActiveSectorIndex(null)
    setSelectedOptionIndex(null)

    const startRotation = rotationRef.current
    const targetRotation = calculateSpinTargetAngle(startRotation, chosenSector)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const durationMs = prefersReducedMotion ? 450 : 3800
    const startTime = performance.now()
    let lastSliceBucket = Math.floor(startRotation / WHEEL_SLICE_ANGLE)

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = easeOutQuart(progress)
      const currentAngle = startRotation + (targetRotation - startRotation) * eased

      rotationRef.current = currentAngle
      setRotation(currentAngle)

      const currentBucket = Math.floor(currentAngle / WHEEL_SLICE_ANGLE)
      if (currentBucket !== lastSliceBucket) {
        lastSliceBucket = currentBucket
        setPointerTick(true)
        if (tickTimerRef.current !== null) {
          window.clearTimeout(tickTimerRef.current)
        }
        tickTimerRef.current = window.setTimeout(() => setPointerTick(false), 65)
      }

      if (progress < 1) {
        rafIdRef.current = window.requestAnimationFrame(animate)
      } else {
        rafIdRef.current = null
        setPointerTick(false)
        setActiveSectorIndex(chosenSector)
        postStopTimerRef.current = window.setTimeout(() => {
          setPhase('question')
        }, 380)
      }
    }

    rafIdRef.current = window.requestAnimationFrame(animate)
  }

  // Выбор варианта ответа (с защитой от повторного выбора и начисления баллов)
  const handleSelectOption = (optionIndex: number) => {
    if (
      phase !== 'question' ||
      selectedOptionIndex !== null ||
      activeSectorIndex === null ||
      !activeQuestion
    ) {
      return
    }

    const isCorrect = optionIndex === activeQuestion.correctAnswerIndex
    setSelectedOptionIndex(optionIndex)

    setHistory((prev) => [
      ...prev,
      {
        sectorIndex: activeSectorIndex,
        question: activeQuestion,
        selectedOptionIndex: optionIndex,
        isCorrect,
      },
    ])

    setSectorStatuses((prev) => {
      const next = [...prev]
      next[activeSectorIndex] = isCorrect ? 'correct' : 'wrong'
      return next
    })

    setRemainingSectors((prev) => prev.filter((idx) => idx !== activeSectorIndex))
  }

  // Переход к следующему вращению или к экрану итогов
  const handleNextQuestion = () => {
    if (remainingSectors.length === 0) {
      setPhase('finished')
      setActiveSectorIndex(null)
      setSelectedOptionIndex(null)
      return
    }
    setSelectedOptionIndex(null)
    setActiveSectorIndex(null)
    setPhase('idle')
  }

  // Полный перезапуск игры с новым перемешиванием 10 вопросов
  const handleRestart = () => {
    clearTimers()
    setSessionQuestions(shuffleWheelQuestions(wheelQuestions))
    setPhase('idle')
    setPointerTick(false)
    setRemainingSectors(INITIAL_SECTORS)
    setSectorStatuses(createInitialStatuses())
    setActiveSectorIndex(null)
    setSelectedOptionIndex(null)
    setHistory([])
  }

  const finalResults = evaluateWheelResult(history, totalQuestions)

  return (
    <div className="wheel-game-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToGames}>
          <span aria-hidden="true">←</span>
          <span>В Игровую зону</span>
        </button>
        <span className="interactive-mode-badge wheel-mode-badge">
          Игра: Колесо-фортуна · ГК РК
        </span>
      </div>

      {/* Основная карточка игры */}
      {phase !== 'finished' ? (
        <div className="glass-panel wheel-panel">
          {/* Заголовок и счётчики */}
          <div className="wheel-header-row">
            <div className="wheel-title-block">
              <h3 className="wheel-game-title">Колесо-фортуна</h3>
              <p className="wheel-game-desc">
                Крутите колесо, чтобы случайным образом выбрать один из 10 вопросов по Общей и Особенной частям Гражданского кодекса РК. Каждый сектор выпадает только один раз.
              </p>
            </div>

            <div className="wheel-hud-grid" aria-label="Статистика текущей игры">
              <div className="wheel-hud-pill hud-score">
                <span className="wheel-hud-label">Правильных ответов</span>
                <strong className="wheel-hud-value">{correctScore}</strong>
              </div>
              <div className="wheel-hud-pill hud-remaining">
                <span className="wheel-hud-label">Осталось вопросов</span>
                <strong className="wheel-hud-value">
                  {remainingSectors.length} / {totalQuestions}
                </strong>
              </div>
            </div>
          </div>

          {/* Прогресс-бар прохождения 10 вопросов */}
          <div className="quiz-progress-section">
            <div className="quiz-progress-label">
              <span>
                Пройдено вопросов: {history.length} из {totalQuestions}
              </span>
              <span className="quiz-progress-cat">
                {phase === 'spinning'
                  ? 'Колесо вращается...'
                  : phase === 'question' && activeSectorIndex !== null
                  ? `Выпал сектор №${activeSectorIndex + 1}`
                  : 'Готово к вращению'}
              </span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill wheel-progress-fill"
                style={{ width: `${(history.length / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Рабочая область: Колесо в центре / слева + Карточка вопроса */}
          <div className={`wheel-workspace ${phase === 'question' ? 'has-question' : ''}`}>
            <div className="wheel-column">
              <FortuneWheelSvg
                rotation={rotation}
                isSpinning={phase === 'spinning'}
                pointerTick={pointerTick}
                sectorStatuses={sectorStatuses}
                highlightedSector={activeSectorIndex}
                onCenterSpinClick={handleSpin}
                canSpin={canSpin}
              />

              <div className="wheel-spin-controls">
                <button
                  type="button"
                  className="wheel-spin-btn"
                  onClick={handleSpin}
                  disabled={!canSpin}
                >
                  <span className="wheel-spin-btn-icon" aria-hidden="true">
                    {phase === 'spinning' ? '✦' : '↻'}
                  </span>
                  <span>
                    {phase === 'spinning'
                      ? 'Вращается...'
                      : phase === 'question'
                      ? 'Ответьте на вопрос'
                      : 'Крутить колесо'}
                  </span>
                </button>
              </div>
            </div>

            {/* Панель вопроса после остановки колеса */}
            {phase === 'question' && activeQuestion && activeSectorIndex !== null && (
              <div className="wheel-question-card" role="region" aria-live="polite">
                <div className="wheel-question-meta">
                  <span className="wheel-sector-badge">Сектор №{activeSectorIndex + 1}</span>
                  <span className="wheel-part-tag">{activeQuestion.part}</span>
                </div>

                <h4 className="wheel-question-text">{activeQuestion.question}</h4>

                <div className="wheel-options-list" role="radiogroup">
                  {activeQuestion.options.map((optionText, optIdx) => {
                    let optionClass = 'quiz-option-btn wheel-option-btn'
                    if (isAnswered) {
                      if (optIdx === activeQuestion.correctAnswerIndex) {
                        optionClass += ' option-correct'
                      } else if (optIdx === selectedOptionIndex) {
                        optionClass += ' option-wrong'
                      } else {
                        optionClass += ' option-dimmed'
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={optionClass}
                        onClick={() => handleSelectOption(optIdx)}
                        disabled={isAnswered}
                        aria-pressed={selectedOptionIndex === optIdx}
                      >
                        <span className="option-marker">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="option-text">{optionText}</span>
                        {isAnswered && optIdx === activeQuestion.correctAnswerIndex && (
                          <span className="option-status-icon" aria-hidden="true">
                            ✓
                          </span>
                        )}
                        {isAnswered &&
                          optIdx === selectedOptionIndex &&
                          optIdx !== activeQuestion.correctAnswerIndex && (
                            <span className="option-status-icon" aria-hidden="true">
                              ✗
                            </span>
                          )}
                      </button>
                    )
                  })}
                </div>

                {/* Обратная связь после выбора ответа */}
                {isAnswered && (
                  <div
                    className={`quiz-feedback-box ${
                      selectedOptionIndex === activeQuestion.correctAnswerIndex
                        ? 'feedback-correct'
                        : 'feedback-wrong'
                    }`}
                  >
                    <div className="feedback-status-row">
                      <span className="feedback-icon" aria-hidden="true">
                        {selectedOptionIndex === activeQuestion.correctAnswerIndex ? '✓' : '✗'}
                      </span>
                      <span className="feedback-verdict">
                        {selectedOptionIndex === activeQuestion.correctAnswerIndex
                          ? 'Верно! +1 балл'
                          : 'Неверно'}
                      </span>
                      <span className="feedback-article-pill">{activeQuestion.articleLabel}</span>
                    </div>

                    <p className="feedback-explanation">{activeQuestion.explanation}</p>

                    <div className="feedback-source-row">
                      <a
                        href={activeQuestion.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="feedback-adilet-link"
                      >
                        <span>Читать статью ({activeQuestion.articleLabel} на Adilet)</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>

                    <div className="quiz-next-row">
                      <button
                        type="button"
                        className="quiz-next-btn"
                        onClick={handleNextQuestion}
                      >
                        <span>
                          {remainingSectors.length > 0
                            ? 'Следующий вопрос'
                            : 'Посмотреть результаты'}
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Экран завершения после всех 10 вопросов */
        <div className="quiz-result-card glass-panel wheel-result-card">
          <div className="result-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {finalResults.percentage >= 80 ? '🏆' : finalResults.percentage >= 50 ? '🎯' : '📚'}
            </span>
            <h3 className="result-title">{finalResults.gradeTitle}</h3>
            <p className="result-subtitle">{finalResults.gradeMessage}</p>
          </div>

          <div className="wheel-results-metrics">
            <div className="wheel-metric-box metric-percent">
              <span className="wheel-metric-value">{finalResults.percentage}%</span>
              <span className="wheel-metric-label">Точность</span>
            </div>
            <div className="wheel-metric-box metric-correct">
              <span className="wheel-metric-value">{finalResults.correctCount}</span>
              <span className="wheel-metric-label">Правильных</span>
            </div>
            <div className="wheel-metric-box metric-wrong">
              <span className="wheel-metric-value">{finalResults.wrongCount}</span>
              <span className="wheel-metric-label">Неправильных</span>
            </div>
          </div>

          <div className="result-review-section">
            <h4 className="result-review-heading">Разбор всех 10 вопросов:</h4>
            <div className="result-review-list">
              {history.map((item, idx) => (
                <div
                  key={item.question.id}
                  className={`review-item ${item.isCorrect ? 'review-correct' : 'review-wrong'}`}
                >
                  <div className="review-item-header">
                    <span className="review-item-num">
                      #{idx + 1} · Сектор №{item.sectorIndex + 1}
                    </span>
                    <span className="review-status-tag">
                      {item.isCorrect ? 'Верно' : 'Ошибка'}
                    </span>
                    <span className="review-article">{item.question.articleLabel}</span>
                  </div>
                  <p className="review-question">{item.question.question}</p>
                  <div className="review-answer-details">
                    <div>
                      <span className="review-detail-label">Ваш ответ: </span>
                      <span className={item.isCorrect ? 'text-correct' : 'text-wrong'}>
                        {item.question.options[item.selectedOptionIndex]}
                      </span>
                    </div>
                    {!item.isCorrect && (
                      <div>
                        <span className="review-detail-label">Правильный ответ: </span>
                        <span className="text-correct">
                          {item.question.options[item.question.correctAnswerIndex]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="cw-review-source-row">
                    <a
                      href={item.question.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="feedback-adilet-link"
                    >
                      <span>Читать статью ({item.question.articleLabel})</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-actions-row">
            <button
              type="button"
              className="interactive-action-btn primary"
              onClick={handleRestart}
            >
              <span aria-hidden="true">🔄</span>
              <span>Пройти ещё раз</span>
            </button>
            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={onBackToGames}
            >
              <span>В Игровую зону</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
