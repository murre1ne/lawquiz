import type React from 'react'
import { ContractErrorPractice } from './ContractErrorPractice'
import { LegalCasesCatalog } from './LegalCasesCatalog'
import { LegalCasePlayer } from './LegalCasePlayer'
import { ContractAnalysisCatalog } from './ContractAnalysisCatalog'
import { ContractAnalysisViewer } from './ContractAnalysisViewer'
import { LegalChatCases } from './LegalChatCases'
import { PenaltyCalculatorPractice } from './PenaltyCalculatorPractice'
import { legalCasesData, type LegalCaseScenario } from '../data/legalCasesData'
import {
  contractAnalysisData,
  type ContractAnalysisItem,
} from '../data/contractAnalysisData'
import { legalChatCases, type LegalChatCase } from '../data/legalChatCases'
import {
  PENALTY_ACHIEVEMENT_XP_REWARD,
  PENALTY_CASES,
} from '../data/penaltyCalculatorData'
import {
  XP_REWARDS,
  getSolvedPenaltyCaseNumbers,
  isTaskCompleted,
  type AwardXPPayload,
  type CrosswordProgressMap,
} from '../data/crosswordProgress'

export type PracticeViewMode =
  | 'menu'
  | 'situations-catalog'
  | 'situation-play'
  | 'contract-errors'
  | 'scenarios-catalog'
  | 'scenario-play'
  | 'analysis-catalog'
  | 'analysis-play'
  | 'penalty-calculator'

interface PracticeCard {
  id: string
  title: string
  description: string
  focus: string
  status: string
  icon: React.ReactNode
}

// 3. Юридическая практика — существующие 4 карточки
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
  {
    id: 'prac-scenarios',
    title: 'Выбери развитие событий',
    description: 'Принимай юридические решения и смотри, к чему они приводят.',
    focus: '4 юридических дела',
    status: 'Интерактив',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="M6 9v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V9" />
        <path d="M12 15v0" />
      </svg>
    ),
  },
  {
    id: 'prac-penalty-calc',
    title: 'Калькулятор договорной неустойки',
    description:
      'Рассчитывай размер договорной пени за просрочку обязательств. Изучай практические ситуации, работай с условиями договора и проверяй правильность своих расчётов.',
    focus: '3 учебных дела',
    status: 'Калькулятор и задачи',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <path d="M16 10h.01" />
        <path d="M12 10h.01" />
        <path d="M8 10h.01" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M12 18h.01" />
        <path d="M8 18h.01" />
      </svg>
    ),
  },
]

function getPracticeViewLabel(view: PracticeViewMode): string {
  switch (view) {
    case 'situations-catalog':
    case 'situation-play':
      return 'Разбор юридических ситуаций'
    case 'contract-errors':
      return 'Поиск ошибок в учебном договоре'
    case 'analysis-catalog':
    case 'analysis-play':
      return 'Пошаговый разбор договоров'
    case 'scenarios-catalog':
    case 'scenario-play':
      return 'Выбери развитие событий'
    case 'penalty-calculator':
      return 'Калькулятор договорной неустойки'
    default:
      return '5 форматов заданий'
  }
}

interface PracticePageProps {
  practiceView: PracticeViewMode
  activeChatCaseId: string | null
  activeScenarioId: string | null
  activeAnalysisContractId: string | null
  progressMap: CrosswordProgressMap
  onBackToHome: () => void
  onBackToPracticeMenu: () => void
  onOpenSituationsCatalog: () => void
  onOpenSituationChatCase: (chatCase: LegalChatCase) => void
  onOpenContractErrors: () => void
  onOpenContractAnalysisCatalog: () => void
  onOpenContractAnalysisItem: (contract: ContractAnalysisItem) => void
  onOpenScenariosCatalog: () => void
  onOpenScenarioCase: (scenario: LegalCaseScenario) => void
  onOpenPenaltyCalculator: () => void
  onRecordChatCaseAnswer: (
    caseId: string,
    isCorrect: boolean
  ) => { xpGainedNow: number; alreadyAwarded: boolean }
  onAwardTaskXP: (payload: AwardXPPayload) => {
    xpGainedNow: number
    alreadyCompleted: boolean
    leveledUp: boolean
    newLevel: number
  }
  onSaveContractAnalysisStep: (
    contractId: string,
    stepIndex: number,
    maxUnlockedStep: number
  ) => void
  onCompleteContractAnalysis: (
    contractId: string,
    totalSteps: number
  ) => { xpGainedNow: number; alreadyCompleted: boolean }
  onCompleteLegalCase: (
    caseId: string,
    correctCount: number
  ) => { xpGainedNow: number; alreadyCompleted: boolean }
  onRecordPenaltyCaseSolved: (caseNumber: number) => {
    xpGainedNow: number
    alreadyCompleted: boolean
    solvedCaseNumbers: number[]
    justSolvedThisCase: boolean
    allCasesSolved: boolean
  }
}

export function PracticePage({
  practiceView,
  activeChatCaseId,
  activeScenarioId,
  activeAnalysisContractId,
  progressMap,
  onBackToHome,
  onBackToPracticeMenu,
  onOpenSituationsCatalog,
  onOpenSituationChatCase,
  onOpenContractErrors,
  onOpenContractAnalysisCatalog,
  onOpenContractAnalysisItem,
  onOpenScenariosCatalog,
  onOpenScenarioCase,
  onOpenPenaltyCalculator,
  onRecordChatCaseAnswer,
  onAwardTaskXP,
  onSaveContractAnalysisStep,
  onCompleteContractAnalysis,
  onCompleteLegalCase,
  onRecordPenaltyCaseSolved,
}: PracticePageProps) {
  const completedCasesCount = legalCasesData.filter((scenario) =>
    isTaskCompleted(progressMap, scenario.id)
  ).length

  const completedContractsCount = contractAnalysisData.filter((contract) =>
    isTaskCompleted(progressMap, contract.id)
  ).length

  const completedChatCasesCount = legalChatCases.filter((chatCase) =>
    isTaskCompleted(progressMap, chatCase.id)
  ).length

  const contractAuditCompleted = isTaskCompleted(progressMap, 'practice-contract-errors')
  const solvedPenaltyCasesCount = getSolvedPenaltyCaseNumbers(progressMap).length
  const penaltyCalcCompleted = solvedPenaltyCasesCount >= PENALTY_CASES.length

  const activeScenario =
    legalCasesData.find((scenario) => scenario.id === activeScenarioId) ?? null
  const activeAnalysisContract =
    contractAnalysisData.find((contract) => contract.id === activeAnalysisContractId) ?? null

  const nextAnalysisContract: ContractAnalysisItem | null = (() => {
    if (!activeAnalysisContract) return null
    const idx = contractAnalysisData.findIndex((item) => item.id === activeAnalysisContract.id)
    if (idx >= 0 && idx < contractAnalysisData.length - 1) {
      return contractAnalysisData[idx + 1]
    }
    const firstUncompleted = contractAnalysisData.find(
      (item) => item.id !== activeAnalysisContract.id && !progressMap[item.id]?.completed
    )
    return firstUncompleted ?? contractAnalysisData[0]
  })()

  return (
    <section
      className="content-section practice-standalone-page"
      id="practice-page"
      aria-labelledby="practice-page-heading"
    >
      <div className="section-container">
        {/* Верхняя панель навигации отдельной страницы юридической практики */}
        <div className="interactive-top-bar library-page-topbar">
          {practiceView === 'menu' ? (
            <button type="button" className="interactive-back-btn" onClick={onBackToHome}>
              <span aria-hidden="true">←</span>
              <span>На главную страницу</span>
            </button>
          ) : (
            <button type="button" className="interactive-back-btn" onClick={onBackToPracticeMenu}>
              <span aria-hidden="true">←</span>
              <span>К списку интерактивов</span>
            </button>
          )}
          <span className="interactive-mode-badge library-page-badge">
            Юридическая практика · {getPracticeViewLabel(practiceView)}
          </span>
        </div>

        {/* Заголовок отдельной страницы */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">03 / 05</span>
              <span className="section-category-tag">ПРАКТИКУМ И КЕЙСЫ</span>
            </div>
            <h1 id="practice-page-heading" className="section-main-title practice-page-title">
              Юридическая практика
            </h1>
            <p className="section-main-desc">
              Применяйте нормы гражданского права Республики Казахстан для решения практических задач и анализа юридических ситуаций
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

        {/* Каталог карточек юридической практики */}
        {practiceView === 'menu' && (
          <>
            <div className="practice-grid">
              {practiceCards.map((card, index) => {
                const isSituationsCard = card.id === 'prac-situations'
                const isContractErrorsCard = card.id === 'prac-errors'
                const isContractAnalysisCard = card.id === 'prac-contracts'
                const isScenariosCard = card.id === 'prac-scenarios'
                const isPenaltyCalcCard = card.id === 'prac-penalty-calc'
                const isInteractivePractice =
                  isSituationsCard ||
                  isContractErrorsCard ||
                  isContractAnalysisCard ||
                  isScenariosCard ||
                  isPenaltyCalcCard
                const handleOpenPractice = isSituationsCard
                  ? onOpenSituationsCatalog
                  : isContractErrorsCard
                  ? onOpenContractErrors
                  : isContractAnalysisCard
                  ? onOpenContractAnalysisCatalog
                  : isScenariosCard
                  ? onOpenScenariosCatalog
                  : isPenaltyCalcCard
                  ? onOpenPenaltyCalculator
                  : undefined

                return (
                  <article
                    key={card.id}
                    className={`edu-card edu-card-tone-${index % 3} ${
                      isInteractivePractice ? 'game-card-interactive' : ''
                    } ${isSituationsCard ? 'scales-levitate-card levitate-delay-3' : ''}`}
                    onClick={handleOpenPractice}
                    role={isInteractivePractice ? 'button' : undefined}
                    tabIndex={isInteractivePractice ? 0 : undefined}
                    onKeyDown={
                      handleOpenPractice
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleOpenPractice()
                            }
                          }
                        : undefined
                    }
                    aria-label={
                      isSituationsCard
                        ? 'Открыть тренажёр «Разбор юридических ситуаций»'
                        : isContractErrorsCard
                        ? 'Открыть практику «Поиск ошибок в учебном договоре»'
                        : isContractAnalysisCard
                        ? 'Открыть раздел «Пошаговый разбор договоров»'
                        : isScenariosCard
                        ? 'Открыть интерактив «Выбери развитие событий»'
                        : isPenaltyCalcCard
                        ? 'Открыть «Калькулятор договорной неустойки»'
                        : undefined
                    }
                  >
                    <div className="card-topline">
                      <span className="card-icon-badge" aria-hidden="true">
                        {card.icon}
                      </span>
                      <span className="card-pill-tag">
                        {isSituationsCard
                          ? `${legalChatCases.length} кейса · ${completedChatCasesCount}/${legalChatCases.length}`
                          : isContractErrorsCard
                          ? contractAuditCompleted
                            ? 'Пройдено ✓ · 4 договора'
                            : `4 договора · +${XP_REWARDS.contractErrors} XP`
                          : isContractAnalysisCard
                          ? `${contractAnalysisData.length} договора · ${completedContractsCount}/${contractAnalysisData.length}`
                          : isScenariosCard
                          ? `${legalCasesData.length} дела · ${completedCasesCount}/${legalCasesData.length}`
                          : isPenaltyCalcCard
                          ? penaltyCalcCompleted
                            ? `Пройдено ✓ · ${PENALTY_CASES.length} дела`
                            : `${PENALTY_CASES.length} дела · ${solvedPenaltyCasesCount}/${PENALTY_CASES.length} · +${PENALTY_ACHIEVEMENT_XP_REWARD} XP`
                          : card.focus}
                      </span>
                    </div>
                    <h2 className="card-heading">{card.title}</h2>
                    <p className="edu-card-desc">{card.description}</p>
                    <div className="card-action-row">
                      {isSituationsCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenSituationsCatalog()
                          }}
                        >
                          <span>Открыть ситуации</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isContractErrorsCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenContractErrors()
                          }}
                        >
                          <span>Открыть практику</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isContractAnalysisCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenContractAnalysisCatalog()
                          }}
                        >
                          <span>Открыть разбор</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isScenariosCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenScenariosCatalog()
                          }}
                        >
                          <span>Открыть дела</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : isPenaltyCalcCard ? (
                        <button
                          type="button"
                          className="card-action-btn primary-start-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenPenaltyCalculator()
                          }}
                        >
                          <span>Открыть калькулятор</span>
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
                Все пять практикумов раздела активны: «Разбор юридических ситуаций», «Поиск ошибок в учебном договоре», «Пошаговый разбор договоров», «Выбери развитие событий» и «Калькулятор договорной неустойки».
              </span>
            </div>
          </>
        )}

        {(practiceView === 'situations-catalog' || practiceView === 'situation-play') && (
          <LegalChatCases
            activeCaseId={practiceView === 'situation-play' ? activeChatCaseId : null}
            progressMap={progressMap}
            onSelectCase={onOpenSituationChatCase}
            onBackToCatalog={onOpenSituationsCatalog}
            onBackToPractice={onBackToPracticeMenu}
            onRecordAnswer={onRecordChatCaseAnswer}
          />
        )}

        {practiceView === 'contract-errors' && (
          <ContractErrorPractice
            onBackToPractice={onBackToPracticeMenu}
            onComplete={(score) =>
              onAwardTaskXP({
                taskId: 'practice-contract-errors',
                taskType: 'contract-errors',
                amount: XP_REWARDS.contractErrors,
                bestScore: score,
              })
            }
          />
        )}

        {practiceView === 'analysis-catalog' && (
          <ContractAnalysisCatalog
            progressMap={progressMap}
            onSelectContract={onOpenContractAnalysisItem}
            onBackToPractice={onBackToPracticeMenu}
          />
        )}

        {practiceView === 'analysis-play' && activeAnalysisContract && (
          <ContractAnalysisViewer
            key={activeAnalysisContract.id}
            contract={activeAnalysisContract}
            progress={progressMap[activeAnalysisContract.id]}
            nextContract={nextAnalysisContract}
            onBackToCatalog={onOpenContractAnalysisCatalog}
            onSelectContract={onOpenContractAnalysisItem}
            onSaveStep={onSaveContractAnalysisStep}
            onCompleteContract={onCompleteContractAnalysis}
          />
        )}

        {practiceView === 'scenarios-catalog' && (
          <LegalCasesCatalog
            progressMap={progressMap}
            onSelectCase={onOpenScenarioCase}
            onBackToPractice={onBackToPracticeMenu}
          />
        )}

        {practiceView === 'scenario-play' && activeScenario && (
          <LegalCasePlayer
            key={activeScenario.id}
            scenario={activeScenario}
            onBackToCatalog={onOpenScenariosCatalog}
            onCompleteCase={onCompleteLegalCase}
          />
        )}

        {practiceView === 'penalty-calculator' && (
          <PenaltyCalculatorPractice
            progressMap={progressMap}
            onBackToPractice={onBackToPracticeMenu}
            onSolveCase={onRecordPenaltyCaseSolved}
          />
        )}
      </div>
    </section>
  )
}
