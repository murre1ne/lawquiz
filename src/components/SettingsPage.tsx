import {
  playXPSound,
  type SiteSettings,
  type ThemeMode,
} from '../utils/achievementAudio'

interface SettingsPageProps {
  settings: SiteSettings
  onChangeTheme: (theme: ThemeMode) => void
  onToggleVisualNotifications: (enabled: boolean) => void
  onToggleSound: (enabled: boolean) => void
  onBack: () => void
}

export function SettingsPage({
  settings,
  onChangeTheme,
  onToggleVisualNotifications,
  onToggleSound,
  onBack,
}: SettingsPageProps) {
  return (
    <section
      className="content-section settings-page-section"
      id="settings"
      aria-labelledby="settings-heading"
    >
      <div className="section-container settings-container">
        {/* Верхняя кнопка возврата */}
        <div className="interactive-top-bar settings-top-bar">
          <button type="button" className="interactive-back-btn" onClick={onBack}>
            <span aria-hidden="true">←</span>
            <span>Вернуться назад</span>
          </button>
          <span className="interactive-mode-badge settings-autosave-badge">
            ✓ Изменения сохраняются автоматически
          </span>
        </div>

        {/* Заголовок страницы настроек */}
        <div className="section-header-row settings-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">ЦЕНТР УПРАВЛЕНИЯ</span>
              <span className="section-category-tag">ПАРАМЕТРЫ ПЛАТФОРМЫ</span>
            </div>
            <h2 id="settings-heading" className="section-main-title">
              Настройки
            </h2>
            <p className="section-main-desc">
              Управляйте темой оформления, всплывающими уведомлениями и игровыми звуками Law Quiz KZ. Все изменения применяются мгновенно и сохраняются независимо от игрового прогресса.
            </p>
          </div>
          <div className="section-header-icon settings-header-icon" aria-hidden="true">
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </div>
        </div>

        {/* Три категории настроек */}
        <div className="settings-groups-grid">
          {/* 1. Внешний вид */}
          <article className="settings-card settings-card--appearance">
            <div className="settings-card-head">
              <span className="settings-cat-icon settings-icon--appearance" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </span>
              <div>
                <span className="settings-cat-eyebrow">Категория 1</span>
                <h3 className="settings-cat-title">Внешний вид</h3>
              </div>
            </div>

            <div className="settings-item-block">
              <div className="settings-item-copy">
                <h4 className="settings-item-name">Тема оформления</h4>
                <p className="settings-item-desc">
                  Выберите светлое или тёмное оформление для всех разделов, карточек, интерактивов, уведомлений и модальных окон. Для новых пользователей по умолчанию активна светлая тема.
                </p>
              </div>

              <div
                className="settings-theme-grid"
                role="radiogroup"
                aria-label="Выбор темы оформления"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === 'light'}
                  className={`settings-theme-option ${
                    settings.theme === 'light' ? 'is-selected' : ''
                  }`}
                  onClick={() => onChangeTheme('light')}
                >
                  <span className="settings-theme-preview preview-light" aria-hidden="true">
                    <span className="preview-bar" />
                    <span className="preview-cards">
                      <i />
                      <i />
                    </span>
                  </span>
                  <span className="settings-theme-meta">
                    <strong>Светлая тема</strong>
                    <span>Фирменная бело-зелёная палитра</span>
                  </span>
                  <span className="settings-theme-check" aria-hidden="true">
                    {settings.theme === 'light' ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === 'dark'}
                  className={`settings-theme-option ${
                    settings.theme === 'dark' ? 'is-selected' : ''
                  }`}
                  onClick={() => onChangeTheme('dark')}
                >
                  <span className="settings-theme-preview preview-dark" aria-hidden="true">
                    <span className="preview-bar" />
                    <span className="preview-cards">
                      <i />
                      <i />
                    </span>
                  </span>
                  <span className="settings-theme-meta">
                    <strong>Тёмная тема</strong>
                    <span>Графитовый фон и тёмно-зелёные поверхности</span>
                  </span>
                  <span className="settings-theme-check" aria-hidden="true">
                    {settings.theme === 'dark' ? '✓' : ''}
                  </span>
                </button>
              </div>
            </div>
          </article>

          {/* 2. Уведомления */}
          <article className="settings-card settings-card--notifications">
            <div className="settings-card-head">
              <span className="settings-cat-icon settings-icon--notifications" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </span>
              <div>
                <span className="settings-cat-eyebrow">Категория 2</span>
                <h3 className="settings-cat-title">Уведомления</h3>
              </div>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-item-copy">
                <h4 className="settings-item-name">Визуальные уведомления</h4>
                <p className="settings-item-desc">
                  Показывает всплывающие сообщения при получении XP, открытии достижений и достижении нового уровня. Если отключить, всплывающие окна скрываются, но начисление опыта и разблокировка достижений продолжают работать.
                </p>
              </div>

              <label className="settings-switch-wrap">
                <input
                  type="checkbox"
                  className="ach-toggle-input"
                  checked={settings.visualNotificationsEnabled}
                  onChange={(e) => onToggleVisualNotifications(e.target.checked)}
                  aria-label="Переключить визуальные уведомления"
                />
                <span className="ach-toggle-track settings-switch-track" aria-hidden="true">
                  <span className="ach-toggle-thumb settings-switch-thumb" />
                </span>
                <span className="settings-switch-state">
                  {settings.visualNotificationsEnabled ? 'Включено' : 'Выключено'}
                </span>
              </label>
            </div>
          </article>

          {/* 3. Звук */}
          <article className="settings-card settings-card--sound">
            <div className="settings-card-head">
              <span className="settings-cat-icon settings-icon--sound" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </span>
              <div>
                <span className="settings-cat-eyebrow">Категория 3</span>
                <h3 className="settings-cat-title">Звук</h3>
              </div>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-item-copy">
                <h4 className="settings-item-name">Звуковые эффекты</h4>
                <p className="settings-item-desc">
                  Включает короткие звуковые сигналы при получении достижений, начислении опыта (XP) и повышении уровня. Настройка управляет только звуками сайта и не влияет на системную громкость устройства.
                </p>
              </div>

              <label className="settings-switch-wrap">
                <input
                  type="checkbox"
                  className="ach-toggle-input"
                  checked={settings.soundEnabled}
                  onChange={(e) => onToggleSound(e.target.checked)}
                  aria-label="Переключить звуковые эффекты"
                />
                <span className="ach-toggle-track settings-switch-track" aria-hidden="true">
                  <span className="ach-toggle-thumb settings-switch-thumb" />
                </span>
                <span className="settings-switch-state">
                  {settings.soundEnabled ? 'Включено' : 'Выключено'}
                </span>
              </label>
            </div>

            <div className="settings-sound-footer">
              <span className="settings-sound-note">
                Если браузер ограничивает автовоспроизведение аудио, игровой прогресс и уведомления продолжают работать без ошибок.
              </span>
              <button
                type="button"
                className="settings-test-sound-btn"
                disabled={!settings.soundEnabled}
                onClick={() => playXPSound(settings.soundEnabled)}
              >
                <span aria-hidden="true">♪</span>
                <span>Проверить звук</span>
              </button>
            </div>
          </article>
        </div>

        {/* Информационный баннер о сохранении */}
        <div className="section-status-banner">
          <span className="status-dot" aria-hidden="true" />
          <span>
            Настройки хранятся локально в браузере отдельно от XP и достижений и сохраняются даже после сброса игрового прогресса.
          </span>
        </div>
      </div>
    </section>
  )
}
