import { useState, useMemo } from 'react'
import { truthOrMythItems } from '../data/truthOrMythData'
import type { TruthOrMythItem } from '../data/trainerTypes'

// Случайное перемешивание массива (Фишер-Йетс)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Выборка 5 случайных утверждений
function generateTruthOrMythRound(): TruthOrMythItem[] {
  return shuffleArray(truthOrMythItems).slice(0, 5)
}

interface TruthOrMythInteractiveProps {
  onExit: () => void
}

export function TruthOrMythInteractive({ onExit }: TruthOrMythInteractiveProps) {
  const [roundKey, setRoundKey] = useState(0)
  const statements = useMemo(() => generateTruthOrMythRound(), [roundKey])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userChoice, setUserChoice] = useState<boolean | null>(null)
  const [answersHistory, setAnswersHistory] = useState<
    Array<{
      item: TruthOrMythItem
      userChoice: boolean
      isCorrect: boolean
    }>
  >([])
  const [isCompleted, setIsCompleted] = useState(false)

  const currentItem = statements[currentIndex]
  const isAnswered = userChoice !== null

  // Обработка ответа пользователя (true = Правда, false = Миф)
  const handleAnswer = (choice: boolean) => {
    if (isAnswered) return
    setUserChoice(choice)
    const isCorrect = choice === currentItem.isTruth
    setAnswersHistory((prev) => [
      ...prev,
      {
        item: currentItem,
        userChoice: choice,
        isCorrect,
      },
    ])
  }

  // Переход к следующему вопросу или результату
  const handleNext = () => {
    if (currentIndex + 1 < statements.length) {
      setCurrentIndex((prev) => prev + 1)
      setUserChoice(null)
    } else {
      setIsCompleted(true)
    }
  }

  // Перезапуск с новой случайной выборкой
  const handleRestart = () => {
    setCurrentIndex(0)
    setUserChoice(null)
    setAnswersHistory([])
    setIsCompleted(false)
    setRoundKey((k) => k + 1)
  }

  // Количество правильных ответов
  const score = answersHistory.filter((a) => a.isCorrect).length

  return (
    <div className="interactive-container">
      {/* Шапка режима */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onExit}>
          <span aria-hidden="true">←</span>
          <span>В меню тренажёра</span>
        </button>
        <span className="interactive-mode-badge tm-badge">
          Режим: Правда или миф?
        </span>
      </div>

      {!isCompleted ? (
        <div className="tm-card glass-panel">
          {/* Прогресс-бар */}
          <div className="quiz-progress-section">
            <div className="quiz-progress-label">
              <span>Утверждение {currentIndex + 1} из {statements.length}</span>
              <span className="quiz-progress-cat">{currentItem.category}</span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill tm-fill"
                style={{ width: `${((currentIndex + 1) / statements.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Карточка утверждения */}
          <div className="tm-statement-box">
            <span className="tm-quote-icon" aria-hidden="true">“</span>
            <p className="tm-statement-text">{currentItem.statement}</p>
          </div>

          {/* Кнопки выбора «Правда» или «Миф» */}
          <div className="tm-choices-row">
            <button
              type="button"
              className={`tm-choice-btn btn-truth ${
                isAnswered
                  ? currentItem.isTruth
                    ? 'choice-correct'
                    : userChoice === true
                    ? 'choice-wrong'
                    : 'choice-dimmed'
                  : ''
              }`}
              onClick={() => handleAnswer(true)}
              disabled={isAnswered}
            >
              <span className="tm-choice-icon" aria-hidden="true">✓</span>
              <span className="tm-choice-title">ПРАВДА</span>
              <span className="tm-choice-sub">Действующая норма</span>
            </button>

            <button
              type="button"
              className={`tm-choice-btn btn-myth ${
                isAnswered
                  ? !currentItem.isTruth
                    ? 'choice-correct'
                    : userChoice === false
                    ? 'choice-wrong'
                    : 'choice-dimmed'
                  : ''
              }`}
              onClick={() => handleAnswer(false)}
              disabled={isAnswered}
            >
              <span className="tm-choice-icon" aria-hidden="true">✗</span>
              <span className="tm-choice-title">МИФ</span>
              <span className="tm-choice-sub">Заблуждение</span>
            </button>
          </div>

          {/* Блок пояснения и обоснования */}
          {isAnswered && (
            <div
              className={`quiz-feedback-box ${
                userChoice === currentItem.isTruth
                  ? 'feedback-correct'
                  : 'feedback-wrong'
              }`}
            >
              <div className="feedback-status-row">
                <span className="feedback-icon" aria-hidden="true">
                  {userChoice === currentItem.isTruth ? '✓' : '✗'}
                </span>
                <span className="feedback-verdict">
                  {userChoice === currentItem.isTruth
                    ? 'Абсолютно верно!'
                    : 'Неверно!'}
                </span>
                <span className="tm-verdict-pill">
                  Это: <strong>{currentItem.isTruth ? 'ПРАВДА' : 'МИФ'}</strong>
                </span>
              </div>

              <p className="feedback-explanation">
                {currentItem.explanation}
              </p>

              <div className="feedback-source-row">
                <span className="feedback-article-pill">
                  {currentItem.article}
                </span>
                <a
                  href={currentItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedback-adilet-link"
                >
                  <span>Сверить в системе «Әділет»</span>
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
                    {currentIndex + 1 < statements.length
                      ? 'Следующее утверждение'
                      : 'Посмотреть итог раунда'}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Экран результатов раунда «Правда или миф» */
        <div className="quiz-result-card glass-panel">
          <div className="result-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {score === 5 ? '🌟' : score >= 3 ? '⚖️' : '📖'}
            </span>
            <h3 className="result-title">Раунд завершён!</h3>
            <p className="result-subtitle">
              {score === 5
                ? 'Превосходная юридическая интуиция и знание законов РК!'
                : score >= 3
                ? 'Хороший результат! Вы легко распознаете большинство стереотипов.'
                : 'Многие юридические мифы кажутся правдой — повторите нормы в библиотеке!'}
            </p>
          </div>

          <div className="result-score-block">
            <div className="result-score-circle tm-score-circle">
              <span className="result-score-num">{score}</span>
              <span className="result-score-total">/ 5</span>
            </div>
            <span className="result-score-label">Верных решений</span>
          </div>

          {/* Обзор утверждений */}
          <div className="result-review-section">
            <h4 className="result-review-heading">Утверждения этого раунда:</h4>
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
                    <span className="review-article">{item.item.article}</span>
                  </div>
                  <p className="review-question">«{item.item.statement}»</p>
                  <div className="review-answer-details">
                    <div>
                      <span className="review-detail-label">Ваш выбор: </span>
                      <span className={item.isCorrect ? 'text-correct' : 'text-wrong'}>
                        {item.userChoice ? 'Правда' : 'Миф'}
                      </span>
                    </div>
                    <div>
                      <span className="review-detail-label">На самом деле: </span>
                      <span className="text-correct">
                        {item.item.isTruth ? 'Правда' : 'Миф'}
                      </span>
                    </div>
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
              <span>Начать заново (новая выборка из 5)</span>
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
