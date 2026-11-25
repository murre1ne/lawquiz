import { useState } from 'react'

interface PracticeSectionProps {
  onOpenPractice: () => void
}

const practiceFormatPreviews = [
  { num: '01', title: 'Разбор юридических ситуаций' },
  { num: '02', title: 'Поиск ошибок в учебном договоре' },
  { num: '03', title: 'Пошаговый разбор договоров' },
  { num: '04', title: 'Выбери развитие событий' },
  { num: '05', title: 'Калькулятор договорной неустойки' },
]

export function PracticeSection({ onOpenPractice }: PracticeSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <section className="content-section" id="practice" aria-labelledby="practice-heading">
      <div className="section-container">
        {/* Заголовок секции */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">03 / 05</span>
              <span className="section-category-tag">ПРАКТИКУМ И КЕЙСЫ</span>
            </div>
            <h2 id="practice-heading" className="section-main-title">
              Юридическая практика
            </h2>
            <p className="section-main-desc">
              Применяйте нормы гражданского права Республики Казахстан для решения практических задач и анализа юридических ситуаций.
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
              <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="M7 21h10" />
              <path d="M12 3v18" />
              <path d="M3 7h18" />
            </svg>
          </div>
        </div>

        {/* Презентационная информационная карточка юридической практики с плавным раскрытием */}
        <article
          className={`lib-hero-card practice-hero-card promo-expandable-card ${
            isExpanded ? 'is-expanded' : ''
          }`}
          onClick={handleCardClick}
        >
          <div className="lib-hero-content">
            <span className="lib-hero-eyebrow">Практикум и кейсы · ГК РК</span>
            <h3 className="lib-hero-title">Юридическая практика</h3>
            <p className="lib-hero-desc">
              Применяйте знания гражданского права Республики Казахстан на практике. Анализируйте юридические ситуации, находите ошибки в договорах, изучайте договорные отношения поэтапно и принимайте решения в смоделированных правовых ситуациях.
            </p>

            <div className="promo-reveal-collapse" id="practice-card-details">
              <div className="promo-reveal-inner">
                <ul className="lib-hero-highlights">
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>5 форматов практических заданий</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Анализ реальных по форме, но вымышленных юридических ситуаций</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Практическое применение норм гражданского законодательства РК</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lib-hero-actions">
              <button
                type="button"
                className="lib-hero-cta-btn"
                onClick={onOpenPractice}
              >
                <span>Перейти к практике</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="promo-details-toggle-btn"
                aria-expanded={isExpanded}
                aria-controls="practice-card-details"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <span>{isExpanded ? 'Скрыть подробности' : 'Подробнее'}</span>
                <span className="promo-toggle-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* Визуальный блок-эмблема форматов практики */}
          <div className="lib-hero-visual" aria-hidden="true">
            <div className="lib-visual-emblem scales-levitate-card levitate-delay-2">
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
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="M7 21h10" />
                    <path d="M12 3v18" />
                    <path d="M3 7h18" />
                  </svg>
                </span>
                <div className="lib-visual-crest-text">
                  <strong>Практикум</strong>
                  <span>5 форматов заданий</span>
                </div>
              </div>

              <div className="promo-reveal-collapse promo-chapters-collapse">
                <div className="promo-reveal-inner">
                  <div className="lib-visual-chapters">
                    {practiceFormatPreviews.map((item) => (
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
