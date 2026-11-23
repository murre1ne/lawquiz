import type { WheelSectorStatus } from '../data/wheelQuestions'
import { WHEEL_SECTOR_COUNT, WHEEL_SLICE_ANGLE } from '../utils/wheelLogic'

interface FortuneWheelSvgProps {
  rotation: number
  isSpinning: boolean
  pointerTick: boolean
  sectorStatuses: WheelSectorStatus[]
  highlightedSector: number | null
  onCenterSpinClick: () => void
  canSpin: boolean
}

const SECTOR_PALETTE = [
  { fill: '#1b7a4c', stroke: '#145c38', text: '#ffffff' }, // 1 — Изумруд
  { fill: '#0284c7', stroke: '#0369a1', text: '#ffffff' }, // 2 — Небесно-голубой РК
  { fill: '#d97706', stroke: '#b45309', text: '#ffffff' }, // 3 — Степное золото
  { fill: '#7c3aed', stroke: '#6d28d9', text: '#ffffff' }, // 4 — Королевский фиолет
  { fill: '#0d9488', stroke: '#0f766e', text: '#ffffff' }, // 5 — Глубокая бирюза
  { fill: '#e11d48', stroke: '#be123c', text: '#ffffff' }, // 6 — Коралловый рубин
  { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff' }, // 7 — Сапфировый синий
  { fill: '#16a34a', stroke: '#15803d', text: '#ffffff' }, // 8 — Свежий зелёный
  { fill: '#db2777', stroke: '#be185d', text: '#ffffff' }, // 9 — Малиновый
  { fill: '#0891b2', stroke: '#0e7490', text: '#ffffff' }, // 10 — Морской циан
]

const CX = 200
const CY = 200
const OUTER_R = 178
const LABEL_R = 126
const STATUS_R = 88

function polarToCartesian(cx: number, cy: number, radius: number, angleDegFromTop: number) {
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function createSlicePath(index: number): string {
  const startAngle = index * WHEEL_SLICE_ANGLE
  const endAngle = (index + 1) * WHEEL_SLICE_ANGLE
  const start = polarToCartesian(CX, CY, OUTER_R, startAngle)
  const end = polarToCartesian(CX, CY, OUTER_R, endAngle)
  return `M ${CX} ${CY} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${OUTER_R} ${OUTER_R} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

export function FortuneWheelSvg({
  rotation,
  isSpinning,
  pointerTick,
  sectorStatuses,
  highlightedSector,
  onCenterSpinClick,
  canSpin,
}: FortuneWheelSvgProps) {
  return (
    <div className="wheel-stage" aria-label="Интерактивное колесо фортуны с 10 секторами">
      {/* Стрелка-указатель сверху (12 часов) */}
      <div
        className={`wheel-pointer-wrap ${pointerTick ? 'is-ticking' : ''}`}
        aria-hidden="true"
      >
        <svg width="42" height="48" viewBox="0 0 42 48" fill="none">
          <defs>
            <linearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id="pointerShadow" x="-20%" y="-10%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.32" />
            </filter>
          </defs>
          <path
            d="M21 45 L4 14 C2.5 11 4.5 6 8.5 6 L33.5 6 C37.5 6 39.5 11 38 14 Z"
            fill="url(#pointerGrad)"
            stroke="#ffffff"
            strokeWidth="2.5"
            filter="url(#pointerShadow)"
          />
          <circle cx="21" cy="14" r="4.5" fill="#fef3c7" />
        </svg>
      </div>

      {/* Вращающееся колесо */}
      <div className="wheel-canvas-frame">
        <svg
          className={`wheel-svg ${isSpinning ? 'is-spinning' : ''}`}
          viewBox="0 0 400 400"
          role="img"
          aria-label="Колесо-фортуна с десятью секторами вопросов"
        >
          <defs>
            <radialGradient id="wheelOuterRim" cx="50%" cy="50%" r="50%">
              <stop offset="86%" stopColor="#1b4332" />
              <stop offset="94%" stopColor="#2d6a4f" />
              <stop offset="100%" stopColor="#0f291e" />
            </radialGradient>
            <radialGradient id="wheelGloss" cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
            </radialGradient>
          </defs>

          {/* Декоративный внешний обод */}
          <circle cx={CX} cy={CY} r={194} fill="url(#wheelOuterRim)" />
          <circle
            cx={CX}
            cy={CY}
            r={186}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeOpacity="0.72"
          />

          {/* Вращаемая группа секторов и штифтов */}
          <g transform={`rotate(${rotation} ${CX} ${CY})`}>
            {Array.from({ length: WHEEL_SECTOR_COUNT }, (_, idx) => {
              const status = sectorStatuses[idx] ?? 'available'
              const isPlayed = status !== 'available'
              const isHighlighted = highlightedSector === idx
              const colors = SECTOR_PALETTE[idx % SECTOR_PALETTE.length]
              const midAngle = idx * WHEEL_SLICE_ANGLE + WHEEL_SLICE_ANGLE / 2
              const labelPos = polarToCartesian(CX, CY, LABEL_R, midAngle)
              const statusPos = polarToCartesian(CX, CY, STATUS_R, midAngle)
              const pegPos = polarToCartesian(CX, CY, 186, idx * WHEEL_SLICE_ANGLE)

              return (
                <g key={idx} className={`wheel-sector ${isPlayed ? 'sector-played' : ''}`}>
                  <path
                    d={createSlicePath(idx)}
                    fill={colors.fill}
                    fillOpacity={isPlayed ? 0.36 : 1}
                    stroke="#ffffff"
                    strokeWidth={isHighlighted ? 3.5 : 2}
                    strokeOpacity={isHighlighted ? 1 : 0.88}
                  />
                  {/* Номер сектора 1–10 */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={colors.text}
                    fillOpacity={isPlayed ? 0.65 : 1}
                    fontSize="20"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${midAngle} ${labelPos.x} ${labelPos.y})`}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {idx + 1}
                  </text>

                  {/* Индикатор пройденного сектора */}
                  {isPlayed && (
                    <g transform={`translate(${statusPos.x}, ${statusPos.y})`}>
                      <circle
                        r="11"
                        fill={status === 'correct' ? '#16a34a' : '#dc2626'}
                        stroke="#ffffff"
                        strokeWidth="1.8"
                      />
                      <text
                        x="0"
                        y="0.5"
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {status === 'correct' ? '✓' : '✗'}
                      </text>
                    </g>
                  )}

                  {/* Золотой штифт на границе сектора */}
                  <circle
                    cx={pegPos.x}
                    cy={pegPos.y}
                    r="4"
                    fill="#fef08a"
                    stroke="#92400e"
                    strokeWidth="1.2"
                  />
                </g>
              )
            })}

            {/* Лёгкий стеклянный блик на диске */}
            <circle
              cx={CX}
              cy={CY}
              r={OUTER_R}
              fill="url(#wheelGloss)"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        </svg>

        {/* Центральный медальон-кнопка */}
        <button
          type="button"
          className={`wheel-center-hub ${canSpin ? 'can-spin' : ''}`}
          onClick={onCenterSpinClick}
          disabled={!canSpin}
          aria-label="Крутить колесо-фортуна"
          title={canSpin ? 'Крутить колесо' : undefined}
        >
          <span className="wheel-hub-icon" aria-hidden="true">
            ⚖
          </span>
        </button>
      </div>
    </div>
  )
}
