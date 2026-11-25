import type { XPProgressInfo } from '../data/crosswordProgress'

interface AchievementsSectionProps {
  xpProgress: XPProgressInfo
  isFreshBaseline: boolean
  onOpenAchievementsPage: () => void
}

function getLevelTitle(level: number): string {
  if (level <= 1) return 'Стажёр права'
  if (level === 2) return 'Начинающий правовед'
  if (level === 3) return 'Знаток ГК РК'
  if (level === 4) return 'Уверенный юрист'
  return 'Мастер гражданского права'
}

export function AchievementsSection({
  xpProgress,
  isFreshBaseline,
  onOpenAchievementsPage,
}: AchievementsSectionProps) {
  const displayedXpSubtext = isFreshBaseline
    ? xpProgress.totalXp > 0
      ? 'Накоплено за пройденные интерактивы'
      : 'Проходите интерактивы, чтобы зарабатывать XP'
    : xpProgress.earnedLocalXp > 0
    ? `Из них +${xpProgress.earnedLocalXp} XP за пройденные практики и игры`
    : 'Баллов академического опыта'

  const statsTagLabel =
    isFreshBaseline || xpProgress.earnedLocalXp > 0 ? 'Локальный прогресс' : 'Текущий прогресс'

  return (
    <section className="content-section" id="achievements" aria-labelledby="achievements-heading">
      <div className="section-container">
        {/* Заголовок секции опыта и уровня */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">05 / 05</span>
              <span className="section-category-tag">ОПЫТ И УРОВЕНЬ</span>
            </div>
            <h2 id="achievements-heading" className="section-main-title">
              Мой прогресс
            </h2>
            <p className="section-main-desc">
              Ваш текущий уровень, накопленный опыт (XP) и прогресс до следующей ступени обучения.
            </p>
          </div>
          <div className="section-header-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>

        {/* Только уровень, накопленный опыт (XP) и полоса прогресса до следующего уровня */}
        <div className="stats-grid xp-summary-grid">
          <div className="stat-card stat-card--level">
            <div className="stat-card-top">
              <span className="stat-icon-wrap" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
                </svg>
              </span>
              <span className="demo-tag">{statsTagLabel}</span>
            </div>
            <span className="stat-label">Текущий уровень</span>
            <span className="stat-value">Уровень {xpProgress.currentLevel}</span>
            <span className="stat-subtext">{getLevelTitle(xpProgress.currentLevel)}</span>
            <div className="stat-progress">
              <div className="stat-progress-meta">
                <span>
                  До уровня {xpProgress.currentLevel + 1} (ещё {xpProgress.remainingToNextLevel} XP)
                </span>
                <span>{xpProgress.progressPercent}%</span>
              </div>
              <div
                className="stat-progress-bar-wrap"
                role="progressbar"
                aria-valuenow={xpProgress.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Прогресс до следующего уровня"
              >
                <div
                  className="stat-progress-bar-fill"
                  style={{ width: `${xpProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card--score">
            <div className="stat-card-top">
              <span className="stat-icon-wrap" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <span className="demo-tag">{statsTagLabel}</span>
            </div>
            <span className="stat-label">Накопленный опыт</span>
            <span className="stat-value">{xpProgress.totalXp} XP</span>
            <span className="stat-subtext">{displayedXpSubtext}</span>
          </div>
        </div>

        {/* Кнопка перехода на отдельную страницу достижений */}
        <div className="xp-achievements-cta-bar">
          <button
            type="button"
            className="primary-button xp-achievements-cta-btn"
            onClick={onOpenAchievementsPage}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
              <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
            </svg>
            <span>Посмотреть достижения</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
