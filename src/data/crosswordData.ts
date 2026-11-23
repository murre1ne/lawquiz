/**
 * Данные юридических кроссвордов по гражданскому праву Республики Казахстан
 * Проект: Law Quiz KZ
 *
 * Источники:
 * - ГК РК (Общая часть): https://adilet.zan.kz/rus/docs/K940001000_
 * - ГК РК (Особенная часть): https://adilet.zan.kz/rus/docs/K990000409_
 *
 * Архитектура позволяет добавлять новые кроссворды в массив crosswordPuzzles
 * без изменения компонентов отображения и проверки.
 */

export type CrosswordDirection = 'across' | 'down'

export interface CrosswordWord {
  number: number
  clue: string
  answer: string
  article: string
  articleLabel: string
  source: string
  sourceUrl: string
  direction: CrosswordDirection
  /** 0-индексированная строка начала слова в сетке */
  row: number
  /** 0-индексированный столбец начала слова в сетке */
  col: number
  needsReview: boolean
  reviewNote?: string
}

export interface CrosswordPuzzle {
  id: string
  number: number
  title: string
  topic: string
  description: string
  difficulty: 'Лёгкий' | 'Средний' | 'Сложный'
  sourceName: string
  sourceUrl: string
  rows: number
  cols: number
  words: CrosswordWord[]
  needsReview: boolean
}

export const CROSSWORD_XP_PER_WORD = 10

const ADILET_GENERAL_URL = 'https://adilet.zan.kz/rus/docs/K940001000_'
const ADILET_SPECIAL_URL = 'https://adilet.zan.kz/rus/docs/K990000409_'

export const crosswordPuzzles: CrosswordPuzzle[] = [
  {
    id: 'cw-basics',
    number: 1,
    title: 'Основы гражданского права',
    topic: 'Общая часть ГК РК',
    description:
      'Базовые понятия Общей части Гражданского кодекса РК: сделки, договоры, имущество и стороны обязательства.',
    difficulty: 'Лёгкий',
    sourceName: 'ГК РК, Общая часть',
    sourceUrl: ADILET_GENERAL_URL,
    rows: 11,
    cols: 7,
    needsReview: true,
    words: [
      {
        number: 1,
        clue: 'Действие, направленное на возникновение, изменение или прекращение гражданских прав и обязанностей',
        answer: 'СДЕЛКА',
        article: '147',
        articleLabel: 'ст. 147 ГК РК',
        source: 'ГК РК, Общая часть',
        sourceUrl: ADILET_GENERAL_URL,
        direction: 'down',
        row: 0,
        col: 0,
        needsReview: true,
        reviewNote: 'В ст. 147 ГК РК используется формулировка «установление, изменение или прекращение».',
      },
      {
        number: 2,
        clue: 'Соглашение двух или нескольких лиц',
        answer: 'ДОГОВОР',
        article: '378',
        articleLabel: 'ст. 378 ГК РК',
        source: 'ГК РК, Общая часть',
        sourceUrl: ADILET_GENERAL_URL,
        direction: 'across',
        row: 9,
        col: 0,
        needsReview: true,
      },
      {
        number: 3,
        clue: 'Общее название вещей, денег и имущественных прав',
        answer: 'ИМУЩЕСТВО',
        article: '115',
        articleLabel: 'ст. 115 ГК РК',
        source: 'ГК РК, Общая часть',
        sourceUrl: ADILET_GENERAL_URL,
        direction: 'down',
        row: 1,
        col: 5,
        needsReview: true,
      },
      {
        number: 4,
        clue: 'Лицо, обязанное исполнить обязательство',
        answer: 'ДОЛЖНИК',
        article: '268',
        articleLabel: 'ст. 268 ГК РК',
        source: 'ГК РК, Общая часть',
        sourceUrl: ADILET_GENERAL_URL,
        direction: 'across',
        row: 1,
        col: 0,
        needsReview: true,
      },
      {
        number: 5,
        clue: 'Лицо, имеющее право требовать исполнения обязательства',
        answer: 'КРЕДИТОР',
        article: '268',
        articleLabel: 'ст. 268 ГК РК',
        source: 'ГК РК, Общая часть',
        sourceUrl: ADILET_GENERAL_URL,
        direction: 'down',
        row: 3,
        col: 3,
        needsReview: true,
      },
    ],
  },
  {
    id: 'cw-parties',
    number: 2,
    title: 'Участники договоров',
    topic: 'Особенная часть ГК РК',
    description:
      'Наименования сторон в ключевых гражданско-правовых договорах: купля-продажа, дарение и имущественный наём (аренда).',
    difficulty: 'Лёгкий',
    sourceName: 'ГК РК, Особенная часть',
    sourceUrl: ADILET_SPECIAL_URL,
    rows: 14,
    cols: 8,
    needsReview: true,
    words: [
      {
        number: 1,
        clue: 'Лицо, которое продаёт товар',
        answer: 'ПРОДАВЕЦ',
        article: '406',
        articleLabel: 'ст. 406 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'across',
        row: 5,
        col: 0,
        needsReview: true,
      },
      {
        number: 2,
        clue: 'Лицо, которое покупает товар',
        answer: 'ПОКУПАТЕЛЬ',
        article: '406',
        articleLabel: 'ст. 406 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 1,
        col: 0,
        needsReview: true,
      },
      {
        number: 3,
        clue: 'Лицо, которое передаёт подарок',
        answer: 'ДАРИТЕЛЬ',
        article: '506',
        articleLabel: 'ст. 506 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 0,
        col: 6,
        needsReview: true,
      },
      {
        number: 4,
        clue: 'Лицо, которое получает подарок',
        answer: 'ОДАРЯЕМЫЙ',
        article: '506',
        articleLabel: 'ст. 506 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 5,
        col: 2,
        needsReview: true,
      },
      {
        number: 5,
        clue: 'Лицо, которое получает имущество во временное пользование по договору аренды',
        answer: 'НАНИМАТЕЛЬ',
        article: '540',
        articleLabel: 'ст. 540 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 4,
        col: 4,
        needsReview: true,
        reviewNote: 'В ст. 540 ГК РК указано «во временное владение и пользование» по договору имущественного найма (аренды).',
      },
    ],
  },
  {
    id: 'cw-contracts',
    number: 3,
    title: 'Виды гражданско-правовых договоров',
    topic: 'Особенная часть ГК РК',
    description:
      'Основные виды договоров Особенной части ГК РК: аренда, дарение, подряд, заем и договор проката.',
    difficulty: 'Лёгкий',
    sourceName: 'ГК РК, Особенная часть',
    sourceUrl: ADILET_SPECIAL_URL,
    rows: 8,
    cols: 6,
    needsReview: true,
    words: [
      {
        number: 1,
        clue: 'Платное временное пользование чужим имуществом',
        answer: 'АРЕНДА',
        article: '540',
        articleLabel: 'ст. 540 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'across',
        row: 6,
        col: 0,
        needsReview: true,
        reviewNote: 'В ст. 540 ГК РК договор именуется «имущественный наём (аренда)» и охватывает временное владение и пользование.',
      },
      {
        number: 2,
        clue: 'Безвозмездная передача имущества другому лицу',
        answer: 'ДАРЕНИЕ',
        article: '506',
        articleLabel: 'ст. 506 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 0,
        col: 2,
        needsReview: true,
      },
      {
        number: 3,
        clue: 'Выполнение определённой работы по заданию заказчика',
        answer: 'ПОДРЯД',
        article: '616',
        articleLabel: 'ст. 616 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'across',
        row: 0,
        col: 0,
        needsReview: true,
      },
      {
        number: 4,
        clue: 'Передача денег или вещей с обязанностью возврата по договору',
        answer: 'ЗАЕМ',
        article: '715',
        articleLabel: 'ст. 715 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'across',
        row: 3,
        col: 0,
        needsReview: true,
        reviewNote: 'В ст. 715 ГК РК уточняется: «деньги или вещи, определенные родовыми признаками».',
      },
      {
        number: 5,
        clue: 'Разновидность аренды движимого имущества в рамках постоянной предпринимательской деятельности наймодателя',
        answer: 'ПРОКАТ',
        article: '595',
        articleLabel: 'ст. 595 ГК РК',
        source: 'ГК РК, Особенная часть',
        sourceUrl: ADILET_SPECIAL_URL,
        direction: 'down',
        row: 2,
        col: 5,
        needsReview: true,
      },
    ],
  },
]
