import { useEffect } from 'react'

/**
 * Селекторы содержательных элементов, которые плавно появляются при прокрутке.
 * Анимируем отдельные блоки и карточки (не целиком огромные страницы),
 * чтобы сохранять 60 FPS и не задерживать доступ к контенту.
 */
const REVEAL_SELECTOR = [
  '.learning-intro-block',
  '.section-header-row',
  '.promo-expandable-card',
  '.edu-card',
  '.lib-cat-card',
  '.lib-topic-card',
  '.ach2-card',
  '.stat-card',
  '.settings-card',
  '.penalty-card',
  '.xp-achievements-cta-bar',
  '.achievements-summary-strip',
  '.footer-disclaimer-card',
].join(', ')

/** Карточки в сетках, для которых уместна короткая последовательная задержка (stagger) */
const STAGGER_ITEM_SELECTOR =
  '.edu-card, .lib-cat-card, .lib-topic-card, .ach2-card, .stat-card, .settings-card'

/**
 * Централизованный IntersectionObserver для однократного плавного появления контента при прокрутке.
 * - Элементы в видимой области на момент загрузки/перехода показываются сразу (без задержки и мерцания).
 * - При prefers-reduced-motion: reduce ничего не скрывает.
 * - Запускается строго один раз для каждого элемента (после появления снимается с наблюдения).
 */
export function useScrollReveal(routeKey: string) {
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        el.dataset.reveal = 'visible'
      })
      return
    }

    const observedSet = new WeakSet<HTMLElement>()
    const visibleThresholdY = () => window.innerHeight * 0.96

    const revealElement = (el: HTMLElement) => {
      el.dataset.reveal = 'visible'
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            revealElement(target)
            observer.unobserve(target)
          }
        }
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -32px 0px',
      }
    )

    const scanElements = () => {
      const nodes = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
      const parentIndexMap = new WeakMap<Element, number>()

      nodes.forEach((el) => {
        if (
          observedSet.has(el) ||
          el.dataset.reveal === 'visible' ||
          el.dataset.reveal === 'immediate'
        ) {
          return
        }
        observedSet.add(el)

        const rect = el.getBoundingClientRect()
        // Всё, что уже в первом экране или выше текущей позиции прокрутки, показываем мгновенно
        if (rect.top <= visibleThresholdY()) {
          el.dataset.reveal = 'immediate'
          return
        }

        // Короткая каскадная задержка только для соседних карточек в сетке (макс. 180 мс)
        if (el.matches(STAGGER_ITEM_SELECTOR) && el.parentElement) {
          const siblingIdx = parentIndexMap.get(el.parentElement) ?? 0
          parentIndexMap.set(el.parentElement, siblingIdx + 1)
          const delayMs = Math.min(siblingIdx, 4) * 45
          el.style.setProperty('--reveal-delay', `${delayMs}ms`)
        } else {
          el.style.setProperty('--reveal-delay', '0ms')
        }

        el.dataset.reveal = 'hidden'
        observer.observe(el)
      })
    }

    // Первичное сканирование после отрисовки нового маршрута
    const initRaf = window.requestAnimationFrame(scanElements)

    // Лёгкое отслеживание динамически добавляемых блоков (переключение вкладок, фильтров, подразделов)
    let mutationRaf = 0
    const mainEl = document.querySelector('main.site-main')
    let mutationObserver: MutationObserver | null = null

    if (mainEl && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        if (mutationRaf !== 0) return
        mutationRaf = window.requestAnimationFrame(() => {
          mutationRaf = 0
          scanElements()
        })
      })
      mutationObserver.observe(mainEl, { childList: true, subtree: true })
    }

    return () => {
      window.cancelAnimationFrame(initRaf)
      if (mutationRaf !== 0) window.cancelAnimationFrame(mutationRaf)
      observer.disconnect()
      if (mutationObserver) mutationObserver.disconnect()
    }
  }, [routeKey])
}
