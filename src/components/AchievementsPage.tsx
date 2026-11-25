import { useEffect, useState } from 'react'
import {
  ACHIEVEMENT_CATEGORIES,
  RARITY_LABELS,
  type AchievementCategoryId,
  type EvaluatedAchievement,
} from '../data/achievementsData'
import type { NotificationSettings } from '../utils/achievementAudio'

interface AchievementsPageProps {
  evaluatedAchievements: EvaluatedAchievement[]
  notificationSettings: NotificationSettings
  onResetProgress: () => void
  onBackToHome: () => void
}

type StatusFilter = 'all' | 'unlocked' | 'locked'

function formatUnlockDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function AchievementsPage({
  evaluatedAchievements,
  notificationSettings,
  onResetProgress,
  onBackToHome,
}: AchievementsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategoryId>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false)
  const [confirmChecked, setConfirmChecked] = useState<boolean>(false)

  // Закрытие модального окна сброса по Escape
  useEffect(() => {
    if (!isResetModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsResetModalOpen(false)
        setConfirmChecked(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isResetModalOpen])

  const totalAchievements = evaluatedAchievements.length
  const unlockedCount = evaluatedAchievements.filter((a) => a.unlocked).length
  const lockedCount = totalAchievements - unlockedCount
  const completionPercent =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0

  const filteredAchievements = evaluatedAchievements.filter((item) => {
    if (selectedCategory !== 'all' && item.definition.category !== selectedCategory) {
      return false
    }
    if (statusFilter === 'unlocked' && !item.unlocked) return false
    if (statusFilter === 'locked' && item.unlocked) return false
    return true
  })

  const handleOpenResetModal = () => {
    setConfirmChecked(false)
    setIsResetModalOpen(true)
  }

  const handleCancelReset = () => {
    setIsResetModalOpen(false)
    setConfirmChecked(false)
  }

  const handleConfirmReset = () => {
    if (!confirmChecked) return
    setIsResetModalOpen(false)
    setConfirmChecked(false)
    onResetProgress()
  }

  return (
    <section
      className="content-section achievements-page-section"
      id="achievements-page"
      aria-labelledby="achievements-page-heading"
    >
      <div className="section-container achievements-page-container">
        {/* Верхняя панель навигации отдельной страницы */}
        <div className="library-page-topbar">
          <button
            type="button"
            className="library-page-back-btn"
            onClick={onBackToHome}
          >
            <span aria-hidden="true">←</span>
            <span>На главную страницу</span>
          </button>

          <div className="library-page-breadcrumb" aria-label="Текущий раздел">
            <span>Главная</span>
            <span aria-hidden="true">/</span>
            <strong>Достижения</strong>
          </div>
        </div>

        {/* Заголовок страницы достижений */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">КОЛЛЕКЦИЯ НАГРАД</span>
              <span className="section-category-tag">
                {unlockedCount} ИЗ {totalAchievements} ПОЛУЧЕНО
              </span>
            </div>
            <h1 id="achievements-page-heading" className="section-main-title achievements-page-title">
              Достижения
            </h1>
            <p className="section-main-desc">
              Полная коллекция из {totalAchievements} достижений по всем разделам Law Quiz KZ: прогресс выполнения, категории, редкость и секретные награды.
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
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
              <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
            </svg>
          </div>
        </div>

        {/* Каталог всех существующих достижений */}
        <div className="achievements-box ach2-box">
          <div className="achievements-box-header ach2-header">
            <div className="achievements-heading-copy">
              <h2 className="achievements-box-title">Коллекция достижений</h2>
              <p className="achievements-box-note">
                Получено <strong>{unlockedCount}</strong> из <strong>{totalAchievements}</strong> · Завершено на <strong>{completionPercent}%</strong>
              </p>
            </div>

            <div className="achievements-summary ach2-summary">
              <span className="ach2-percent-pill">{completionPercent}% выполнено</span>
              <div
                className="achievements-meter ach2-meter"
                role="progressbar"
                aria-valuenow={completionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Получено ${unlockedCount} из ${totalAchievements} достижений`}
              >
                <span
                  className="achievements-meter-fill"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Фильтры по статусу и категориям */}
          <div className="ach2-filters-wrap">
            <div className="ach2-status-filters" role="tablist" aria-label="Фильтр по статусу">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                className={`ach2-filter-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Все ({totalAchievements})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'unlocked'}
                className={`ach2-filter-pill ${statusFilter === 'unlocked' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('unlocked')}
              >
                Полученные ({unlockedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'locked'}
                className={`ach2-filter-pill ${statusFilter === 'locked' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('locked')}
              >
                Неполученные ({lockedCount})
              </button>
            </div>

            <div className="ach2-category-tabs" role="tablist" aria-label="Категории достижений">
              <button
                type="button"
                role="tab"
                aria-selected={selectedCategory === 'all'}
                className={`ach2-cat-tab ${selectedCategory === 'all' ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span>Все категории</span>
                <span className="ach2-cat-count">
                  {unlockedCount}/{totalAchievements}
                </span>
              </button>

              {ACHIEVEMENT_CATEGORIES.map((cat) => {
                const catItems = evaluatedAchievements.filter(
                  (a) => a.definition.category === cat.id
                )
                const catDone = catItems.filter((a) => a.unlocked).length
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.id}
                    className={`ach2-cat-tab ${selectedCategory === cat.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="ach2-cat-count">
                      {catDone}/{catItems.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Сетка достижений */}
          {filteredAchievements.length === 0 ? (
            <div className="ach2-empty-state">
              <p>
                {statusFilter === 'unlocked'
                  ? 'В этой категории пока нет полученных достижений. Проходите интерактивы, чтобы открыть награды!'
                  : 'Все достижения в выбранной категории уже получены!'}
              </p>
            </div>
          ) : (
            <div className="ach2-grid">
              {filteredAchievements.map((item) => {
                const { definition: def, unlocked, unlockedAt, current, target, percent } = item
                const isHiddenSecret = Boolean(def.secret && !unlocked)
                const categoryMeta = ACHIEVEMENT_CATEGORIES.find((c) => c.id === def.category)
                const showProgress = !unlocked && !isHiddenSecret && target > 1

                return (
                  <article
                    key={def.id}
                    className={`ach2-card ach2-rarity--${
                      isHiddenSecret ? 'secret' : def.rarity
                    } ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                  >
                    <div className="ach2-card-top">
                      <div className="ach2-icon-wrap" aria-hidden="true">
                        <span>{isHiddenSecret ? '?' : def.icon}</span>
                      </div>

                      <div className="ach2-badges-col">
                        <span
                          className={`ach2-rarity-badge rarity-${
                            isHiddenSecret ? 'secret' : def.rarity
                          }`}
                        >
                          {isHiddenSecret ? 'Секретное' : RARITY_LABELS[def.rarity]}
                        </span>
                        {!isHiddenSecret && typeof def.xpReward === 'number' && def.xpReward > 0 && (
                          <span className="ach2-xp-reward-pill">+{def.xpReward} XP</span>
                        )}
                        <span className="ach2-category-chip">
                          {categoryMeta?.label}
                        </span>
                      </div>
                    </div>

                    <div className="ach2-card-body">
                      <h3 className="ach2-card-title">
                        {isHiddenSecret ? 'Секретное достижение' : def.title}
                      </h3>
                      <p className="ach2-card-desc">
                        {isHiddenSecret
                          ? 'Название и условие скрыты. Продолжайте изучать Law Quiz KZ, чтобы разблокировать эту награду.'
                          : def.description}
                      </p>
                    </div>

                    {/* Прогресс-бар для незавершённых накопительных достижений */}
                    {showProgress && (
                      <div className="ach2-progress-block">
                        <div className="ach2-progress-meta">
                          <span>Прогресс</span>
                          <strong>
                            {current} / {target}
                            {def.progressUnit ? ` ${def.progressUnit}` : ''}
                          </strong>
                        </div>
                        <div className="ach2-progress-track">
                          <div
                            className="ach2-progress-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="ach2-card-footer">
                      <span
                        className={`achievement-status-tag ${
                          unlocked ? 'tag-done' : 'tag-pending'
                        }`}
                      >
                        {unlocked
                          ? 'Получено ✓'
                          : isHiddenSecret
                          ? 'Скрыто'
                          : current > 0
                          ? `В процессе (${percent}%)`
                          : 'Закрыто'}
                      </span>
                      {unlocked && unlockedAt && (
                        <span className="ach2-date-label">{formatUnlockDate(unlockedAt)}</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* Панель статуса уведомлений и безопасного сброса игрового прогресса */}
        <div className="ach-controls-panel">
          <div className="ach-settings-summary-note">
            <span className="ach-summary-pill">
              {notificationSettings.visualNotificationsEnabled
                ? '🔔 Уведомления вкл.'
                : '🔕 Уведомления выкл.'}
            </span>
            <span className="ach-summary-pill">
              {notificationSettings.soundEnabled ? '🔊 Звук вкл.' : '🔇 Звук выкл.'}
            </span>
            <span className="ach-summary-hint">
              Управление темой, уведомлениями и звуком — в разделе «Настройки» в шапке сайта.
            </span>
          </div>

          <button
            type="button"
            className="ach-reset-btn"
            onClick={handleOpenResetModal}
          >
            <span aria-hidden="true">↺</span>
            <span>Сбросить игровой прогресс</span>
          </button>
        </div>

        <div className="section-status-banner">
          <span className="status-dot" aria-hidden="true" />
          <span>
            100% конфиденциальность: прогресс, достижения и настройки сохраняются локально в вашем браузере без регистрации.
          </span>
        </div>
      </div>

      {/* Модальное окно подтверждения сброса прогресса */}
      {isResetModalOpen && (
        <div
          className="ach-modal-backdrop"
          role="presentation"
          onClick={handleCancelReset}
        >
          <div
            className="ach-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            aria-describedby="reset-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ach-modal-icon" aria-hidden="true">
              ⚠️
            </div>
            <h3 id="reset-modal-title" className="ach-modal-title">
              Сбросить весь игровой прогресс?
            </h3>
            <p id="reset-modal-desc" className="ach-modal-desc">
              Будут удалены накопленный опыт, уровень, полученные достижения и история прохождения интерактивов. Это действие нельзя отменить.
            </p>
            <p className="ach-modal-preserve-note">
              Настройки светлой/тёмной темы, звука и уведомлений сохранятся.
            </p>

            <label className="ach-modal-confirm-check">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <span>Я понимаю, что игровой прогресс будет полностью обнулён</span>
            </label>

            <div className="ach-modal-actions">
              <button
                type="button"
                className="ach-modal-btn ach-modal-btn--cancel"
                onClick={handleCancelReset}
              >
                Отмена
              </button>
              <button
                type="button"
                className="ach-modal-btn ach-modal-btn--danger"
                disabled={!confirmChecked}
                onClick={handleConfirmReset}
              >
                Да, сбросить прогресс
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
