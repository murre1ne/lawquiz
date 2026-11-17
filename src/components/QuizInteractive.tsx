import { useState, useMemo } from 'react'
import { testQuestions } from '../data/testQuestions'
import type { TestQuestion } from '../data/trainerTypes'

interface ShuffledQuestion {
  original: TestQuestion
  shuffledOptions: string[]
  correctIndex: number
}

// Алгоритм случайного перемешивания Фишера-Йетса
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Генерация 10 случайных вопросов с перемешанными вариантами ответов
function generateQuizRound(): ShuffledQuestion[] {
  const chosen = shuffleArray(testQuestions).slice(0, 10)
  return chosen.map((q) => {
    const originalCorrectText = q.options[q.correctAnswerIndex]
    const shuffledOptions = shuffleArray(q.options)
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText)
    return {
      original: q,
      shuffledOptions,
      correctIndex: newCorrectIndex,
    }
  })
}

interface QuizInteractiveProps {
  onExit: () => void
}

export function QuizInteractive({ onExit }: QuizInteractiveProps) {
  const [roundKey, setRoundKey] = useState(0)
  const questions = useMemo(() => generateQuizRound(), [roundKey])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answersHistory, setAnswersHistory] = useState<
    Array<{
      question: ShuffledQuestion
      selectedIndex: number
      isCorrect: boolean
    }>
  >([])
  const [isCompleted, setIsCompleted] = useState(false)

  const currentQ = questions[currentIndex]
  const isAnswered = selectedOption !== null

  // Выбор варианта ответа
  const handleSelectOption = (index: number) => {
    if (isAnswered) return
    setSelectedOption(index)
    const isCorrect = index === currentQ.correctIndex
    setAnswersHistory((prev) => [
      ...prev,
      {
        question: currentQ,
        selectedIndex: index,
        isCorrect,
      },
    ])
  }

  // Переход к следующему вопросу или завершение
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedOption(null)
    } else {
      setIsCompleted(true)
    }
  }

  // Перезапуск с новой выборкой
  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswersHistory([])
    setIsCompleted(false)
    setRoundKey((k) => k + 1)
  }

  // Подсчёт правильных ответов
  const score = answersHistory.filter((a) => a.isCorrect).length

  return (
    <div className="interactive-container">
      {/* Шапка режима тестирования */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onExit}>
          <span aria-hidden="true">←</span>
          <span>В меню тренажёра</span>
        </button>
        <span className="interactive-mode-badge">
          Режим: Тестирование по ГК РК
        </span>
      </div>

      {!isCompleted ? (
        <div className="quiz-card glass-panel">
          {/* Индикатор прогресса */}
          <div className="quiz-progress-section">
            <div className="quiz-progress-label">
              <span>Вопрос {currentIndex + 1} из {questions.length}</span>
              <span className="quiz-progress-cat">{currentQ.original.category}</span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Текст вопроса */}
          <div className="quiz-question-header">
            <h3 className="quiz-question-text">{currentQ.original.question}</h3>
          </div>

          {/* 4 варианта ответа */}
          <div className="quiz-options-grid" role="radiogroup">
            {currentQ.shuffledOptions.map((option, idx) => {
              let optionClass = 'quiz-option-btn'
              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  optionClass += ' option-correct'
                } else if (idx === selectedOption) {
                  optionClass += ' option-wrong'
                } else {
                  optionClass += ' option-dimmed'
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={optionClass}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  aria-pressed={selectedOption === idx}
                >
                  <span className="option-marker">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="option-text">{option}</span>
                  {isAnswered && idx === currentQ.correctIndex && (
                    <span className="option-status-icon" aria-hidden="true">✓</span>
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <span className="option-status-icon" aria-hidden="true">✗</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Блок обратной связи после выбора ответа */}
          {isAnswered && (
            <div
              className={`quiz-feedback-box ${
                selectedOption === currentQ.correctIndex
                  ? 'feedback-correct'
                  : 'feedback-wrong'
              }`}
            >
              <div className="feedback-status-row">
                <span className="feedback-icon" aria-hidden="true">
                  {selectedOption === currentQ.correctIndex ? '✓' : '✗'}
                </span>
                <span className="feedback-verdict">
                  {selectedOption === currentQ.correctIndex
                    ? 'Правильно!'
                    : 'Неверно'}
                </span>
                <span className="feedback-article-pill">
                  {currentQ.original.article}
                </span>
              </div>

              <p className="feedback-explanation">
                {currentQ.original.explanation}
              </p>

              <div className="feedback-source-row">
                <a
                  href={currentQ.original.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedback-adilet-link"
                >
                  <span>Проверить норму в системе «Әділет»</span>
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
                    {currentIndex + 1 < questions.length
                      ? 'Следующий вопрос'
                      : 'Завершить тестирование'}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Экран результатов тестирования */
        <div className="quiz-result-card glass-panel">
          <div className="result-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {score >= 8 ? '🏆' : score >= 5 ? '🎯' : '📚'}
            </span>
            <h3 className="result-title">Тестирование завершено!</h3>
            <p className="result-subtitle">
              {score >= 8
                ? 'Отличный уровень правовой грамотности!'
                : score >= 5
                ? 'Хорошая база знаний, есть над чем поработать!'
                : 'Рекомендуем повторить материалы в Правовой библиотеке.'}
            </p>
          </div>

          <div className="result-score-block">
            <div className="result-score-circle">
              <span className="result-score-num">{score}</span>
              <span className="result-score-total">/ 10</span>
            </div>
            <span className="result-score-label">Правильных ответов</span>
          </div>

          {/* Список ответов раунда для работы над ошибками */}
          <div className="result-review-section">
            <h4 className="result-review-heading">Обзор вопросов раунда:</h4>
            <div className="result-review-list">
              {answersHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`review-item ${
                    item.isCorrect ? 'review-correct' : 'review-wrong'
                  }`}
                >
                  <div className="review-item-header">
                    <span className="review-item-num">#{idx + 1}</span>
                    <span className="review-status-tag">
                      {item.isCorrect ? 'Верно' : 'Ошибка'}
                    </span>
                    <span className="review-article">{item.question.original.article}</span>
                  </div>
                  <p className="review-question">{item.question.original.question}</p>
                  <div className="review-answer-details">
                    <div>
                      <span className="review-detail-label">Ваш ответ: </span>
                      <span className={item.isCorrect ? 'text-correct' : 'text-wrong'}>
                        {item.question.shuffledOptions[item.selectedIndex]}
                      </span>
                    </div>
                    {!item.isCorrect && (
                      <div>
                        <span className="review-detail-label">Правильно: </span>
                        <span className="text-correct">
                          {item.question.shuffledOptions[item.question.correctIndex]}
                        </span>
                      </div>
                    )}
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
              <span>Пройти новый тест (новая выборка)</span>
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
      )}
    </div>
  )
}
