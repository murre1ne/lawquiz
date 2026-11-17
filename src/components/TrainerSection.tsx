import { useState } from 'react'
import { QuizInteractive } from './QuizInteractive'
import { TruthOrMythInteractive } from './TruthOrMythInteractive'
import { MatchingInteractive } from './MatchingInteractive'
import { SortingInteractive } from './SortingInteractive'
import type { TrainerMode } from '../data/trainerTypes'

export function TrainerSection() {
  const [activeMode, setActiveMode] = useState<TrainerMode>(null)

  return (
    <section className="content-section" id="trainer" aria-labelledby="trainer-heading">
      <div className="section-container">
        {/* Заголовок секции */}
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-badge-line">
              <span className="section-num-pill">02 / 05</span>
              <span className="section-category-tag">САМОПРОВЕРКА И ЗАКРЕПЛЕНИЕ</span>
            </div>
            <h2 id="trainer-heading" className="section-main-title">
              Тренажёр знаний
            </h2>
            <p className="section-main-desc">
              Четыре интерактивных режима для закрепления норм гражданского права РК: тестирование, «Правда или миф?», сопоставление терминов и распределение по категориям.
            </p>
          </div>
          <div className="section-header-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        {/* Каталог режимов */}
        {activeMode === null && (
          <>
            <div className="trainer-grid">
              {/* 1 — Тесты */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">10 из 50 вопросов</span>
                </div>
                <h3 className="card-heading">Тесты по ГК РК</h3>
                <p className="edu-card-desc">
                  Проверьте свои знания по ключевым институтам гражданского права Казахстана. Случайная выборка 10 вопросов из банка 50 заданий с подробным объяснением каждого ответа.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => setActiveMode('quiz')}
                    aria-label="Начать тестирование по ГК РК"
                  >
                    <span>Начать тестирование</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 2 — Правда или миф? */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">5 из 50 утверждений</span>
                </div>
                <h3 className="card-heading">Правда или миф?</h3>
                <p className="edu-card-desc">
                  Экспресс-раунд на юридическую интуицию: отличите реальные статьи ГК РК от популярных правовых заблуждений. 5 случайных утверждений с обоснованием норм.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => setActiveMode('truthOrMyth')}
                    aria-label="Начать режим Правда или миф"
                  >
                    <span>Играть раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 3 — Соединяшки */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">5 из 50 терминов</span>
                </div>
                <h3 className="card-heading">Соедини термин и определение</h3>
                <p className="edu-card-desc">
                  Упражнения на сопоставление юридических понятий с их нормативными формулировками по ГК РК. Термины и определения перемешиваются независимо.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => setActiveMode('matching')}
                    aria-label="Начать соединение терминов с определениями"
                  >
                    <span>Начать раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              {/* 4 — Распредели по категориям */}
              <article className="edu-card trainer-mode-card featured-mode">
                <div className="card-topline">
                  <span className="card-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  <span className="card-pill-tag tag-interactive">10 из 50 карточек</span>
                </div>
                <h3 className="card-heading">Распредели по категориям</h3>
                <p className="edu-card-desc">
                  Задания на распределение правовых объектов, видов сделок и обязательств по четырём институтам ГК РК: вещное право, обязательственное, субъекты, сделки.
                </p>
                <div className="card-action-row">
                  <button
                    type="button"
                    className="card-action-btn primary-start-btn"
                    onClick={() => setActiveMode('sorting')}
                    aria-label="Начать распределение по категориям"
                  >
                    <span>Начать раунд</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            </div>

            <div className="section-status-banner">
              <span className="status-dot" aria-hidden="true" />
              <span>
                Все четыре интерактива подключены к банку из 200 проверенных правовых элементов по Гражданскому кодексу РК с перемешиванием и ссылками на «Әділет».
              </span>
            </div>
          </>
        )}

        {activeMode === 'quiz' && (
          <QuizInteractive onExit={() => setActiveMode(null)} />
        )}
        {activeMode === 'truthOrMyth' && (
          <TruthOrMythInteractive onExit={() => setActiveMode(null)} />
        )}
        {activeMode === 'matching' && (
          <MatchingInteractive onExit={() => setActiveMode(null)} />
        )}
        {activeMode === 'sorting' && (
          <SortingInteractive onExit={() => setActiveMode(null)} />
        )}
      </div>
    </section>
  )
}
