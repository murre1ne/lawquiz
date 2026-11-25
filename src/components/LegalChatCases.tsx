import { useState } from 'react'
import {
  LEGAL_CHAT_CASE_XP_REWARD,
  legalChatCases,
  type ChatOptionLetter,
  type LegalChatCase,
} from '../data/legalChatCases'
import type { CrosswordProgressMap } from '../data/crosswordProgress'

interface LegalChatCasesProps {
  activeCaseId: string | null
  progressMap: CrosswordProgressMap
  onSelectCase: (chatCase: LegalChatCase) => void
  onBackToCatalog: () => void
  onBackToPractice: () => void
  onRecordAnswer: (
    caseId: string,
    isCorrect: boolean
  ) => { xpGainedNow: number; alreadyAwarded: boolean }
}

interface ChatCasePlayViewProps {
  chatCase: LegalChatCase
  onBackToCatalog: () => void
  onRecordAnswer: (
    caseId: string,
    isCorrect: boolean
  ) => { xpGainedNow: number; alreadyAwarded: boolean }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function ChatCasePlayView({
  chatCase,
  onBackToCatalog,
  onRecordAnswer,
}: ChatCasePlayViewProps) {
  const totalMessages = chatCase.messages.length
  const [visibleCount, setVisibleCount] = useState<number>(1)
  const [selectedOption, setSelectedOption] = useState<ChatOptionLetter | null>(null)
  const [xpNotice, setXpNotice] = useState<{
    gained: number
    alreadyAwarded: boolean
  } | null>(null)

  const allMessagesRevealed = visibleCount >= totalMessages
  const visibleMessages = chatCase.messages.slice(0, visibleCount)
  const hasAnswered = selectedOption !== null
  const isCorrect = selectedOption === chatCase.correctAnswer

  const chosenOptionObj =
    chatCase.options.find((opt) => opt.letter === selectedOption) ?? null
  const correctOptionObj = chatCase.options.find(
    (opt) => opt.letter === chatCase.correctAnswer
  )!

  const scrollToPracticeTop = () => {
    const el = document.getElementById('practice')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRevealNextMessage = () => {
    if (allMessagesRevealed) return
    setVisibleCount((prev) => Math.min(prev + 1, totalMessages))
  }

  const handleChooseAnswer = (letter: ChatOptionLetter) => {
    // Запрещаем выбор ответа до полного раскрытия переписки и после уже данного ответа
    if (!allMessagesRevealed || hasAnswered) return
    const correct = letter === chatCase.correctAnswer
    setSelectedOption(letter)
    const award = onRecordAnswer(chatCase.id, correct)
    setXpNotice({
      gained: award.xpGainedNow,
      alreadyAwarded: award.alreadyAwarded,
    })
  }

  const handleRestartCase = () => {
    setVisibleCount(1)
    setSelectedOption(null)
    setXpNotice(null)
    scrollToPracticeTop()
  }

  const chatProgressPercent = Math.round((visibleCount / totalMessages) * 100)

  return (
    <div className="chat-case-player">
      {/* Верхняя панель */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToCatalog}>
          <span aria-hidden="true">←</span>
          <span>Вернуться к делам</span>
        </button>
        <span className="interactive-mode-badge chat-mode-badge">
          Дело №{chatCase.caseNumber} · {chatCase.icon} {chatCase.title}
        </span>
      </div>

      {/* Карточка-окно переписки */}
      <div className="glass-panel chat-window-card">
        <div className="chat-window-header">
          <div className="chat-window-title-group">
            <div className="chat-header-pills">
              <span className="chat-case-pill">Дело №{chatCase.caseNumber}</span>
              <span className="chat-category-pill">{chatCase.category}</span>
            </div>
            <h3 className="chat-window-title">{chatCase.title}</h3>
          </div>

          <div className="chat-progress-box" aria-live="polite">
            <span className="chat-progress-label">Ход переписки</span>
            <strong className="chat-progress-counter">
              {visibleCount} из {totalMessages} сообщений
            </strong>
          </div>
        </div>

        <div
          className="quiz-progress-track chat-progress-track"
          role="progressbar"
          aria-valuenow={visibleCount}
          aria-valuemin={1}
          aria-valuemax={totalMessages}
          aria-label={`Открыто ${visibleCount} из ${totalMessages} сообщений`}
        >
          <div
            className="quiz-progress-fill chat-progress-fill"
            style={{ width: `${chatProgressPercent}%` }}
          />
        </div>

        {/* Лента сообщений */}
        <div className="chat-thread" role="log" aria-live="polite" aria-label="Переписка сторон">
          {visibleMessages.map((msg, idx) => {
            const isLastVisible = idx === visibleMessages.length - 1
            const isClickableToAdvance = isLastVisible && !allMessagesRevealed

            return (
              <div
                key={msg.id}
                className={`chat-msg-row chat-side-${msg.side}`}
              >
                <div className="chat-avatar" aria-hidden="true">
                  {getInitials(msg.sender)}
                </div>

                <div
                  className={`chat-bubble chat-bubble-${msg.side} ${
                    isClickableToAdvance ? 'is-clickable' : ''
                  }`}
                  onClick={isClickableToAdvance ? handleRevealNextMessage : undefined}
                  role={isClickableToAdvance ? 'button' : undefined}
                  tabIndex={isClickableToAdvance ? 0 : undefined}
                  onKeyDown={
                    isClickableToAdvance
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleRevealNextMessage()
                          }
                        }
                      : undefined
                  }
                  aria-label={
                    isClickableToAdvance
                      ? `${msg.sender}: ${msg.text}. Нажмите, чтобы открыть следующее сообщение`
                      : undefined
                  }
                >
                  <div className="chat-bubble-meta">
                    <span className="chat-sender-name">{msg.sender}</span>
                    <span className="chat-sender-role">{msg.roleLabel}</span>
                  </div>
                  <p className="chat-bubble-text">{msg.text}</p>

                  {isClickableToAdvance && (
                    <span className="chat-tap-cue" aria-hidden="true">
                      Нажмите на сообщение, чтобы открыть следующее ↓
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Область продолжения переписки */}
        {!allMessagesRevealed ? (
          <div className="chat-advance-bar">
            <span className="chat-advance-hint">
              Нажмите на последнее сообщение выше или на кнопку, чтобы увидеть продолжение диалога.
            </span>
            <button
              type="button"
              className="chat-advance-btn"
              onClick={handleRevealNextMessage}
            >
              <span>
                Показать сообщение {visibleCount + 1} из {totalMessages}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className="chat-complete-bar" role="status">
            <span className="chat-complete-dot" aria-hidden="true">
              ✓
            </span>
            <span>
              Переписка завершена ({totalMessages} из {totalMessages} сообщений). Теперь выберите юридическое решение ниже.
            </span>
          </div>
        )}
      </div>

      {/* Блок «Юридическое решение» — открывается СТРОГО после всех сообщений */}
      {allMessagesRevealed && (
        <section
          className="glass-panel chat-decision-card"
          aria-labelledby="chat-decision-heading"
        >
          <div className="chat-decision-head">
            <span className="chat-decision-tag">Юридическое решение</span>
            <h4 id="chat-decision-heading" className="chat-decision-question">
              {chatCase.question}
            </h4>
            {!hasAnswered && (
              <p className="chat-decision-sub">
                Выберите один из трёх вариантов ответа на основе Гражданского кодекса РК.
              </p>
            )}
          </div>

          <div className="chat-options-list" role="radiogroup" aria-label={chatCase.question}>
            {chatCase.options.map((opt) => {
              const isSelected = selectedOption === opt.letter
              const isOptionCorrect = opt.letter === chatCase.correctAnswer

              let stateClass = ''
              if (hasAnswered) {
                if (isOptionCorrect) {
                  stateClass = 'is-correct'
                } else if (isSelected && !isOptionCorrect) {
                  stateClass = 'is-wrong'
                } else {
                  stateClass = 'is-muted'
                }
              }

              return (
                <button
                  key={opt.letter}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={hasAnswered}
                  className={`chat-option-btn ${stateClass}`}
                  onClick={() => handleChooseAnswer(opt.letter)}
                >
                  <span className="chat-option-letter">{opt.letter}</span>
                  <span className="chat-option-text">{opt.text}</span>
                  {hasAnswered && isOptionCorrect && (
                    <span className="chat-option-badge chat-badge-ok">Верно</span>
                  )}
                  {hasAnswered && isSelected && !isOptionCorrect && (
                    <span className="chat-option-badge chat-badge-err">Ваш выбор</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Экран результата после выбора ответа */}
          {hasAnswered && chosenOptionObj && (
            <div
              className={`chat-result-panel ${
                isCorrect ? 'result-is-correct' : 'result-is-wrong'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="chat-result-top">
                <div className="chat-result-verdict">
                  <span className="chat-result-icon" aria-hidden="true">
                    {isCorrect ? '✓' : '✕'}
                  </span>
                  <div>
                    <h5 className="chat-result-title">
                      {isCorrect ? 'Правильно!' : 'Неправильно'}
                    </h5>
                    <p className="chat-result-subtitle">
                      {isCorrect
                        ? `Вы выбрали верный вариант ${chosenOptionObj.letter}.`
                        : `Вы выбрали вариант ${chosenOptionObj.letter}, но по ГК РК верным является вариант ${correctOptionObj.letter}.`}
                    </p>
                  </div>
                </div>

                <div className="chat-result-xp">
                  {xpNotice && xpNotice.gained > 0 ? (
                    <span className="cw-xp-gained-pill">
                      Задание завершено! +{xpNotice.gained} XP
                    </span>
                  ) : (
                    <span className="cw-xp-neutral-pill">
                      Вы уже получили опыт за это задание
                    </span>
                  )}
                </div>
              </div>

              {/* Почему выбранный неверный вариант ошибочен */}
              {!isCorrect && chosenOptionObj.whyWrong && (
                <div className="chat-wrong-reason-box">
                  <span className="chat-box-label">
                    Почему вариант {chosenOptionObj.letter} неверен:
                  </span>
                  <p>{chosenOptionObj.whyWrong}</p>
                </div>
              )}

              {/* Правильный вариант */}
              <div className="chat-correct-answer-box">
                <span className="chat-box-label">Правильный вариант:</span>
                <p>
                  <strong>{correctOptionObj.letter})</strong> {correctOptionObj.text}
                </p>
              </div>

              {/* Юридическое объяснение ситуации */}
              <div className="chat-explanation-block">
                <h6 className="chat-section-label">Объяснение юридической ситуации</h6>
                <div className="chat-explanation-paragraphs">
                  {chatCase.explanation.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Нормативная основа (проверенная конкретная статья ГК РК) */}
              <div className="chat-normative-box">
                <div className="chat-normative-head">
                  <span className="chat-normative-scale" aria-hidden="true">
                    ⚖
                  </span>
                  <div>
                    <span className="chat-normative-eyebrow">
                      НОРМАТИВНАЯ ОСНОВА · {chatCase.legalBasis.codePart.toUpperCase()}
                    </span>
                    <h6 className="chat-normative-title">
                      {chatCase.legalBasis.article} — «{chatCase.legalBasis.title}»
                    </h6>
                  </div>
                </div>

                <p className="chat-normative-summary">{chatCase.legalBasis.summary}</p>

                <div className="chat-normative-link-row">
                  <a
                    href={chatCase.legalBasis.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adilet-source-btn"
                  >
                    <span>
                      Открыть {chatCase.legalBasis.codePart} в ИПС «Әділет»
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="chat-result-actions">
                <button
                  type="button"
                  className="interactive-action-btn primary"
                  onClick={handleRestartCase}
                >
                  <span aria-hidden="true">🔄</span>
                  <span>Начать дело заново</span>
                </button>
                <button
                  type="button"
                  className="interactive-action-btn secondary"
                  onClick={onBackToCatalog}
                >
                  <span>Вернуться к делам</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export function LegalChatCases({
  activeCaseId,
  progressMap,
  onSelectCase,
  onBackToCatalog,
  onBackToPractice,
  onRecordAnswer,
}: LegalChatCasesProps) {
  const activeCase = legalChatCases.find((item) => item.id === activeCaseId) ?? null

  if (activeCase) {
    return (
      <ChatCasePlayView
        key={activeCase.id}
        chatCase={activeCase}
        onBackToCatalog={onBackToCatalog}
        onRecordAnswer={onRecordAnswer}
      />
    )
  }

  const totalCases = legalChatCases.length
  const completedCount = legalChatCases.filter(
    (item) => progressMap[item.id]?.completed
  ).length
  const totalEarnedXp = legalChatCases.reduce(
    (sum, item) => sum + (progressMap[item.id]?.xpEarned ?? 0),
    0
  )
  const maxXp = totalCases * LEGAL_CHAT_CASE_XP_REWARD

  return (
    <div className="chat-catalog-container">
      {/* Верхняя навигация */}
      <div className="interactive-top-bar">
        <button type="button" className="interactive-back-btn" onClick={onBackToPractice}>
          <span aria-hidden="true">←</span>
          <span>К разделу «Юридическая практика»</span>
        </button>
        <div className="cw-catalog-badges">
          <span className="interactive-mode-badge chat-mode-badge">
            Разбор юридических ситуаций · {completedCount} / {totalCases}
          </span>
          <span className="cw-xp-summary-pill">
            ★ {totalEarnedXp} / {maxXp} XP
          </span>
        </div>
      </div>

      {/* Интро-блок каталога */}
      <div className="glass-panel chat-catalog-intro">
        <div className="chat-catalog-intro-copy">
          <span className="chat-format-pill">Формат переписки · 4 юридических дела</span>
          <h3 className="chat-catalog-title">Разбор юридических ситуаций</h3>
          <p className="chat-catalog-desc">
            Изучайте реальные бытовые споры в формате последовательной переписки. Открывайте реплики сторон по очереди, а после завершения диалога примите правовое решение и проверьте его по Гражданскому кодексу Республики Казахстан.
          </p>
        </div>

        <div className="chat-catalog-progress-box">
          <div className="chat-catalog-progress-head">
            <span>Решено дел</span>
            <strong>
              {completedCount} из {totalCases}
            </strong>
          </div>
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill chat-progress-fill"
              style={{ width: `${(completedCount / totalCases) * 100}%` }}
            />
          </div>
          <span className="chat-catalog-progress-note">
            {completedCount >= totalCases
              ? 'Все четыре дела успешно разобраны!'
              : `За первое верное решение каждого дела начисляется +${LEGAL_CHAT_CASE_XP_REWARD} XP.`}
          </span>
        </div>
      </div>

      {/* Сетка из 4 дел */}
      <div className="chat-catalog-grid">
        {legalChatCases.map((item, idx) => {
          const prog = progressMap[item.id]
          const isSolved = prog?.completed ?? false
          const wasAttempted = !isSolved && Boolean(prog?.lastPlayedAt)

          return (
            <article
              key={item.id}
              className={`edu-card chat-case-card chat-tone-${idx % 4}`}
              onClick={() => onSelectCase(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectCase(item)
                }
              }}
              aria-label={`Открыть дело №${item.caseNumber}: ${item.title}`}
            >
              <div className="card-topline">
                <span className="card-icon-badge chat-emoji-badge" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="card-pill-tag">Дело №{item.caseNumber}</span>
              </div>

              <span className="chat-card-category">{item.category}</span>
              <h4 className="card-heading">{item.title}</h4>
              <p className="edu-card-desc">{item.shortDescription}</p>

              <div className="cw-card-meta-row">
                <span className="cw-meta-chip">
                  {item.messages.length} сообщения
                </span>
                <span className="cw-meta-chip">+{LEGAL_CHAT_CASE_XP_REWARD} XP</span>
                <span
                  className={`cw-status-badge ${
                    isSolved
                      ? 'cw-status-done'
                      : wasAttempted
                      ? 'cw-status-progress'
                      : 'cw-status-idle'
                  }`}
                >
                  {isSolved ? 'Решено ✓' : wasAttempted ? 'Попробовать снова' : 'Не начато'}
                </span>
              </div>

              <div className="card-action-row">
                <button
                  type="button"
                  className="card-action-btn primary-start-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectCase(item)
                  }}
                >
                  <span>{isSolved ? 'Повторить дело' : 'Открыть переписку'}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
