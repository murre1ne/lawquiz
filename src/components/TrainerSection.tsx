import { useState } from 'react'

export type { TaskAwardFeedback } from './TrainerPage'

interface TrainerSectionProps {
  onOpenTrainer: () => void
}

const trainerFormatPreviews = [
  { num: '01', title: 'Тесты по ГК РК' },
  { num: '02', title: 'Правда или миф?' },
  { num: '03', title: 'Соедини термин и определение' },
  { num: '04', title: 'Распредели по категориям' },
]

export function TrainerSection({ onOpenTrainer }: TrainerSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <section className="content-section" id="trainer" aria-labelledby="trainer-heading">
      <div className="section-container">
        {/* Заголовок секции */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">02 / 05</span>
              <span className="section-category-tag">САМОПРОВЕРКА И ЗАКРЕПЛЕНИЕ</span>
            </div>
            <h2 id="trainer-heading" className="section-main-title">
              Тренажёр знаний
            </h2>
            <p className="section-main-desc">
              Интерактивные задания для изучения и закрепления знаний по гражданскому праву Республики Казахстан.
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
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        {/* Презентационная информационная карточка тренажёра знаний с плавным раскрытием */}
        <article
          className={`lib-hero-card trainer-hero-card promo-expandable-card ${
            isExpanded ? 'is-expanded' : ''
          }`}
          onClick={handleCardClick}
        >
          <div className="lib-hero-content">
            <span className="lib-hero-eyebrow">Интерактивная практика · ГК РК</span>
            <h3 className="lib-hero-title">Тренажёр знаний</h3>
            <p className="lib-hero-desc">
              Проверяйте свои знания гражданского права Республики Казахстан с помощью интерактивных заданий. Решайте тесты, проверяйте правовые утверждения, соединяйте юридические термины с определениями и распределяйте понятия по категориям, чтобы закрепить изученный материал.
            </p>

            <div className="promo-reveal-collapse" id="trainer-card-details">
              <div className="promo-reveal-inner">
                <ul className="lib-hero-highlights">
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>4 интерактивных формата</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Проверка знаний в игровой форме</span>
                  </li>
                  <li>
                    <span className="lib-highlight-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>Практика по гражданскому праву Республики Казахстан</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lib-hero-actions">
              <button
                type="button"
                className="lib-hero-cta-btn"
                onClick={onOpenTrainer}
              >
                <span>Перейти к тренажёру</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="promo-details-toggle-btn"
                aria-expanded={isExpanded}
                aria-controls="trainer-card-details"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <span>{isExpanded ? 'Скрыть подробности' : 'Подробнее'}</span>
                <span className="promo-toggle-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* Визуальный блок-эмблема форматов тренажёра */}
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
                <div className="lib-visual-crest-text">
                  <strong>Тренажёр</strong>
                  <span>4 интерактивных формата</span>
                </div>
              </div>

              <div className="promo-reveal-collapse promo-chapters-collapse">
                <div className="promo-reveal-inner">
                  <div className="lib-visual-chapters">
                    {trainerFormatPreviews.map((item) => (
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
