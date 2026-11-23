import type { TimedAnswerRecord, TimedQuizQuestion } from '../data/timedQuizQuestions'

/**
 * Перемешивание массива вопросов по алгоритму Фишера-Йетса
 */
export function shuffleTimedQuestions(questions: TimedQuizQuestion[]): TimedQuizQuestion[] {
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Форматирование секунд в строгий формат MM:SS (без отрицательных значений)
 */
export function formatSecondsMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Подсчёт статистики завершённого испытания на время
 */
export function evaluateTimedQuiz(records: TimedAnswerRecord[], totalQuestions: number) {
  const correctCount = records.filter((r) => r.status === 'correct').length
  const wrongCount = records.filter((r) => r.status === 'wrong').length
  const skippedCount = records.filter((r) => r.status === 'skipped').length
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  let title = 'Есть куда расти!'
  let message =
    'Изучите подробный разбор ниже и статьи ГК РК на «Әділет», затем попробуйте пройти испытание ещё раз.'

  if (percentage >= 90) {
    title = 'Превосходный результат!'
    message =
      'Вы блестяще справились с блиц-испытанием и уверенно ориентируетесь в Общей и Особенной частях ГК РК.'
  } else if (percentage >= 75) {
    title = 'Отличный уровень!'
    message =
      'Сильный результат в условиях ограниченного времени. Проверьте единичные неточности в разборе ниже.'
  } else if (percentage >= 50) {
    title = 'Хорошая база!'
    message =
      'Больше половины ответов верны. Повторите пропущенные и ошибочные нормы ГК РК — следующая попытка будет ещё выше.'
  }

  return {
    correctCount,
    wrongCount,
    skippedCount,
    percentage,
    title,
    message,
  }
}
