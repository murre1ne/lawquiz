import { useEffect, useRef } from 'react'

interface ScrollProgressBarProps {
  /** Ключ текущего маршрута/подраздела для корректного сброса и пересчёта индикатора */
  routeKey: string
}

/**
 * Тонкая верхняя полоска индикатора прокрутки страницы (3px).
 * Обновляет transform: scaleX(...) напрямую через DOM ref в requestAnimationFrame,
 * не вызывая лишних React-перерисовок при скролле и не смещая шапку.
 */
export function ScrollProgressBar({ routeKey }: ScrollProgressBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let rafId = 0

    const updateProgress = () => {
      rafId = 0
      const fillEl = fillRef.current
      const barEl = barRef.current
      if (!fillEl || !barEl) return

      const docEl = document.documentElement
      const scrollTop = window.scrollY || docEl.scrollTop || 0
      const scrollable = Math.max(0, docEl.scrollHeight - window.innerHeight)

      if (scrollable <= 2) {
        fillEl.style.transform = 'scaleX(0)'
        barEl.setAttribute('data-visible', 'false')
        return
      }

      const ratio = Math.min(1, Math.max(0, scrollTop / scrollable))
      fillEl.style.transform = `scaleX(${ratio.toFixed(4)})`
      barEl.setAttribute('data-visible', ratio > 0.002 ? 'true' : 'false')
    }

    const scheduleUpdate = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(updateProgress)
    }

    // Немедленный сброс и пересчёт при смене маршрута
    updateProgress()
    const settleRaf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updateProgress)
    })

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(document.documentElement)
      if (document.body) {
        resizeObserver.observe(document.body)
      }
    }

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(settleRaf)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [routeKey])

  return (
    <div
      ref={barRef}
      className="scroll-progress-bar"
      data-visible="false"
      aria-hidden="true"
    >
      <div ref={fillRef} className="scroll-progress-fill" />
    </div>
  )
}
