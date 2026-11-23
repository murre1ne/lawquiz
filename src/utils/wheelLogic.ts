import type { WheelAnswerRecord, WheelQuestion } from '../data/wheelQuestions'

export const WHEEL_SECTOR_COUNT = 10
export const WHEEL_SLICE_ANGLE = 360 / WHEEL_SECTOR_COUNT // 36° на сектор

/**
 * Алгоритм случайного перемешивания Фишера-Йетса
 */
export function shuffleWheelQuestions(questions: WheelQuestion[]): WheelQuestion[] {
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Выбирает случайный индекс сектора исключительно среди ещё не пройденных секторов
 */
export function pickRandomRemainingSector(remainingSectors: number[]): number | null {
  if (remainingSectors.length === 0) return null
  const randomIdx = Math.floor(Math.random() * remainingSectors.length)
  return remainingSectors[randomIdx]
}

/**
 * Вычисляет целевой угол вращения (по часовой стрелке, в градусах),
 * чтобы центр выбранного сектора гарантированно остановился под верхним указателем (12 часов).
 *
 * Сектор i занимает диапазон [i * 36°, (i + 1) * 36°) от 12 часов по часовой стрелке.
 * Центр сектора i находится на угле (i * 36 + 18)°.
 * После поворота колеса на R° по часовой стрелке этот центр окажется в 0° (12 часов),
 * если (i * 36 + 18 + R) ≡ 0 (mod 360), т.е. R ≡ (360 - (i * 36 + 18)) (mod 360).
 */
export function calculateSpinTargetAngle(currentRotation: number, targetSectorIndex: number): number {
  const sectorCenter = targetSectorIndex * WHEEL_SLICE_ANGLE + WHEEL_SLICE_ANGLE / 2
  // Небольшое естественное смещение внутри сектора (±9° при полуширине 18°), чтобы стрелка не попадала на границу
  const organicJitter = (Math.random() * 2 - 1) * 9
  const desiredMod = (((360 - sectorCenter + organicJitter) % 360) + 360) % 360

  const currentMod = ((currentRotation % 360) + 360) % 360
  let deltaToTarget = desiredMod - currentMod
  if (deltaToTarget <= 0) {
    deltaToTarget += 360
  }

  // 5–7 полных оборотов для выразительного и естественного вращения
  const extraFullTurns = (5 + Math.floor(Math.random() * 3)) * 360
  return currentRotation + extraFullTurns + deltaToTarget
}

/**
 * Плавная функция замедления (easeOutQuart) для естественной инерции колеса
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Подсчёт итоговых показателей завершённой игры
 */
export function evaluateWheelResult(history: WheelAnswerRecord[], totalQuestions: number) {
  const correctCount = history.filter((item) => item.isCorrect).length
  const wrongCount = history.length - correctCount
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  let gradeTitle = 'Хороший старт!'
  let gradeMessage =
    'Повторите ключевые нормы в Правовой библиотеке и покрутите колесо ещё раз — результат обязательно вырастет.'

  if (percentage >= 90) {
    gradeTitle = 'Блестящий результат!'
    gradeMessage =
      'Вы превосходно ориентируетесь как в Общей, так и в Особенной части Гражданского кодекса РК!'
  } else if (percentage >= 70) {
    gradeTitle = 'Уверенный уровень!'
    gradeMessage =
      'Отличная правовая подготовка. Осталось закрепить буквально несколько норм ГК РК.'
  } else if (percentage >= 50) {
    gradeTitle = 'Достойная база!'
    gradeMessage =
      'Больше половины ответов верны. Обратите внимание на объяснения и статьи ГК РК по спорным вопросам.'
  }

  return {
    correctCount,
    wrongCount,
    percentage,
    gradeTitle,
    gradeMessage,
  }
}
