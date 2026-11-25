import { useEffect, useState } from 'react'

const LINE_ONE = 'Разбирайся в праве.'
const LINE_TWO = 'Уверенно.'
const TOTAL_CHARS = LINE_ONE.length + LINE_TWO.length

/** Флаг на уровне модуля: анимация печати запускается только один раз за загрузку сайта */
let hasTypedOnceInSession = false

function isReducedMotionPreferred(): boolean {
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

interface HeroTypewriterTitleProps {
  /** Сигнал начала печати (поступает при завершении стартового прелоадера) */
  start: boolean
}

export function HeroTypewriterTitle({ start }: HeroTypewriterTitleProps) {
  const skipAnimation = hasTypedOnceInSession || isReducedMotionPreferred()

  const [typedCount, setTypedCount] = useState<number>(() =>
    skipAnimation ? TOTAL_CHARS : 0
  )
  const [showCursor, setShowCursor] = useState<boolean>(() => !skipAnimation)
  const [isDone, setIsDone] = useState<boolean>(() => skipAnimation)

  useEffect(() => {
    if (hasTypedOnceInSession || isReducedMotionPreferred()) {
      hasTypedOnceInSession = true
      setTypedCount(TOTAL_CHARS)
      setIsDone(true)
      setShowCursor(false)
      return
    }

    if (!start) return

    let cancelled = false
    let current = 0
    let timerId: number | null = null
    let cursorHideTimerId: number | null = null

    const step = () => {
      if (cancelled) return
      current += 1
      setTypedCount(current)

      if (current >= TOTAL_CHARS) {
        hasTypedOnceInSession = true
        setIsDone(true)
        // После завершения печати курсор мягко исчезает
        cursorHideTimerId = window.setTimeout(() => {
          if (!cancelled) {
            setShowCursor(false)
          }
        }, 1150)
        return
      }

      // Небольшая естественная пауза после точки в конце первой строки
      const delay = current === LINE_ONE.length ? 220 : current > LINE_ONE.length ? 56 : 44
      timerId = window.setTimeout(step, delay)
    }

    // Небольшая задержка синхронизации с fade-out прелоадера
    timerId = window.setTimeout(step, 140)

    return () => {
      cancelled = true
      if (timerId !== null) window.clearTimeout(timerId)
      if (cursorHideTimerId !== null) window.clearTimeout(cursorHideTimerId)
    }
  }, [start])

  const visibleLineOne = LINE_ONE.slice(0, Math.min(typedCount, LINE_ONE.length))
  const visibleLineTwo =
    typedCount > LINE_ONE.length ? LINE_TWO.slice(0, typedCount - LINE_ONE.length) : ''
  const cursorOnLineOne = showCursor && typedCount <= LINE_ONE.length
  const cursorOnLineTwo = showCursor && typedCount > LINE_ONE.length

  return (
    <h1
      className="hero-typewriter-heading"
      aria-label={`${LINE_ONE} ${LINE_TWO}`}
    >
      {/* Невидимый резервный макет полностью исключает скачки интерфейса во время печати */}
      <span className="hero-tw-ghost" aria-hidden="true">
        {LINE_ONE}
        <br />
        <span>{LINE_TWO}</span>
      </span>

      {/* Видимый посимвольный слой печати с плавным переливающимся градиентом */}
      <span className="hero-tw-live" aria-hidden="true">
        <span className="hero-gradient-shimmer">{visibleLineOne}</span>
        {cursorOnLineOne && (
          <span className={`hero-tw-cursor ${isDone ? 'is-finishing' : ''}`} />
        )}
        {typedCount > LINE_ONE.length && (
          <>
            <br />
            <span className="hero-gradient-shimmer hero-gradient-line-two">
              {visibleLineTwo}
            </span>
            {cursorOnLineTwo && (
              <span className={`hero-tw-cursor ${isDone ? 'is-finishing' : ''}`} />
            )}
          </>
        )}
      </span>
    </h1>
  )
}
