import { computed, reactive, watch } from 'vue'

const STORAGE_KEY = 'clear-reading-state-v1'
export const ARTICLE_FONT_KEY = 'clear-reading-font-size'
export const SIDEBAR_KEY = 'clear-reading-sidebar-hidden'
export const INSPECTOR_KEY = 'clear-reading-inspector-hidden'
export const PERSONAL_API_KEY_LOCAL = 'clear-reading-personal-api-key'
export const PERSONAL_API_KEY_SESSION = 'clear-reading-session-api-key'

export const SAMPLE_ARTICLE = `The Hidden Intelligence of Urban Trees

For many years, city trees were treated mainly as decorative objects. They were planted to make streets look pleasant, while their practical value received less attention. Recent research, however, suggests that trees form part of a complex urban system. They influence temperature, water movement, air quality and even the behaviour of people who live nearby.

One of their most important functions is cooling. Leaves intercept sunlight and release water vapour, reducing the temperature around them. This effect is especially valuable during heatwaves, when buildings and roads absorb heat during the day and release it slowly at night. A mature tree can therefore provide benefits that cannot be reproduced simply by placing a small plant beside a pavement.

The success of an urban tree depends on what happens below the ground as well as above it. Roots require water, oxygen and enough space to expand. In heavily built areas, soil is often compressed by construction work, while underground pipes limit the room available. A tree may appear healthy for several years before these hidden restrictions begin to affect its growth.

For this reason, some planners now view trees as long-term infrastructure rather than decoration. Selecting a species is only the beginning; cities must also protect the soil, manage rainwater and plan for decades of maintenance. The most effective programmes are those that consider the whole system instead of counting how many young trees have been planted.`

const PHRASE_DICTIONARY = {
  'water hyacinth': '水葫芦；凤眼莲',
  'as well as': '以及；除……之外还……',
  'for this reason': '因此；出于这个原因',
  'rather than': '而不是',
  'as a result': '因此；结果是',
  'in contrast': '相比之下',
  'according to': '根据',
  'play a role': '发挥作用',
  'take into account': '将……考虑在内',
  'a wide range of': '广泛的；各种各样的',
  'be likely to': '很可能……',
  'depend on': '取决于；依靠',
  'instead of': '而不是；代替',
  'part of': '……的一部分',
  'even though': '尽管；即使',
  'in terms of': '在……方面',
}

const WORD_DICTIONARY = {
  absorb: ['/əbˈzɔːb/', 'v. 吸收；理解；使全神贯注'],
  affect: ['/əˈfekt/', 'v. 影响；使发生变化'],
  attention: ['/əˈtenʃn/', 'n. 注意；关注'],
  available: ['/əˈveɪləbl/', 'adj. 可获得的；可利用的'],
  behaviour: ['/bɪˈheɪvjə/', 'n. 行为；表现方式'],
  benefit: ['/ˈbenɪfɪt/', 'n. 益处；v. 使受益'],
  complex: ['/ˈkɒmpleks/', 'adj. 复杂的；n. 综合体'],
  compressed: ['/kəmˈprest/', 'adj. 被压缩的；压实的'],
  consider: ['/kənˈsɪdə/', 'v. 考虑；认为'],
  construction: ['/kənˈstrʌkʃn/', 'n. 建造；建筑工程'],
  decorative: ['/ˈdekərətɪv/', 'adj. 装饰性的'],
  depend: ['/dɪˈpend/', 'v. 取决于；依靠'],
  effective: ['/ɪˈfektɪv/', 'adj. 有效的；实际的'],
  especially: ['/ɪˈspeʃəli/', 'adv. 尤其；特别'],
  expand: ['/ɪkˈspænd/', 'v. 扩大；扩展'],
  function: ['/ˈfʌŋkʃn/', 'n. 功能；v. 运转'],
  heavily: ['/ˈhevɪli/', 'adv. 严重地；大量地'],
  hidden: ['/ˈhɪdn/', 'adj. 隐藏的；不易察觉的'],
  influence: ['/ˈɪnfluəns/', 'v./n. 影响'],
  infrastructure: ['/ˈɪnfrəstrʌktʃə/', 'n. 基础设施'],
  intercept: ['/ˌɪntəˈsept/', 'v. 拦截；阻止'],
  maintenance: ['/ˈmeɪntənəns/', 'n. 维护；保养'],
  mature: ['/məˈtʃʊə/', 'adj. 成熟的；充分发展的'],
  movement: ['/ˈmuːvmənt/', 'n. 移动；运动；活动'],
  oxygen: ['/ˈɒksɪdʒən/', 'n. 氧气'],
  practical: ['/ˈpræktɪkl/', 'adj. 实际的；实用的'],
  programme: ['/ˈprəʊɡræm/', 'n. 计划；项目；节目'],
  recent: ['/ˈriːsnt/', 'adj. 最近的；近来的'],
  reducing: ['/rɪˈdjuːsɪŋ/', 'v. 减少；降低（reduce 的现在分词）'],
  release: ['/rɪˈliːs/', 'v. 释放；公布；n. 释放'],
  require: ['/rɪˈkwaɪə/', 'v. 需要；要求'],
  research: ['/rɪˈsɜːtʃ/', 'n./v. 研究；调查'],
  restriction: ['/rɪˈstrɪkʃn/', 'n. 限制；约束'],
  select: ['/sɪˈlekt/', 'v. 选择；挑选'],
  species: ['/ˈspiːʃiːz/', 'n. 物种；种类（单复数同形）'],
  suggest: ['/səˈdʒest/', 'v. 表明；建议；暗示'],
  system: ['/ˈsɪstəm/', 'n. 系统；体系'],
  temperature: ['/ˈtemprətʃə/', 'n. 温度；体温'],
  vapour: ['/ˈveɪpə/', 'n. 蒸气'],
  valuable: ['/ˈvæljuəbl/', 'adj. 有价值的；宝贵的'],
  water: ['/ˈwɔːtə/', 'n. 水；v. 浇水'],
  whole: ['/həʊl/', 'adj. 整个的；n. 整体'],
  hyacinth: ['/ˈhaɪəsɪnθ/', 'n. 风信子'],
}

export function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored && Array.isArray(stored.articles)) {
      stored.vocabulary = Array.isArray(stored.vocabulary)
        ? stored.vocabulary.map((item) => ({
            ...item,
            review: normalizeReviewState(item.review, item.createdAt),
          }))
        : []
      return stored
    }
  } catch (_) {}
  return { articles: [], currentArticleId: null, vocabulary: [], createdAt: new Date().toISOString() }
}
export function parseArticle(raw, manualTitle = '') {
  const normalizedRaw = raw.replace(/\r\n?/g, '\n').trim()
  const nonEmptyLines = normalizedRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  let title = manualTitle
  let bodyRaw = normalizedRaw
  if (!title && nonEmptyLines.length > 1 && looksLikeTitle(nonEmptyLines[0])) {
    title = nonEmptyLines[0]
    const firstLineEnd = normalizedRaw.indexOf('\n')
    bodyRaw = normalizedRaw.slice(firstLineEnd + 1).trim()
  }
  if (!title) title = ''
  const blocks = bodyRaw
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  const paragraphs = blocks.length ? blocks : [raw.replace(/\s+/g, ' ').trim()]
  return { title, paragraphs }
}

function looksLikeTitle(text) {
  const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []
  if (!words.length || words.length > 16 || text.length > 120) return false
  if (/[.!?;:]$/.test(text)) return false
  const titleCaseCount = words.filter((word) => /^[A-Z]/.test(word)).length
  return titleCaseCount / words.length >= 0.45 || text === text.toUpperCase()
}

export function getSentenceContext(paragraph, start, end) {
  const left = Math.max(
    paragraph.lastIndexOf('.', Math.max(0, start - 2)),
    paragraph.lastIndexOf('?', Math.max(0, start - 2)),
    paragraph.lastIndexOf('!', Math.max(0, start - 2)),
  )
  const candidates = [
    paragraph.indexOf('.', end),
    paragraph.indexOf('?', end),
    paragraph.indexOf('!', end),
  ].filter((value) => value >= 0)
  const right = candidates.length ? Math.min(...candidates) + 1 : paragraph.length
  return paragraph.slice(left + 1, right).trim()
}

export function getDictionaryEntry(text) {
  const key = normalize(text)
  if (PHRASE_DICTIONARY[key]) return { meaning: PHRASE_DICTIONARY[key], phonetic: '固定搭配' }
  if (WORD_DICTIONARY[key])
    return { phonetic: WORD_DICTIONARY[key][0], meaning: WORD_DICTIONARY[key][1] }
  const lemma = simpleLemma(key)
  if (WORD_DICTIONARY[lemma])
    return { phonetic: WORD_DICTIONARY[lemma][0], meaning: WORD_DICTIONARY[lemma][1] }
  return null
}

function simpleLemma(word) {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3)
    if (WORD_DICTIONARY[stem]) return stem
    if (WORD_DICTIONARY[`${stem}e`]) return `${stem}e`
  }
  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2)
    if (WORD_DICTIONARY[stem]) return stem
    if (WORD_DICTIONARY[`${stem}e`]) return `${stem}e`
  }
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1)
  return word
}

export function selectionCacheKey(selection) {
  if (!selection) return ''
  return [
    selection.paragraphIndex,
    selection.start,
    selection.end,
    normalize(selection.text),
    normalize(selection.context || ''),
  ].join('|')
}

export function normalizeReviewState(review, createdAt = new Date().toISOString()) {
  const dueAt =
    review?.dueAt && !Number.isNaN(new Date(review.dueAt).getTime())
      ? review.dueAt
      : createdAt || new Date().toISOString()
  return {
    dueAt,
    intervalDays: Number.isFinite(review?.intervalDays) ? Math.max(0, review.intervalDays) : 0,
    easeFactor: Number.isFinite(review?.easeFactor)
      ? Math.min(3, Math.max(1.3, review.easeFactor))
      : 2.3,
    repetitions: Number.isFinite(review?.repetitions) ? Math.max(0, review.repetitions) : 0,
    lapses: Number.isFinite(review?.lapses) ? Math.max(0, review.lapses) : 0,
    lastReviewedAt: review?.lastReviewedAt || null,
    lastRating: review?.lastRating || null,
  }
}

export function isVocabularyMastered(item) {
  return (item.review?.repetitions || 0) >= 3 && (item.review?.intervalDays || 0) >= 7
}

export function updateVocabularySchedule(item, rating) {
  const review = normalizeReviewState(item.review, item.createdAt)
  const now = new Date()
  let intervalDays = review.intervalDays
  let easeFactor = review.easeFactor
  let repetitions = review.repetitions
  let lapses = review.lapses
  if (rating === 'again') {
    intervalDays = 10 / (24 * 60)
    easeFactor = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
    lapses += 1
  } else if (rating === 'hard') {
    intervalDays = repetitions === 0 ? 1 : Math.max(1, Math.round(Math.max(1, intervalDays) * 1.4))
    easeFactor = Math.max(1.3, easeFactor - 0.08)
    repetitions += 1
  } else {
    intervalDays =
      repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(4, Math.round(intervalDays * easeFactor))
    easeFactor = Math.min(3, easeFactor + 0.05)
    repetitions += 1
  }
  item.review = {
    dueAt: new Date(now.getTime() + intervalDays * 86_400_000).toISOString(),
    intervalDays,
    easeFactor,
    repetitions,
    lapses,
    lastReviewedAt: now.toISOString(),
    lastRating: rating,
  }
}

export function vocabularyReviewLabel(item) {
  const review = item.review || normalizeReviewState(null, item.createdAt)
  if (new Date(review.dueAt).getTime() <= Date.now()) return '今日待复习'
  if (isVocabularyMastered(item)) return `已掌握 · ${formatDate(review.dueAt)}再看`
  return `下次 ${formatDate(review.dueAt)}`
}

export function countWords(text) {
  return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length
}

export function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[“”".,!?;:()]/g, '')
    .replace(/\s+/g, ' ')
}

export function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value))
}

export const state = reactive(loadState())
export const article = computed(() => state.articles.find((a) => a.id === state.currentArticleId))
if (!article.value && state.articles.length) state.currentArticleId = state.articles[0].id
export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
watch(state, persist, { deep: true })
export function createArticle(raw, parsed, model = '') {
  const now = new Date().toISOString()
  const item = {
    id: crypto.randomUUID(),
    raw,
    title: parsed.title,
    hasTitle: Boolean(parsed.title),
    paragraphs: parsed.paragraphs,
    sectionHeadings: parsed.sectionHeadings || [],
    structureSource: model ? 'qwen' : 'local',
    structureModel: model,
    translations: {},
    highlights: [],
    notes: [],
    aiExplanations: {},
    sentenceAnalyses: {},
    createdAt: now,
    lastReadAt: now,
  }
  state.articles.unshift(item)
  return item.id
}
