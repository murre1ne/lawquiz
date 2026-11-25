import { useState } from 'react'
import { libraryCategoriesData } from '../data/libraryData'

interface LibrarySectionProps {
  onOpenLibrary: () => void
}

export function LibrarySection({ onOpenLibrary }: LibrarySectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <section className="content-section" id="library" aria-labelledby="library-heading">
      <div className="section-container">
        {/* Заголовок секции */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">01 / 05</span>
              <span className="section-category-tag">ТЕОРИЯ И НОРМЫ ГК РК</span>
            </div>
            <h2 id="library-heading" className="section-main-title">
              Правовая библиотека
            </h2>
            <p className="section-main-desc">
              Систематизированный справочник по основным институтам гражданского права Республики Казахстан.
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        </div>

        {/* Презентационная информационная карточка библиотеки с плавным раскрытием подробностей */}
        <article
          className={`lib-hero-card promo-expandable-card ${isExpanded ? 'is-expanded' : ''}`}
          onClick={handleCardClick}
        >
          <div className="lib-hero-content">
            <span className="lib-hero-eyebrow">Учебная база · Гражданский кодекс РК</span>
            <h3 className="lib-hero-title">Правовая библиотека</h3>
            <p className="lib-hero-desc">
              Изучайте основы гражданского права Республики Казахстан, знакомьтесь с участниками гражданских правоотношений, объектами гражданских прав, сделками, договорами и правом собственности. В библиотеке собраны учебные материалы, которые помогут разобраться в основных институтах гражданского законодательства.
            </p>

            <div className="promo-reveal-collapse" id="library-card-details">
              <div className="promo-reveal-inner">
                <ul className="lib-hero-highlights">
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>{libraryCategoriesData.length} тематических разделов</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Учебные материалы по гражданскому праву РК</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Ссылки на соответствующие нормативные положения</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lib-hero-actions">
              <button
                type="button"
                className="lib-hero-cta-btn"
                onClick={onOpenLibrary}
              >
                <span>Перейти в библиотеку</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="promo-details-toggle-btn"
                aria-expanded={isExpanded}
                aria-controls="library-card-details"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <span>{isExpanded ? 'Скрыть подробности' : 'Подробнее'}</span>
                <span className="promo-toggle-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* Визуальный блок-эмблема библиотеки */}
          <div className="lib-hero-visual" aria-hidden="true">
            <div className="lib-visual-emblem scales-levitate-card levitate-delay-1">
              <div className="lib-visual-crest">
                <span className="lib-visual-scale">⚖</span>
                <div className="lib-visual-crest-text">
                  <strong>ГК РК</strong>
                  <span>{libraryCategoriesData.length} разделов</span>
                </div>
              </div>

              <div className="promo-reveal-collapse promo-chapters-collapse">
                <div className="promo-reveal-inner">
                  <div className="lib-visual-chapters">
                    {libraryCategoriesData.map((cat, idx) => (
                      <div key={cat.id} className="lib-visual-chapter-row">
                        <span className="lib-chapter-num">0{idx + 1}</span>
                        <span className="lib-chapter-name">{cat.title}</span>
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
