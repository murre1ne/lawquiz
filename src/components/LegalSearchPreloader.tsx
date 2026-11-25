import { useEffect, useState } from 'react'

/** Минимальное время показа фирменной анимации «Правовой поиск» (мс) */
export const PRELOADER_MIN_DURATION_MS = 1600
/** Сокращённое время показа при активном prefers-reduced-motion (мс) */
export const PRELOADER_REDUCED_MOTION_MS = 450
/** Длительность плавного исчезновения (fade-out, мс) */
export const PRELOADER_FADEOUT_MS = 440
/** Жёсткий защитный таймер, исключающий бесконечный экран загрузки при любой ошибке (мс) */
export const PRELOADER_FAILSAFE_MAX_MS = 3500

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

interface LegalSearchPreloaderProps {
  onRevealStart?: () => void
}

export function LegalSearchPreloader({ onRevealStart }: LegalSearchPreloaderProps) {
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'hidden'>('visible')

  useEffect(() => {
    // Сразу передаём эстафету от HTML-щита к React-заставке без мерцания
    document.documentElement.classList.remove('lqkz-booting')
    document.documentElement.style.backgroundColor = ''

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const reducedMotion = prefersReducedMotion()
    const minDuration = reducedMotion ? PRELOADER_REDUCED_MOTION_MS : PRELOADER_MIN_DURATION_MS

    let minElapsed = false
    let pageReady = document.readyState === 'complete'
    let hasStartedExit = false
    let unmountTimerId: number | null = null

    const beginExit = () => {
      if (hasStartedExit) return
      hasStartedExit = true
      // Возвращаем прокрутку сразу при начале fade-out, чтобы интерфейс не ощущался заблокированным
      document.body.style.overflow = prevOverflow
      setPhase('exiting')
      onRevealStart?.()
      unmountTimerId = window.setTimeout(() => {
        setPhase('hidden')
      }, reducedMotion ? 220 : PRELOADER_FADEOUT_MS)
    }

    const tryComplete = () => {
      if (minElapsed && pageReady) {
        beginExit()
      }
    }

    const minTimerId = window.setTimeout(() => {
      minElapsed = true
      tryComplete()
    }, minDuration)

    const failsafeTimerId = window.setTimeout(() => {
      beginExit()
    }, PRELOADER_FAILSAFE_MAX_MS)

    const handleWindowLoad = () => {
      pageReady = true
      tryComplete()
    }

    if (!pageReady) {
      window.addEventListener('load', handleWindowLoad, { once: true })
    }

    return () => {
      window.clearTimeout(minTimerId)
      window.clearTimeout(failsafeTimerId)
      if (unmountTimerId !== null) {
        window.clearTimeout(unmountTimerId)
      }
      window.removeEventListener('load', handleWindowLoad)
      document.body.style.overflow = prevOverflow
      document.documentElement.classList.remove('lqkz-booting')
    }
  }, [])

  if (phase === 'hidden') {
    return null
  }

  return (
    <div
      className={`lqkz-preloader ${phase === 'exiting' ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={phase === 'visible'}
      aria-label="Загрузка Law Quiz KZ — ищем правовую информацию"
    >
      <div className="lqkz-preloader-inner">
        {/* Фирменный логотип Law Quiz KZ */}
        <div className="lqkz-preloader-brand">
          <span className="lqkz-preloader-mark" aria-hidden="true">
            LQ
          </span>
          <div className="lqkz-preloader-brand-text">
            <span className="lqkz-preloader-name">
              Law Quiz <span className="lqkz-preloader-accent">KZ</span>
            </span>
            <span className="lqkz-preloader-tagline">Гражданское право РК</span>
          </div>
        </div>

        {/* Центральная композиция «Правовой поиск»: юридический документ + сканирующая лупа */}
        <div className="lqkz-preloader-stage" aria-hidden="true">
          <div className="lqkz-preloader-halo" />

          {/* Стилизованный юридический документ */}
          <div className="lqkz-doc-sheet">
            <div className="lqkz-doc-fold" />

            {/* Шапка юридического акта */}
            <div className="lqkz-doc-header">
              <span className="lqkz-doc-emblem">⚖</span>
              <div className="lqkz-doc-header-bars">
                <span className="lqkz-doc-meta-tag">ГК РК</span>
                <span className="lqkz-doc-title-bar" />
              </div>
            </div>

            {/* Строки юридического текста (отдельные строки подсвечиваются при сканировании лупой) */}
            <div className="lqkz-doc-body">
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num">§1</span>
                <span className="lqkz-doc-line lqkz-line-1" />
              </div>
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num">1.</span>
                <span className="lqkz-doc-line lqkz-line-2 lqkz-line-scan-a" />
              </div>
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num">2.</span>
                <span className="lqkz-doc-line lqkz-line-3" />
              </div>
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num">3.</span>
                <span className="lqkz-doc-line lqkz-line-4 lqkz-line-scan-b" />
              </div>
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num">4.</span>
                <span className="lqkz-doc-line lqkz-line-5 lqkz-line-scan-c" />
              </div>
              <div className="lqkz-doc-line-row">
                <span className="lqkz-doc-clause-num" />
                <span className="lqkz-doc-line lqkz-line-6" />
              </div>
            </div>

            {/* Нижняя строка со штампом / печатью документа */}
            <div className="lqkz-doc-footer">
              <span className="lqkz-doc-sig-line" />
              <span className="lqkz-doc-seal">✓</span>
            </div>
          </div>

          {/* Увеличительная лупа, плавно сканирующая строки документа */}
          <div className="lqkz-loupe-mover">
            <svg
              className="lqkz-loupe-svg"
              width="76"
              height="76"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="lqkzLensFill" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
                  <stop offset="55%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.24" />
                </linearGradient>
                <linearGradient id="lqkzRimGrad" x1="12" y1="12" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1b7a4c" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="lqkzHandleGrad" x1="50" y1="50" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#14532d" />
                  <stop offset="100%" stopColor="#1b7a4c" />
                </linearGradient>
              </defs>

              {/* Мягкая тень линзы */}
              <circle cx="34" cy="36" r="22" fill="rgba(16, 120, 74, 0.14)" />

              {/* Линза */}
              <circle
                cx="33"
                cy="33"
                r="20"
                fill="url(#lqkzLensFill)"
                stroke="url(#lqkzRimGrad)"
                strokeWidth="4.5"
              />

              {/* Внутренний блик стекла */}
              <path
                d="M22 25.5C24.4 21.8 28.4 19.6 33 19.6"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="20.5" cy="30" r="1.6" fill="rgba(255, 255, 255, 0.75)" />

              {/* Соединительное кольцо и рукоятка */}
              <path
                d="M48.2 48.2L53.2 53.2"
                stroke="#0f5f3a"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M52.5 52.5L68.5 68.5"
                stroke="url(#lqkzHandleGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M54 54L66.5 66.5"
                stroke="rgba(167, 243, 208, 0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Подпись статуса загрузки с плавной анимацией трёх точек */}
        <p className="lqkz-preloader-caption">
          <span>Ищем правовую информацию</span>
          <span className="lqkz-preloader-dots" aria-hidden="true">
            <span className="lqkz-dot lqkz-dot-1">.</span>
            <span className="lqkz-dot lqkz-dot-2">.</span>
            <span className="lqkz-dot lqkz-dot-3">.</span>
          </span>
        </p>
      </div>
    </div>
  )
}
