import { useCallback, useEffect, useRef, useState } from 'react'
import { LibrarySection } from './components/LibrarySection'
import { LibraryPage } from './components/LibraryPage'
import { TrainerSection } from './components/TrainerSection'
import { TrainerPage } from './components/TrainerPage'
import { PracticeSection } from './components/PracticeSection'
import { PracticePage, type PracticeViewMode } from './components/PracticePage'
import { GamesSection } from './components/GamesSection'
import { GamesPage, type GamesViewMode } from './components/GamesPage'
import { AchievementsSection } from './components/AchievementsSection'
import { AchievementsPage } from './components/AchievementsPage'
import { SettingsPage } from './components/SettingsPage'
import { LegalSearchPreloader } from './components/LegalSearchPreloader'
import { HeroTypewriterTitle } from './components/HeroTypewriterTitle'
import { AmbientBackground } from './components/AmbientBackground'
import { ScrollProgressBar } from './components/ScrollProgressBar'
import { CursorTrail } from './components/CursorTrail'
import {
  RouteTransitionOverlay,
  type RoutePageKey,
} from './components/RouteTransitionOverlay'
import { useScrollReveal } from './utils/useScrollReveal'
import { crosswordPuzzles, type CrosswordPuzzle } from './data/crosswordData'
import { legalCasesData, type LegalCaseScenario } from './data/legalCasesData'
import {
  contractAnalysisData,
  type ContractAnalysisItem,
} from './data/contractAnalysisData'
import { legalChatCases, type LegalChatCase } from './data/legalChatCases'
import {
  RARITY_LABELS,
  evaluateAchievementsView,
  evaluateAndPersistAchievements,
  getUnseenAchievementsCount,
  loadUnlockedAchievements,
  markAllAchievementsAsSeen,
  type AchievementDefinition,
  type UnlockedAchievementsMap,
} from './data/achievementsData'
import {
  loadSiteSettings,
  playAchievementSound,
  playLevelUpSound,
  playXPSound,
  saveSiteSettings,
  type SiteSettings,
  type ThemeMode,
} from './utils/achievementAudio'
import {
  awardXP,
  completeContractAnalysis,
  getXPProgress,
  isFreshProgressMode,
  loadCrosswordProgress,
  recordCrosswordResult,
  recordLegalCaseResult,
  recordLegalChatCaseResult,
  recordPenaltyCaseSolved,
  resetAllGameProgress,
  saveContractAnalysisStep,
  type AwardXPPayload,
  type AwardXPResult,
  type CrosswordProgressMap,
} from './data/crosswordProgress'
import { PENALTY_CASES } from './data/penaltyCalculatorData'

interface XPToastItem {
  id: number
  kind: 'xp' | 'already' | 'levelup' | 'reset'
  title: string
  subtitle?: string
}

const navItems = [
  { id: 'home', label: 'Главная' },
  { id: 'library', label: 'Правовая библиотека' },
  { id: 'trainer', label: 'Тренажёр знаний' },
  { id: 'practice', label: 'Юридическая практика' },
  { id: 'games', label: 'Игровая зона' },
  { id: 'achievements', label: 'Прогресс' },
]

function App() {
  const [isHeroReadyForTyping, setIsHeroReadyForTyping] = useState<boolean>(false)
  const [isRouteTransitioning, setIsRouteTransitioning] = useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [activeSection, setActiveSection] = useState<string>('home')
  const [isLibraryPageOpen, setIsLibraryPageOpen] = useState<boolean>(false)
  const [isTrainerPageOpen, setIsTrainerPageOpen] = useState<boolean>(false)
  const [isPracticePageOpen, setIsPracticePageOpen] = useState<boolean>(false)
  const [isGamesPageOpen, setIsGamesPageOpen] = useState<boolean>(false)
  const [isAchievementsPageOpen, setIsAchievementsPageOpen] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [returnSection, setReturnSection] = useState<string>('home')
  const [returnToPage, setReturnToPage] = useState<
    'main' | 'library' | 'trainer' | 'practice' | 'games' | 'achievements'
  >('main')
  const isAchievementsPageOpenRef = useRef<boolean>(false)
  isAchievementsPageOpenRef.current = isAchievementsPageOpen
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(loadSiteSettings)
  const theme = siteSettings.theme
  const notificationSettings = {
    soundEnabled: siteSettings.soundEnabled,
    visualNotificationsEnabled: siteSettings.visualNotificationsEnabled,
  }
  const [practiceView, setPracticeView] = useState<PracticeViewMode>('menu')
  const [activeChatCaseId, setActiveChatCaseId] = useState<string | null>(null)
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [activeAnalysisContractId, setActiveAnalysisContractId] = useState<string | null>(null)
  const [gamesView, setGamesView] = useState<GamesViewMode>('menu')
  const [activeCrosswordId, setActiveCrosswordId] = useState<string | null>(null)
  const [crosswordProgress, setCrosswordProgress] = useState<CrosswordProgressMap>(
    loadCrosswordProgress
  )
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementsMap>(
    loadUnlockedAchievements
  )
  const [isFreshBaseline, setIsFreshBaseline] = useState<boolean>(isFreshProgressMode)
  const [xpToasts, setXpToasts] = useState<XPToastItem[]>([])
  const [achievementQueue, setAchievementQueue] = useState<AchievementDefinition[]>([])
  const [activeAchievementToast, setActiveAchievementToast] =
    useState<AchievementDefinition | null>(null)
  const toastIdRef = useRef<number>(1)
  const toastTimersRef = useRef<number[]>([])
  const themeTransitionTimerRef = useRef<number | null>(null)
  const didSilentHydrateRef = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      toastTimersRef.current = []
      if (themeTransitionTimerRef.current !== null) {
        window.clearTimeout(themeTransitionTimerRef.current)
        themeTransitionTimerRef.current = null
      }
      document.documentElement.classList.remove('theme-transitioning')
    }
  }, [])

  // Тихая синхронизация уже выполненных условий из прежнего прогресса при загрузке (без спама уведомлений и ложного бейджа)
  useEffect(() => {
    if (didSilentHydrateRef.current) return
    didSilentHydrateRef.current = true
    const { nextUnlockedMap, newlyUnlocked } = evaluateAndPersistAchievements(
      crosswordProgress,
      unlockedAchievements,
      { markNewAsSeen: true }
    )
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(nextUnlockedMap)
    }
  }, [crosswordProgress, unlockedAchievements])

  // Последовательная очередь показа уведомлений о полученных достижениях (+ звуковой эффект по редкости)
  useEffect(() => {
    if (activeAchievementToast !== null || achievementQueue.length === 0) return

    const [nextAch, ...rest] = achievementQueue
    setAchievementQueue(rest)
    playAchievementSound(nextAch.rarity, notificationSettings.soundEnabled)

    if (!notificationSettings.visualNotificationsEnabled) {
      return
    }

    setActiveAchievementToast(nextAch)
    const duration =
      nextAch.rarity === 'legendary' ? 5400 : nextAch.rarity === 'rare' ? 4600 : 4000
    const timerId = window.setTimeout(() => {
      setActiveAchievementToast(null)
    }, duration)

    return () => window.clearTimeout(timerId)
  }, [
    achievementQueue,
    activeAchievementToast,
    notificationSettings.soundEnabled,
    notificationSettings.visualNotificationsEnabled,
  ])

  const updateSiteSettings = useCallback((updater: (prev: SiteSettings) => SiteSettings) => {
    setSiteSettings((prev) => {
      const next = updater(prev)
      saveSiteSettings(next)
      return next
    })
  }, [])

  const handleChangeTheme = useCallback(
    (nextTheme: ThemeMode) => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (currentTheme !== nextTheme && !prefersReducedMotion) {
        if (themeTransitionTimerRef.current !== null) {
          window.clearTimeout(themeTransitionTimerRef.current)
        }
        document.documentElement.classList.add('theme-transitioning')
        themeTransitionTimerRef.current = window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning')
          themeTransitionTimerRef.current = null
        }, 430)
      }

      updateSiteSettings((prev) => ({ ...prev, theme: nextTheme }))
    },
    [updateSiteSettings]
  )

  const handleToggleVisualNotifications = useCallback(
    (enabled: boolean) => {
      updateSiteSettings((prev) => ({ ...prev, visualNotificationsEnabled: enabled }))
      if (!enabled) {
        setXpToasts([])
        setActiveAchievementToast(null)
      }
    },
    [updateSiteSettings]
  )

  const handleToggleSound = useCallback(
    (enabled: boolean) => {
      updateSiteSettings((prev) => ({ ...prev, soundEnabled: enabled }))
    },
    [updateSiteSettings]
  )

  const scrollTopInstant = () => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    const handleResize = () => {
      if (window.innerWidth > 1040) setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileMenuOpen])

  const openLibraryPage = () => {
    setIsMobileMenuOpen(false)
    setIsSettingsOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsLibraryPageOpen(true)
    setActiveSection('library')
    window.history.pushState(null, '', '#library/catalog')
    scrollTopInstant()
  }

  const closeLibraryPageToHome = () => {
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsSettingsOpen(false)
    setActiveSection('home')
    window.history.pushState(null, '', '#home')
    scrollTopInstant()
  }

  const openTrainerPage = () => {
    setIsMobileMenuOpen(false)
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsTrainerPageOpen(true)
    setActiveSection('trainer')
    window.history.pushState(null, '', '#trainer/catalog')
    scrollTopInstant()
  }

  const closeTrainerPageToHome = () => {
    setIsTrainerPageOpen(false)
    setIsLibraryPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsSettingsOpen(false)
    setActiveSection('home')
    window.history.pushState(null, '', '#home')
    scrollTopInstant()
  }

  const openPracticePage = () => {
    setIsMobileMenuOpen(false)
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('menu')
    setIsPracticePageOpen(true)
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/catalog')
    scrollTopInstant()
  }

  const closePracticePageToHome = () => {
    setIsPracticePageOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsSettingsOpen(false)
    setPracticeView('menu')
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setActiveSection('home')
    window.history.pushState(null, '', '#home')
    scrollTopInstant()
  }

  const openGamesPage = () => {
    setIsMobileMenuOpen(false)
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsAchievementsPageOpen(false)
    setActiveCrosswordId(null)
    setGamesView('menu')
    setIsGamesPageOpen(true)
    setActiveSection('games')
    window.history.pushState(null, '', '#games/catalog')
    scrollTopInstant()
  }

  const closeGamesPageToHome = () => {
    setIsGamesPageOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsSettingsOpen(false)
    setGamesView('menu')
    setActiveCrosswordId(null)
    setActiveSection('home')
    window.history.pushState(null, '', '#home')
    scrollTopInstant()
  }

  const openAchievementsPage = () => {
    setIsMobileMenuOpen(false)
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(true)
    setUnlockedAchievements((prev) => markAllAchievementsAsSeen(prev))
    window.history.pushState(null, '', '#achievements/all')
    scrollTopInstant()
  }

  const closeAchievementsPageToHome = () => {
    setIsAchievementsPageOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsSettingsOpen(false)
    setActiveSection('home')
    window.history.pushState(null, '', '#home')
    scrollTopInstant()
  }

  const openSettingsPage = () => {
    setIsMobileMenuOpen(false)
    if (isSettingsOpen) {
      closeSettingsPage()
      return
    }
    if (isLibraryPageOpen) {
      setReturnToPage('library')
    } else if (isTrainerPageOpen) {
      setReturnToPage('trainer')
    } else if (isPracticePageOpen) {
      setReturnToPage('practice')
    } else if (isGamesPageOpen) {
      setReturnToPage('games')
    } else if (isAchievementsPageOpen) {
      setReturnToPage('achievements')
    } else {
      setReturnToPage('main')
    }
    setReturnSection(activeSection || 'home')
    setIsSettingsOpen(true)
    window.history.pushState(null, '', '#settings')
    scrollTopInstant()
  }

  const closeSettingsPage = () => {
    setIsSettingsOpen(false)
    if (returnToPage === 'library') {
      setIsLibraryPageOpen(true)
      setIsTrainerPageOpen(false)
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('library')
      window.history.pushState(null, '', '#library/catalog')
      scrollTopInstant()
      return
    }
    if (returnToPage === 'trainer') {
      setIsTrainerPageOpen(true)
      setIsLibraryPageOpen(false)
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('trainer')
      window.history.pushState(null, '', '#trainer/catalog')
      scrollTopInstant()
      return
    }
    if (returnToPage === 'practice') {
      setIsPracticePageOpen(true)
      setIsLibraryPageOpen(false)
      setIsTrainerPageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('practice')
      window.history.pushState(null, '', '#practice/catalog')
      scrollTopInstant()
      return
    }
    if (returnToPage === 'games') {
      setIsGamesPageOpen(true)
      setIsLibraryPageOpen(false)
      setIsTrainerPageOpen(false)
      setIsPracticePageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('games')
      window.history.pushState(null, '', '#games/catalog')
      scrollTopInstant()
      return
    }
    if (returnToPage === 'achievements') {
      setIsAchievementsPageOpen(true)
      setIsLibraryPageOpen(false)
      setIsTrainerPageOpen(false)
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setUnlockedAchievements((prev) => markAllAchievementsAsSeen(prev))
      window.history.pushState(null, '', '#achievements/all')
      scrollTopInstant()
      return
    }
    const targetId = returnSection || 'home'
    window.history.pushState(null, '', `#${targetId}`)
    if (targetId === 'home') {
      scrollTopInstant()
      setActiveSection('home')
      return
    }
    window.requestAnimationFrame(() => {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        setActiveSection(targetId)
      } else {
        scrollTopInstant()
      }
    })
  }

  const pushToast = useCallback(
    (
      kind: XPToastItem['kind'],
      title: string,
      subtitle?: string,
      durationMs = 4600,
      forceShow = false
    ) => {
      if (!forceShow && !notificationSettings.visualNotificationsEnabled) return
      const id = toastIdRef.current++
      setXpToasts((prev) => [...prev.slice(-2), { id, kind, title, subtitle }])
      const timerId = window.setTimeout(() => {
        setXpToasts((prev) => prev.filter((item) => item.id !== id))
      }, durationMs)
      toastTimersRef.current.push(timerId)
    },
    [notificationSettings.visualNotificationsEnabled]
  )

  const dismissToast = (id: number) => {
    setXpToasts((prev) => prev.filter((item) => item.id !== id))
  }

  const syncAchievementsAfterProgress = useCallback(
    (nextProgressMap: CrosswordProgressMap) => {
      setUnlockedAchievements((currentUnlocked) => {
        const { nextUnlockedMap, newlyUnlocked } = evaluateAndPersistAchievements(
          nextProgressMap,
          currentUnlocked,
          { markNewAsSeen: isAchievementsPageOpenRef.current }
        )
        if (newlyUnlocked.length > 0) {
          setAchievementQueue((prevQueue) => [...prevQueue, ...newlyUnlocked])
        }
        return nextUnlockedMap
      })
    },
    []
  )

  const notifyXPAward = useCallback(
    (res: AwardXPResult) => {
      if (res.xpGainedNow > 0) {
        pushToast(
          'xp',
          `Задание завершено! +${res.xpGainedNow} XP`,
          `Всего опыта: ${res.totalXp} XP`
        )
        if (res.leveledUp) {
          playLevelUpSound(siteSettings.soundEnabled)
          pushToast(
            'levelup',
            'Новый уровень достигнут!',
            `Поздравляем! Теперь у вас Уровень ${res.newLevel}.`,
            6200
          )
        } else {
          playXPSound(siteSettings.soundEnabled)
        }
      } else if (res.alreadyCompleted) {
        pushToast('already', 'Вы уже получили опыт за это задание', undefined, 3600)
      }
    },
    [pushToast, siteSettings.soundEnabled]
  )

  const handleResetGameProgress = () => {
    const emptyMap = resetAllGameProgress()
    setCrosswordProgress(emptyMap)
    setUnlockedAchievements({})
    setIsFreshBaseline(true)
    setAchievementQueue([])
    setActiveAchievementToast(null)
    setPracticeView('menu')
    setGamesView('menu')
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setActiveCrosswordId(null)
    pushToast('reset', 'Игровой прогресс успешно сброшен', 'Опыт, уровень и достижения обнулены.', 4800, true)
  }

  // Единый расчёт опыта, уровня, прогресса и всех 25 достижений
  const xpProgress = getXPProgress(crosswordProgress)
  const evaluatedAchievements = evaluateAchievementsView(
    crosswordProgress,
    unlockedAchievements
  )
  const unseenAchievementsCount = getUnseenAchievementsCount(unlockedAchievements)

  const syncFromHash = () => {
    const rawHash = window.location.hash.replace('#', '')
    if (rawHash === 'settings') {
      setIsSettingsOpen(true)
      return 'settings'
    }
    setIsSettingsOpen(false)
    if (rawHash === 'library/catalog') {
      setIsLibraryPageOpen(true)
      setIsTrainerPageOpen(false)
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('library')
      return 'library-page'
    }
    setIsLibraryPageOpen(false)
    if (rawHash === 'trainer/catalog') {
      setIsTrainerPageOpen(true)
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(false)
      setActiveSection('trainer')
      return 'trainer-page'
    }
    setIsTrainerPageOpen(false)
    if (rawHash === 'achievements/all') {
      setIsPracticePageOpen(false)
      setIsGamesPageOpen(false)
      setIsAchievementsPageOpen(true)
      setUnlockedAchievements((prev) => markAllAchievementsAsSeen(prev))
      return 'achievements-page'
    }
    setIsAchievementsPageOpen(false)
    if (rawHash === 'practice/catalog') {
      setIsPracticePageOpen(true)
      setPracticeView('menu')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    if (rawHash === 'practice/situations') {
      setIsPracticePageOpen(true)
      setPracticeView('situations-catalog')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    if (rawHash.startsWith('practice/situations/')) {
      const id = rawHash.replace('practice/situations/', '')
      const exists = legalChatCases.some((c) => c.id === id)
      setIsPracticePageOpen(true)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      if (exists) {
        setActiveChatCaseId(id)
        setPracticeView('situation-play')
      } else {
        setActiveChatCaseId(null)
        setPracticeView('situations-catalog')
      }
      return 'practice-page'
    }
    if (rawHash === 'practice/contract-errors') {
      setIsPracticePageOpen(true)
      setPracticeView('contract-errors')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    if (rawHash === 'practice/contract-analysis') {
      setIsPracticePageOpen(true)
      setPracticeView('analysis-catalog')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    if (rawHash.startsWith('practice/contract-analysis/')) {
      const id = rawHash.replace('practice/contract-analysis/', '')
      const exists = contractAnalysisData.some((c) => c.id === id)
      setIsPracticePageOpen(true)
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveSection('practice')
      if (exists) {
        setActiveAnalysisContractId(id)
        setPracticeView('analysis-play')
      } else {
        setActiveAnalysisContractId(null)
        setPracticeView('analysis-catalog')
      }
      return 'practice-page'
    }
    if (rawHash === 'practice/scenarios') {
      setIsPracticePageOpen(true)
      setPracticeView('scenarios-catalog')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    if (rawHash.startsWith('practice/scenarios/')) {
      const id = rawHash.replace('practice/scenarios/', '')
      const exists = legalCasesData.some((c) => c.id === id)
      setIsPracticePageOpen(true)
      setActiveChatCaseId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      if (exists) {
        setActiveScenarioId(id)
        setPracticeView('scenario-play')
      } else {
        setActiveScenarioId(null)
        setPracticeView('scenarios-catalog')
      }
      return 'practice-page'
    }
    if (rawHash === 'practice/penalty-calculator') {
      setIsPracticePageOpen(true)
      setPracticeView('penalty-calculator')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      setActiveSection('practice')
      return 'practice-page'
    }
    setIsPracticePageOpen(false)
    if (rawHash === 'practice') {
      setIsGamesPageOpen(false)
      setPracticeView('menu')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
      return 'practice'
    }
    if (rawHash === 'games/catalog') {
      setIsGamesPageOpen(true)
      setGamesView('menu')
      setActiveCrosswordId(null)
      setActiveSection('games')
      return 'games-page'
    }
    if (rawHash === 'games/crosswords') {
      setIsGamesPageOpen(true)
      setGamesView('crosswords-catalog')
      setActiveCrosswordId(null)
      setActiveSection('games')
      return 'games-page'
    }
    if (rawHash.startsWith('games/crosswords/')) {
      const id = rawHash.replace('games/crosswords/', '')
      const exists = crosswordPuzzles.some((p) => p.id === id)
      setIsGamesPageOpen(true)
      setActiveSection('games')
      if (exists) {
        setActiveCrosswordId(id)
        setGamesView('crossword-play')
      } else {
        setActiveCrosswordId(null)
        setGamesView('crosswords-catalog')
      }
      return 'games-page'
    }
    if (rawHash === 'games/wheel') {
      setIsGamesPageOpen(true)
      setGamesView('wheel-play')
      setActiveCrosswordId(null)
      setActiveSection('games')
      return 'games-page'
    }
    if (rawHash === 'games/time') {
      setIsGamesPageOpen(true)
      setGamesView('time-play')
      setActiveCrosswordId(null)
      setActiveSection('games')
      return 'games-page'
    }
    setIsGamesPageOpen(false)
    if (rawHash === 'games') {
      setGamesView('menu')
      setActiveCrosswordId(null)
      return 'games'
    }
    return rawHash
  }

  const openSituationsCatalog = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('situations-catalog')
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/situations')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openSituationChatCase = (chatCase: LegalChatCase) => {
    setIsPracticePageOpen(true)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setActiveChatCaseId(chatCase.id)
    setPracticeView('situation-play')
    setActiveSection('practice')
    window.history.pushState(null, '', `#practice/situations/${chatCase.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openContractErrorsPractice = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('contract-errors')
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/contract-errors')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openContractAnalysisCatalog = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('analysis-catalog')
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/contract-analysis')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openContractAnalysisItem = (contract: ContractAnalysisItem) => {
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(contract.id)
    setPracticeView('analysis-play')
    setActiveSection('practice')
    window.history.pushState(null, '', `#practice/contract-analysis/${contract.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openScenariosCatalog = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('scenarios-catalog')
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/scenarios')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openScenarioCase = (scenario: LegalCaseScenario) => {
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveAnalysisContractId(null)
    setActiveScenarioId(scenario.id)
    setPracticeView('scenario-play')
    setActiveSection('practice')
    window.history.pushState(null, '', `#practice/scenarios/${scenario.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openPenaltyCalculator = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsPracticePageOpen(true)
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('penalty-calculator')
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/penalty-calculator')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRecordPenaltyCaseSolved = (caseNumber: number) => {
    const res = recordPenaltyCaseSolved(crosswordProgress, caseNumber, PENALTY_CASES.length)
    setCrosswordProgress(res.nextMap)
    if (res.xpGainedNow > 0) {
      notifyXPAward(res)
    }
    syncAchievementsAfterProgress(res.nextMap)
    return {
      xpGainedNow: res.xpGainedNow,
      alreadyCompleted: res.alreadyCompleted,
      solvedCaseNumbers: res.solvedCaseNumbers,
      justSolvedThisCase: res.justSolvedThisCase,
      allCasesSolved: res.allCasesSolved,
    }
  }

  const backToPracticeMenu = () => {
    setActiveChatCaseId(null)
    setActiveScenarioId(null)
    setActiveAnalysisContractId(null)
    setPracticeView('menu')
    setIsPracticePageOpen(true)
    setActiveSection('practice')
    window.history.pushState(null, '', '#practice/catalog')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAwardTaskXP = (payload: AwardXPPayload) => {
    const res = awardXP(crosswordProgress, payload)
    setCrosswordProgress(res.nextMap)
    notifyXPAward(res)
    syncAchievementsAfterProgress(res.nextMap)
    return {
      xpGainedNow: res.xpGainedNow,
      alreadyCompleted: res.alreadyCompleted,
      leveledUp: res.leveledUp,
      newLevel: res.newLevel,
    }
  }

  const handleRecordChatCaseAnswer = (caseId: string, isCorrect: boolean) => {
    const res = recordLegalChatCaseResult(crosswordProgress, caseId, isCorrect)
    setCrosswordProgress(res.nextMap)
    notifyXPAward(res)
    syncAchievementsAfterProgress(res.nextMap)
    return { xpGainedNow: res.xpGainedNow, alreadyAwarded: res.alreadyAwarded }
  }

  const handleSaveContractAnalysisStep = useCallback(
    (contractId: string, stepIndex: number, maxUnlockedStep: number) => {
      setCrosswordProgress((prev) =>
        saveContractAnalysisStep(prev, contractId, stepIndex, maxUnlockedStep)
      )
    },
    []
  )

  const handleCompleteContractAnalysis = (contractId: string, totalSteps: number) => {
    const res = completeContractAnalysis(crosswordProgress, contractId, totalSteps)
    setCrosswordProgress(res.nextMap)
    notifyXPAward(res)
    syncAchievementsAfterProgress(res.nextMap)
    return { xpGainedNow: res.xpGainedNow, alreadyCompleted: res.alreadyCompleted }
  }

  const handleCompleteLegalCase = (caseId: string, correctCount: number) => {
    const res = recordLegalCaseResult(crosswordProgress, caseId, correctCount)
    setCrosswordProgress(res.nextMap)
    notifyXPAward(res)
    syncAchievementsAfterProgress(res.nextMap)
    return { xpGainedNow: res.xpGainedNow, alreadyCompleted: res.alreadyCompleted }
  }

  const openWheelGame = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsGamesPageOpen(true)
    setActiveCrosswordId(null)
    setGamesView('wheel-play')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/wheel')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openTimedGame = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsGamesPageOpen(true)
    setActiveCrosswordId(null)
    setGamesView('time-play')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/time')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCrosswordsCatalog = () => {
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsAchievementsPageOpen(false)
    setIsGamesPageOpen(true)
    setActiveCrosswordId(null)
    setGamesView('crosswords-catalog')
    setActiveSection('games')
    window.history.pushState(null, '', '#games/crosswords')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCrosswordPuzzle = (puzzle: CrosswordPuzzle) => {
    setIsGamesPageOpen(true)
    setActiveCrosswordId(puzzle.id)
    setGamesView('crossword-play')
    setActiveSection('games')
    window.history.pushState(null, '', `#games/crosswords/${puzzle.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToGamesMenu = () => {
    setActiveCrosswordId(null)
    setGamesView('menu')
    setIsGamesPageOpen(true)
    setActiveSection('games')
    window.history.pushState(null, '', '#games/catalog')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRecordCrosswordResult = (
    puzzleId: string,
    solvedWordNumbers: number[],
    totalWords: number
  ) => {
    const res = recordCrosswordResult(crosswordProgress, puzzleId, solvedWordNumbers, totalWords)
    setCrosswordProgress(res.nextMap)
    // Показываем уведомление о XP и проверяем достижения при полном верном завершении кроссворда
    if (solvedWordNumbers.length >= totalWords) {
      notifyXPAward(res)
      syncAchievementsAfterProgress(res.nextMap)
    }
    return { xpGainedNow: res.xpGainedNow, alreadyMaxed: res.alreadyMaxed }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#0c1412' : '#ecf5f0')
    }
  }, [theme])

  const toggleTheme = () => {
    handleChangeTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (
      isSettingsOpen ||
      isLibraryPageOpen ||
      isTrainerPageOpen ||
      isPracticePageOpen ||
      isGamesPageOpen ||
      isAchievementsPageOpen
    ) {
      return
    }
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
  }, [
    isSettingsOpen,
    isLibraryPageOpen,
    isTrainerPageOpen,
    isPracticePageOpen,
    isGamesPageOpen,
    isAchievementsPageOpen,
  ])

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
    setIsMobileMenuOpen(false)
    const wasOnStandalonePage =
      isSettingsOpen ||
      isLibraryPageOpen ||
      isTrainerPageOpen ||
      isPracticePageOpen ||
      isGamesPageOpen ||
      isAchievementsPageOpen
    setIsSettingsOpen(false)
    setIsLibraryPageOpen(false)
    setIsTrainerPageOpen(false)
    setIsPracticePageOpen(false)
    setIsGamesPageOpen(false)
    setIsAchievementsPageOpen(false)
    if (targetId === 'practice') {
      setPracticeView('menu')
      setActiveChatCaseId(null)
      setActiveScenarioId(null)
      setActiveAnalysisContractId(null)
    }
    if (targetId === 'games') {
      setGamesView('menu')
      setActiveCrosswordId(null)
    }
    setActiveSection(targetId)
    window.history.pushState(null, '', `#${targetId}`)

    const scrollToTarget = () => {
      if (targetId === 'home') {
        if (wasOnStandalonePage) {
          scrollTopInstant()
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        return
      }
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }

    if (wasOnStandalonePage) {
      scrollTopInstant()
      if (targetId !== 'home') {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(scrollToTarget)
        })
      }
    } else {
      scrollToTarget()
    }
  }

  const currentPageKey: RoutePageKey = isSettingsOpen
    ? 'settings'
    : isLibraryPageOpen
    ? 'library'
    : isTrainerPageOpen
    ? 'trainer'
    : isPracticePageOpen
    ? 'practice'
    : isGamesPageOpen
    ? 'games'
    : isAchievementsPageOpen
    ? 'achievements'
    : 'home'

  const scrollRouteKey = `${currentPageKey}:${practiceView}:${gamesView}:${activeChatCaseId ?? ''}:${activeScenarioId ?? ''}:${activeAnalysisContractId ?? ''}:${activeCrosswordId ?? ''}`
  useScrollReveal(scrollRouteKey)

  return (
    <>
      {/* Живой ненавязчивый анимированный фон (вне переходов маршрутов — без мерцания) */}
      <AmbientBackground />

      {/* Деликатный шлейф курсора (только на десктопе с мышью, без накопления DOM) */}
      <CursorTrail />

      {/* Тонкий индикатор прокрутки страницы в самом верху окна */}
      <ScrollProgressBar routeKey={scrollRouteKey} />

      <LegalSearchPreloader onRevealStart={() => setIsHeroReadyForTyping(true)} />

      {/* Компактная анимация перехода между разделами и при возврате на главную */}
      <RouteTransitionOverlay
        pageKey={currentPageKey}
        enabled={isHeroReadyForTyping}
        onTransitionStateChange={setIsRouteTransitioning}
      />

      {/* Полноширинная верхняя панель (фон и нижняя граница на 100% ширины окна) */}
      <header className="topbar">
        <div className="topbar-inner">
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
            {navItems.map((item) => {
              const isActive =
                !isSettingsOpen && !isAchievementsPageOpen && activeSection === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-link-text" data-label={item.label}>
                    {item.label}
                  </span>
                </a>
              )
            })}
          </nav>

          <div className="topbar-actions">
            <button
              type="button"
              className={`achievements-nav-btn ${
                !isSettingsOpen && isAchievementsPageOpen ? 'is-active' : ''
              }`}
              onClick={openAchievementsPage}
              aria-current={!isSettingsOpen && isAchievementsPageOpen ? 'page' : undefined}
              aria-label={
                unseenAchievementsCount > 0
                  ? `Достижения — новых непросмотренных: ${unseenAchievementsCount}`
                  : 'Открыть страницу достижений'
              }
              title="Достижения"
            >
              <span className="ach-nav-icon-wrap" aria-hidden="true">
                <svg
                  className="ach-nav-trophy-svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
                </svg>
                {unseenAchievementsCount > 0 && (
                  <span className="ach-nav-badge" aria-hidden="true">
                    {unseenAchievementsCount}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${isSettingsOpen ? 'is-active' : ''}`}
              onClick={openSettingsPage}
              aria-expanded={isSettingsOpen}
              aria-label="Открыть настройки сайта"
              title="Настройки"
            >
              <span className="settings-nav-icon" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </span>
              <span className="settings-nav-label">Настройки</span>
            </button>

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

            <button
              type="button"
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isMobileMenuOpen ? 'Закрыть меню навигации' : 'Открыть меню навигации'}
            >
              <span className="burger-bar burger-bar-1" aria-hidden="true" />
              <span className="burger-bar burger-bar-2" aria-hidden="true" />
              <span className="burger-bar burger-bar-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Раскрывающееся мобильное меню навигации */}
        <div
          id="mobile-nav-drawer"
          className={`mobile-nav-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="mobile-nav-drawer-inner">
            <nav className="mobile-nav-list" aria-label="Мобильная навигация">
              {navItems.map((item) => {
                const isActive =
                  !isSettingsOpen && !isAchievementsPageOpen && activeSection === item.id
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="mobile-nav-dot" aria-hidden="true" />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>

            <div className="mobile-nav-quick-actions">
              <button
                type="button"
                tabIndex={isMobileMenuOpen ? 0 : -1}
                className={`mobile-nav-action-btn ${
                  !isSettingsOpen && isAchievementsPageOpen ? 'is-active' : ''
                }`}
                onClick={openAchievementsPage}
              >
                <span>Достижения</span>
                {unseenAchievementsCount > 0 && (
                  <span className="mobile-nav-badge">{unseenAchievementsCount}</span>
                )}
              </button>
              <button
                type="button"
                tabIndex={isMobileMenuOpen ? 0 : -1}
                className={`mobile-nav-action-btn ${isSettingsOpen ? 'is-active' : ''}`}
                onClick={openSettingsPage}
              >
                <span>Настройки</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="site-shell">

      <main className="site-main">
        <div
          key={currentPageKey}
          className={`page-transition-stage ${
            isRouteTransitioning ? 'is-route-transitioning' : ''
          }`}
        >
        {isSettingsOpen ? (
          <SettingsPage
            settings={siteSettings}
            onChangeTheme={handleChangeTheme}
            onToggleVisualNotifications={handleToggleVisualNotifications}
            onToggleSound={handleToggleSound}
            onBack={closeSettingsPage}
          />
        ) : isLibraryPageOpen ? (
          <LibraryPage onBackToHome={closeLibraryPageToHome} />
        ) : isTrainerPageOpen ? (
          <TrainerPage
            progressMap={crosswordProgress}
            onAwardXP={handleAwardTaskXP}
            onBackToHome={closeTrainerPageToHome}
          />
        ) : isPracticePageOpen ? (
          <PracticePage
            practiceView={practiceView}
            activeChatCaseId={activeChatCaseId}
            activeScenarioId={activeScenarioId}
            activeAnalysisContractId={activeAnalysisContractId}
            progressMap={crosswordProgress}
            onBackToHome={closePracticePageToHome}
            onBackToPracticeMenu={backToPracticeMenu}
            onOpenSituationsCatalog={openSituationsCatalog}
            onOpenSituationChatCase={openSituationChatCase}
            onOpenContractErrors={openContractErrorsPractice}
            onOpenContractAnalysisCatalog={openContractAnalysisCatalog}
            onOpenContractAnalysisItem={openContractAnalysisItem}
            onOpenScenariosCatalog={openScenariosCatalog}
            onOpenScenarioCase={openScenarioCase}
            onOpenPenaltyCalculator={openPenaltyCalculator}
            onRecordChatCaseAnswer={handleRecordChatCaseAnswer}
            onAwardTaskXP={handleAwardTaskXP}
            onSaveContractAnalysisStep={handleSaveContractAnalysisStep}
            onCompleteContractAnalysis={handleCompleteContractAnalysis}
            onCompleteLegalCase={handleCompleteLegalCase}
            onRecordPenaltyCaseSolved={handleRecordPenaltyCaseSolved}
          />
        ) : isGamesPageOpen ? (
          <GamesPage
            gamesView={gamesView}
            activeCrosswordId={activeCrosswordId}
            progressMap={crosswordProgress}
            onBackToHome={closeGamesPageToHome}
            onBackToGamesMenu={backToGamesMenu}
            onOpenCrosswordsCatalog={openCrosswordsCatalog}
            onOpenCrosswordPuzzle={openCrosswordPuzzle}
            onOpenWheelGame={openWheelGame}
            onOpenTimedGame={openTimedGame}
            onRecordCrosswordResult={handleRecordCrosswordResult}
            onAwardTaskXP={handleAwardTaskXP}
          />
        ) : isAchievementsPageOpen ? (
          <AchievementsPage
            evaluatedAchievements={evaluatedAchievements}
            notificationSettings={notificationSettings}
            onResetProgress={handleResetGameProgress}
            onBackToHome={closeAchievementsPageToHome}
          />
        ) : (
          <>
        {/* Главный экран (Hero) */}
        <section className="hero" id="home">
          {/* Плавающие полупрозрачные юридические символы на заднем фоне баннера */}
          <div className="hero-floating-symbols" aria-hidden="true">
            <span className="hero-float-symbol sym-glyph sym-pos-1">§</span>
            <span className="hero-float-symbol sym-glyph sym-pos-2 is-mobile-hidden">⚖</span>
            <span className="hero-float-symbol sym-emoji sym-pos-3">📜</span>
            <span className="hero-float-symbol sym-emoji sym-pos-4 is-mobile-hidden">📖</span>
            <span className="hero-float-symbol sym-glyph sym-pos-5 is-mobile-hidden">§</span>
            <span className="hero-float-symbol sym-glyph sym-pos-6">⚖</span>
            <span className="hero-float-symbol sym-emoji sym-pos-7">📖</span>
            <span className="hero-float-symbol sym-glyph sym-pos-8 is-mobile-hidden">§</span>
            <span className="hero-float-symbol sym-emoji sym-pos-9">📜</span>
            <span className="hero-float-symbol sym-glyph sym-pos-10">⚖</span>
          </div>

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА
            </div>
            <HeroTypewriterTitle start={isHeroReadyForTyping} />
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
            <div className="art-card art-card-main scales-levitate-hero">
              <div className="scale-icon">
                <svg
                  className="hero-scales-svg"
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Основание и центральная стойка весов (статичны) */}
                  <g className="scale-stand">
                    <path
                      d="M32 11V51"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 53H43"
                      stroke="currentColor"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M25.5 49.5C27.5 48.2 36.5 48.2 38.5 49.5L40.5 53H23.5L25.5 49.5Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    <circle cx="32" cy="11" r="2.8" fill="currentColor" />
                  </g>

                  {/* Подвижное коромысло с чашами, сохраняющими горизонтальный баланс */}
                  <g className="scale-beam-group">
                    <path
                      d="M14 19C20 17.5 26 16.8 32 16.8C38 16.8 44 17.5 50 19"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="32" cy="16.8" r="2.6" fill="currentColor" />
                    <circle cx="14" cy="19" r="2.1" fill="currentColor" />
                    <circle cx="50" cy="19" r="2.1" fill="currentColor" />

                    {/* Левый подвес и чаша */}
                    <g className="scale-pan-left">
                      <path
                        d="M14 20.5L7.8 36.5M14 20.5L20.2 36.5"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        opacity="0.88"
                      />
                      <path
                        d="M6.2 36.5H21.8C20.9 41.2 17.9 43.4 14 43.4C10.1 43.4 7.1 41.2 6.2 36.5Z"
                        fill="currentColor"
                      />
                    </g>

                    {/* Правый подвес и чаша */}
                    <g className="scale-pan-right">
                      <path
                        d="M50 20.5L43.8 36.5M50 20.5L56.2 36.5"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        opacity="0.88"
                      />
                      <path
                        d="M42.2 36.5H57.8C56.9 41.2 53.9 43.4 50 43.4C46.1 43.4 43.1 41.2 42.2 36.5Z"
                        fill="currentColor"
                      />
                    </g>
                  </g>
                </svg>
              </div>
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

        {/* 1. Правовая библиотека (презентационная карточка с переходом на отдельную страницу) */}
        <LibrarySection onOpenLibrary={openLibraryPage} />

        {/* 2. Тренажёр знаний (презентационная карточка с переходом на отдельную страницу) */}
        <TrainerSection onOpenTrainer={openTrainerPage} />

        {/* 3. Юридическая практика (презентационная карточка с переходом на отдельную страницу) */}
        <PracticeSection onOpenPractice={openPracticePage} />

        {/* 4. Игровая зона (презентационная карточка с переходом на отдельную страницу) */}
        <GamesSection onOpenGames={openGamesPage} />

        {/* 5. Опыт и уровень (с переходом на отдельную страницу достижений) */}
        <AchievementsSection
          xpProgress={xpProgress}
          isFreshBaseline={isFreshBaseline}
          onOpenAchievementsPage={openAchievementsPage}
        />
          </>
        )}
        </div>
      </main>
      </div>

      {/* Полноширинная нижняя зона с плавным затемнением фона и неизменной юридической оговоркой */}
      <footer className="footer-atmosphere-zone" id="footer">
        <div className="footer-inner footer">
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
                23.11.2026 года были проверены нормы и сроки по действующей редакции Гражданского кодекса.
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
        </div>
      </footer>

      {/* Уведомления единой системы XP, достижений и повышения уровня */}
      {(xpToasts.length > 0 || activeAchievementToast !== null) && (
        <div
          className="xp-toast-stack"
          role="region"
          aria-live="polite"
          aria-label="Уведомления о начислении опыта и достижениях"
        >
          {activeAchievementToast && (
            <div
              key={`ach-${activeAchievementToast.id}`}
              className={`xp-toast ach-unlock-toast ach-unlock--${activeAchievementToast.rarity}`}
              role="status"
            >
              <span className="ach-unlock-icon" aria-hidden="true">
                {activeAchievementToast.icon}
              </span>
              <div className="xp-toast-body">
                <div className="ach-unlock-topline">
                  <span className="ach-unlock-eyebrow">Достижение получено!</span>
                  <span
                    className={`ach2-rarity-badge rarity-${activeAchievementToast.rarity}`}
                  >
                    {RARITY_LABELS[activeAchievementToast.rarity]}
                  </span>
                  {typeof activeAchievementToast.xpReward === 'number' &&
                    activeAchievementToast.xpReward > 0 && (
                      <span className="ach2-xp-reward-pill">
                        +{activeAchievementToast.xpReward} XP
                      </span>
                    )}
                </div>
                <strong className="xp-toast-title">{activeAchievementToast.title}</strong>
                <span className="xp-toast-sub">{activeAchievementToast.description}</span>
              </div>
              <button
                type="button"
                className="xp-toast-close"
                onClick={() => setActiveAchievementToast(null)}
                aria-label="Закрыть уведомление о достижении"
              >
                ×
              </button>
            </div>
          )}

          {xpToasts.map((toast) => (
            <div
              key={toast.id}
              className={`xp-toast xp-toast--${toast.kind}`}
              role="status"
            >
              <span className="xp-toast-icon" aria-hidden="true">
                {toast.kind === 'levelup'
                  ? '🏆'
                  : toast.kind === 'xp'
                  ? '★'
                  : toast.kind === 'reset'
                  ? '↺'
                  : 'ℹ'}
              </span>
              <div className="xp-toast-body">
                <strong className="xp-toast-title">{toast.title}</strong>
                {toast.subtitle && (
                  <span className="xp-toast-sub">{toast.subtitle}</span>
                )}
              </div>
              <button
                type="button"
                className="xp-toast-close"
                onClick={() => dismissToast(toast.id)}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default App
