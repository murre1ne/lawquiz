import { useEffect, useRef, useState } from 'react'

export type RoutePageKey =
  | 'home'
  | 'library'
  | 'trainer'
  | 'practice'
  | 'games'
  | 'achievements'
  | 'settings'

/** Длительность активной фазы компактной анимации перехода (мс) */
export const ROUTE_TRANSITION_HOLD_MS = 340
/** Длительность плавного растворения оверлея (мс) */
export const ROUTE_TRANSITION_EXIT_MS = 200

const SECTION_LABELS: Record<RoutePageKey, string> = {
  home: 'Главная',
  library: 'Правовая библиотека',
  trainer: 'Тренажёр знаний',
  practice: 'Юридическая практика',
  games: 'Игровая зона',
  achievements: 'Достижения',
  settings: 'Настройки',
}

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

interface RouteTransitionOverlayProps {
  /** Текущий активный раздел/страница */
  pageKey: RoutePageKey
  /** Включается только после завершения первоначальной загрузки сайта */
  enabled: boolean
  /** Сообщает родителю, когда идёт фаза перехода, для синхронизации плавного появления контента */
  onTransitionStateChange?: (active: boolean) => void
}

/**
 * Компактная анимация перехода между разделами Law Quiz KZ (~540 мс).
 * - Стилистически перекликается с первоначальным экраном «Правовой поиск»,
 *   но выполнена в виде лёгкой мини-композиции (без дублирования большого прелоадера).
 * - Запускается строго при реальной смене раздела (включая возврат на главную и Назад/Вперёд в браузере).
 * - При prefers-reduced-motion: reduce не задерживает переход.
 */
export function RouteTransitionOverlay({
  pageKey,
  enabled,
  onTransitionStateChange,
}: RouteTransitionOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'active' | 'exiting'>('idle')
  const [label, setLabel] = useState<string>(SECTION_LABELS[pageKey])
  const [runId, setRunId] = useState<number>(0)

  const prevPageKeyRef = useRef<RoutePageKey>(pageKey)
  const holdTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const callbackRef = useRef(onTransitionStateChange)
  callbackRef.current = onTransitionStateChange

  useEffect(() => {
    const clearTimers = () => {
      if (rafRef.current !== 0) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }

    // Во время первоначального прелоадера просто синхронизируем текущий ключ без повторной заставки
    if (!enabled) {
      prevPageKeyRef.current = pageKey
      return
    }

    if (prevPageKeyRef.current === pageKey) {
      return
    }

    prevPageKeyRef.current = pageKey

    if (prefersReducedMotion()) {
      clearTimers()
      setPhase('idle')
      callbackRef.current?.(false)
      return
    }

    clearTimers()
    setLabel(SECTION_LABELS[pageKey])
    setRunId((n) => n + 1)
    setPhase('active')
    callbackRef.current?.(true)

    // Ждём ближайший кадр отрисовки нового содержимого и без лишних задержек завершаем компактный переход
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null
        setPhase('exiting')
        callbackRef.current?.(false)

        exitTimerRef.current = window.setTimeout(() => {
          exitTimerRef.current = null
          setPhase('idle')
        }, ROUTE_TRANSITION_EXIT_MS)
      }, ROUTE_TRANSITION_HOLD_MS)
    })

    return clearTimers
  }, [pageKey, enabled])

  if (phase === 'idle') {
    return null
  }

  return (
    <div
      key={runId}
      className={`lqkz-route-transition ${phase === 'exiting' ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Переход в раздел: ${label}`}
    >
      <div className="lqkz-rt-card" aria-hidden="true">
        <div className="lqkz-rt-emblem">
          <span className="lqkz-rt-halo" />
          {/* Компактная мини-композиция в стиле «Правовой поиск»: мини-лист + лёгкий проход лупы */}
          <div className="lqkz-rt-mini-doc">
            <span className="lqkz-rt-doc-line lqkz-rt-doc-line--1" />
            <span className="lqkz-rt-doc-line lqkz-rt-doc-line--2" />
            <span className="lqkz-rt-doc-line lqkz-rt-doc-line--3" />
          </div>
          <svg
            className="lqkz-rt-mini-loupe"
            width="34"
            height="34"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="15"
              cy="15"
              r="8.5"
              fill="rgba(52, 211, 153, 0.22)"
              stroke="#1b7a4c"
              strokeWidth="2.6"
            />
            <path
              d="M11.6 12.2C12.5 11.1 13.8 10.6 15.2 10.7"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.9"
            />
            <line
              x1="21.4"
              y1="21.4"
              x2="29.5"
              y2="29.5"
              stroke="#14532d"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="lqkz-rt-meta">
          <span className="lqkz-rt-label">{label}</span>
          <span className="lqkz-rt-track">
            <span className="lqkz-rt-bar" />
          </span>
        </div>
      </div>
    </div>
  )
}
