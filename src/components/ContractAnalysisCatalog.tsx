import {
  CONTRACT_ANALYSIS_LEGAL_NOTE,
  CONTRACT_ANALYSIS_NORMATIVE_TABLE,
  CONTRACT_ANALYSIS_XP_REWARD,
  contractAnalysisData,
  type ContractAnalysisItem,
} from '../data/contractAnalysisData'
import type { CrosswordProgressMap } from '../data/crosswordProgress'

interface ContractAnalysisCatalogProps {
  progressMap: CrosswordProgressMap
  onSelectContract: (contract: ContractAnalysisItem) => void
  onBackToPractice: () => void
}

export function ContractAnalysisCatalog({
  progressMap,
  onSelectContract,
  onBackToPractice,
}: ContractAnalysisCatalogProps) {
  const totalContracts = contractAnalysisData.length
  const completedCount = contractAnalysisData.filter(
    (contract) => progressMap[contract.id]?.completed
  ).length
  const totalEarnedXp = contractAnalysisData.reduce(
    (sum, contract) => sum + (progressMap[contract.id]?.xpEarned ?? 0),
    0
  )
  const maxXp = totalContracts * CONTRACT_ANALYSIS_XP_REWARD

  return (
    <div className="can-catalog-container">
      {/* Верхняя панель навигации */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToPractice}>
          <span aria-hidden="true">←</span>
          <span>К разделу «Юридическая практика»</span>
        </button>
        <div className="cw-catalog-badges">
          <span className="interactive-mode-badge can-mode-badge">
            Пошаговый разбор договоров · {completedCount} / {totalContracts}
          </span>
          <span className="cw-xp-summary-pill">
            ★ {totalEarnedXp} / {maxXp} XP
          </span>
        </div>
      </div>

      {/* Интро-карточка каталога */}
      <div className="glass-panel can-catalog-intro">
        <div className="can-catalog-intro-copy">
          <span className="can-format-pill">Образовательный разбор · Без тестов и оценок</span>
          <h3 className="can-catalog-title">Пошаговый разбор договоров</h3>
          <p className="can-catalog-desc">
            Последовательно изучите содержание четырёх учебных договоров по Гражданскому кодексу Республики Казахстан. В каждом договоре разобраны пять ключевых условий: фрагмент документа, юридическое объяснение простыми словами, главный вывод и правовая основа.
          </p>
        </div>

        <div className="can-catalog-progress-box">
          <div className="can-catalog-progress-head">
            <span>Изучено договоров</span>
            <strong>
              {completedCount} из {totalContracts}
            </strong>
          </div>
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill can-progress-fill"
              style={{ width: `${(completedCount / totalContracts) * 100}%` }}
            />
          </div>
          <span className="can-catalog-progress-note">
            {completedCount >= totalContracts
              ? 'Все 4 учебных договора успешно изучены!'
              : `Прогресс каждого договора сохраняется автоматически — можно вернуться с последнего этапа.`}
          </span>
        </div>
      </div>

      {/* Сетка из 4 учебных договоров */}
      <div className="can-catalog-grid">
        {contractAnalysisData.map((contract, idx) => {
          const prog = progressMap[contract.id]
          const totalSteps = contract.steps.length
          const isCompleted = prog?.completed ?? false
          const hasStarted = !isCompleted && typeof prog?.currentStep === 'number'
          const currentStepNum = hasStarted
            ? Math.min((prog.currentStep ?? 0) + 1, totalSteps)
            : 0
          const openedStagesCount = isCompleted
            ? totalSteps
            : hasStarted
            ? Math.min((prog.maxUnlockedStep ?? prog.currentStep ?? 0) + 1, totalSteps)
            : 0

          const ctaLabel = isCompleted
            ? 'Повторить разбор'
            : hasStarted
            ? 'Продолжить'
            : 'Изучить договор'

          return (
            <article
              key={contract.id}
              className={`edu-card can-contract-card can-tone-${idx % 4}`}
              onClick={() => onSelectContract(contract)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectContract(contract)
                }
              }}
              aria-label={`${contract.contractLabel}: ${contract.title} — ${ctaLabel}`}
            >
              <div className="card-topline">
                <span className="card-icon-badge can-emoji-badge" aria-hidden="true">
                  {contract.icon}
                </span>
                <span className="card-pill-tag">{contract.contractLabel}</span>
              </div>

              <div className="can-card-doc-meta">
                <span>{contract.docTitle}</span>
              </div>

              <h4 className="card-heading">{contract.title}</h4>
              <p className="edu-card-desc">{contract.shortDescription}</p>

              <div className="can-card-theme-box">
                <span className="can-card-theme-label">Основная тематика:</span>
                <span className="can-card-theme-value">{contract.theme}</span>
              </div>

              {/* Индикатор прохождения по 5 этапам */}
              <div className="can-card-progress-wrap">
                <div className="can-card-meta-row">
                  <span className="cw-meta-chip">{totalSteps} этапов</span>
                  <span
                    className={`cw-status-badge ${
                      isCompleted
                        ? 'cw-status-done'
                        : hasStarted
                        ? 'cw-status-progress'
                        : 'cw-status-idle'
                    }`}
                  >
                    {isCompleted
                      ? `Изучено · ${totalSteps}/${totalSteps}`
                      : hasStarted
                      ? `Этап ${currentStepNum} из ${totalSteps}`
                      : 'Не начат'}
                  </span>
                </div>

                <div
                  className="can-mini-segments"
                  role="img"
                  aria-label={`Открыто этапов: ${openedStagesCount} из ${totalSteps}`}
                >
                  {contract.steps.map((st, sIdx) => (
                    <span
                      key={st.stepNumber}
                      className={`can-mini-seg ${
                        isCompleted
                          ? 'is-complete'
                          : sIdx < openedStagesCount
                          ? 'is-opened'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="card-action-row">
                <button
                  type="button"
                  className="card-action-btn primary-start-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectContract(contract)
                  }}
                >
                  <span>{ctaLabel}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Нормативные источники раздела */}
      <div className="glass-panel can-sources-panel">
        <div className="can-sources-head">
          <span className="can-sources-icon" aria-hidden="true">
            ⚖
          </span>
          <div>
            <h4 className="can-sources-title">Нормативные источники раздела</h4>
            <p className="can-sources-sub">
              Все ситуации, участники и суммы являются вымышленными учебными примерами.
            </p>
          </div>
        </div>

        <div className="can-sources-links">
          {CONTRACT_ANALYSIS_NORMATIVE_TABLE.map((row) => (
            <a
              key={row.url}
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="can-source-card-link"
            >
              <div className="can-source-card-main">
                <strong>{row.act}</strong>
                <span className="can-source-card-date">{row.dateAndNumber}</span>
              </div>
              <span className="can-source-card-arrow" aria-hidden="true">
                ИПС «Әділет» ↗
              </span>
            </a>
          ))}
        </div>

        <p className="can-legal-footnote">{CONTRACT_ANALYSIS_LEGAL_NOTE}</p>
      </div>
    </div>
  )
}
