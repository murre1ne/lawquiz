import { useMemo, useRef, useState } from 'react'
import {
  CROSSWORD_COMPLETION_XP,
  type CrosswordPuzzle,
  type CrosswordWord,
} from '../data/crosswordData'
import type { CrosswordPuzzleProgress } from '../data/crosswordProgress'

interface GridCellInfo {
  row: number
  col: number
  expectedLetter: string
  startNumber?: number
  wordNumbers: number[]
}

interface WordCheckResult {
  word: CrosswordWord
  userAnswer: string
  isCorrect: boolean
}

interface CrosswordGameProps {
  puzzle: CrosswordPuzzle
  progress?: CrosswordPuzzleProgress
  onBackToCatalog: () => void
  onRecordResult: (
    puzzleId: string,
    solvedWordNumbers: number[],
    totalWords: number
  ) => { xpGainedNow: number; alreadyMaxed: boolean }
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function getWordCells(word: CrosswordWord): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let i = 0; i < word.answer.length; i++) {
    cells.push({
      row: word.direction === 'across' ? word.row : word.row + i,
      col: word.direction === 'across' ? word.col + i : word.col,
    })
  }
  return cells
}

function normalizeRussian(value: string): string {
  return value.trim().toUpperCase().replace(/Ё/g, 'Е')
}

function extractLastCyrillicChar(raw: string): string | null {
  const upper = raw.toUpperCase()
  for (let i = upper.length - 1; i >= 0; i--) {
    if (/[А-ЯЁ]/.test(upper[i])) {
      return upper[i]
    }
  }
  return null
}

function getWordLengthLabel(len: number): string {
  if (len === 1) return '1 буква'
  if (len >= 2 && len <= 4) return `${len} буквы`
  return `${len} букв`
}

export function CrosswordGame({
  puzzle,
  progress,
  onBackToCatalog,
  onRecordResult,
}: CrosswordGameProps) {
  const firstWord = puzzle.words[0]

  const [letters, setLetters] = useState<Record<string, string>>({})
  const [activeWordNumber, setActiveWordNumber] = useState<number>(firstWord.number)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({
    row: firstWord.row,
    col: firstWord.col,
  })
  const [checkResults, setCheckResults] = useState<WordCheckResult[] | null>(null)
  const [lastXpAward, setLastXpAward] = useState<{
    gained: number
    alreadyMaxed: boolean
  } | null>(null)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Построение матрицы сетки из заранее рассчитанных координат
  const { gridMatrix, cellMap, wordByNumber } = useMemo(() => {
    const map = new Map<string, GridCellInfo>()
    const byNum = new Map<number, CrosswordWord>()

    for (const word of puzzle.words) {
      byNum.set(word.number, word)
      const chars = word.answer.split('')
      chars.forEach((char, idx) => {
        const r = word.direction === 'across' ? word.row : word.row + idx
        const c = word.direction === 'across' ? word.col + idx : word.col
        const key = cellKey(r, c)
        const existing = map.get(key)
        if (existing) {
          if (!existing.wordNumbers.includes(word.number)) {
            existing.wordNumbers.push(word.number)
          }
          if (idx === 0 && existing.startNumber === undefined) {
            existing.startNumber = word.number
          }
        } else {
          map.set(key, {
            row: r,
            col: c,
            expectedLetter: char,
            startNumber: idx === 0 ? word.number : undefined,
            wordNumbers: [word.number],
          })
        }
      })
    }

    const matrix: Array<Array<GridCellInfo | null>> = Array.from(
      { length: puzzle.rows },
      (_, r) =>
        Array.from({ length: puzzle.cols }, (_, c) => map.get(cellKey(r, c)) ?? null)
    )

    return { gridMatrix: matrix, cellMap: map, wordByNumber: byNum }
  }, [puzzle])

  const activeWord = wordByNumber.get(activeWordNumber) ?? firstWord

  const activeWordCellKeys = useMemo(() => {
    return new Set(getWordCells(activeWord).map((p) => cellKey(p.row, p.col)))
  }, [activeWord])

  const wordStatusMap = useMemo(() => {
    const map = new Map<number, boolean>()
    if (checkResults) {
      for (const res of checkResults) {
        map.set(res.word.number, res.isCorrect)
      }
    }
    return map
  }, [checkResults])

  const focusCell = (row: number, col: number) => {
    setActiveCell({ row, col })
    const el = inputRefs.current[cellKey(row, col)]
    if (el) {
      el.focus()
      el.select()
    }
  }

  // Выбор слова по клику на подсказку
  const handleSelectClue = (word: CrosswordWord) => {
    setActiveWordNumber(word.number)
    const cells = getWordCells(word)
    const firstEmpty = cells.find((p) => !letters[cellKey(p.row, p.col)])
    const target = firstEmpty ?? cells[0]
    focusCell(target.row, target.col)
  }

  // Выбор клетки в сетке
  const handleCellClick = (cell: GridCellInfo) => {
    const isSameCell = activeCell.row === cell.row && activeCell.col === cell.col
    if (cell.wordNumbers.length > 1) {
      if (isSameCell) {
        const currentIdx = cell.wordNumbers.indexOf(activeWordNumber)
        const nextWordNum = cell.wordNumbers[(currentIdx + 1) % cell.wordNumbers.length]
        setActiveWordNumber(nextWordNum)
      } else if (!cell.wordNumbers.includes(activeWordNumber)) {
        setActiveWordNumber(cell.wordNumbers[0])
      }
    } else if (cell.wordNumbers.length === 1) {
      setActiveWordNumber(cell.wordNumbers[0])
    }
    focusCell(cell.row, cell.col)
  }

  // Переход к следующей / предыдущей клетке внутри активного слова
  const moveWithinActiveWord = (row: number, col: number, delta: 1 | -1) => {
    const cells = getWordCells(activeWord)
    const idx = cells.findIndex((p) => p.row === row && p.col === col)
    if (idx === -1) return
    const nextIdx = idx + delta
    if (nextIdx >= 0 && nextIdx < cells.length) {
      focusCell(cells[nextIdx].row, cells[nextIdx].col)
    }
  }

  // Ввод буквы в клетку (десктоп и мобильные клавиатуры)
  const handleInputChange = (cell: GridCellInfo, rawValue: string) => {
    const key = cellKey(cell.row, cell.col)

    if (rawValue === '') {
      setLetters((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    const char = extractLastCyrillicChar(rawValue)
    if (!char) return

    setLetters((prev) => ({ ...prev, [key]: char }))
    moveWithinActiveWord(cell.row, cell.col, 1)
  }

  // Навигация стрелками и Backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, cell: GridCellInfo) => {
    const key = cellKey(cell.row, cell.col)

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (letters[key]) {
        setLetters((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        const cells = getWordCells(activeWord)
        const idx = cells.findIndex((p) => p.row === cell.row && p.col === cell.col)
        if (idx > 0) {
          const prevPos = cells[idx - 1]
          const prevKey = cellKey(prevPos.row, prevPos.col)
          setLetters((prev) => {
            const next = { ...prev }
            delete next[prevKey]
            return next
          })
          focusCell(prevPos.row, prevPos.col)
        }
      }
      return
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      setLetters((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    const arrowDeltas: Record<string, [number, number, 'across' | 'down']> = {
      ArrowRight: [0, 1, 'across'],
      ArrowLeft: [0, -1, 'across'],
      ArrowDown: [1, 0, 'down'],
      ArrowUp: [-1, 0, 'down'],
    }

    const move = arrowDeltas[e.key]
    if (move) {
      e.preventDefault()
      const [dr, dc, preferredDir] = move
      let nr = cell.row + dr
      let nc = cell.col + dc
      // Ищем ближайшую активную клетку в направлении стрелки
      while (nr >= 0 && nr < puzzle.rows && nc >= 0 && nc < puzzle.cols) {
        const target = cellMap.get(cellKey(nr, nc))
        if (target) {
          const matchingDirWord = target.wordNumbers.find(
            (num) => wordByNumber.get(num)?.direction === preferredDir
          )
          if (matchingDirWord !== undefined) {
            setActiveWordNumber(matchingDirWord)
          } else if (!target.wordNumbers.includes(activeWordNumber)) {
            setActiveWordNumber(target.wordNumbers[0])
          }
          focusCell(nr, nc)
          return
        }
        nr += dr
        nc += dc
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheckAnswers()
    }
  }

  // Проверка ответов
  const handleCheckAnswers = () => {
    const evaluated: WordCheckResult[] = puzzle.words.map((word) => {
      const cells = getWordCells(word)
      const userAnswer = cells.map((p) => letters[cellKey(p.row, p.col)] ?? '').join('')
      const isComplete = cells.every((p) => Boolean(letters[cellKey(p.row, p.col)]))
      const isCorrect =
        isComplete && normalizeRussian(userAnswer) === normalizeRussian(word.answer)
      return { word, userAnswer, isCorrect }
    })

    setCheckResults(evaluated)

    const solvedNums = evaluated.filter((r) => r.isCorrect).map((r) => r.word.number)
    const { xpGainedNow, alreadyMaxed } = onRecordResult(
      puzzle.id,
      solvedNums,
      puzzle.words.length
    )
    setLastXpAward({ gained: xpGainedNow, alreadyMaxed })
  }

  // Очистка сетки и сброс текущей попытки
  const handleReset = () => {
    setLetters({})
    setCheckResults(null)
    setLastXpAward(null)
    setActiveWordNumber(firstWord.number)
    focusCell(firstWord.row, firstWord.col)
  }

  // Подсчёт заполненных клеток
  const totalActiveCells = cellMap.size
  const filledCellsCount = Array.from(cellMap.keys()).filter((k) => Boolean(letters[k])).length
  const correctCount = checkResults ? checkResults.filter((r) => r.isCorrect).length : 0
  const percent = checkResults ? Math.round((correctCount / puzzle.words.length) * 100) : 0

  // Определение цветового статуса клетки после проверки
  const getCellCheckClass = (cell: GridCellInfo): string => {
    if (!checkResults) return ''
    const statuses = cell.wordNumbers.map((num) => wordStatusMap.get(num))
    const allCorrect = statuses.every((s) => s === true)
    const anyCorrect = statuses.some((s) => s === true)
    const entered = letters[cellKey(cell.row, cell.col)] ?? ''
    if (allCorrect) return 'cw-cell-correct'
    if (
      anyCorrect &&
      entered &&
      normalizeRussian(entered) === normalizeRussian(cell.expectedLetter)
    ) {
      return 'cw-cell-correct'
    }
    return 'cw-cell-wrong'
  }

  const getResultMessage = (score: number, total: number): string => {
    if (score === total) {
      return 'Отлично! Все 5 терминов разгаданы верно — уверенное знание норм ГК РК.'
    }
    if (score >= 3) {
      return 'Хороший результат! Исправьте выделенные красным слова и проверьте ответы снова.'
    }
    return 'Начало положено! Ознакомьтесь с подсказками и статьями ГК РК, исправьте ошибки и повторите проверку.'
  }

  return (
    <div className="cw-game-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToCatalog}>
          <span aria-hidden="true">←</span>
          <span>К каталогу кроссвордов</span>
        </button>
        <div className="cw-catalog-badges">
          <span className="interactive-mode-badge cw-mode-badge">
            Кроссворд №{puzzle.number} · {puzzle.difficulty}
          </span>
          <span className="cw-xp-summary-pill">
            ★ {progress?.xpEarned ?? 0} / {Math.max(progress?.xpEarned ?? 0, CROSSWORD_COMPLETION_XP)} XP
          </span>
        </div>
      </div>

      {/* Главная панель кроссворда */}
      <div className="glass-panel cw-panel">
        <div className="cw-header-block">
          <div className="cw-header-meta">
            <span className="cw-topic-pill">{puzzle.topic}</span>
          </div>
          <h3 className="cw-puzzle-title">
            Кроссворд №{puzzle.number}. «{puzzle.title}»
          </h3>
          <p className="cw-puzzle-subtitle">{puzzle.description}</p>

          {/* Прогресс заполнения */}
          <div className="quiz-progress-section">
            <div className="quiz-progress-label">
              <span>
                Заполнено букв: {filledCellsCount} из {totalActiveCells}
              </span>
              <span className="quiz-progress-cat">
                Активное слово №{activeWord.number} (
                {activeWord.direction === 'across' ? 'по горизонтали' : 'по вертикали'})
              </span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill cw-progress-fill"
                style={{
                  width: `${Math.round((filledCellsCount / totalActiveCells) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Текущая подсказка-баннер для удобства на мобильных и десктопе */}
        <div className="cw-active-clue-banner" role="status" aria-live="polite">
          <span className="cw-active-clue-num">№{activeWord.number}</span>
          <div className="cw-active-clue-body">
            <div className="cw-active-clue-meta">
              <span>
                {activeWord.direction === 'across' ? 'По горизонтали →' : 'По вертикали ↓'}
              </span>
              <span>·</span>
              <span>{getWordLengthLabel(activeWord.answer.length)}</span>
              <span>·</span>
              <span>{activeWord.articleLabel}</span>
            </div>
            <p className="cw-active-clue-text">{activeWord.clue}</p>
          </div>
        </div>

        {/* Рабочая область: Сетка (слева) + Подсказки (справа на ПК, снизу на мобильных) */}
        <div className="cw-workspace">
          <div className="cw-grid-column">
            <div
              className="cw-grid"
              style={
                {
                  '--cw-cols': puzzle.cols,
                  '--cw-rows': puzzle.rows,
                } as React.CSSProperties
              }
              role="grid"
              aria-label={`Сетка кроссворда ${puzzle.title}`}
            >
              {gridMatrix.map((rowArr, rIdx) =>
                rowArr.map((cell, cIdx) => {
                  const key = cellKey(rIdx, cIdx)
                  if (!cell) {
                    return <div key={key} className="cw-cell-empty" aria-hidden="true" />
                  }

                  const isActiveCell =
                    activeCell.row === cell.row && activeCell.col === cell.col
                  const isInActiveWord = activeWordCellKeys.has(key)
                  const checkClass = getCellCheckClass(cell)

                  return (
                    <div
                      key={key}
                      className={`cw-cell-active ${isInActiveWord ? 'cw-cell-word' : ''} ${
                        isActiveCell ? 'cw-cell-focused' : ''
                      } ${checkClass}`}
                      onClick={() => handleCellClick(cell)}
                    >
                      {cell.startNumber !== undefined && (
                        <span className="cw-cell-number" aria-hidden="true">
                          {cell.startNumber}
                        </span>
                      )}
                      <input
                        ref={(el) => {
                          inputRefs.current[key] = el
                        }}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={2}
                        className="cw-cell-input"
                        value={letters[key] ?? ''}
                        onFocus={() => {
                          setActiveCell({ row: cell.row, col: cell.col })
                          if (!cell.wordNumbers.includes(activeWordNumber)) {
                            setActiveWordNumber(cell.wordNumbers[0])
                          }
                        }}
                        onChange={(e) => handleInputChange(cell, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, cell)}
                        aria-label={`Строка ${cell.row + 1}, столбец ${cell.col + 1}${
                          cell.startNumber ? `, начало слова ${cell.startNumber}` : ''
                        }`}
                      />
                    </div>
                  )
                })
              )}
            </div>

            {/* Кнопки управления */}
            <div className="cw-controls-row">
              <button
                type="button"
                className="interactive-action-btn primary"
                onClick={handleCheckAnswers}
              >
                <span>Проверить ответы</span>
                <span aria-hidden="true">✓</span>
              </button>
              <button
                type="button"
                className="interactive-action-btn secondary"
                onClick={handleReset}
              >
                <span aria-hidden="true">↺</span>
                <span>Начать заново</span>
              </button>
            </div>
            <p className="cw-keyboard-hint">
              Вводите русские буквы с клавиатуры. Стрелки перемещают курсор, Backspace удаляет букву, повторный клик по пересечению меняет направление.
            </p>
          </div>

          {/* Панель подсказок */}
          <aside className="cw-clues-column" aria-label="Подсказки кроссворда">
            <div className="cw-clues-header">
              <h4 className="cw-clues-heading">Подсказки ({puzzle.words.length})</h4>
              <span className="cw-clues-sub">Нажмите на подсказку, чтобы выделить слово</span>
            </div>

            <div className="cw-clues-list">
              {puzzle.words.map((word) => {
                const isSelected = word.number === activeWordNumber
                const checkedStatus = wordStatusMap.get(word.number)
                const statusClass =
                  checkedStatus === true
                    ? 'cw-clue-correct'
                    : checkedStatus === false
                    ? 'cw-clue-wrong'
                    : ''

                return (
                  <button
                    key={word.number}
                    type="button"
                    className={`cw-clue-item ${isSelected ? 'cw-clue-active' : ''} ${statusClass}`}
                    onClick={() => handleSelectClue(word)}
                  >
                    <div className="cw-clue-top">
                      <span className="cw-clue-num">№{word.number}</span>
                      <span className="cw-clue-dir">
                        {word.direction === 'across' ? 'По горизонтали →' : 'По вертикали ↓'}
                      </span>
                      <span className="cw-clue-article">{word.articleLabel}</span>
                    </div>
                    <p className="cw-clue-text">{word.clue}</p>
                    <div className="cw-clue-footer">
                      <span className="cw-clue-len">
                        {getWordLengthLabel(word.answer.length)}
                      </span>
                      {checkedStatus !== undefined && (
                        <span
                          className={
                            checkedStatus ? 'cw-clue-badge-ok' : 'cw-clue-badge-err'
                          }
                        >
                          {checkedStatus ? '✓ Верно' : '✗ Ошибка'}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>

        {/* Блок результатов после нажатия «Проверить ответы» */}
        {checkResults && (
          <div className="cw-results-panel">
            <div className="cw-results-summary">
              <div className="cw-results-score-wrap">
                <div className="result-score-circle cw-score-circle">
                  <span className="result-score-num">{correctCount}</span>
                  <span className="result-score-total">/ {puzzle.words.length}</span>
                </div>
                <div className="cw-results-copy">
                  <div className="cw-results-badges-line">
                    <span className="cw-percent-pill">Выполнено: {percent}%</span>
                    {lastXpAward && lastXpAward.gained > 0 ? (
                      <span className="cw-xp-gained-pill">
                        Задание завершено! +{lastXpAward.gained} XP
                      </span>
                    ) : (
                      <span className="cw-xp-neutral-pill">
                        {lastXpAward?.alreadyMaxed
                          ? 'Вы уже получили опыт за это задание'
                          : `Для получения +${CROSSWORD_COMPLETION_XP} XP правильно заполните все ${puzzle.words.length} слов`}
                      </span>
                    )}
                  </div>
                  <h4 className="cw-results-title">
                    Правильных ответов: {correctCount} из {puzzle.words.length}
                  </h4>
                  <p className="cw-results-message">
                    {getResultMessage(correctCount, puzzle.words.length)}
                  </p>
                </div>
              </div>

              <div className="cw-results-actions">
                <button
                  type="button"
                  className="interactive-action-btn primary"
                  onClick={handleReset}
                >
                  <span aria-hidden="true">🔄</span>
                  <span>Пройти заново</span>
                </button>
                <button
                  type="button"
                  className="interactive-action-btn secondary"
                  onClick={onBackToCatalog}
                >
                  <span>К каталогу кроссвордов</span>
                </button>
              </div>
            </div>

            {/* Детальный разбор всех 5 слов со статьями ГК РК и ссылками на «Әділет» */}
            <div className="result-review-section cw-review-section">
              <h5 className="result-review-heading">
                Разбор ответов и нормативные ссылки ({puzzle.sourceName}):
              </h5>
              <div className="cw-review-list">
                {checkResults.map((item) => (
                  <div
                    key={item.word.number}
                    className={`review-item ${
                      item.isCorrect ? 'review-correct' : 'review-wrong'
                    }`}
                  >
                    <div className="review-item-header">
                      <span className="review-item-num">№{item.word.number}</span>
                      <span className="review-status-tag">
                        {item.isCorrect ? 'Верно (+1 балл)' : 'Ошибка (0 баллов)'}
                      </span>
                      <span className="review-article">{item.word.articleLabel}</span>
                    </div>
                    <p className="review-question">{item.word.clue}</p>
                    <div className="review-answer-details">
                      <div>
                        <span className="review-detail-label">Ваш ответ: </span>
                        <span className={item.isCorrect ? 'text-correct' : 'text-wrong'}>
                          {item.userAnswer || 'не заполнено'}
                        </span>
                      </div>
                      {!item.isCorrect && (
                        <div>
                          <span className="review-detail-label">Правильный ответ: </span>
                          <span className="text-correct">{item.word.answer}</span>
                        </div>
                      )}
                    </div>
                    <div className="cw-review-source-row">
                      <a
                        href={item.word.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="feedback-adilet-link"
                      >
                        <span>
                          {item.word.source}, {item.word.articleLabel} — открыть в «Әділет»
                        </span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
