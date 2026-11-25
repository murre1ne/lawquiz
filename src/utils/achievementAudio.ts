/**
 * Единый модуль настроек сайта и синтезатора игровых звуков Law Quiz KZ (Web Audio API).
 * Настройки хранятся в отдельных ключах localStorage и НЕ удаляются при сбросе прогресса:
 * - 'lqkz-theme' (тема оформления: 'light' | 'dark', по умолчанию 'light')
 * - 'lawQuiz_notifications' (визуальные уведомления: 'true' | 'false', по умолчанию true)
 * - 'lawQuiz_sounds' (звуковые эффекты: 'true' | 'false', по умолчанию true)
 */

export type ThemeMode = 'light' | 'dark'
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface NotificationSettings {
  soundEnabled: boolean
  visualNotificationsEnabled: boolean
}

export interface SiteSettings extends NotificationSettings {
  theme: ThemeMode
}

export const THEME_STORAGE_KEY = 'lqkz-theme'
export const NOTIFICATIONS_STORAGE_KEY = 'lawQuiz_notifications'
export const SOUNDS_STORAGE_KEY = 'lawQuiz_sounds'
/** Старый комбинированный ключ для мягкой миграции без потери настроек */
export const LEGACY_NOTIFICATION_SETTINGS_KEY = 'lqkz-notification-settings-v1'

const DEFAULT_SETTINGS: SiteSettings = {
  theme: 'light',
  soundEnabled: true,
  visualNotificationsEnabled: true,
}

function readLegacyNotificationSettings(): Partial<NotificationSettings> {
  try {
    const raw = window.localStorage.getItem(LEGACY_NOTIFICATION_SETTINGS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return fallback
  } catch {
    return fallback
  }
}

export function loadStoredTheme(): ThemeMode {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return DEFAULT_SETTINGS.theme
  }
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* localStorage может быть недоступен */
  }
}

export function loadNotificationSettings(): NotificationSettings {
  const legacy = readLegacyNotificationSettings()
  const fallbackSound =
    typeof legacy.soundEnabled === 'boolean' ? legacy.soundEnabled : DEFAULT_SETTINGS.soundEnabled
  const fallbackVisual =
    typeof legacy.visualNotificationsEnabled === 'boolean'
      ? legacy.visualNotificationsEnabled
      : DEFAULT_SETTINGS.visualNotificationsEnabled

  return {
    soundEnabled: readStoredBoolean(SOUNDS_STORAGE_KEY, fallbackSound),
    visualNotificationsEnabled: readStoredBoolean(NOTIFICATIONS_STORAGE_KEY, fallbackVisual),
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    window.localStorage.setItem(SOUNDS_STORAGE_KEY, String(settings.soundEnabled))
    window.localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      String(settings.visualNotificationsEnabled)
    )
  } catch {
    /* localStorage может быть недоступен */
  }
}

export function loadSiteSettings(): SiteSettings {
  const notif = loadNotificationSettings()
  return {
    theme: loadStoredTheme(),
    soundEnabled: notif.soundEnabled,
    visualNotificationsEnabled: notif.visualNotificationsEnabled,
  }
}

export function saveSiteSettings(settings: SiteSettings): void {
  saveStoredTheme(settings.theme)
  saveNotificationSettings({
    soundEnabled: settings.soundEnabled,
    visualNotificationsEnabled: settings.visualNotificationsEnabled,
  })
}

let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctor()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {
      /* Автовоспроизведение может быть заблокировано браузером — безопасно игнорируем */
    })
  }
  return sharedAudioCtx
}

interface ToneSpec {
  freq: number
  startOffset: number
  duration: number
  gain: number
  type: OscillatorType
}

const RARITY_MELODIES: Record<AchievementRarity, ToneSpec[]> = {
  common: [
    { freq: 523.25, startOffset: 0, duration: 0.14, gain: 0.08, type: 'sine' },
    { freq: 659.25, startOffset: 0.09, duration: 0.22, gain: 0.09, type: 'triangle' },
  ],
  uncommon: [
    { freq: 523.25, startOffset: 0, duration: 0.12, gain: 0.08, type: 'triangle' },
    { freq: 659.25, startOffset: 0.08, duration: 0.14, gain: 0.09, type: 'triangle' },
    { freq: 783.99, startOffset: 0.16, duration: 0.26, gain: 0.1, type: 'sine' },
  ],
  rare: [
    { freq: 587.33, startOffset: 0, duration: 0.13, gain: 0.08, type: 'triangle' },
    { freq: 739.99, startOffset: 0.08, duration: 0.14, gain: 0.09, type: 'triangle' },
    { freq: 880.0, startOffset: 0.16, duration: 0.18, gain: 0.1, type: 'sine' },
    { freq: 1174.66, startOffset: 0.24, duration: 0.34, gain: 0.1, type: 'sine' },
  ],
  legendary: [
    { freq: 523.25, startOffset: 0, duration: 0.14, gain: 0.09, type: 'triangle' },
    { freq: 659.25, startOffset: 0.07, duration: 0.15, gain: 0.09, type: 'triangle' },
    { freq: 783.99, startOffset: 0.14, duration: 0.18, gain: 0.1, type: 'triangle' },
    { freq: 987.77, startOffset: 0.22, duration: 0.22, gain: 0.09, type: 'sine' },
    { freq: 1046.5, startOffset: 0.3, duration: 0.44, gain: 0.11, type: 'sine' },
    { freq: 523.25, startOffset: 0.3, duration: 0.42, gain: 0.06, type: 'sine' },
  ],
}

const XP_GAIN_MELODY: ToneSpec[] = [
  { freq: 587.33, startOffset: 0, duration: 0.11, gain: 0.07, type: 'sine' },
  { freq: 880.0, startOffset: 0.08, duration: 0.19, gain: 0.08, type: 'triangle' },
]

const LEVEL_UP_MELODY: ToneSpec[] = [
  { freq: 523.25, startOffset: 0, duration: 0.12, gain: 0.08, type: 'triangle' },
  { freq: 659.25, startOffset: 0.08, duration: 0.12, gain: 0.09, type: 'triangle' },
  { freq: 783.99, startOffset: 0.16, duration: 0.14, gain: 0.09, type: 'triangle' },
  { freq: 1046.5, startOffset: 0.24, duration: 0.36, gain: 0.11, type: 'sine' },
]

function playMelody(notes: ToneSpec[], soundEnabled: boolean): void {
  if (!soundEnabled) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = note.type
      osc.frequency.setValueAtTime(note.freq, now + note.startOffset)

      gainNode.gain.setValueAtTime(0.0001, now + note.startOffset)
      gainNode.gain.exponentialRampToValueAtTime(note.gain, now + note.startOffset + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.startOffset + note.duration
      )

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(now + note.startOffset)
      osc.stop(now + note.startOffset + note.duration + 0.02)
    }
  } catch {
    /* Безопасно игнорируем любые ограничения Web Audio API */
  }
}

/** Звуковой эффект получения достижения по редкости */
export function playAchievementSound(rarity: AchievementRarity, soundEnabled: boolean): void {
  playMelody(RARITY_MELODIES[rarity] ?? RARITY_MELODIES.common, soundEnabled)
}

/** Короткий звуковой эффект начисления XP */
export function playXPSound(soundEnabled: boolean): void {
  playMelody(XP_GAIN_MELODY, soundEnabled)
}

/** Праздничный звуковой эффект повышения уровня */
export function playLevelUpSound(soundEnabled: boolean): void {
  playMelody(LEVEL_UP_MELODY, soundEnabled)
}
