import {
  LEGAL_CASE_XP_REWARD,
  legalCasesData,
  type LegalCaseScenario,
} from '../data/legalCasesData'
import type { CrosswordProgressMap } from '../data/crosswordProgress'

interface LegalCasesCatalogProps {
  progressMap: CrosswordProgressMap
  onSelectCase: (scenario: LegalCaseScenario) => void
  onBackToPractice: () => void
}

export function LegalCasesCatalog({
  progressMap,
  onSelectCase,
  onBackToPractice,
}: LegalCasesCatalogProps) {
  const completedCount = legalCasesData.filter((c) => progressMap[c.id]?.completed).length
  const totalEarnedXp = legalCasesData.reduce(
    (sum, c) => sum + (progressMap[c.id]?.xpEarned ?? 0),
    0
  )
  const maxXp = legalCasesData.length * LEGAL_CASE_XP_REWARD

  return (
    <div className="lc-catalog-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToPractice}>
          <span aria-hidden="true">←</span>
          <span>К разделу «Юридическая практика»</span>
        </button>
        <div className="cw-catalog-badges">
          <span className="interactive-mode-badge lc-mode-badge">
            Выбери развитие событий · {completedCount} / {legalCasesData.length}
          </span>
          <span className="cw-xp-summary-pill">
            ★ {totalEarnedXp} / {maxXp} XP
          </span>
        </div>
      </div>

      {/* Интро-блок каталога дел */}
      <div className="glass-panel lc-catalog-intro">
        <div className="lc-catalog-intro-copy">
          <h3 className="lc-catalog-title">Выбери развитие событий</h3>
          <p className="lc-catalog-desc">
            Принимай юридические решения и смотри, к чему они приводят. В каждом деле тебя ждут две развилки и итоговое правовое заключение по Гражданскому кодексу РК. Пройди все 4 дела, чтобы открыть достижение «Мастер правовых решений».
          </p>
        </div>

        <div className="lc-catalog-progress-box">
          <div className="lc-catalog-progress-head">
            <span>Пройдено дел</span>
            <strong>
              {completedCount} из {legalCasesData.length}
            </strong>
          </div>
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill lc-progress-fill"
              style={{ width: `${(completedCount / legalCasesData.length) * 100}%` }}
            />
          </div>
          <span className="lc-catalog-ach-hint">
            {completedCount >= legalCasesData.length
              ? '🏆 Достижение «Мастер правовых решений» открыто!'
              : `Осталось дел до достижения: ${legalCasesData.length - completedCount}`}
          </span>
        </div>
      </div>

      {/* Сетка из 4 дел (без раскрытия номеров статей!) */}
      <div className="lc-catalog-grid">
        {legalCasesData.map((scenario, idx) => {
          const prog = progressMap[scenario.id]
          const isCompleted = prog?.completed ?? false
          const bestScore = prog?.bestScore ?? 0

          return (
            <article
              key={scenario.id}
              className={`edu-card lc-case-card lc-tone-${idx % 4}`}
              onClick={() => onSelectCase(scenario)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectCase(scenario)
                }
              }}
              aria-label={`Открыть дело ${scenario.caseNumber}: ${scenario.title}`}
            >
              <div className="card-topline">
                <span className="card-icon-badge lc-emoji-badge" aria-hidden="true">
                  {scenario.icon}
                </span>
                <span className="card-pill-tag">Дело {scenario.caseNumber}</span>
              </div>

              <h4 className="card-heading">{scenario.title}</h4>
              <p className="edu-card-desc">{scenario.shortDescription}</p>

              <div className="lc-card-legal-area">
                <span className="lc-legal-area-label">Правовая основа:</span>
                <span className="lc-legal-area-val">{scenario.legalAreaPreview}</span>
              </div>

              <div className="cw-card-meta-row">
                <span className="cw-meta-chip">2 этапа решений</span>
                <span className="cw-meta-chip">+{LEGAL_CASE_XP_REWARD} XP</span>
                <span
                  className={`cw-status-badge ${
                    isCompleted ? 'cw-status-done' : 'cw-status-idle'
                  }`}
                >
                  {isCompleted ? `Пройдено · ${bestScore}/2` : 'Не пройдено'}
                </span>
              </div>

              <div className="card-action-row">
                <button
                  type="button"
                  className="card-action-btn primary-start-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectCase(scenario)
                  }}
                >
                  <span>{isCompleted ? 'Повторить дело' : 'Начать дело'}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
