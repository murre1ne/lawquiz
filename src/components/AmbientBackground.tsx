import { memo } from 'react'

/**
 * Постоянный ненавязчивый живой фон с мягкими изумрудными свечениями (ambient glow).
 * Рендерится вне контейнера переходов страниц, чтобы не мерцать при смене маршрутов.
 * Использует только CSS radial-gradient, transform и opacity — без canvas/WebGL и тяжёлых blur-фильтров.
 */
export const AmbientBackground = memo(function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <span className="ambient-orb ambient-orb--1" />
      <span className="ambient-orb ambient-orb--2" />
      <span className="ambient-orb ambient-orb--3" />
    </div>
  )
})
