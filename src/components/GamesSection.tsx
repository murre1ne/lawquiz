import { useState } from 'react'

interface GamesSectionProps {
  onOpenGames: () => void
}

const gameFormatPreviews = [
  { num: '01', title: 'Юридический кроссворд' },
  { num: '02', title: 'Колесо-фортуна' },
  { num: '03', title: 'Испытание на время' },
]

export function GamesSection({ onOpenGames }: GamesSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <section className="content-section" id="games" aria-labelledby="games-heading">
      <div className="section-container">
        {/* Заголовок секции */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">04 / 05</span>
              <span className="section-category-tag">ОБРАЗОВАТЕЛЬНЫЙ ИНТЕРАКТИВ</span>
            </div>
            <h2 id="games-heading" className="section-main-title">
              Игровая зона
            </h2>
            <p className="section-main-desc">
              Закрепляйте знания по гражданскому праву Республики Казахстан с помощью игровых заданий.
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
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="15" y1="13" x2="15.01" y2="13" />
              <line x1="18" y1="11" x2="18.01" y2="11" />
              <rect x="2" y="6" width="20" height="12" rx="6" />
            </svg>
          </div>
        </div>

        {/* Презентационная информационная карточка игровой зоны с плавным раскрытием */}
        <article
          className={`lib-hero-card games-hero-card promo-expandable-card ${
            isExpanded ? 'is-expanded' : ''
          }`}
          onClick={handleCardClick}
        >
          <div className="lib-hero-content">
            <span className="lib-hero-eyebrow">Игровой формат · ГК РК</span>
            <h3 className="lib-hero-title">Игровая зона</h3>
            <p className="lib-hero-desc">
              Изучайте гражданское право Республики Казахстан в игровом формате. Решайте юридические кроссворды, испытывайте удачу в колесе-фортуне и проверяйте скорость своих знаний в заданиях на время.
            </p>

            <div className="promo-reveal-collapse" id="games-card-details">
              <div className="promo-reveal-inner">
                <ul className="lib-hero-highlights">
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>3 игровых формата</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Интерактивное изучение гражданского права РК</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Возможность проверить знания в игровой форме</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lib-hero-actions">
              <button
                type="button"
                className="lib-hero-cta-btn"
                onClick={onOpenGames}
              >
                <span>Перейти к играм</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="promo-details-toggle-btn"
                aria-expanded={isExpanded}
                aria-controls="games-card-details"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <span>{isExpanded ? 'Скрыть подробности' : 'Подробнее'}</span>
                <span className="promo-toggle-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* Визуальный блок-эмблема игровых форматов */}
          <div className="lib-hero-visual" aria-hidden="true">
            <div className="lib-visual-emblem">
              <div className="lib-visual-crest">
                <span className="lib-visual-scale">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="6" y1="12" x2="10" y2="12" />
                    <line x1="8" y1="10" x2="8" y2="14" />
                    <line x1="15" y1="13" x2="15.01" y2="13" />
                    <line x1="18" y1="11" x2="18.01" y2="11" />
                    <rect x="2" y="6" width="20" height="12" rx="6" />
                  </svg>
                </span>
                <div className="lib-visual-crest-text">
                  <strong>Игры</strong>
                  <span>3 игровых формата</span>
                </div>
              </div>

              <div className="promo-reveal-collapse promo-chapters-collapse">
                <div className="promo-reveal-inner">
                  <div className="lib-visual-chapters">
                    {gameFormatPreviews.map((item) => (
                      <div key={item.num} className="lib-visual-chapter-row">
                        <span className="lib-chapter-num">{item.num}</span>
                        <span className="lib-chapter-name">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
