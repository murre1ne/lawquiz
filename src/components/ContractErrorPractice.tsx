import { useRef, useState } from 'react'
import {
  contractAuditCases,
  getContractAuditGrade,
  type ContractAuditPhase,
  type ContractAuditRecord,
} from '../data/contractErrorsData'

interface ContractErrorPracticeProps {
  onBackToPractice: () => void
}

export function ContractErrorPractice({ onBackToPractice }: ContractErrorPracticeProps) {
  const [phase, setPhase] = useState<ContractAuditPhase>('intro')
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedClause, setSelectedClause] = useState<1 | 2 | 3 | 4 | null>(null)
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [records, setRecords] = useState<ContractAuditRecord[]>([])

  // Защита от повторного начисления баллов за один и тот же договор
  const scoredContractIdsRef = useRef<Set<string>>(new Set())

  const totalContracts = contractAuditCases.length
  const currentContract = contractAuditCases[currentIndex]
  const currentScore = records.filter((r) => r.isCorrect).length

  const handleStartPractice = () => {
    scoredContractIdsRef.current = new Set()
    setCurrentIndex(0)
    setSelectedClause(null)
    setIsChecked(false)
    setValidationMessage(null)
    setRecords([])
    setPhase('active')
  }

  const handleSelectClause = (clauseNum: 1 | 2 | 3 | 4) => {
    if (isChecked) return
    setSelectedClause(clauseNum)
    setValidationMessage(null)
  }

  const handleCheckAnswer = () => {
    if (isChecked) return
    if (selectedClause === null) {
      setValidationMessage('Выберите один из четырёх пунктов договора, содержащий юридическую ошибку.')
      return
    }

    setValidationMessage(null)
    setIsChecked(true)

    // Фиксируем результат договора строго один раз
    if (!scoredContractIdsRef.current.has(currentContract.id)) {
      scoredContractIdsRef.current.add(currentContract.id)
      const isCorrect = selectedClause === currentContract.errorClauseNumber
      setRecords((prev) => [
        ...prev,
        {
          contract: currentContract,
          selectedClauseNumber: selectedClause,
          isCorrect,
        },
      ])
    }
  }

  const handleNextContract = () => {
    if (currentIndex + 1 < totalContracts) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedClause(null)
      setIsChecked(false)
      setValidationMessage(null)
      const el = document.getElementById('practice')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setPhase('results')
      const el = document.getElementById('practice')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const isCurrentCorrect = isChecked && selectedClause === currentContract.errorClauseNumber
  const wrongCount = totalContracts - currentScore
  const percent = Math.round((currentScore / totalContracts) * 100)

  return (
    <div className="ca-container">
      {/* Верхняя панель навигации */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToPractice}>
          <span aria-hidden="true">←</span>
          <span>К разделу «Юридическая практика»</span>
        </button>
        <span className="interactive-mode-badge ca-mode-badge">
          Практикум: Поиск ошибок в учебном договоре
        </span>
      </div>

      {/* 1. Экран начала практики */}
      {phase === 'intro' && (
        <div className="glass-panel ca-intro-card">
          <div className="ca-intro-emblem" aria-hidden="true">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="12" />
              <line x1="11" y1="14" x2="11.01" y2="14" />
            </svg>
          </div>

          <h3 className="ca-intro-title">Поиск ошибок в учебном договоре</h3>
          <p className="ca-intro-quote">
            «Представьте, что вы юрист, которому поручили проверить договоры перед подписанием. В каждом из четырёх документов скрыта одна юридическая ошибка. Сможете ли вы найти все нарушения?»
          </p>

          <div className="ca-specs-grid">
            <div className="ca-spec-chip">
              <strong>4 учебных договора</strong>
              <span>Дарение, аренда, услуги, заём</span>
            </div>
            <div className="ca-spec-chip">
              <strong>4 пункта в каждом</strong>
              <span>Анализ текста документа</span>
            </div>
            <div className="ca-spec-chip">
              <strong>1 ошибка в договоре</strong>
              <span>По нормам ГК РК</span>
            </div>
            <div className="ca-spec-chip">
              <strong>1 балл за ответ</strong>
              <span>Максимум 4 балла</span>
            </div>
          </div>

          <p className="ca-legal-disclaimer">
            Все договоры являются учебными примерами для изучения гражданского права РК и не предназначены для заключения реальных сделок.
          </p>

          <button type="button" className="ca-start-btn" onClick={handleStartPractice}>
            <span>Начать практику</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* 2. Экран аудита текущего договора */}
      {phase === 'active' && (
        <div className="ca-workspace">
          {/* Компактный индикатор прогресса */}
          <div className="glass-panel ca-progress-bar-card">
            <div className="ca-progress-top">
              <div className="ca-progress-steps" aria-label="Прогресс по договорам">
                {contractAuditCases.map((c, idx) => {
                  const rec = records.find((r) => r.contract.id === c.id)
                  const stepClass =
                    idx === currentIndex
                      ? 'is-current'
                      : rec
                      ? rec.isCorrect
                        ? 'is-ok'
                        : 'is-err'
                      : ''
                  return (
                    <span key={c.id} className={`ca-step-dot ${stepClass}`}>
                      {idx + 1}
                    </span>
                  )
                })}
              </div>

              <div className="ca-progress-meta">
                <span>
                  Договор <strong>{currentIndex + 1}</strong> из {totalContracts}
                </span>
                <span className="ca-score-pill">
                  Баллы: {currentScore} / {totalContracts}
                </span>
              </div>
            </div>

            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill ca-progress-fill"
                style={{ width: `${((currentIndex + 1) / totalContracts) * 100}%` }}
              />
            </div>
          </div>

          {/* Лист юридического документа */}
          <article key={currentContract.id} className="ca-document-sheet">
            {/* Шапка документа */}
            <header className="ca-doc-header">
              <div className="ca-doc-top-tags">
                <span className="ca-doc-stamp">УЧЕБНЫЙ ДОКУМЕНТ НА ПРОВЕРКЕ</span>
                <span className="ca-doc-case-label">{currentContract.caseTitle}</span>
              </div>

              <h3 className="ca-doc-heading">{currentContract.documentHeading}</h3>

              <div className="ca-doc-place-date">
                <span>{currentContract.city}</span>
                <span>{currentContract.date}</span>
              </div>

              <p className="ca-doc-preamble">{currentContract.preamble}</p>
            </header>

            <div className="ca-instruction-strip">
              <span className="ca-instruction-icon" aria-hidden="true">
                ✎
              </span>
              <span>
                {isChecked
                  ? 'Проверка выполнена. Ознакомьтесь с правовым заключением ниже.'
                  : 'Внимательно прочитайте все 4 пункта документа и нажмите на тот, в котором содержится юридическая ошибка.'}
              </span>
            </div>

            {/* Четыре интерактивных пункта договора */}
            <div className="ca-clauses-list" role="radiogroup" aria-label="Пункты договора">
              {currentContract.clauses.map((clause) => {
                const isSelected = selectedClause === clause.number
                const isErrorClause = clause.number === currentContract.errorClauseNumber

                let clauseStateClass = ''
                let stateBadgeText = isSelected ? 'Выбран для проверки' : 'Нажмите, чтобы отметить'

                if (isChecked) {
                  if (isErrorClause) {
                    clauseStateClass = 'ca-clause-correct'
                    stateBadgeText = isSelected
                      ? '✓ Ошибка найдена верно'
                      : '✓ Здесь скрыта ошибка'
                  } else if (isSelected) {
                    clauseStateClass = 'ca-clause-wrong'
                    stateBadgeText = '✗ Ошибки в этом пункте нет'
                  } else {
                    clauseStateClass = 'ca-clause-muted'
                    stateBadgeText = 'Соответствует закону'
                  }
                } else if (isSelected) {
                  clauseStateClass = 'ca-clause-selected'
                }

                return (
                  <button
                    key={clause.number}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isChecked}
                    className={`ca-clause ${clauseStateClass}`}
                    onClick={() => handleSelectClause(clause.number)}
                  >
                    <div className="ca-clause-head">
                      <span className="ca-clause-title">
                        <span className="ca-clause-num">Пункт {clause.number}.</span>{' '}
                        {clause.title}
                      </span>
                      <span className="ca-clause-badge">{stateBadgeText}</span>
                    </div>
                    <p className="ca-clause-text">{clause.text}</p>
                  </button>
                )
              })}
            </div>

            {/* Панель проверки до нажатия «Проверить ответ» */}
            {!isChecked && (
              <div className="ca-doc-actions">
                {validationMessage && (
                  <p className="ca-validation-msg" role="alert">
                    {validationMessage}
                  </p>
                )}
                <div className="ca-action-bar">
                  <span className="ca-selected-hint">
                    {selectedClause !== null
                      ? `Выбран Пункт ${selectedClause} — можно изменить выбор до проверки`
                      : 'Пункт ещё не выбран'}
                  </span>
                  <button
                    type="button"
                    className="ca-check-btn"
                    onClick={handleCheckAnswer}
                  >
                    <span>Проверить ответ</span>
                    <span aria-hidden="true">✓</span>
                  </button>
                </div>
              </div>
            )}

            {/* Правовое заключение после проверки */}
            {isChecked && (
              <section
                className={`ca-analysis-card ${
                  isCurrentCorrect ? 'ca-analysis-ok' : 'ca-analysis-err'
                }`}
                aria-live="polite"
              >
                <div className="ca-analysis-header">
                  <span className="ca-analysis-icon" aria-hidden="true">
                    {isCurrentCorrect ? '✓' : '✗'}
                  </span>
                  <div className="ca-analysis-headline">
                    <strong className="ca-analysis-verdict">
                      {isCurrentCorrect
                        ? 'Верно! Юридическая ошибка определена точно (+1 балл)'
                        : `Неверно. Вы выбрали Пункт ${selectedClause}, а ошибка содержится в Пункте ${currentContract.errorClauseNumber}`}
                    </strong>
                    <div className="ca-analysis-tags">
                      <span className="ca-tag-clause">
                        Ошибочный пункт: Пункт {currentContract.errorClauseNumber}
                      </span>
                      <span className="ca-tag-article">
                        {currentContract.articleLabel} — «{currentContract.articleTitle}»
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ca-analysis-body">
                  {currentContract.explanation.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>

                <div className="ca-fix-box">
                  <span className="ca-fix-label">Как исправить договор:</span>
                  <p className="ca-fix-text">{currentContract.howToFix}</p>
                </div>

                <div className="ca-analysis-footer">
                  <a
                    href={currentContract.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="feedback-adilet-link"
                  >
                    <span>
                      Открыть {currentContract.sourceName} на «Әділет» (
                      {currentContract.articleLabel})
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>

                  <button
                    type="button"
                    className="quiz-next-btn"
                    onClick={handleNextContract}
                  >
                    <span>
                      {currentIndex + 1 < totalContracts
                        ? 'Следующий договор'
                        : 'Посмотреть итоги практики'}
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </section>
            )}
          </article>
        </div>
      )}

      {/* 3. Итоговый экран */}
      {phase === 'results' && (
        <div className="glass-panel ca-results-card">
          <div className="ca-results-header">
            <span className="result-trophy-icon" aria-hidden="true">
              {currentScore === 4 ? '🏆' : currentScore >= 3 ? '⚖️' : '📘'}
            </span>
            <h3 className="result-title">{getContractAuditGrade(currentScore)}</h3>
            <p className="result-subtitle">
              Аудит четырёх учебных договоров завершён. Ниже приведены ваши итоги и краткая сводка по каждому документу.
            </p>
          </div>

          <div className="ca-results-metrics">
            <div className="ca-metric-box metric-score">
              <span className="ca-metric-val">
                {currentScore} / {totalContracts}
              </span>
              <span className="ca-metric-lbl">Итоговый балл</span>
            </div>
            <div className="ca-metric-box metric-percent">
              <span className="ca-metric-val">{percent}%</span>
              <span className="ca-metric-lbl">Точность</span>
            </div>
            <div className="ca-metric-box metric-ok">
              <span className="ca-metric-val">{currentScore}</span>
              <span className="ca-metric-lbl">Правильных</span>
            </div>
            <div className="ca-metric-box metric-err">
              <span className="ca-metric-val">{wrongCount}</span>
              <span className="ca-metric-lbl">Неправильных</span>
            </div>
          </div>

          {/* Сводка по всем 4 договорам */}
          <div className="ca-results-review">
            <h4 className="result-review-heading">Сводка проверенных договоров:</h4>
            <div className="ca-results-list">
              {records.map((rec) => (
                <div
                  key={rec.contract.id}
                  className={`review-item ${rec.isCorrect ? 'review-correct' : 'review-wrong'}`}
                >
                  <div className="review-item-header">
                    <span className="review-item-num">Договор №{rec.contract.order}</span>
                    <span className="review-status-tag">
                      {rec.isCorrect ? 'Верно (+1 балл)' : 'Ошибка (0 баллов)'}
                    </span>
                    <span className="review-article">{rec.contract.articleLabel}</span>
                  </div>
                  <p className="review-question">{rec.contract.caseTitle}</p>
                  <div className="review-answer-details">
                    <div>
                      <span className="review-detail-label">Ваш выбор: </span>
                      <span className={rec.isCorrect ? 'text-correct' : 'text-wrong'}>
                        Пункт {rec.selectedClauseNumber}
                      </span>
                    </div>
                    <div>
                      <span className="review-detail-label">Ошибочный пункт: </span>
                      <span className="text-correct">
                        Пункт {rec.contract.errorClauseNumber} ({rec.contract.articleLabel} — «
                        {rec.contract.articleTitle}»)
                      </span>
                    </div>
                    <div>
                      <span className="review-detail-label">Исправление: </span>
                      <span>{rec.contract.howToFix}</span>
                    </div>
                  </div>
                  <div className="cw-review-source-row">
                    <a
                      href={rec.contract.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="feedback-adilet-link"
                    >
                      <span>Читать норму на «Әділет» ({rec.contract.articleLabel})</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="ca-legal-disclaimer">
            Учебные материалы носят образовательный характер и не заменяют профессиональную юридическую консультацию.
          </p>

          <div className="result-actions-row">
            <button
              type="button"
              className="interactive-action-btn primary"
              onClick={handleStartPractice}
            >
              <span aria-hidden="true">🔄</span>
              <span>Пройти заново</span>
            </button>
            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={onBackToPractice}
            >
              <span>Вернуться в юридическую практику</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
