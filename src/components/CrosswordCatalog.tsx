import {
  CROSSWORD_COMPLETION_XP,
  crosswordPuzzles,
  type CrosswordPuzzle,
} from '../data/crosswordData'
import type { CrosswordProgressMap } from '../data/crosswordProgress'

interface CrosswordCatalogProps {
  progressMap: CrosswordProgressMap
  onSelectPuzzle: (puzzle: CrosswordPuzzle) => void
  onBackToGames: () => void
}

export function CrosswordCatalog({
  progressMap,
  onSelectPuzzle,
  onBackToGames,
}: CrosswordCatalogProps) {
  const completedCount = crosswordPuzzles.filter((p) => progressMap[p.id]?.completed).length
  const totalEarnedXp = crosswordPuzzles.reduce(
    (sum, p) => sum + (progressMap[p.id]?.xpEarned ?? 0),
    0
  )
  const maxPossibleXp = Math.max(
    totalEarnedXp,
    crosswordPuzzles.length * CROSSWORD_COMPLETION_XP
  )

  return (
    <div className="cw-catalog-container">
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToGames}>
          <span aria-hidden="true">←</span>
          <span>В Игровую зону</span>
        </button>
        <div className="cw-catalog-badges">
          <span className="interactive-mode-badge cw-mode-badge">
            Юридические кроссворды · {completedCount} / {crosswordPuzzles.length}
          </span>
          <span className="cw-xp-summary-pill">
            ★ {totalEarnedXp} / {maxPossibleXp} XP
          </span>
        </div>
      </div>

      <div className="cw-catalog-intro glass-panel">
        <div className="cw-catalog-intro-text">
          <h3 className="cw-catalog-title">Каталог юридических кроссвордов</h3>
          <p className="cw-catalog-desc">
            Выберите тематический кроссворд по Гражданскому кодексу Республики Казахстан. В каждом задании 5 пересекающихся терминов со ссылками на статьи в системе «Әділет».
          </p>
        </div>
      </div>

      <div className="cw-catalog-grid">
        {crosswordPuzzles.map((puzzle, index) => {
          const prog = progressMap[puzzle.id]
          const bestScore = prog?.bestScore ?? 0
          const isCompleted = prog?.completed ?? false
          const xpEarned = prog?.xpEarned ?? 0
          const maxXp = Math.max(xpEarned, CROSSWORD_COMPLETION_XP)

          let statusLabel = 'Не начат'
          let statusClass = 'cw-status-idle'
          if (isCompleted) {
            statusLabel = `Пройден · ${bestScore} / ${puzzle.words.length}`
            statusClass = 'cw-status-done'
          } else if (bestScore > 0) {
            statusLabel = `В процессе · ${bestScore} / ${puzzle.words.length}`
            statusClass = 'cw-status-progress'
          }

          return (
            <article
              key={puzzle.id}
              className={`edu-card cw-catalog-card cw-card-tone-${index % 3}`}
              onClick={() => onSelectPuzzle(puzzle)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectPuzzle(puzzle)
                }
              }}
              aria-label={`Открыть кроссворд №${puzzle.number}: ${puzzle.title}`}
            >
              <div className="card-topline">
                <span className="card-icon-badge cw-num-badge" aria-hidden="true">
                  №{puzzle.number}
                </span>
                <span className="card-pill-tag">{puzzle.difficulty}</span>
              </div>

              <span className="cw-card-topic">{puzzle.topic}</span>
              <h4 className="card-heading">{puzzle.title}</h4>
              <p className="edu-card-desc">{puzzle.description}</p>

              <div className="cw-card-meta-row">
                <span className="cw-meta-chip">Слов: {puzzle.words.length}</span>
                <span className="cw-meta-chip">
                  XP: {xpEarned} / {maxXp}
                </span>
                <span className={`cw-status-badge ${statusClass}`}>{statusLabel}</span>
              </div>

              <div className="card-action-row">
                <button
                  type="button"
                  className="card-action-btn primary-start-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectPuzzle(puzzle)
                  }}
                >
                  <span>
                    {isCompleted
                      ? 'Пройти ещё раз'
                      : bestScore > 0
                      ? 'Продолжить'
                      : 'Открыть кроссворд'}
                  </span>
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
