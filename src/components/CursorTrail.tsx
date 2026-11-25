import { memo, useEffect, useRef } from 'react'

/** Фиксированный пул частиц — DOM-элементы никогда не накапливаются и не пересоздаются */
const TRAIL_POOL_SIZE = 10
/** Минимальная дистанция между соседними точками шлейфа (px), чтобы не было «комков» */
const MIN_SPAWN_DISTANCE_PX = 11
/** Время растворения одной частицы (мс) */
const PARTICLE_LIFE_MS = 380

interface TrailParticle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  baseScale: number
}

function createEmptyPool(): TrailParticle[] {
  return Array.from({ length: TRAIL_POOL_SIZE }, () => ({
    active: false,
    x: -100,
    y: -100,
    vx: 0,
    vy: 0,
    age: 0,
    life: PARTICLE_LIFE_MS,
    baseScale: 1,
  }))
}

/**
 * Деликатный шлейф курсора из мягких изумрудных световых точек.
 * - Работает только на устройствах с точным указателем (мышь) и отключается на мобильных/touch-экранах.
 * - Использует фиксированный пул DOM-элементов и on-demand requestAnimationFrame (0% CPU в покое).
 * - Полностью прозрачен для кликов, ссылок и выделения текста (pointer-events: none).
 */
export const CursorTrail = memo(function CursorTrail() {
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const isEnabled = () => pointerQuery.matches && !motionQuery.matches

    const pool = createEmptyPool()
    let cursorIndex = 0
    let lastSpawnX = 0
    let lastSpawnY = 0
    let hasLastSpawn = false
    let rafId = 0
    let lastFrameTime = 0

    const hideAllDots = () => {
      for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
        pool[i].active = false
        const el = dotRefs.current[i]
        if (el) {
          el.style.opacity = '0'
        }
      }
      hasLastSpawn = false
    }

    const stopLoop = () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
      lastFrameTime = 0
    }

    const tick = (now: number) => {
      const dt = lastFrameTime === 0 ? 16 : Math.min(40, Math.max(4, now - lastFrameTime))
      lastFrameTime = now
      const dtRatio = dt / 16.67

      let anyActive = false

      for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
        const p = pool[i]
        const el = dotRefs.current[i]
        if (!p.active || !el) continue

        p.age += dt
        if (p.age >= p.life) {
          p.active = false
          el.style.opacity = '0'
          continue
        }

        anyActive = true

        // Лёгкая инерция с мягким затуханием скорости
        p.x += p.vx * dtRatio
        p.y += p.vy * dtRatio
        const friction = Math.pow(0.9, dtRatio)
        p.vx *= friction
        p.vy *= friction

        const t = p.age / p.life
        const inv = 1 - t
        const opacity = inv * inv * 0.56
        const scale = p.baseScale * (1 - t * 0.72)

        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
      }

      if (anyActive) {
        rafId = window.requestAnimationFrame(tick)
      } else {
        stopLoop()
      }
    }

    const ensureLoop = () => {
      if (rafId === 0) {
        lastFrameTime = 0
        rafId = window.requestAnimationFrame(tick)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isEnabled() || e.pointerType !== 'mouse') return

      const x = e.clientX
      const y = e.clientY

      if (!hasLastSpawn) {
        lastSpawnX = x
        lastSpawnY = y
        hasLastSpawn = true
        return
      }

      const dx = x - lastSpawnX
      const dy = y - lastSpawnY
      const distSq = dx * dx + dy * dy

      if (distSq < MIN_SPAWN_DISTANCE_PX * MIN_SPAWN_DISTANCE_PX) {
        return
      }

      // Ограничиваем инерцию, чтобы частицы мягко отставали и не разлетались при резких движениях
      const clampVel = (v: number) => Math.max(-1.6, Math.min(1.6, v))
      const slot = pool[cursorIndex]
      slot.active = true
      slot.x = x
      slot.y = y
      slot.vx = clampVel(dx * 0.032)
      slot.vy = clampVel(dy * 0.032)
      slot.age = 0
      slot.life = PARTICLE_LIFE_MS + (cursorIndex % 3) * 35
      slot.baseScale = 0.86 + (cursorIndex % 3) * 0.14

      const el = dotRefs.current[cursorIndex]
      if (el) {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${slot.baseScale.toFixed(3)})`
        el.style.opacity = '0.56'
      }

      cursorIndex = (cursorIndex + 1) % TRAIL_POOL_SIZE
      lastSpawnX = x
      lastSpawnY = y
      ensureLoop()
    }

    const handlePointerLeave = () => {
      hasLastSpawn = false
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop()
        hideAllDots()
      }
    }

    const handleMediaChange = () => {
      if (!isEnabled()) {
        stopLoop()
        hideAllDots()
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    window.addEventListener('blur', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    pointerQuery.addEventListener?.('change', handleMediaChange)
    motionQuery.addEventListener?.('change', handleMediaChange)

    return () => {
      stopLoop()
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      pointerQuery.removeEventListener?.('change', handleMediaChange)
      motionQuery.removeEventListener?.('change', handleMediaChange)
    }
  }, [])

  return (
    <div className="cursor-trail-layer" aria-hidden="true">
      {Array.from({ length: TRAIL_POOL_SIZE }, (_, idx) => (
        <span
          key={idx}
          ref={(node) => {
            dotRefs.current[idx] = node
          }}
          className={`cursor-trail-dot cursor-trail-dot--tone-${idx % 3}`}
        />
      ))}
    </div>
  )
})
