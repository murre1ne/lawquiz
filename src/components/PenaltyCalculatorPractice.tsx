import { useState } from 'react'
import {
  ADILET_GK_RK_URL,
  PENALTY_ACHIEVEMENT_XP_REWARD,
  PENALTY_CASES,
  formatRuNumber,
  formatTenge,
  isPenaltyAnswerCorrect,
  matchesCaseConditions,
  validateAndCalculatePenalty,
  type PenaltyCaseStudy,
} from '../data/penaltyCalculatorData'
import {
  getSolvedPenaltyCaseNumbers,
  type CrosswordProgressMap,
} from '../data/crosswordProgress'

interface PenaltyCalculatorPracticeProps {
  progressMap: CrosswordProgressMap
  onBackToPractice: () => void
  onSolveCase: (caseNumber: number) => {
    xpGainedNow: number
    alreadyCompleted: boolean
    solvedCaseNumbers: number[]
    justSolvedThisCase: boolean
    allCasesSolved: boolean
  }
}

interface CheckFeedbackState {
  status: 'correct-case' | 'correct-custom' | 'incorrect' | 'answer-error'
  message: string
  userAnswer: number | null
  expectedTotal: number
  dailyPenalty: number
  xpGainedNow?: number
  justSolvedThisCase?: boolean
  allCasesSolved?: boolean
}

export function PenaltyCalculatorPractice({
  progressMap,
  onBackToPractice,
  onSolveCase,
}: PenaltyCalculatorPracticeProps) {
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(0)
  const activeCase: PenaltyCaseStudy = PENALTY_CASES[activeCaseIndex] ?? PENALTY_CASES[0]

  const [amountInput, setAmountInput] = useState<string>(String(activeCase.amount))
  const [rateInput, setRateInput] = useState<string>(String(activeCase.rate).replace('.', ','))
  const [daysInput, setDaysInput] = useState<string>(String(activeCase.days))
  const [userAnswerInput, setUserAnswerInput] = useState<string>('')
  const [checkFeedback, setCheckFeedback] = useState<CheckFeedbackState | null>(null)
  const [showLiveAutoResult, setShowLiveAutoResult] = useState<boolean>(false)

  const solvedCaseNumbers = getSolvedPenaltyCaseNumbers(progressMap)
  const solvedCount = solvedCaseNumbers.length
  const totalCases = PENALTY_CASES.length
  const allAchievementDone = solvedCount >= totalCases
  const isCurrentCaseSolved = solvedCaseNumbers.includes(activeCase.caseNumber)

  // Автоматический расчёт при каждом изменении исходных параметров
  const validation = validateAndCalculatePenalty(amountInput, rateInput, daysInput)
  const calc = validation.calculation
  const isUsingOriginalConditions = calc !== null && matchesCaseConditions(activeCase, calc)

  // Авторасчёт открыт сразу при пользовательских параметрах, после проверки или по переключателю
  const shouldRevealCalculation =
    calc !== null &&
    (!isUsingOriginalConditions || checkFeedback !== null || showLiveAutoResult || isCurrentCaseSolved)

  const loadCaseDefaults = (targetCase: PenaltyCaseStudy) => {
    setAmountInput(String(targetCase.amount))
    setRateInput(String(targetCase.rate).replace('.', ','))
    setDaysInput(String(targetCase.days))
    setUserAnswerInput('')
    setCheckFeedback(null)
    setShowLiveAutoResult(false)
  }

  const handleSelectCase = (index: number) => {
    const nextCase = PENALTY_CASES[index]
    if (!nextCase) return
    setActiveCaseIndex(index)
    loadCaseDefaults(nextCase)
  }

  const handleParamChange = (setter: (val: string) => void) => (value: string) => {
    setter(value)
    // При изменении исходных данных сбрасываем прежний результат проверки
    setCheckFeedback(null)
  }

  const handleResetInputs = () => {
    loadCaseDefaults(activeCase)
  }

  const handleRetryAnswer = () => {
    setUserAnswerInput('')
    setCheckFeedback(null)
  }

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validation.valid || !calc) {
      setCheckFeedback({
        status: 'answer-error',
        message:
          validation.errors.general ||
          validation.errors.amount ||
          validation.errors.rate ||
          validation.errors.days ||
          'Сначала исправьте ошибки в исходных параметрах договора.',
        userAnswer: null,
        expectedTotal: 0,
        dailyPenalty: 0,
      })
      return
    }

    const answerCheck = isPenaltyAnswerCorrect(userAnswerInput, calc.totalPenalty)
    if (!answerCheck.valid) {
      setCheckFeedback({
        status: 'answer-error',
        message: answerCheck.error ?? 'Введите корректный ответ.',
        userAnswer: answerCheck.parsedAnswer,
        expectedTotal: calc.totalPenalty,
        dailyPenalty: calc.dailyPenalty,
      })
      return
    }

    if (!answerCheck.isCorrect) {
      setCheckFeedback({
        status: 'incorrect',
        message: `Ответ ${formatTenge(answerCheck.parsedAnswer ?? 0)} не совпадает с расчётной суммой пени ${formatTenge(calc.totalPenalty)}. Проверьте подстановку в формулу и попробуйте снова.`,
        userAnswer: answerCheck.parsedAnswer,
        expectedTotal: calc.totalPenalty,
        dailyPenalty: calc.dailyPenalty,
      })
      return
    }

    if (!isUsingOriginalConditions) {
      setCheckFeedback({
        status: 'correct-custom',
        message: `Верно! Для введённых вами параметров пеня составляет ${formatTenge(calc.totalPenalty)}. Чтобы засчитать «${activeCase.code}» в прогресс достижения, сбросьте параметры к исходным условиям дела и проверьте ответ.`,
        userAnswer: answerCheck.parsedAnswer,
        expectedTotal: calc.totalPenalty,
        dailyPenalty: calc.dailyPenalty,
      })
      return
    }

    // Верный ответ по исходным условиям учебного дела -> фиксируем прогресс и проверяем достижение
    const res = onSolveCase(activeCase.caseNumber)
    const msg =
      res.xpGainedNow > 0
        ? `Отлично! Правильный расчёт — ${formatTenge(calc.totalPenalty)}. Все 3 дела решены: открыто достижение «Мастер юридических расчётов» (+${res.xpGainedNow} XP)!`
        : res.allCasesSolved
        ? `Верно! Расчёт для «${activeCase.code}» подтверждён — ${formatTenge(calc.totalPenalty)}. Все 3 дела уже решены, награда +${PENALTY_ACHIEVEMENT_XP_REWARD} XP ранее получена.`
        : res.justSolvedThisCase
        ? `Верно! Сумма договорной неустойки по «${activeCase.code}» составляет ${formatTenge(calc.totalPenalty)}. Прогресс сохранён: решено ${res.solvedCaseNumbers.length} из ${totalCases} дел.`
        : `Верно! Сумма договорной неустойки по «${activeCase.code}» составляет ${formatTenge(calc.totalPenalty)}. Это дело уже засчитано ранее.`

    setCheckFeedback({
      status: 'correct-case',
      message: msg,
      userAnswer: answerCheck.parsedAnswer,
      expectedTotal: calc.totalPenalty,
      dailyPenalty: calc.dailyPenalty,
      xpGainedNow: res.xpGainedNow,
      justSolvedThisCase: res.justSolvedThisCase,
      allCasesSolved: res.allCasesSolved,
    })
  }

  const nextUnsolvedIndex = PENALTY_CASES.findIndex(
    (item) => item.caseNumber !== activeCase.caseNumber && !solvedCaseNumbers.includes(item.caseNumber)
  )

  return (
    <div className="penalty-calc-wrapper">
      {/* Панель прогресса достижения «Мастер юридических расчётов» */}
      <div className={`penalty-ach-banner ${allAchievementDone ? 'is-completed' : ''}`}>
        <div className="penalty-ach-banner-left">
          <span className="penalty-ach-icon" aria-hidden="true">
            🧮
          </span>
          <div className="penalty-ach-copy">
            <div className="penalty-ach-topline">
              <strong className="penalty-ach-title">Мастер юридических расчётов</strong>
              <span className="penalty-ach-xp-pill">+{PENALTY_ACHIEVEMENT_XP_REWARD} XP</span>
              <span className="ach2-rarity-badge rarity-rare">Редкое</span>
            </div>
            <p className="penalty-ach-subtitle">
              {allAchievementDone
                ? 'Все три учебных дела решены правильно — достижение получено!'
                : `Правильно рассчитайте неустойку во всех трёх делах. Решено ${solvedCount} из ${totalCases} дел.`}
            </p>
          </div>
        </div>

        <div className="penalty-ach-progress-wrap">
          <span className="penalty-ach-counter">
            {allAchievementDone ? 'Выполнено ✓' : `Решено ${solvedCount} из ${totalCases}`}
          </span>
          <div
            className="penalty-ach-track"
            role="progressbar"
            aria-valuenow={Math.round((solvedCount / totalCases) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Прогресс достижения: решено ${solvedCount} из ${totalCases} дел`}
          >
            <div
              className="penalty-ach-fill"
              style={{ width: `${Math.round((solvedCount / totalCases) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Переключатель трёх учебных ситуаций */}
      <div className="penalty-case-tabs" role="tablist" aria-label="Учебные ситуации расчёта неустойки">
        {PENALTY_CASES.map((item, idx) => {
          const solved = solvedCaseNumbers.includes(item.caseNumber)
          const isActive = idx === activeCaseIndex
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`penalty-case-tab ${isActive ? 'is-active' : ''} ${
                solved ? 'is-solved' : ''
              }`}
              onClick={() => handleSelectCase(idx)}
            >
              <div className="penalty-case-tab-top">
                <span className="penalty-case-code">{item.code}</span>
                <span className={`penalty-case-status ${solved ? 'status-done' : ''}`}>
                  {solved ? 'Решено ✓' : 'Ожидает расчёта'}
                </span>
              </div>
              <span className="penalty-case-tab-title">{item.title}</span>
            </button>
          )
        })}
      </div>

      {/* Основная рабочая область калькулятора */}
      <div className="penalty-workspace-grid">
        {/* Левая колонка: фабула, поля параметров и форма проверки ответа */}
        <div className="penalty-main-col">
          {/* Описание учебной ситуации */}
          <article className="penalty-card penalty-case-card">
            <div className="penalty-card-header">
              <span className="penalty-badge-tag">{activeCase.code}</span>
              {isCurrentCaseSolved && (
                <span className="penalty-solved-chip">Решено верно ✓</span>
              )}
            </div>
            <h2 className="penalty-case-heading">{activeCase.title}</h2>
            <p className="penalty-case-text">{activeCase.circumstances}</p>

            <div className="penalty-contract-terms">
              <h3 className="penalty-terms-title">Условия договора (учебные):</h3>
              <ul className="penalty-terms-list">
                <li>
                  <span>Сумма обязательства</span>
                  <strong>{formatTenge(activeCase.amount)}</strong>
                </li>
                <li>
                  <span>Договорная пеня за каждый день просрочки</span>
                  <strong>{formatRuNumber(activeCase.rate, 4)}%</strong>
                </li>
                <li>
                  <span>Количество дней просрочки</span>
                  <strong>{activeCase.days} дн.</strong>
                </li>
              </ul>
            </div>
          </article>

          {/* Форма параметров и ввода собственного ответа */}
          <form className="penalty-card penalty-form-card" onSubmit={handleCheckAnswer} noValidate>
            <div className="penalty-form-head">
              <div>
                <h3 className="penalty-section-title">Параметры расчёта</h3>
                <p className="penalty-section-hint">
                  Калькулятор пересчитывает формулу автоматически при изменении исходных данных.
                </p>
              </div>
              <button
                type="button"
                className="penalty-secondary-btn"
                onClick={handleResetInputs}
              >
                <span aria-hidden="true">↺</span>
                <span>Сбросить исходные данные</span>
              </button>
            </div>

            {!isUsingOriginalConditions && validation.valid && (
              <div className="penalty-custom-notice" role="status">
                <span>
                  Вы изменили исходные условия договора — включён режим свободного расчёта. Чтобы засчитать {activeCase.code} в достижение, нажмите «Сбросить исходные данные».
                </span>
              </div>
            )}

            <div className="penalty-inputs-grid">
              <div className={`penalty-field ${validation.errors.amount ? 'has-error' : ''}`}>
                <label htmlFor="penalty-amount-input">Сумма обязательства (₸)</label>
                <input
                  id="penalty-amount-input"
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => handleParamChange(setAmountInput)(e.target.value)}
                  placeholder="Например, 120000"
                  aria-invalid={Boolean(validation.errors.amount)}
                />
                {validation.errors.amount && (
                  <span className="penalty-field-error" role="alert">
                    {validation.errors.amount}
                  </span>
                )}
              </div>

              <div className={`penalty-field ${validation.errors.rate ? 'has-error' : ''}`}>
                <label htmlFor="penalty-rate-input">Ставка пени (% в день)</label>
                <input
                  id="penalty-rate-input"
                  type="text"
                  inputMode="decimal"
                  value={rateInput}
                  onChange={(e) => handleParamChange(setRateInput)(e.target.value)}
                  placeholder="Например, 0,1"
                  aria-invalid={Boolean(validation.errors.rate)}
                />
                {validation.errors.rate && (
                  <span className="penalty-field-error" role="alert">
                    {validation.errors.rate}
                  </span>
                )}
              </div>

              <div className={`penalty-field ${validation.errors.days ? 'has-error' : ''}`}>
                <label htmlFor="penalty-days-input">Дней просрочки</label>
                <input
                  id="penalty-days-input"
                  type="text"
                  inputMode="numeric"
                  value={daysInput}
                  onChange={(e) => handleParamChange(setDaysInput)(e.target.value)}
                  placeholder="Например, 6"
                  aria-invalid={Boolean(validation.errors.days)}
                />
                {validation.errors.days && (
                  <span className="penalty-field-error" role="alert">
                    {validation.errors.days}
                  </span>
                )}
              </div>
            </div>

            {validation.errors.general && (
              <div className="penalty-alert penalty-alert--error" role="alert">
                {validation.errors.general}
              </div>
            )}

            {calc?.hasZeroFactor && (
              <div className="penalty-alert penalty-alert--info" role="status">
                При нулевой сумме, нулевой ставке или 0 днях просрочки договорная неустойка равна 0 ₸.
              </div>
            )}

            {/* Поле самостоятельного ввода ответа */}
            <div className="penalty-answer-box">
              <label htmlFor="penalty-user-answer" className="penalty-answer-label">
                Ваш расчёт суммы договорной неустойки (₸)
              </label>
              <div className="penalty-answer-row">
                <input
                  id="penalty-user-answer"
                  type="text"
                  inputMode="decimal"
                  className="penalty-answer-input"
                  value={userAnswerInput}
                  onChange={(e) => {
                    setUserAnswerInput(e.target.value)
                    if (checkFeedback) setCheckFeedback(null)
                  }}
                  placeholder="Введите итоговую сумму в тенге..."
                />
                <button type="submit" className="primary-button penalty-submit-btn">
                  <span>Проверить ответ</span>
                  <span aria-hidden="true">✓</span>
                </button>
              </div>
            </div>

            {/* Обратная связь после проверки ответа */}
            {checkFeedback && (
              <div
                className={`penalty-feedback penalty-feedback--${checkFeedback.status}`}
                role="status"
                aria-live="polite"
              >
                <div className="penalty-feedback-head">
                  <span className="penalty-feedback-icon" aria-hidden="true">
                    {checkFeedback.status === 'correct-case' ||
                    checkFeedback.status === 'correct-custom'
                      ? '✓'
                      : '!'}
                  </span>
                  <strong>
                    {checkFeedback.status === 'correct-case'
                      ? 'Правильный расчёт!'
                      : checkFeedback.status === 'correct-custom'
                      ? 'Расчёт верен для ваших параметров'
                      : checkFeedback.status === 'answer-error'
                      ? 'Проверьте корректность ввода'
                      : 'Есть расхождение в расчёте'}
                  </strong>
                </div>
                <p className="penalty-feedback-text">{checkFeedback.message}</p>

                <div className="penalty-feedback-actions">
                  <button
                    type="button"
                    className="penalty-secondary-btn"
                    onClick={handleRetryAnswer}
                  >
                    Решить повторно
                  </button>
                  {checkFeedback.status === 'correct-case' && nextUnsolvedIndex >= 0 && (
                    <button
                      type="button"
                      className="card-action-btn primary-start-btn"
                      onClick={() => handleSelectCase(nextUnsolvedIndex)}
                    >
                      <span>Следующее дело ({PENALTY_CASES[nextUnsolvedIndex].code})</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Правая колонка: формула, пошаговый расчёт и юридическая справка по ст. 293 ГК РК */}
        <aside className="penalty-side-col">
          {/* Карточка формулы и автоматического расчёта */}
          <div className="penalty-card penalty-formula-card">
            <div className="penalty-formula-head">
              <h3 className="penalty-section-title">Формула и расчёт</h3>
              {isUsingOriginalConditions && checkFeedback === null && !isCurrentCaseSolved && (
                <button
                  type="button"
                  className="penalty-reveal-toggle"
                  onClick={() => setShowLiveAutoResult((prev) => !prev)}
                >
                  {showLiveAutoResult ? 'Скрыть итог' : 'Показать авторасчёт'}
                </button>
              )}
            </div>

            <div className="penalty-formula-box">
              <span className="penalty-formula-caption">Базовая формула</span>
              <div className="penalty-formula-expr">
                Пеня = (Сумма обязательства × Ставка × Количество дней) / 100
              </div>
            </div>

            {calc ? (
              <>
                <div className="penalty-substitution-box">
                  <span className="penalty-formula-caption">Подстановка текущих данных</span>
                  <div className="penalty-substitution-expr">
                    ({formatRuNumber(calc.amount, 2)} × {formatRuNumber(calc.rate, 4)} ×{' '}
                    {formatRuNumber(calc.days, 0)}) / 100
                    {shouldRevealCalculation && (
                      <>
                        {' '}
                        = <strong>{formatTenge(calc.totalPenalty)}</strong>
                      </>
                    )}
                  </div>
                </div>

                {shouldRevealCalculation ? (
                  <div className="penalty-results-grid">
                    <div className="penalty-result-metric">
                      <span className="penalty-metric-label">Пеня за 1 день просрочки</span>
                      <strong className="penalty-metric-value">
                        {formatTenge(calc.dailyPenalty)}
                      </strong>
                      <span className="penalty-metric-formula">
                        ({formatRuNumber(calc.amount, 2)} × {formatRuNumber(calc.rate, 4)}%) / 100
                      </span>
                    </div>

                    <div className="penalty-result-metric is-primary">
                      <span className="penalty-metric-label">Общая сумма пени</span>
                      <strong className="penalty-metric-value">
                        {formatTenge(calc.totalPenalty)}
                      </strong>
                      <span className="penalty-metric-formula">
                        За {calc.days} дн. просрочки (округление до 2 знаков)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="penalty-hidden-hint">
                    Введите ваш расчёт слева и нажмите «Проверить ответ», чтобы сверить пеню за 1 день и итоговую сумму (или включите «Показать авторасчёт»).
                  </div>
                )}
              </>
            ) : (
              <div className="penalty-hidden-hint">
                Исправьте некорректные значения в полях параметров — формула и расчёт обновятся автоматически.
              </div>
            )}
          </div>

          {/* Юридическая справка (ст. 293 ГК РК) */}
          <div className="penalty-card penalty-legal-card scales-levitate-card levitate-delay-4">
            <div className="penalty-legal-head">
              <span className="penalty-legal-icon" aria-hidden="true">
                ⚖
              </span>
              <div>
                <span className="penalty-legal-eyebrow">Юридическая справка</span>
                <h3 className="penalty-legal-title">
                  Правовое основание — статья 293 Гражданского кодекса Республики Казахстан
                </h3>
              </div>
            </div>

            <div className="penalty-legal-points">
              <div className="penalty-legal-point">
                <strong>Законодательное определение неустойки:</strong>
                <p>
                  Статья 293 ГК РК раскрывает общее понятие неустойки (штрафа, пени) как определённой законодательством или договором денежной суммы, которую должник обязан уплатить кредитору при неисполнении или ненадлежащем исполнении обязательства, в частности в случае просрочки исполнения.
                </p>
              </div>

              <div className="penalty-legal-point">
                <strong>Размер пени по условиям договора:</strong>
                <p>
                  Конкретная процентная ставка пени в учебных заданиях (0,1%, 0,05%, 0,2% в день) является условным примером договорного условия, согласованного сторонами, и не установлена статьёй 293 ГК РК в качестве единого обязательного тарифа.
                </p>
              </div>
            </div>

            <a
              href={ADILET_GK_RK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="penalty-adilet-link"
            >
              <span>Открыть Гражданский кодекс РК на «Әділет»</span>
              <span aria-hidden="true">↗</span>
            </a>

            <p className="penalty-disclaimer-note">
              Внимание: калькулятор предназначен исключительно для учебных целей и не заменяет индивидуальный юридический анализ конкретного договора.
            </p>
          </div>
        </aside>
      </div>

      {/* Нижняя кнопка возврата к списку инструментов практики */}
      <div className="penalty-footer-bar">
        <button
          type="button"
          className="interactive-back-btn"
          onClick={onBackToPractice}
        >
          <span aria-hidden="true">←</span>
          <span>Вернуться к разделу «Юридическая практика»</span>
        </button>
      </div>
    </div>
  )
}
