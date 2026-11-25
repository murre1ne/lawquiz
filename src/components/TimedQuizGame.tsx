import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TIMED_QUIZ_DURATION_SECONDS,
  TIMED_QUIZ_TOTAL_QUESTIONS,
  timedQuizQuestions,
  type TimedAnswerRecord,
  type TimedQuizPhase,
  type TimedQuizQuestion,
} from '../data/timedQuizQuestions'
import {
  evaluateTimedQuiz,
  formatSecondsMMSS,
  shuffleTimedQuestions,
} from '../utils/timedQuizLogic'

interface TimedQuizGameProps {
  alreadyCompletedBefore: boolean
  onBackToGames: () => void
  onComplete: (correctCount: number) => {
    xpGainedNow: number
    alreadyCompleted: boolean
    leveledUp: boolean
    newLevel: number
  }
}

export function TimedQuizGame({
  alreadyCompletedBefore,
  onBackToGames,
  onComplete,
}: TimedQuizGameProps) {
  const [phase, setPhase] = useState<TimedQuizPhase>('intro')
  const [questions, setQuestions] = useState<TimedQuizQuestion[]>(() =>
    shuffleTimedQuestions(timedQuizQuestions)
  )
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [records, setRecords] = useState<TimedAnswerRecord[]>([])
  const [remainingSeconds, setRemainingSeconds] = useState<number>(TIMED_QUIZ_DURATION_SECONDS)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [finishedByTimeout, setFinishedByTimeout] = useState<boolean>(false)
  const [lockedChoiceIndex, setLockedChoiceIndex] = useState<number | null>(null)
  const [xpAward, setXpAward] = useState<{
    gained: number
    alreadyCompleted: boolean
    notEligibleReason?: string
  } | null>(null)

  // Рефы для точного wall-clock таймера и защиты от двойного завершения/двойных баллов
  const startTimeRef = useRef<number | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const advanceTimerRef = useRef<number | null>(null)
  const hasFinishedRef = useRef<boolean>(false)
  const answeredIdsRef = useRef<Set<string>>(new Set())
  const recordsRef = useRef<TimedAnswerRecord[]>([])
  const questionsRef = useRef<TimedQuizQuestion[]>(questions)

  questionsRef.current = questions
  recordsRef.current = records

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  // Единая точка завершения испытания (защищена от повторного вызова)
  const finalizeAttempt = useCallback(
    (reason: 'completed' | 'timeout', latestRecords?: TimedAnswerRecord[]) => {
      if (hasFinishedRef.current) return
      hasFinishedRef.current = true
      clearAllTimers()

      const baseRecords = latestRecords ?? recordsRef.current
      const recordedIds = new Set(baseRecords.map((r) => r.question.id))

      // Все оставшиеся неотвеченные вопросы при истечении времени помечаем как пропущенные
      const completeRecords: TimedAnswerRecord[] = [
        ...baseRecords,
        ...questionsRef.current
          .filter((q) => !recordedIds.has(q.id))
          .map((q) => ({
            question: q,
            selectedOptionIndex: null,
            status: 'skipped' as const,
          })),
      ]

      const spent =
        reason === 'timeout'
          ? TIMED_QUIZ_DURATION_SECONDS
          : startTimeRef.current !== null
          ? Math.min(
              TIMED_QUIZ_DURATION_SECONDS,
              Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
            )
          : 0

      if (reason === 'timeout') {
        setRemainingSeconds(0)
      }
      setElapsedSeconds(spent)
      setFinishedByTimeout(reason === 'timeout')
      setLockedChoiceIndex(null)
      recordsRef.current = completeRecords
      setRecords(completeRecords)

      // Начисление XP только при фактическом завершении всех 12 вопросов в срок (без пустых пропусков)
      const answeredCount = completeRecords.filter((r) => r.status !== 'skipped').length
      const correctCount = completeRecords.filter((r) => r.status === 'correct').length
      if (reason === 'completed' && answeredCount > 0) {
        const res = onComplete(correctCount)
        setXpAward({ gained: res.xpGainedNow, alreadyCompleted: res.alreadyCompleted })
      } else if (alreadyCompletedBefore) {
        setXpAward({ gained: 0, alreadyCompleted: true })
      } else {
        setXpAward({
          gained: 0,
          alreadyCompleted: false,
          notEligibleReason:
            reason === 'timeout'
              ? 'Для получения +20 XP завершите все 12 вопросов до истечения времени'
              : 'Для получения +20 XP ответьте на вопросы испытания (не пропуская все подряд)',
        })
      }

      setPhase('finished')
    },
    [alreadyCompletedBefore, clearAllTimers, onComplete]
  )

  // Синхронизация таймера по системным часам (устойчиво к переключению вкладок и троттлингу JS)
  const syncTimer = useCallback(() => {
    if (hasFinishedRef.current || endTimeRef.current === null) return
    const remainingMs = Math.max(0, endTimeRef.current - Date.now())
    const nextSec = Math.min(TIMED_QUIZ_DURATION_SECONDS, Math.ceil(remainingMs / 1000))
    setRemainingSeconds(nextSec)

    if (remainingMs <= 0) {
      finalizeAttempt('timeout')
    }
  }, [finalizeAttempt])

  useEffect(() => {
    if (phase !== 'playing') return

    syncTimer()
    intervalRef.current = window.setInterval(syncTimer, 200)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearAllTimers()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [phase, syncTimer, clearAllTimers])

  // Очистка при размонтировании
  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  // Запуск новой попытки с перемешиванием вопросов и чистым сбросом состояния
  const startNewAttempt = () => {
    clearAllTimers()
    const freshQuestions = shuffleTimedQuestions(timedQuizQuestions)
    const now = Date.now()

    hasFinishedRef.current = false
    answeredIdsRef.current = new Set()
    recordsRef.current = []
    questionsRef.current = freshQuestions
    startTimeRef.current = now
    endTimeRef.current = now + TIMED_QUIZ_DURATION_SECONDS * 1000

    setQuestions(freshQuestions)
    setCurrentIndex(0)
    setRecords([])
    setRemainingSeconds(TIMED_QUIZ_DURATION_SECONDS)
    setElapsedSeconds(0)
    setFinishedByTimeout(false)
    setLockedChoiceIndex(null)
    setXpAward(null)
    setPhase('playing')
  }

  const currentQuestion = questions[currentIndex] ?? null
  const currentScore = records.filter((r) => r.status === 'correct').length
  const isWarningTime = remainingSeconds <= 60

  // Фиксация ответа (или пропуска) с переходом к следующему вопросу
  const commitAnswer = (optionIndex: number | null) => {
    if (
      phase !== 'playing' ||
      hasFinishedRef.current ||
      !currentQuestion ||
      lockedChoiceIndex !== null ||
      answeredIdsRef.current.has(currentQuestion.id)
    ) {
      return
    }

    answeredIdsRef.current.add(currentQuestion.id)

    const status =
      optionIndex === null
        ? 'skipped'
        : optionIndex === currentQuestion.correctAnswerIndex
        ? 'correct'
        : 'wrong'

    const nextRecord: TimedAnswerRecord = {
      question: currentQuestion,
      selectedOptionIndex: optionIndex,
      status,
    }

    const updatedRecords = [...recordsRef.current, nextRecord]
    recordsRef.current = updatedRecords
    setRecords(updatedRecords)

    const isLastQuestion = currentIndex + 1 >= questions.length

    if (optionIndex === null) {
      if (isLastQuestion) {
        finalizeAttempt('completed', updatedRecords)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
      return
    }

    // Короткая визуальная фиксация выбранного варианта, затем автопереход
    setLockedChoiceIndex(optionIndex)
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      if (hasFinishedRef.current) return
      setLockedChoiceIndex(null)
      if (isLastQuestion) {
        finalizeAttempt('completed', updatedRecords)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    }, 240)
  }

  const results = evaluateTimedQuiz(records, TIMED_QUIZ_TOTAL_QUESTIONS)

  return (
    <div className="timed-game-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToGames}>
          <span aria-hidden="true">←</span>
          <span>В Игровую зону</span>
        </button>
        <span className="interactive-mode-badge timed-mode-badge">
          Игра: Испытание на время · ГК РК
        </span>
      </div>

      {/* 1. Экран перед началом */}
      {phase === 'intro' && (
        <div className="glass-panel timed-intro-card">
          <div className="timed-intro-icon" aria-hidden="true">
            ⏱
          </div>
          <h3 className="timed-intro-title">Испытание на время</h3>
          <p className="timed-intro-desc">
            Ответьте на 12 вопросов по Гражданскому кодексу РК за 5 минут
          </p>

          <div className="timed-specs-grid">
            <div className="timed-spec-item">
              <span className="timed-spec-label">Количество вопросов</span>
              <strong className="timed-spec-value">{TIMED_QUIZ_TOTAL_QUESTIONS} вопросов</strong>
            </div>
            <div className="timed-spec-item">
              <span className="timed-spec-label">Продолжительность</span>
              <strong className="timed-spec-value">5 минут (05:00)</strong>
            </div>
            <div className="timed-spec-item">
              <span className="timed-spec-label">Максимум баллов</span>
              <strong className="timed-spec-value">{TIMED_QUIZ_TOTAL_QUESTIONS} баллов</strong>
            </div>
          </div>

          <p className="timed-intro-note">
            Таймер запустится только после нажатия кнопки. После выбора варианта ответ фиксируется, и сразу открывается следующий вопрос. Любой вопрос можно пропустить (0 баллов).
          </p>

          <div className="timed-intro-actions">
            <button
              type="button"
              className="timed-start-btn"
              onClick={startNewAttempt}
            >
              <span>Начать испытание</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Активный игровой экран */}
      {phase === 'playing' && currentQuestion && (
        <div className="glass-panel timed-play-card">
          {/* Верхняя строка: таймер, номер вопроса, баллы */}
          <div className="timed-hud-bar">
            <div
              className={`timed-timer-box ${isWarningTime ? 'is-warning' : ''}`}
              role="timer"
              aria-live="off"
              aria-label={`Оставшееся время ${formatSecondsMMSS(remainingSeconds)}`}
            >
              <span className="timed-timer-icon" aria-hidden="true">
                ⏱
              </span>
              <div className="timed-timer-copy">
                <span className="timed-timer-label">
                  {isWarningTime ? 'Осталось меньше минуты!' : 'Осталось времени'}
                </span>
                <strong className="timed-timer-digits">
                  {formatSecondsMMSS(remainingSeconds)}
                </strong>
              </div>
            </div>

            <div className="timed-hud-counters">
              <div className="timed-counter-pill">
                <span className="timed-counter-label">Вопрос</span>
                <strong className="timed-counter-val">
                  {currentIndex + 1} из {questions.length}
                </strong>
              </div>
              <div className="timed-counter-pill counter-score">
                <span className="timed-counter-label">Баллы</span>
                <strong className="timed-counter-val">
                  {currentScore} / {questions.length}
                </strong>
              </div>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="quiz-progress-section">
            <div className="quiz-progress-label">
              <span>
                Прогресс испытания: {currentIndex + 1} из {questions.length}
              </span>
              <span className="quiz-progress-cat">{currentQuestion.category}</span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill timed-progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Карточка текущего вопроса с плавной анимацией смены */}
          <div key={currentQuestion.id} className="timed-question-stage">
            <h3 className="quiz-question-text">{currentQuestion.question}</h3>

            <div className="quiz-options-grid" role="radiogroup">
              {currentQuestion.options.map((optionText, optIdx) => {
                const isSelected = lockedChoiceIndex === optIdx
                return (
                  <button
                    key={optIdx}
                    type="button"
                    className={`quiz-option-btn timed-option-btn ${
                      isSelected ? 'timed-option-selected' : ''
                    }`}
                    onClick={() => commitAnswer(optIdx)}
                    disabled={lockedChoiceIndex !== null}
                    aria-pressed={isSelected}
                  >
                    <span className="option-marker">{String.fromCharCode(65 + optIdx)}</span>
                    <span className="option-text">{optionText}</span>
                  </button>
                )
              })}
            </div>

            <div className="timed-footer-controls">
              <button
                type="button"
                className="timed-skip-btn"
                onClick={() => commitAnswer(null)}
                disabled={lockedChoiceIndex !== null}
              >
                <span>Пропустить вопрос (0 баллов)</span>
                <span aria-hidden="true">↷</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Экран результатов и подробный разбор всех 12 вопросов */}
      {phase === 'finished' && (
        <div className="glass-panel timed-results-wrapper">
          <div className="timed-results-top">
            <span className="result-trophy-icon" aria-hidden="true">
              {results.percentage >= 80 ? '🏆' : results.percentage >= 50 ? '⏱️' : '📚'}
            </span>
            {finishedByTimeout && (
              <span className="timed-timeout-pill">Время вышло (00:00)</span>
            )}
            <h3 className="result-title">{results.title}</h3>
            <p className="result-subtitle">{results.message}</p>

            {xpAward && (
              <div className="xp-inline-feedback">
                {xpAward.gained > 0 ? (
                  <span className="cw-xp-gained-pill">
                    Задание завершено! +{xpAward.gained} XP
                  </span>
                ) : xpAward.notEligibleReason ? (
                  <span className="cw-xp-neutral-pill">{xpAward.notEligibleReason}</span>
                ) : (
                  <span className="cw-xp-neutral-pill">
                    Вы уже получили опыт за это задание
                  </span>
                )}
              </div>
            )}

            <div className="timed-final-score-badge">
              <span className="timed-final-score-num">{results.correctCount}</span>
              <span className="timed-final-score-den">/ {TIMED_QUIZ_TOTAL_QUESTIONS}</span>
            </div>

            {/* Сводка 5 метрик */}
            <div className="timed-summary-grid">
              <div className="timed-stat-pill stat-percent">
                <span className="timed-stat-num">{results.percentage}%</span>
                <span className="timed-stat-lbl">Точность</span>
              </div>
              <div className="timed-stat-pill stat-ok">
                <span className="timed-stat-num">{results.correctCount}</span>
                <span className="timed-stat-lbl">Правильно</span>
              </div>
              <div className="timed-stat-pill stat-err">
                <span className="timed-stat-num">{results.wrongCount}</span>
                <span className="timed-stat-lbl">Неправильно</span>
              </div>
              <div className="timed-stat-pill stat-skip">
                <span className="timed-stat-num">{results.skippedCount}</span>
                <span className="timed-stat-lbl">Пропущено</span>
              </div>
              <div className="timed-stat-pill stat-time">
                <span className="timed-stat-num">{formatSecondsMMSS(elapsedSeconds)}</span>
                <span className="timed-stat-lbl">Затрачено</span>
              </div>
            </div>

            <div className="result-actions-row">
              <button
                type="button"
                className="interactive-action-btn primary"
                onClick={startNewAttempt}
              >
                <span aria-hidden="true">🔄</span>
                <span>Пройти ещё раз</span>
              </button>
              <button
                type="button"
                className="interactive-action-btn secondary"
                onClick={onBackToGames}
              >
                <span>Вернуться в игровую зону</span>
              </button>
            </div>
          </div>

          {/* Раздел «Разбор вопросов» для всех 12 вопросов */}
          <div className="timed-review-section">
            <h4 className="result-review-heading">
              Разбор вопросов ({records.length} из {TIMED_QUIZ_TOTAL_QUESTIONS})
            </h4>

            <div className="timed-review-list">
              {records.map((rec, idx) => {
                const statusClass =
                  rec.status === 'correct'
                    ? 'review-correct'
                    : rec.status === 'wrong'
                    ? 'review-wrong'
                    : 'timed-review-skipped'

                const statusText =
                  rec.status === 'correct'
                    ? 'Правильно (+1 балл)'
                    : rec.status === 'wrong'
                    ? 'Неправильно (0 баллов)'
                    : 'Пропущено (0 баллов)'

                return (
                  <article key={rec.question.id} className={`review-item ${statusClass}`}>
                    <div className="review-item-header">
                      <span className="review-item-num">#{idx + 1}</span>
                      <span className="review-status-tag">{statusText}</span>
                      <span className="timed-review-cat">{rec.question.category}</span>
                      <span className="review-article">{rec.question.article}</span>
                    </div>

                    <p className="review-question">{rec.question.question}</p>

                    <div className="review-answer-details">
                      <div>
                        <span className="review-detail-label">Ваш ответ: </span>
                        {rec.selectedOptionIndex !== null ? (
                          <span
                            className={rec.status === 'correct' ? 'text-correct' : 'text-wrong'}
                          >
                            {rec.question.options[rec.selectedOptionIndex]}
                          </span>
                        ) : (
                          <span className="timed-text-skipped">Вопрос пропущен</span>
                        )}
                      </div>
                      {rec.status !== 'correct' && (
                        <div>
                          <span className="review-detail-label">Правильный ответ: </span>
                          <span className="text-correct">
                            {rec.question.options[rec.question.correctAnswerIndex]}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="timed-review-explanation">{rec.question.explanation}</p>

                    <blockquote className="timed-law-excerpt">
                      <span className="timed-law-excerpt-label">
                        Выдержка из закона ({rec.question.article}):
                      </span>
                      <span>{rec.question.lawExcerpt}</span>
                    </blockquote>

                    <div className="cw-review-source-row">
                      <a
                        href={rec.question.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="feedback-adilet-link"
                      >
                        <span>Читать статью на Adilet ({rec.question.article})</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
