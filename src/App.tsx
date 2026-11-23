import { useEffect, useState } from 'react'
import { LibrarySection } from './components/LibrarySection'
import { TrainerSection } from './components/TrainerSection'
import { CrosswordCatalog } from './components/CrosswordCatalog'
import { CrosswordGame } from './components/CrosswordGame'
import { FortuneWheelGame } from './components/FortuneWheelGame'
import { TimedQuizGame } from './components/TimedQuizGame'
import { crosswordPuzzles, type CrosswordPuzzle } from './data/crosswordData'
import {
  loadCrosswordProgress,
  recordCrosswordResult,
  type CrosswordProgressMap,
} from './data/crosswordProgress'

interface PracticeCard {
  id: string
  title: string
  description: string
  focus: string
  status: string
  icon: React.ReactNode
}

interface GameCard {
  id: string
  title: string
  description: string
  tag: string
  status: string
  icon: React.ReactNode
}

interface AchievementItem {
  id: string
  title: string
  description: string
  status: string
  completed: boolean
  icon: string
}

const THEME_STORAGE_KEY = 'lqkz-theme'

function readStoredTheme(): 'light' | 'dark' {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const navItems = [
  { id: 'home', label: 'Главная' },
  { id: 'library', label: 'Правовая библиотека' },
  { id: 'trainer', label: 'Тренажёр знаний' },
  { id: 'practice', label: 'Юридическая практика' },
  { id: 'games', label: 'Игровая зона' },
  { id: 'achievements', label: 'Мои достижения' },
]

// 3. Юридическая практика — карточки
const practiceCards: PracticeCard[] = [
  {
    id: 'prac-situations',
    title: 'Разбор юридических ситуаций',
    description:
      'Учебный анализ моделируемых жизненных обстоятельств из гражданского оборота с определением правомерности действий и взаимных обязанностей участников.',
    focus: 'Анализ обстоятельств',
    status: 'Учебные фабулы',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h18" />
      </svg>
    ),
  },
  {
    id: 'prac-errors',
    title: 'Поиск ошибок в учебном договоре',
    description:
      'Практические задания по выявлению некорректных, двусмысленных или противоречивых положений в учебных проектах договоров.',
    focus: 'Аудит условий',
    status: 'Учебные соглашения',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="12" />
        <line x1="11" y1="14" x2="11.01" y2="14" />
      </svg>
    ),
  },
  {
    id: 'prac-contracts',
    title: 'Пошаговый разбор договоров',
    description:
      'Структурированное изучение существенных условий договоров: предмета соглашения, цены, прав и обязанностей сторон, порядка расторжения и ответственности.',
    focus: 'Структура сделки',
    status: 'Методика анализа',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
]

// 4. Игровая зона — карточки
const gameCards: GameCard[] = [
  {
    id: 'game-crossword',
    title: 'Юридический кроссворд',
    description:
      'Интеллектуальная головоломка для повторения и закрепления юридических определений и ключевых понятий гражданского законодательства.',
    tag: 'Слова и термины',
    status: 'Проектирование',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
  },
  {
    id: 'game-wheel',
    title: 'Колесо-фортуна',
    description:
      'Динамичная викторина со случайным выбором одного из 10 секторов по Общей и Особенной частям ГК РК для самопроверки без повторения вопросов.',
    tag: '10 секторов · ГК РК',
    status: 'Доступно',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'game-time',
    title: 'Испытание на время',
    description:
      'Ответьте на 12 вопросов по Общей и Особенной частям Гражданского кодекса РК за 5 минут с подробным разбором каждого ответа.',
    tag: '12 вопросов · 5 минут',
    status: 'Доступно',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

// 5. Мои достижения — демонстрационные данные
const demoStats = [
  {
    id: 'stat-tasks',
    label: 'Количество выполненных заданий',
    value: '14 / 45',
    subtext: 'Учебных модулей и упражнений',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    id: 'stat-score',
    label: 'Набранные баллы',
    value: '420 XP',
    subtext: 'Баллов академического опыта',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'stat-level',
    label: 'Текущий уровень',
    value: 'Уровень 2',
    subtext: 'Начинающий правовед',
    progress: 65,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
        <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
      </svg>
    ),
  },
]

const demoAchievements: AchievementItem[] = [
  {
    id: 'ach-1',
    title: 'Первый шаг в праве',
    description: 'Ознакомление с вводным разделом библиотеки гражданского права.',
    status: 'Разблокировано',
    completed: true,
    icon: '📖',
  },
  {
    id: 'ach-2',
    title: 'Точность определений',
    description: 'Успешное выполнение упражнений на сопоставление юридических понятий.',
    status: 'Разблокировано',
    completed: true,
    icon: '🎯',
  },
  {
    id: 'ach-3',
    title: 'Внимательный аудитор',
    description: 'Поиск неточностей в учебных фрагментах договоров.',
    status: 'В процессе',
    completed: false,
    icon: '🔍',
  },
  {
    id: 'ach-4',
    title: 'Эрудит гражданского права',
    description: 'Решение тематического юридического кроссворда.',
    status: 'Не начато',
    completed: false,
    icon: '🧩',
  },
]

function App() {
  const [activeSection, setActiveSection] = useState<string>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>(readStoredTheme)
  const [gamesView, setGamesView] = useState<
    'menu' | 'crosswords-catalog' | 'crossword-play' | 'wheel-play' | 'time-play'
  >('menu')
  const [activeCrosswordId, setActiveCrosswordId] = useState<string | null>(null)
  const [crosswordProgress, setCrosswordProgress] = useState<CrosswordProgressMap>(
    loadCrosswordProgress
  )

  const completedCrosswordsCount = crosswordPuzzles.filter(
    (puzzle) => crosswordProgress[puzzle.id]?.completed
  ).length
  const totalCrosswordXp = crosswordPuzzles.reduce(
    (sum, puzzle) => sum + (crosswordProgress[puzzle.id]?.xpEarned ?? 0),
    0
  )

  const baseXp = 420
  const totalXp = baseXp + totalCrosswordXp
  const levelOffset = totalXp - 225
  const currentLevel = Math.floor(levelOffset / 300) + 2
  const currentLevelProgress = Math.min(100, Math.round(((levelOffset % 300) / 300) * 100))

  const liveStats = demoStats.map((st) => {
    if (st.id === 'stat-tasks') {
      return {
        ...st,
        value: `${14 + completedCrosswordsCount} / 45`,
        subtext:
          completedCrosswordsCount > 0
            ? `Включая пройденных кроссвордов: ${completedCrosswordsCount}`
            : st.subtext,
      }
    }
    if (st.id === 'stat-score') {
      return {
        ...st,
        value: `${totalXp} XP`,
        subtext:
          totalCrosswordXp > 0
            ? `Из них +${totalCrosswordXp} XP за кроссворды`
            : st.subtext,
      }
    }
    if (st.id === 'stat-level') {
      return {
        ...st,
        value: `Уровень ${currentLevel}`,
        progress: currentLevelProgress,
      }
    }
    return st
  })

  const liveAchievements = demoAchievements.map((ach) => {
    if (ach.id !== 'ach-4') return ach
    if (completedCrosswordsCount >= 1) {
      return {
        ...ach,
        completed: true,
        status: 'Разблокировано',
      }
    }
    if (totalCrosswordXp > 0) {
      return {
        ...ach,
        completed: false,
        status: 'В процессе',
      }
    }
    return ach
  })

  const unlockedAchievements = liveAchievements.filter((item) => item.completed).length
  const activeCrossword =
    crosswordPuzzles.find((puzzle) => puzzle.id === activeCrosswordId) ?? null

  const syncFromHash = () => {
    const rawHash = window.location.hash.replace('#', '')
    if (rawHash === 'games/crosswords') {
      setGamesView('crosswords-catalog')
      setActiveCrosswordId(null)
      return 'games'
    }
    if (rawHash.startsWith('games/crosswords/')) {
      const id = rawHash.replace('games/crosswords/', '')
      const exists = crosswordPuzzles.some((p) => p.id === id)
      if (exists) {
        setActiveCrosswordId(id)
        setGamesView('crossword-play')
      } else {
        setActiveCrosswordId(null)
        setGamesView('crosswords-catalog')
      }
      return 'games'
    }
    if (rawHash === 'games/wheel') {
      setGamesView('wheel-play')
      setActiveCrosswordId(null)
      return 'games'
    }
    if (rawHash === 'games/time') {
      setGamesView('time-play')
      setActiveCrosswordId(null)
      return 'games'
    }
    if (rawHash === 'games') {
      setGamesView('menu')
      setActiveCrosswordId(null)
      return 'games'
    }
    return rawHash
  }

  const openWheelGame = () => {
    setActiveCrosswordId(null)
    setGamesView('wheel-play')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/wheel')
    const el = document.getElementById('games')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const openTimedGame = () => {
    setActiveCrosswordId(null)
    setGamesView('time-play')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/time')
    const el = document.getElementById('games')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const openCrosswordsCatalog = () => {
    setActiveCrosswordId(null)
    setGamesView('crosswords-catalog')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/crosswords')
    const el = document.getElementById('games')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const openCrosswordPuzzle = (puzzle: CrosswordPuzzle) => {
    setActiveCrosswordId(puzzle.id)
    setGamesView('crossword-play')
    setActiveSection('games')
    window.history.pushState(null, '', `#games/crosswords/${puzzle.id}`)
    const el = document.getElementById('games')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const backToGamesMenu = () => {
    setActiveCrosswordId(null)
    setGamesView('menu')
    window.history.pushState(null, '', '#games')
  }

  const handleRecordCrosswordResult = (
    puzzleId: string,
    solvedWordNumbers: number[],
    totalWords: number
  ) => {
    const res = recordCrosswordResult(crosswordProgress, puzzleId, solvedWordNumbers, totalWords)
    setCrosswordProgress(res.nextMap)
    return { xpGainedNow: res.xpGainedNow, alreadyMaxed: res.alreadyMaxed }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#0c1412' : '#ecf5f0')
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* локальное хранилище может быть недоступно */
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    const sectionIds = ['home', 'library', 'trainer', 'practice', 'games', 'achievements']

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60

      if (isAtBottom) {
        setActiveSection('achievements')
        return
      }

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i])
        if (el) {
          const top = el.offsetTop
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i])
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const targetSection = syncFromHash()
    if (
      targetSection &&
      ['home', 'library', 'trainer', 'practice', 'games', 'achievements'].includes(targetSection)
    ) {
      const target = document.getElementById(targetSection)
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' })
          setActiveSection(targetSection)
        }, 120)
      }
    }

    const handlePopOrHash = () => {
      syncFromHash()
    }
    window.addEventListener('popstate', handlePopOrHash)
    window.addEventListener('hashchange', handlePopOrHash)
    return () => {
      window.removeEventListener('popstate', handlePopOrHash)
      window.removeEventListener('hashchange', handlePopOrHash)
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    if (targetId === 'games') {
      setGamesView('menu')
      setActiveCrosswordId(null)
    }
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(targetId)
      window.history.pushState(null, '', `#${targetId}`)
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={(e) => handleNavClick(e, 'home')}
          aria-label="Law Quiz KZ — на главную"
        >
          <span className="brand-mark">LQ</span>
          <span>
            Law Quiz <span className="brand-accent">KZ</span>
          </span>
        </a>

        <nav className="navigation" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className={`theme-toggle ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </span>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>
          </button>

          <a
            className="nav-cta"
            href="#library"
            onClick={(e) => handleNavClick(e, 'library')}
          >
            К разделам <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main>
        {/* Главный экран (Hero) */}
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА
            </div>
            <h1>
              Разбирайся в праве.<br />
              <span>Уверенно.</span>
            </h1>
            <p className="hero-description">
              Изучай основы гражданского права Республики Казахстан в одном месте.
              Понятная структура для обучения, повторения и закрепления знаний.
            </p>
            <a
              className="primary-button"
              href="#library"
              onClick={(e) => handleNavClick(e, 'library')}
            >
              Начать обучение <span aria-hidden="true">→</span>
            </a>
            <p className="hero-note">Учебный проект · Гражданское право РК</p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-glow" />
            <div className="art-card art-card-back">
              <span className="art-small-label">LAW / STUDY</span>
              <div className="art-lines">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="art-card art-card-main">
              <div className="scale-icon">⚖</div>
              <div className="art-card-rule" />
              <span className="art-card-caption">ЗНАНИЯ · ПРАВО · ПРАКТИКА</span>
            </div>
            <div className="floating-tag">
              <span>✳</span> Учись в своём темпе
            </div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
          </div>
          <div className="hero-bottom-label">
            <span>01 / 05</span>
            <span>ОСНОВЫ ГРАЖДАНСКОГО ПРАВА РК</span>
          </div>
        </section>

        {/* Общий заголовок обучающих направлений */}
        <div className="learning-intro-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> ТВОЙ ПУТЬ К ЗНАНИЯМ
              </div>
              <h2 id="learning-title">
                Изучай. Понимай. <span>Применяй.</span>
              </h2>
            </div>
            <p>Пять ключевых направлений для системного изучения гражданского права Республики Казахстан.</p>
          </div>
        </div>

        {/* 1. Правовая библиотека (V3: Юридическое наполнение материалами по ГК РК) */}
        <LibrarySection />

        {/* 2. Тренажёр знаний (Интерактивные тесты и режим «Правда или миф?») */}
        <TrainerSection />

        {/* 3. Юридическая практика */}
        <section className="content-section" id="practice" aria-labelledby="practice-heading">
          <div className="section-container">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <div className="section-badge-line">
                  <span className="section-num-pill">03 / 05</span>
                  <span className="section-category-tag">ПРАКТИКУМ И КЕЙСЫ</span>
                </div>
                <h2 id="practice-heading" className="section-main-title">
                  Юридическая практика
                </h2>
                <p className="section-main-desc">
                  Раздел с учебными правовыми ситуациями и практическими заданиями.
                </p>
              </div>
              <div className="section-header-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 3v18" />
                  <path d="M3 7h18" />
                </svg>
              </div>
            </div>

            <div className="practice-grid">
              {practiceCards.map((card, index) => (
                <article key={card.id} className={`edu-card edu-card-tone-${index % 3}`}>
                  <div className="card-topline">
                    <span className="card-icon-badge" aria-hidden="true">
                      {card.icon}
                    </span>
                    <span className="card-pill-tag">{card.focus}</span>
                  </div>
                  <h3 className="card-heading">{card.title}</h3>
                  <p className="edu-card-desc">{card.description}</p>
                  <div className="card-action-row">
                    <span className="card-status-pill">
                      <span className="status-dot" aria-hidden="true" />
                      <span>{card.status}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>Учебные практические ситуации разрабатываются на основе положений гражданского законодательства РК без вымышленных норм.</span>
            </div>
          </div>
        </section>

        {/* 4. Игровая зона */}
        <section className="content-section" id="games" aria-labelledby="games-heading">
          <div className="section-container">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <div className="section-badge-line">
                  <span className="section-num-pill">04 / 05</span>
                  <span className="section-category-tag">ОБРАЗОВАТЕЛЬНЫЙ ИНТЕРАКТИВ</span>
                </div>
                <h2 id="games-heading" className="section-main-title">
                  Игровая зона
                </h2>
                <p className="section-main-desc">
                  Раздел с образовательными играми и заданиями.
                </p>
              </div>
              <div className="section-header-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="12" x2="10" y2="12" />
                  <line x1="8" y1="10" x2="8" y2="14" />
                  <line x1="15" y1="13" x2="15.01" y2="13" />
                  <line x1="18" y1="11" x2="18.01" y2="11" />
                  <rect x="2" y="6" width="20" height="12" rx="6" />
                </svg>
              </div>
            </div>

            {gamesView === 'menu' && (
              <>
                <div className="games-grid">
                  {gameCards.map((card, index) => {
                    const isCrosswordCard = card.id === 'game-crossword'
                    const isWheelCard = card.id === 'game-wheel'
                    const isTimeCard = card.id === 'game-time'
                    const isInteractiveCard = isCrosswordCard || isWheelCard || isTimeCard
                    const handleOpenCard = isCrosswordCard
                      ? openCrosswordsCatalog
                      : isWheelCard
                      ? openWheelGame
                      : isTimeCard
                      ? openTimedGame
                      : undefined

                    return (
                      <article
                        key={card.id}
                        className={`edu-card edu-card-tone-${(index + 1) % 3} ${
                          isInteractiveCard ? 'game-card-interactive' : ''
                        }`}
                        onClick={handleOpenCard}
                        role={isInteractiveCard ? 'button' : undefined}
                        tabIndex={isInteractiveCard ? 0 : undefined}
                        onKeyDown={
                          handleOpenCard
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleOpenCard()
                                }
                              }
                            : undefined
                        }
                        aria-label={
                          isCrosswordCard
                            ? 'Открыть каталог юридических кроссвордов'
                            : isWheelCard
                            ? 'Открыть игру Колесо-фортуна'
                            : isTimeCard
                            ? 'Открыть игру Испытание на время'
                            : undefined
                        }
                      >
                        <div className="card-topline">
                          <span className="card-icon-badge" aria-hidden="true">
                            {card.icon}
                          </span>
                          <span className="card-pill-tag">
                            {isCrosswordCard
                              ? `${crosswordPuzzles.length} кроссворда · ${completedCrosswordsCount}/${crosswordPuzzles.length}`
                              : card.tag}
                          </span>
                        </div>
                        <h3 className="card-heading">{card.title}</h3>
                        <p className="edu-card-desc">{card.description}</p>
                        <div className="card-action-row">
                          {isCrosswordCard ? (
                            <button
                              type="button"
                              className="card-action-btn primary-start-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                openCrosswordsCatalog()
                              }}
                            >
                              <span>Открыть кроссворды</span>
                              <span aria-hidden="true">→</span>
                            </button>
                          ) : isWheelCard ? (
                            <button
                              type="button"
                              className="card-action-btn primary-start-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                openWheelGame()
                              }}
                            >
                              <span>Крутить колесо</span>
                              <span aria-hidden="true">→</span>
                            </button>
                          ) : isTimeCard ? (
                            <button
                              type="button"
                              className="card-action-btn primary-start-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                openTimedGame()
                              }}
                            >
                              <span>Открыть испытание</span>
                              <span aria-hidden="true">→</span>
                            </button>
                          ) : (
                            <span className="card-status-pill">
                              <span className="status-dot" aria-hidden="true" />
                              <span>{card.status}</span>
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="section-status-banner">
                  <span className="status-dot" aria-hidden="true" />
                  <span>
                    Все три образовательные игры активны: «Юридический кроссворд», «Колесо-фортуна» (10 секторов) и «Испытание на время» (12 вопросов за 5 минут по ГК РК).
                  </span>
                </div>
              </>
            )}

            {gamesView === 'crosswords-catalog' && (
              <CrosswordCatalog
                progressMap={crosswordProgress}
                onSelectPuzzle={openCrosswordPuzzle}
                onBackToGames={backToGamesMenu}
              />
            )}

            {gamesView === 'crossword-play' && activeCrossword && (
              <CrosswordGame
                key={activeCrossword.id}
                puzzle={activeCrossword}
                progress={crosswordProgress[activeCrossword.id]}
                onBackToCatalog={openCrosswordsCatalog}
                onRecordResult={handleRecordCrosswordResult}
              />
            )}

            {gamesView === 'wheel-play' && (
              <FortuneWheelGame onBackToGames={backToGamesMenu} />
            )}

            {gamesView === 'time-play' && (
              <TimedQuizGame onBackToGames={backToGamesMenu} />
            )}
          </div>
        </section>

        {/* 5. Мои достижения */}
        <section className="content-section" id="achievements" aria-labelledby="achievements-heading">
          <div className="section-container">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <div className="section-badge-line">
                  <span className="section-num-pill">05 / 05</span>
                  <span className="section-category-tag">ПРОГРЕСС ОБУЧЕНИЯ</span>
                </div>
                <h2 id="achievements-heading" className="section-main-title">
                  Мои достижения
                </h2>
                <p className="section-main-desc">
                  Раздел для отображения учебного прогресса пользователя.
                </p>
              </div>
              <div className="section-header-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
                </svg>
              </div>
            </div>

            <div className="demo-notice-banner">
              <span className="demo-notice-icon" aria-hidden="true">ℹ</span>
              <div>
                <strong>Макет отображения результатов:</strong> значения ниже являются <span className="demo-badge">Примером данных</span> для визуальной демонстрации интерфейса и не представляют реальные результаты.
              </div>
            </div>

            {/* Метрики прогресса */}
            <div className="stats-grid">
              {liveStats.map((st) => (
                <div key={st.id} className={`stat-card stat-card--${st.id.replace('stat-', '')}`}>
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap" aria-hidden="true">
                      {st.icon}
                    </span>
                    <span className="demo-tag">
                      {totalCrosswordXp > 0 ? 'Обновлено + кроссворды' : 'Пример данных'}
                    </span>
                  </div>
                  <span className="stat-label">{st.label}</span>
                  <span className="stat-value">{st.value}</span>
                  <span className="stat-subtext">{st.subtext}</span>
                  {typeof st.progress === 'number' && (
                    <div className="stat-progress">
                      <div className="stat-progress-meta">
                        <span>До следующего уровня</span>
                        <span>{st.progress}%</span>
                      </div>
                      <div className="stat-progress-bar-wrap" aria-label="Прогресс до следующего уровня">
                        <div className="stat-progress-bar-fill" style={{ width: `${st.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Список достижений */}
            <div className="achievements-box">
              <div className="achievements-box-header">
                <div className="achievements-heading-copy">
                  <h3 className="achievements-box-title">Список достижений</h3>
                  <p className="achievements-box-note">
                    Открыто {unlockedAchievements} из {liveAchievements.length}
                  </p>
                </div>
                <div className="achievements-summary">
                  <span className="demo-tag">
                    {completedCrosswordsCount > 0 ? 'Локальный прогресс' : 'Пример данных'}
                  </span>
                  <div
                    className="achievements-meter"
                    role="img"
                    aria-label={`Открыто ${unlockedAchievements} из ${liveAchievements.length} достижений`}
                  >
                    <span
                      className="achievements-meter-fill"
                      style={{ width: `${(unlockedAchievements / liveAchievements.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="achievements-grid">
                {liveAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`achievement-card ${ach.completed ? 'completed' : 'locked'}`}
                  >
                    <div className="achievement-icon-wrap" aria-hidden="true">
                      <span>{ach.icon}</span>
                    </div>
                    <div className="achievement-info">
                      <h4 className="achievement-title">{ach.title}</h4>
                      <p className="achievement-desc">{ach.description}</p>
                      <span className={`achievement-status-tag ${ach.completed ? 'tag-done' : 'tag-pending'}`}>
                        {ach.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>100% конфиденциальность: реальный прогресс будет сохраняться локально в браузере без регистрации и сбора персональных данных.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer с неизменной юридической оговоркой */}
      <footer className="footer" id="footer">
        <div className="footer-disclaimer-card">
          <div className="disclaimer-header">
            <span className="disclaimer-icon-badge" aria-hidden="true">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <h3 className="disclaimer-title">Правовая оговорка</h3>
          </div>

          <div className="disclaimer-content">
            <p>
              Law Quiz KZ — интерактивный образовательный проект, созданный для изучения гражданского права Республики Казахстан. Все материалы носят исключительно учебный и информационный характер и не являются профессиональной юридической консультацией.
            </p>
            <p>
              Представленные юридические ситуации, персонажи и примеры договоров являются вымышленными. Информация основана на Гражданском кодексе РК. Актуальность правовых норм рекомендуется проверять в официальной системе «Әділет»:{' '}
              <a
                href="https://adilet.zan.kz/"
                target="_blank"
                rel="noopener noreferrer"
                className="disclaimer-link"
              >
                https://adilet.zan.kz/
              </a>.
            </p>
            <p>
              Сайт не требует регистрации и не собирает персональные данные пользователей. Результаты обучения сохраняются локально в браузере.
            </p>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <a
            className="brand footer-brand"
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            aria-label="Law Quiz KZ — наверх"
          >
            <span className="brand-mark">LQ</span>
            <span>
              Law Quiz <span className="brand-accent">KZ</span>
            </span>
          </a>
          <p className="copyright-text">© 2026 Law Quiz KZ | Образовательный проект.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
