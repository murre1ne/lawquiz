/**
 * Учебные ситуации и чистые функции расчёта/валидации
 * для инструмента «Калькулятор договорной неустойки» Law Quiz KZ.
 *
 * Все ситуации являются вымышленными, а процентные ставки — условными
 * договорными условиями (не установленными законом тарифами).
 */

export interface PenaltyCaseStudy {
  id: string
  /** Уникальный номер дела (1, 2, 3) для учёта прогресса в едином хранилище */
  caseNumber: number
  code: string
  title: string
  circumstances: string
  amount: number
  rate: number
  days: number
  expectedPenalty: number
}

export const PENALTY_CALCULATOR_TASK_ID = 'practice-penalty-calculator'
export const PENALTY_ACHIEVEMENT_ID = 'ach-penalty-master'
export const PENALTY_ACHIEVEMENT_XP_REWARD = 30

export const MAX_PENALTY_AMOUNT = 1_000_000_000_000 // 1 трлн ₸
export const MAX_PENALTY_RATE = 100 // 100% в день
export const MAX_PENALTY_DAYS = 36_500 // 100 лет

export const ADILET_GK_RK_URL = 'https://adilet.zan.kz/rus/docs/K940001000_'

export const PENALTY_CASES: PenaltyCaseStudy[] = [
  {
    id: 'penalty-case-001',
    caseNumber: 1,
    code: 'Дело № 001',
    title: 'Просрочка аренды оборудования',
    circumstances:
      'Компания арендовала фотооборудование для мероприятия. По договору она должна была заплатить 120 000 ₸, но задержала оплату на 6 дней.',
    amount: 120000,
    rate: 0.1,
    days: 6,
    expectedPenalty: 720,
  },
  {
    id: 'penalty-case-002',
    caseNumber: 2,
    code: 'Дело № 002',
    title: 'Задержка ремонта ноутбуков',
    circumstances:
      'Сервисный центр обязался отремонтировать партию ноутбуков. Стоимость просроченных работ составляет 240 000 ₸. Ремонт завершён на 12 дней позже установленного срока.',
    amount: 240000,
    rate: 0.05,
    days: 12,
    expectedPenalty: 1440,
  },
  {
    id: 'penalty-case-003',
    caseNumber: 3,
    code: 'Дело № 003',
    title: 'Задержка поставки товаров',
    circumstances:
      'Поставщик должен был передать магазину партию товаров стоимостью 320 000 ₸. Он задержал поставку на 5 дней.',
    amount: 320000,
    rate: 0.2,
    days: 5,
    expectedPenalty: 3200,
  },
]

/** Округление до 2 знаков после запятой с защитой от двоичной погрешности float */
export function roundToTwo(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Безопасный парсинг пользовательского числового ввода:
 * допускает пробелы-разделители тысяч и запятую/точку как десятичный разделитель;
 * отклоняет пустые строки, NaN, Infinity, научную нотацию и мусорные символы.
 */
export function parseLocalizedNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/[\s\u00A0\u202F]+/g, '').replace(',', '.')
  if (!cleaned) return null
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  const num = Number(cleaned)
  if (!Number.isFinite(num)) return null
  return num
}

export interface PenaltyFieldErrors {
  amount?: string
  rate?: string
  days?: string
  general?: string
}

export interface PenaltyCalculationResult {
  amount: number
  rate: number
  days: number
  dailyPenalty: number
  totalPenalty: number
  hasZeroFactor: boolean
}

export interface PenaltyValidationResult {
  valid: boolean
  errors: PenaltyFieldErrors
  calculation: PenaltyCalculationResult | null
}

/**
 * Полная валидация и расчёт договорной неустойки по формуле:
 * Пеня = (Сумма обязательства × Ставка × Количество дней) / 100.
 * Гарантирует отсутствие NaN, Infinity и ошибок переполнения.
 */
export function validateAndCalculatePenalty(
  amountRaw: string,
  rateRaw: string,
  daysRaw: string
): PenaltyValidationResult {
  const errors: PenaltyFieldErrors = {}

  const amount = parseLocalizedNumber(amountRaw)
  const rate = parseLocalizedNumber(rateRaw)
  const days = parseLocalizedNumber(daysRaw)

  if (amountRaw.trim() === '') {
    errors.amount = 'Введите сумму обязательства.'
  } else if (amount === null) {
    errors.amount = 'Введите корректное числовое значение суммы.'
  } else if (amount < 0) {
    errors.amount = 'Сумма обязательства не может быть отрицательной.'
  } else if (amount > MAX_PENALTY_AMOUNT) {
    errors.amount = 'Слишком большая сумма (максимум 1 000 000 000 000 ₸).'
  }

  if (rateRaw.trim() === '') {
    errors.rate = 'Введите процентную ставку пени.'
  } else if (rate === null) {
    errors.rate = 'Введите корректное число (например, 0,1).'
  } else if (rate < 0) {
    errors.rate = 'Процентная ставка не может быть отрицательной.'
  } else if (rate > MAX_PENALTY_RATE) {
    errors.rate = 'Слишком высокая ставка (максимум 100% в день).'
  }

  if (daysRaw.trim() === '') {
    errors.days = 'Введите количество дней просрочки.'
  } else if (days === null) {
    errors.days = 'Введите корректное целое число дней.'
  } else if (days < 0) {
    errors.days = 'Количество дней просрочки не может быть отрицательным.'
  } else if (!Number.isInteger(days)) {
    errors.days = 'Количество дней просрочки должно быть целым числом.'
  } else if (days > MAX_PENALTY_DAYS) {
    errors.days = 'Слишком большое количество дней (максимум 36 500).'
  }

  if (errors.amount || errors.rate || errors.days || amount === null || rate === null || days === null) {
    return { valid: false, errors, calculation: null }
  }

  const dailyRaw = (amount * rate) / 100
  const totalRaw = (amount * rate * days) / 100

  if (
    !Number.isFinite(dailyRaw) ||
    !Number.isFinite(totalRaw) ||
    totalRaw > Number.MAX_SAFE_INTEGER
  ) {
    return {
      valid: false,
      errors: { general: 'Результат превышает допустимый диапазон безопасных вычислений.' },
      calculation: null,
    }
  }

  const dailyPenalty = roundToTwo(dailyRaw)
  const totalPenalty = roundToTwo(totalRaw)

  return {
    valid: true,
    errors: {},
    calculation: {
      amount,
      rate,
      days,
      dailyPenalty,
      totalPenalty,
      hasZeroFactor: amount === 0 || rate === 0 || days === 0,
    },
  }
}

/** Проверка ответа пользователя с учётом округления до 2 знаков после запятой */
export function isPenaltyAnswerCorrect(userAnswerRaw: string, expectedTotal: number): {
  valid: boolean
  parsedAnswer: number | null
  isCorrect: boolean
  error?: string
} {
  if (userAnswerRaw.trim() === '') {
    return {
      valid: false,
      parsedAnswer: null,
      isCorrect: false,
      error: 'Введите ваш расчёт суммы пени перед проверкой.',
    }
  }
  const parsed = parseLocalizedNumber(userAnswerRaw)
  if (parsed === null) {
    return {
      valid: false,
      parsedAnswer: null,
      isCorrect: false,
      error: 'Введите корректное число (например, 720 или 1 440).',
    }
  }
  if (parsed < 0) {
    return {
      valid: false,
      parsedAnswer: parsed,
      isCorrect: false,
      error: 'Сумма неустойки не может быть отрицательной.',
    }
  }
  if (parsed > Number.MAX_SAFE_INTEGER) {
    return {
      valid: false,
      parsedAnswer: parsed,
      isCorrect: false,
      error: 'Введённое значение слишком велико.',
    }
  }

  const roundedUser = roundToTwo(parsed)
  const roundedExpected = roundToTwo(expectedTotal)
  const isCorrect = Math.abs(roundedUser - roundedExpected) < 0.005

  return {
    valid: true,
    parsedAnswer: roundedUser,
    isCorrect,
  }
}

/** Проверяет, соответствуют ли введённые параметры исходным условиям выбранного учебного дела */
export function matchesCaseConditions(
  caseStudy: PenaltyCaseStudy,
  calc: PenaltyCalculationResult
): boolean {
  return (
    Math.abs(calc.amount - caseStudy.amount) < 0.0001 &&
    Math.abs(calc.rate - caseStudy.rate) < 0.00001 &&
    calc.days === caseStudy.days
  )
}

/** Форматирование чисел в русском стиле (пробелы-разделители тысяч, запятая для дроби) */
export function formatRuNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value)
}

export function formatTenge(value: number): string {
  return `${formatRuNumber(roundToTwo(value), 2)} ₸`
}
