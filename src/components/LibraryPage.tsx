import { useState } from 'react'
import {
  libraryCategoriesData,
  type LibraryCategoryData,
  getTopicById,
  getCategoryByTopicId,
} from '../data/libraryData'

interface LibraryPageProps {
  onBackToHome: () => void
}

export function LibraryPage({ onBackToHome }: LibraryPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  const selectedCategory = selectedCategoryId
    ? libraryCategoriesData.find((c) => c.id === selectedCategoryId)
    : null

  const activeTopic = selectedTopicId ? getTopicById(selectedTopicId) : null

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Открытие категории
  const handleOpenCategory = (categoryId: string) => {
    const category = libraryCategoriesData.find((c) => c.id === categoryId)
    setSelectedCategoryId(categoryId)
    if (category && category.topics.length > 0) {
      setSelectedTopicId(category.topics[0].id)
    }
    scrollToTop()
  }

  // Возврат ко всем пяти категориям библиотеки
  const handleBackToCategories = () => {
    setSelectedCategoryId(null)
    setSelectedTopicId(null)
    scrollToTop()
  }

  // Переход к конкретной теме
  const handleSelectTopic = (topicId: string) => {
    const cat = getCategoryByTopicId(topicId)
    if (cat) {
      setSelectedCategoryId(cat.id)
    }
    setSelectedTopicId(topicId)
    scrollToTop()
  }

  // Навигация след/пред тема внутри категории
  const currentCategoryTopics = selectedCategory ? selectedCategory.topics : []
  const currentTopicIndex = activeTopic
    ? currentCategoryTopics.findIndex((t) => t.id === activeTopic.id)
    : -1

  const handlePrevTopic = () => {
    if (currentTopicIndex > 0) {
      setSelectedTopicId(currentCategoryTopics[currentTopicIndex - 1].id)
      scrollToTop()
    }
  }

  const handleNextTopic = () => {
    if (currentTopicIndex >= 0 && currentTopicIndex < currentCategoryTopics.length - 1) {
      setSelectedTopicId(currentCategoryTopics[currentTopicIndex + 1].id)
      scrollToTop()
    }
  }

  // Рендер иконки категории (сохранены исходные иконки всех 5 разделов)
  const renderCategoryIcon = (type: LibraryCategoryData['iconType']) => {
    switch (type) {
      case 'book':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        )
      case 'users':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      case 'objects':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        )
      case 'deals':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      case 'property':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        )
    }
  }

  return (
    <section
      className="content-section library-standalone-page"
      id="library-page"
      aria-labelledby="library-page-heading"
    >
      <div className="section-container">
        {/* Верхняя панель навигации отдельной страницы библиотеки */}
        <div className="interactive-top-bar library-page-topbar">
          <button type="button" className="interactive-back-btn" onClick={onBackToHome}>
            <span aria-hidden="true">←</span>
            <span>На главную страницу</span>
          </button>
          <span className="interactive-mode-badge library-page-badge">
            Правовая библиотека · {libraryCategoriesData.length} тематических разделов
          </span>
        </div>

        {/* Заголовок отдельной страницы */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">01 / 05</span>
              <span className="section-category-tag">ТЕОРИЯ И НОРМЫ ГК РК</span>
            </div>
            <h2 id="library-page-heading" className="section-main-title">
              Правовая библиотека
            </h2>
            <p className="section-main-desc">
              Основные институты гражданского права Республики Казахстан
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

        {/* Режим 1: Все 5 существующих тематических карточек */}
        {!selectedCategory && (
          <>
            <div className="library-grid">
              {libraryCategoriesData.map((cat) => (
                <article key={cat.id} className="edu-card library-cat-card">
                  <div className="card-topline">
                    <span className="card-icon-badge" aria-hidden="true">
                      {renderCategoryIcon(cat.iconType)}
                    </span>
                    <span className="card-pill-tag">{cat.badge}</span>
                  </div>

                  <h3 className="card-heading">{cat.title}</h3>
                  <p className="edu-card-desc">{cat.description}</p>

                  <div className="cat-topics-preview">
                    <span className="cat-topics-count">Темы ({cat.topics.length}):</span>
                    <ul className="cat-topics-mini-list">
                      {cat.topics.map((t) => (
                        <li key={t.id}>{t.title}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-action-row">
                    <button
                      type="button"
                      className="card-action-btn"
                      onClick={() => handleOpenCategory(cat.id)}
                      aria-label={`Открыть категорию: ${cat.title}`}
                    >
                      <span>Изучить материалы</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>
                Все темы библиотеки разработаны строго на основе Гражданского кодекса Республики Казахстан (Общая часть). Ссылки ведут в официальную базу «Әділет».
              </span>
            </div>
          </>
        )}

        {/* Режим 2: Открытая категория и интерактивное чтение темы (без изменений содержания) */}
        {selectedCategory && (
          <div className="library-detail-view">
            {/* Панель навигации / Хлебные крошки */}
            <div className="library-breadcrumbs">
              <button
                type="button"
                className="breadcrumbs-back-btn"
                onClick={handleBackToCategories}
              >
                <span aria-hidden="true">←</span>
                <span>Все категории библиотеки</span>
              </button>
              <span className="breadcrumbs-sep">/</span>
              <span className="breadcrumbs-current">{selectedCategory.title}</span>
            </div>

            {/* Заголовок категории и список тем */}
            <div className="category-detail-header">
              <div className="cat-detail-title-row">
                <span className="card-icon-badge" aria-hidden="true">
                  {renderCategoryIcon(selectedCategory.iconType)}
                </span>
                <div>
                  <span className="card-pill-tag">{selectedCategory.badge}</span>
                  <h3 className="cat-detail-title">{selectedCategory.title}</h3>
                </div>
              </div>
              <p className="cat-detail-desc">{selectedCategory.description}</p>

              {/* Табы/список подразделов */}
              <div className="topics-tabs-container">
                <span className="topics-tabs-label">Подразделы категории:</span>
                <div className="topics-tabs-nav" role="tablist">
                  {selectedCategory.topics.map((topic, idx) => {
                    const isActive = activeTopic?.id === topic.id
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`topic-tab-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedTopicId(topic.id)}
                      >
                        <span className="topic-tab-num">0{idx + 1}</span>
                        <span className="topic-tab-title">{topic.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Карточка детального чтения выбранной темы */}
            {activeTopic && (
              <article className="topic-reader-card">
                {/* Шапка материала */}
                <div className="topic-reader-header">
                  <div className="topic-meta-line">
                    <span className="topic-article-pill">{activeTopic.article}</span>
                    <span className="topic-verify-pill status-verified">
                      <span aria-hidden="true">✓</span> Сверено с ГК РК (Әділет)
                    </span>
                  </div>

                  <h4 className="topic-reader-title">{activeTopic.title}</h4>
                  <p className="topic-reader-brief">{activeTopic.brief}</p>
                </div>

                {/* Подробное описание */}
                <div className="topic-reader-body">
                  <h5 className="topic-section-subhead">Подробное правовое описание:</h5>
                  <div className="topic-paragraphs">
                    {activeTopic.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Основные термины */}
                {activeTopic.terms.length > 0 && (
                  <div className="topic-terms-section">
                    <h5 className="topic-section-subhead">
                      Основные юридические термины темы:
                    </h5>
                    <div className="legal-terms-grid">
                      {activeTopic.terms.map((item, tIdx) => (
                        <div key={tIdx} className="legal-term-card">
                          <strong className="legal-term-name">{item.term}</strong>
                          <p className="legal-term-definition">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Нормативный источник и проверка */}
                <div className="topic-source-box">
                  <div className="source-box-header">
                    <span className="source-box-icon" aria-hidden="true">
                      ⚖
                    </span>
                    <div>
                      <span className="source-label">Нормативный источник:</span>
                      <strong className="source-title">{activeTopic.source}</strong>
                      <span className="source-article">{activeTopic.article}</span>
                    </div>
                  </div>

                  <p className="source-verify-note">
                    <strong>Статус верификации:</strong> {activeTopic.verificationNote}
                  </p>

                  <div className="source-link-row">
                    <a
                      href={activeTopic.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adilet-source-btn"
                    >
                      <span>Открыть статью в системе «Әділет»</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>

                {/* Связанные темы */}
                {activeTopic.relatedTopicIds.length > 0 && (
                  <div className="topic-related-box">
                    <h5 className="topic-section-subhead">Связанные темы для изучения:</h5>
                    <div className="related-topics-chips">
                      {activeTopic.relatedTopicIds.map((relId) => {
                        const relTopic = getTopicById(relId)
                        if (!relTopic) return null
                        return (
                          <button
                            key={relId}
                            type="button"
                            className="related-topic-chip"
                            onClick={() => handleSelectTopic(relId)}
                          >
                            <span>{relTopic.title}</span>
                            <span aria-hidden="true">→</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Навигация между темами */}
                <div className="topic-nav-controls">
                  <button
                    type="button"
                    className="topic-nav-btn"
                    disabled={currentTopicIndex <= 0}
                    onClick={handlePrevTopic}
                  >
                    <span aria-hidden="true">←</span>
                    <span>Предыдущая тема</span>
                  </button>

                  <button
                    type="button"
                    className="topic-nav-back-btn"
                    onClick={handleBackToCategories}
                  >
                    К списку категорий
                  </button>

                  <button
                    type="button"
                    className="topic-nav-btn"
                    disabled={
                      currentTopicIndex === -1 ||
                      currentTopicIndex >= currentCategoryTopics.length - 1
                    }
                    onClick={handleNextTopic}
                  >
                    <span>Следующая тема</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
