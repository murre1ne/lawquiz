import { useEffect, useRef, useState } from 'react'
import {
  CONTRACT_ANALYSIS_COMPLETION_SCREEN,
  CONTRACT_ANALYSIS_LEGAL_NOTE,
  type ContractAnalysisItem,
} from '../data/contractAnalysisData'
import type { CrosswordPuzzleProgress } from '../data/crosswordProgress'

interface ContractAnalysisViewerProps {
  contract: ContractAnalysisItem
  progress?: CrosswordPuzzleProgress
  nextContract: ContractAnalysisItem | null
  onBackToCatalog: () => void
  onSelectContract: (contract: ContractAnalysisItem) => void
  onSaveStep: (contractId: string, stepIndex: number, maxUnlockedStep: number) => void
  onCompleteContract: (
    contractId: string,
    totalSteps: number
  ) => { xpGainedNow: number; alreadyCompleted: boolean }
}

export function ContractAnalysisViewer({
  contract,
  progress,
  nextContract,
  onBackToCatalog,
  onSelectContract,
  onSaveStep,
  onCompleteContract,
}: ContractAnalysisViewerProps) {
  const totalSteps = contract.steps.length

  const clampedInitialStep = Math.min(
    Math.max(progress?.currentStep ?? 0, 0),
    totalSteps - 1
  )
  const initialMaxUnlocked = progress?.completed
    ? totalSteps - 1
    : Math.min(
        Math.max(progress?.maxUnlockedStep ?? 0, clampedInitialStep),
        totalSteps - 1
      )

  const [stepIndex, setStepIndex] = useState<number>(clampedInitialStep)
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(initialMaxUnlocked)
  const [showSituation, setShowSituation] = useState<boolean>(clampedInitialStep === 0)
  const [showCompletion, setShowCompletion] = useState<boolean>(false)
  const [xpNotice, setXpNotice] = useState<{
    gained: number
    alreadyCompleted: boolean
  } | null>(null)

  const didInitPersist = useRef(false)

  // Фиксируем начало изучения при первом открытии договора, чтобы при возврате
  // каталог сразу отображал статус «Продолжить» и сохранял текущий этап.
  useEffect(() => {
    if (didInitPersist.current) return
    didInitPersist.current = true
    if (typeof progress?.currentStep !== 'number') {
      onSaveStep(contract.id, clampedInitialStep, initialMaxUnlocked)
    }
  }, [clampedInitialStep, contract.id, initialMaxUnlocked, onSaveStep, progress?.currentStep])

  const currentStep = contract.steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === totalSteps - 1

  const scrollToPracticeTop = () => {
    const el = document.getElementById('practice')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleGoToStep = (targetIdx: number) => {
    // Запрещаем перескакивать на ещё не открытые этапы
    if (targetIdx < 0 || targetIdx >= totalSteps || targetIdx > maxUnlockedStep) return
    setStepIndex(targetIdx)
    onSaveStep(contract.id, targetIdx, maxUnlockedStep)
    scrollToPracticeTop()
  }

  const handlePrevStep = () => {
    if (isFirstStep) return
    const prevIdx = stepIndex - 1
    // Возвращение на предыдущий этап НЕ сбрасывает статус открытых этапов
    setStepIndex(prevIdx)
    onSaveStep(contract.id, prevIdx, maxUnlockedStep)
    scrollToPracticeTop()
  }

  const handleNextOrFinish = () => {
    if (!isLastStep) {
      const nextIdx = stepIndex + 1
      const nextMax = Math.max(maxUnlockedStep, nextIdx)
      setStepIndex(nextIdx)
      setMaxUnlockedStep(nextMax)
      setShowSituation(false)
      onSaveStep(contract.id, nextIdx, nextMax)
      scrollToPracticeTop()
      return
    }

    // Завершение пятого этапа -> отдельный завершающий экран
    const res = onCompleteContract(contract.id, totalSteps)
    setMaxUnlockedStep(totalSteps - 1)
    setXpNotice({
      gained: res.xpGainedNow,
      alreadyCompleted: res.alreadyCompleted,
    })
    setShowCompletion(true)
    scrollToPracticeTop()
  }

  const handleRepeatContract = () => {
    const preservedMax = Math.max(maxUnlockedStep, totalSteps - 1)
    setShowCompletion(false)
    setStepIndex(0)
    setShowSituation(true)
    onSaveStep(contract.id, 0, preservedMax)
    scrollToPracticeTop()
  }

  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100)

  return (
    <div className="can-viewer-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToCatalog}>
          <span aria-hidden="true">←</span>
          <span>Вернуться к договорам</span>
        </button>
        <span className="interactive-mode-badge can-mode-badge">
          {contract.contractLabel} · {contract.icon} {contract.title}
        </span>
      </div>

      {!showCompletion ? (
        <>
          {/* Шапка договора и индикатор 5 этапов */}
          <div className="glass-panel can-header-card">
            <div className="can-header-top">
              <div className="can-header-title-group">
                <div className="can-header-pills">
                  <span className="can-contract-num-pill">{contract.contractLabel}</span>
                  <span className="can-doc-id-pill">{contract.docTitle}</span>
                  <span className="can-theme-pill">{contract.theme}</span>
                </div>
                <h3 className="can-viewer-title">{contract.title}</h3>
              </div>

              <div className="can-step-counter-box" aria-live="polite">
                <span className="can-step-counter-label">Текущий этап</span>
                <strong className="can-step-counter-val">
                  Этап {stepIndex + 1} из {totalSteps}
                </strong>
              </div>
            </div>

            {/* Общая полоса прогресса */}
            <div
              className="quiz-progress-track can-viewer-progress-track"
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Этап ${stepIndex + 1} из ${totalSteps}`}
            >
              <div
                className="quiz-progress-fill can-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Компактная навигация по 5 этапам (открытые — кликабельны, будущие — заблокированы) */}
            <nav
              className="can-stepper-nav"
              aria-label="Навигация по этапам разбора договора"
            >
              {contract.steps.map((st, idx) => {
                const isActive = idx === stepIndex
                const isUnlocked = idx <= maxUnlockedStep
                const isVisited =
                  isUnlocked && !isActive && (idx < maxUnlockedStep || Boolean(progress?.completed))

                return (
                  <button
                    key={st.stepNumber}
                    type="button"
                    disabled={!isUnlocked}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={
                      isUnlocked
                        ? `Перейти к этапу ${st.stepNumber}: ${st.title}`
                        : `Этап ${st.stepNumber}: ${st.title} — откроется после изучения предыдущего этапа`
                    }
                    className={`can-step-tab ${
                      isActive
                        ? 'is-active'
                        : isVisited
                        ? 'is-visited'
                        : isUnlocked
                        ? 'is-unlocked'
                        : 'is-locked'
                    }`}
                    onClick={() => handleGoToStep(idx)}
                  >
                    <span className="can-step-tab-num" aria-hidden="true">
                      {isVisited ? '✓' : isUnlocked ? st.stepNumber : '🔒'}
                    </span>
                    <span className="can-step-tab-label">{st.shortLabel}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Блок описания учебной ситуации (сворачиваемый на последующих этапах) */}
          <div className="glass-panel can-situation-card">
            <button
              type="button"
              className="can-situation-toggle"
              aria-expanded={showSituation}
              onClick={() => setShowSituation((prev) => !prev)}
            >
              <div className="can-situation-toggle-left">
                <span className="can-situation-icon" aria-hidden="true">
                  📋
                </span>
                <div>
                  <span className="can-situation-heading">Описание ситуации и участников</span>
                  <span className="can-situation-meta">{contract.cityDate}</span>
                </div>
              </div>
              <span className="can-situation-chevron" aria-hidden="true">
                {showSituation ? 'Свернуть ▲' : 'Показать ▼'}
              </span>
            </button>

            {showSituation && (
              <div className="can-situation-body">
                {contract.situation.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          {/* Основная карточка текущего этапа (3 обязательных блока + Правовая основа) */}
          <article className="glass-panel can-stage-card" key={currentStep.stepNumber}>
            <div className="can-stage-heading-row">
              <span className="can-stage-badge">Этап {currentStep.stepNumber}</span>
              <h4 className="can-stage-title">{currentStep.title}</h4>
            </div>

            {/* Блок А. Фрагмент договора (стилизация под официальный документ) */}
            <section className="can-doc-excerpt" aria-labelledby="can-doc-excerpt-label">
              <div className="can-doc-excerpt-header">
                <div className="can-doc-excerpt-brand">
                  <span className="can-doc-seal" aria-hidden="true">
                    §
                  </span>
                  <div>
                    <span id="can-doc-excerpt-label" className="can-doc-excerpt-eyebrow">
                      Фрагмент договора
                    </span>
                    <strong className="can-doc-excerpt-name">{contract.docTitle}</strong>
                  </div>
                </div>
                <div className="can-doc-excerpt-meta">
                  <span>{contract.cityDate}</span>
                  <span className="can-doc-clause-tag">
                    Условие {currentStep.stepNumber} из {totalSteps}
                  </span>
                </div>
              </div>

              <div className="can-doc-excerpt-body">
                <p className="can-doc-clause-heading">
                  {currentStep.stepNumber}. {currentStep.title}
                </p>
                <blockquote className="can-doc-quote">{currentStep.fragment}</blockquote>
              </div>
            </section>

            {/* Блок Б. Юридический разбор */}
            <section className="can-explanation-box" aria-labelledby="can-explanation-label">
              <div className="can-block-head">
                <span className="can-block-icon can-block-icon--explain" aria-hidden="true">
                  💡
                </span>
                <h5 id="can-explanation-label" className="can-block-title">
                  Юридический разбор
                </h5>
              </div>

              <div className="can-explanation-paragraphs">
                {currentStep.explanation.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}

                {currentStep.formula && (
                  <div className="can-formula-box" aria-label={`Расчёт: ${currentStep.formula}`}>
                    <code>{currentStep.formula}</code>
                  </div>
                )}

                {currentStep.explanationAfterFormula?.map((paragraph, idx) => (
                  <p key={`after-${idx}`}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Блок В. Что необходимо запомнить */}
            <section className="can-takeaway-box" aria-labelledby="can-takeaway-label">
              <div className="can-block-head">
                <span className="can-block-icon can-block-icon--takeaway" aria-hidden="true">
                  📌
                </span>
                <h5 id="can-takeaway-label" className="can-block-title">
                  Что необходимо запомнить
                </h5>
              </div>
              <p className="can-takeaway-text">
                {currentStep.takeaway.charAt(0).toUpperCase() + currentStep.takeaway.slice(1)}
              </p>
            </section>

            {/* Блок: Правовая основа (номера статей ГК РК строго здесь!) */}
            <section className="can-legal-basis-box" aria-labelledby="can-legal-label">
              <div className="can-legal-basis-main">
                <div className="can-block-head">
                  <span className="can-block-icon can-block-icon--law" aria-hidden="true">
                    ⚖
                  </span>
                  <h5 id="can-legal-label" className="can-block-title">
                    Правовая основа
                  </h5>
                </div>
                <p className="can-legal-basis-text">
                  {currentStep.legalBasis.charAt(0).toUpperCase() +
                    currentStep.legalBasis.slice(1)}
                </p>
              </div>

              <div className="can-legal-links-row">
                {currentStep.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adilet-source-btn"
                  >
                    <span>{src.label} в ИПС «Әділет»</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Нижняя пошаговая навигация: «Назад» и «Далее» / «Завершить разбор» */}
            <div className="can-nav-footer">
              <button
                type="button"
                className="can-nav-btn can-nav-btn--back"
                disabled={isFirstStep}
                onClick={handlePrevStep}
              >
                <span aria-hidden="true">←</span>
                <span>Назад</span>
              </button>

              <span className="can-nav-footer-status">
                Этап {stepIndex + 1} из {totalSteps}
              </span>

              <button
                type="button"
                className="can-nav-btn can-nav-btn--next"
                onClick={handleNextOrFinish}
              >
                <span>{isLastStep ? 'Завершить разбор' : 'Далее'}</span>
                <span aria-hidden="true">{isLastStep ? '✓' : '→'}</span>
              </button>
            </div>
          </article>
        </>
      ) : (
        /* Отдельный завершающий экран после 5-го этапа */
        <article className="glass-panel can-completion-card">
          <div className="can-completion-hero">
            <span className="can-completion-emoji" aria-hidden="true">
              📘
            </span>

            <div className="can-completion-badges">
              <span className="can-contract-num-pill">
                {contract.contractLabel} · Изучено 5 из 5 этапов
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

            <h3 className="can-completion-title">
              {CONTRACT_ANALYSIS_COMPLETION_SCREEN.heading}
            </h3>
            <p className="can-completion-lead">
              {CONTRACT_ANALYSIS_COMPLETION_SCREEN.lead}
            </p>
          </div>

          <div className="can-completion-grid">
            {/* Изученные темы */}
            <div className="can-completion-topics-box">
              <h4 className="can-completion-subhead">
                {CONTRACT_ANALYSIS_COMPLETION_SCREEN.topicsHeading}
              </h4>
              <ul className="can-completion-topics-list">
                {CONTRACT_ANALYSIS_COMPLETION_SCREEN.topics.map((topic) => (
                  <li key={topic}>
                    <span className="can-topic-check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Итог по конкретному договору */}
            <div className="can-completion-summary-box">
              <span className="can-summary-eyebrow">{contract.docTitle}</span>
              <h4 className="can-completion-subhead">{contract.summaryTitle}</h4>
              <p className="can-completion-summary-text">{contract.summaryText}</p>
              <p className="can-completion-closing">
                {CONTRACT_ANALYSIS_COMPLETION_SCREEN.closingText}
              </p>
            </div>
          </div>

          {/* Ссылки на официальные источники ГК РК */}
          <div className="can-completion-sources">
            <div className="can-legal-links-row">
              {contract.sources.map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adilet-source-btn"
                >
                  <span>Открыть {src.label} в ИПС «Әділет»</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <p className="can-legal-footnote">{CONTRACT_ANALYSIS_LEGAL_NOTE}</p>
          </div>

          {/* Три кнопки действий */}
          <div className="can-completion-actions">
            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={onBackToCatalog}
            >
              <span>Вернуться к договорам</span>
            </button>

            {nextContract && (
              <button
                type="button"
                className="interactive-action-btn primary"
                onClick={() => onSelectContract(nextContract)}
                aria-label={`Изучить следующий договор: ${nextContract.contractLabel} — ${nextContract.title}`}
              >
                <span>Изучить следующий договор</span>
                <span aria-hidden="true">→</span>
              </button>
            )}

            <button
              type="button"
              className="interactive-action-btn secondary"
              onClick={handleRepeatContract}
            >
              <span aria-hidden="true">🔄</span>
              <span>Повторить разбор</span>
            </button>
          </div>
        </article>
      )}
    </div>
  )
}
