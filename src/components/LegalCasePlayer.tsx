import { useState } from 'react'
import type { LegalCaseScenario } from '../data/legalCasesData'

type ScenarioStep = 'decision1' | 'consequence1' | 'decision2' | 'conclusion'

interface LegalCasePlayerProps {
  scenario: LegalCaseScenario
  onBackToCatalog: () => void
  onCompleteCase: (
    caseId: string,
    correctCount: number
  ) => { xpGainedNow: number; alreadyCompleted: boolean }
}

const STAGE_LABELS: Array<{ key: ScenarioStep; num: number; label: string }> = [
  { key: 'decision1', num: 1, label: 'Ситуация' },
  { key: 'consequence1', num: 2, label: 'Последствия' },
  { key: 'decision2', num: 3, label: 'Развитие дела' },
  { key: 'conclusion', num: 4, label: 'Заключение' },
]

export function LegalCasePlayer({
  scenario,
  onBackToCatalog,
  onCompleteCase,
}: LegalCasePlayerProps) {
  const [step, setStep] = useState<ScenarioStep>('decision1')
  const [firstChoice, setFirstChoice] = useState<'А' | 'Б' | 'В' | null>(null)
  const [secondChoice, setSecondChoice] = useState<'А' | 'Б' | null>(null)
  const [xpNotice, setXpNotice] = useState<{
    gained: number
    alreadyCompleted: boolean
  } | null>(null)

  const currentStageIndex = STAGE_LABELS.findIndex((s) => s.key === step)
  const selectedFirstOption =
    scenario.firstQuestion.options.find((opt) => opt.letter === firstChoice) ?? null
  const selectedSecondOption =
    scenario.secondQuestion.options.find((opt) => opt.letter === secondChoice) ?? null

  const correctFirstOption = scenario.firstQuestion.options.find(
    (opt) => opt.letter === scenario.firstQuestion.correctLetter
  )!
  const correctSecondOption = scenario.secondQuestion.options.find(
    (opt) => opt.letter === scenario.secondQuestion.correctLetter
  )!

  const scrollToPracticeTop = () => {
    const el = document.getElementById('practice')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Шаг 1 -> Шаг 2 (последствия, БЕЗ раскрытия правильности и номера статьи)
  const handleConfirmFirstChoice = () => {
    if (!firstChoice) return
    setStep('consequence1')
    scrollToPracticeTop()
  }

  // Шаг 2 -> Шаг 3 (новые обстоятельства и второй вопрос)
  const handleProceedToSecondQuestion = () => {
    setStep('decision2')
    scrollToPracticeTop()
  }

  // Шаг 3 -> Шаг 4 (итоговое юридическое заключение + однократное начисление XP)
  const handleConfirmSecondChoice = () => {
    if (!firstChoice || !secondChoice) return

    const firstOk = firstChoice === scenario.firstQuestion.correctLetter
    const secondOk = secondChoice === scenario.secondQuestion.correctLetter
    const score = (firstOk ? 1 : 0) + (secondOk ? 1 : 0)

    const award = onCompleteCase(scenario.id, score)
    setXpNotice({
      gained: award.xpGainedNow,
      alreadyCompleted: award.alreadyCompleted,
    })
    setStep('conclusion')
    scrollToPracticeTop()
  }

  // Повторное прохождение этого же дела
  const handleRestartCase = () => {
    setStep('decision1')
    setFirstChoice(null)
    setSecondChoice(null)
    setXpNotice(null)
    scrollToPracticeTop()
  }

  const isFirstCorrect = firstChoice === scenario.firstQuestion.correctLetter
  const isSecondCorrect = secondChoice === scenario.secondQuestion.correctLetter
  const finalScore = (isFirstCorrect ? 1 : 0) + (isSecondCorrect ? 1 : 0)

  return (
    <div className="lc-player-container">
      {/* Верхняя панель навигации */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToCatalog}>
          <span aria-hidden="true">←</span>
          <span>Вернуться к делам</span>
        </button>
        <span className="interactive-mode-badge lc-mode-badge">
          Дело {scenario.caseNumber} · {scenario.icon} {scenario.title}
        </span>
      </div>

      {/* Индикатор этапов и прогресса дела */}
      <div className="glass-panel lc-stepper-card">
        <div className="lc-stepper-row" role="list" aria-label="Этапы прохождения дела">
          {STAGE_LABELS.map((stage, idx) => {
            const stateClass =
              idx === currentStageIndex
                ? 'is-active'
                : idx < currentStageIndex
                ? 'is-done'
                : ''
            return (
              <div key={stage.key} className={`lc-stage-item ${stateClass}`} role="listitem">
                <span className="lc-stage-num">
                  {idx < currentStageIndex ? '✓' : stage.num}
                </span>
                <span className="lc-stage-label">{stage.label}</span>
              </div>
            )
          })}
        </div>
        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill lc-progress-fill"
            style={{ width: `${((currentStageIndex + 1) / STAGE_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ЭТАП 1: Начало истории + Первый вопрос (3 варианта) */}
      {step === 'decision1' && (
        <article className="glass-panel lc-story-card">
          <div className="lc-story-header">
            <span className="lc-case-pill">
              {scenario.icon} Дело {scenario.caseNumber}
            </span>
            <span className="lc-theme-tag">{scenario.theme}</span>
          </div>

          <h3 className="lc-story-title">{scenario.title}</h3>

          <div className="lc-narrative-box">
            <span className="lc-narrative-label">Начало истории</span>
            <div className="lc-narrative-paragraphs">
              {scenario.storyIntro.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          <div className="lc-question-block">
            <span className="lc-question-step-tag">Решение 1 из 2</span>
            <h4 className="lc-question-prompt">{scenario.firstQuestion.prompt}</h4>

            <div className="lc-options-list" role="radiogroup">
              {scenario.firstQuestion.options.map((opt) => {
                const isSelected = firstChoice === opt.letter
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`lc-option-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setFirstChoice(opt.letter)}
                  >
                    <span className="lc-option-letter">{opt.letter}</span>
                    <span className="lc-option-text">{opt.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="lc-step-footer">
              <span className="lc-selection-hint">
                {firstChoice
                  ? `Выбран вариант ${firstChoice} — нажмите, чтобы увидеть последствия`
                  : 'Выберите один из трёх вариантов действий'}
              </span>
              <button
                type="button"
                className="lc-primary-btn"
                disabled={!firstChoice}
                onClick={handleConfirmFirstChoice}
              >
                <span>Посмотреть последствия</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ЭТАП 2: Последствия первого выбора (без спойлеров правильности и статьи!) */}
      {step === 'consequence1' && selectedFirstOption && (
        <article className="glass-panel lc-story-card">
          <div className="lc-story-header">
            <span className="lc-case-pill">
              {scenario.icon} Дело {scenario.caseNumber}
            </span>
            <span className="lc-theme-tag">Развитие событий</span>
          </div>

          <div className="lc-chosen-summary">
            <span className="lc-chosen-label">Ваше решение (вариант {selectedFirstOption.letter}):</span>
            <p className="lc-chosen-text">{selectedFirstOption.text}</p>
          </div>

          <div className="lc-consequence-box" role="status" aria-live="polite">
            <div className="lc-consequence-head">
              <span className="lc-consequence-icon" aria-hidden="true">
                ⚡
              </span>
              <h4 className="lc-consequence-title">Что произошло дальше</h4>
            </div>
            <p className="lc-consequence-text">{selectedFirstOption.consequence}</p>
          </div>

          <p className="lc-suspense-note">
            Полная правовая оценка обоих решений и ссылка на норму Гражданского кодекса РК откроются в итоговом заключении после второго этапа.
          </p>

          <div className="lc-step-footer lc-footer-end">
            <button
              type="button"
              className="lc-primary-btn"
              onClick={handleProceedToSecondQuestion}
            >
              <span>К новым обстоятельствам</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
      )}

      {/* ЭТАП 3: Новые обстоятельства + Второй вопрос (2 варианта) */}
      {step === 'decision2' && (
        <article className="glass-panel lc-story-card">
          <div className="lc-story-header">
            <span className="lc-case-pill">
              {scenario.icon} Дело {scenario.caseNumber}
            </span>
            <span className="lc-theme-tag">Новые обстоятельства</span>
          </div>

          <div className="lc-narrative-box lc-circumstances-box">
            <span className="lc-narrative-label">Новые обстоятельства дела</span>
            <div className="lc-narrative-paragraphs">
              {scenario.newCircumstances.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          <div className="lc-question-block">
            <span className="lc-question-step-tag">Решение 2 из 2</span>
            <h4 className="lc-question-prompt">{scenario.secondQuestion.prompt}</h4>

            <div className="lc-options-list" role="radiogroup">
              {scenario.secondQuestion.options.map((opt) => {
                const isSelected = secondChoice === opt.letter
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`lc-option-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSecondChoice(opt.letter)}
                  >
                    <span className="lc-option-letter">{opt.letter}</span>
                    <span className="lc-option-text">{opt.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="lc-step-footer">
              <span className="lc-selection-hint">
                {secondChoice
                  ? `Выбран вариант ${secondChoice}`
                  : 'Выберите один из двух вариантов ответа'}
              </span>
              <button
                type="button"
                className="lc-primary-btn"
                disabled={!secondChoice}
                onClick={handleConfirmSecondChoice}
              >
                <span>Получить юридическое заключение</span>
                <span aria-hidden="true">✓</span>
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ЭТАП 4: Отдельный экран итогового заключения (впервые раскрывается номер статьи!) */}
      {step === 'conclusion' && selectedFirstOption && selectedSecondOption && (
        <article className="glass-panel lc-conclusion-card">
          <div className="lc-conclusion-hero">
            <span className="lc-conclusion-emoji" aria-hidden="true">
              {finalScore === 2 ? '🏆' : finalScore === 1 ? '⚖️' : '📘'}
            </span>
            <div className="lc-conclusion-badges">
              <span className="lc-case-pill">
                Дело {scenario.caseNumber} завершено
              </span>
              <span className="lc-score-result-pill">
                Результат: {finalScore} из 2 верных решений
              </span>
              {xpNotice && xpNotice.gained > 0 ? (
                <span className="cw-xp-gained-pill">
                  Задание завершено! +{xpNotice.gained} XP
                </span>
              ) : (
                <span className="cw-xp-neutral-pill">
                  Вы уже получили опыт за это задание
                </span>
              )}
            </div>

            <h3 className="lc-conclusion-title">
              {scenario.icon} «{scenario.title}»
            </h3>
            <p className="lc-conclusion-verdict-sub">
              {finalScore === 2
                ? 'Отлично! Оба принятых вами решения полностью соответствуют нормам ГК РК.'
                : finalScore === 1
                ? 'Хорошая попытка! Одно из решений совпало с правовой позицией ГК РК — обратите внимание на разбор второго этапа.'
                : 'Рекомендуем внимательно изучить юридическое заключение ниже и пройти дело ещё раз.'}
            </p>
          </div>

          {/* Разбор двух принятых решений */}
          <div className="lc-decisions-review">
            <h4 className="result-review-heading">Разбор ваших решений:</h4>

            <div className="lc-decisions-grid">
              <div
                className={`review-item ${isFirstCorrect ? 'review-correct' : 'review-wrong'}`}
              >
                <div className="review-item-header">
                  <span className="review-item-num">Этап 1</span>
                  <span className="review-status-tag">
                    {isFirstCorrect ? 'Верное решение' : 'Есть ошибка'}
                  </span>
                </div>
                <p className="review-question">{scenario.firstQuestion.prompt}</p>
                <div className="review-answer-details">
                  <div>
                    <span className="review-detail-label">Ваш выбор ({selectedFirstOption.letter}): </span>
                    <span className={isFirstCorrect ? 'text-correct' : 'text-wrong'}>
                      {selectedFirstOption.text}
                    </span>
                  </div>
                  {!isFirstCorrect && (
                    <div>
                      <span className="review-detail-label">
                        Правильный вариант ({correctFirstOption.letter}):{' '}
                      </span>
                      <span className="text-correct">{correctFirstOption.text}</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`review-item ${isSecondCorrect ? 'review-correct' : 'review-wrong'}`}
              >
                <div className="review-item-header">
                  <span className="review-item-num">Этап 2</span>
                  <span className="review-status-tag">
                    {isSecondCorrect ? 'Верное решение' : 'Есть ошибка'}
                  </span>
                </div>
                <p className="review-question">{scenario.secondQuestion.prompt}</p>
                <div className="review-answer-details">
                  <div>
                    <span className="review-detail-label">Ваш выбор ({selectedSecondOption.letter}): </span>
                    <span className={isSecondCorrect ? 'text-correct' : 'text-wrong'}>
                      {selectedSecondOption.text}
                    </span>
                  </div>
                  {!isSecondCorrect && (
                    <div>
                      <span className="review-detail-label">
                        Правильный вариант ({correctSecondOption.letter}):{' '}
                      </span>
                      <span className="text-correct">{correctSecondOption.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Итоговое юридическое заключение со статьёй ГК РК и ссылкой на «Әділет» */}
          <section className="lc-legal-box">
            <div className="lc-legal-box-head">
              <span className="lc-legal-scale" aria-hidden="true">
                ⚖
              </span>
              <div>
                <span className="lc-legal-eyebrow">ИТОГОВОЕ ЮРИДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ</span>
                <h4 className="lc-legal-article-title">
                  {scenario.conclusion.articleLabel} — «{scenario.conclusion.articleTitle}»
                </h4>
              </div>
            </div>

            <div className="lc-legal-explanation">
              {scenario.conclusion.explanation.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="lc-legal-source-row">
              <a
                href={scenario.conclusion.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="adilet-source-btn"
              >
                <span>
                  Открыть {scenario.conclusion.sourceName} в системе «Әділет»
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <div className="result-actions-row">
            <button
              type="button"
              className="interactive-action-btn primary"
              onClick={handleRestartCase}
            >
              <span aria-hidden="true">🔄</span>
              <span>Пройти ещё раз</span>
            </button>
            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={onBackToCatalog}
            >
              <span>Вернуться к делам</span>
            </button>
          </div>
        </article>
      )}
    </div>
  )
}
