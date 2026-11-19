import { ref, computed, onBeforeUnmount } from 'vue'
import {
  state,
  normalize,
  selectionCacheKey,
  normalizeReviewState,
  getDictionaryEntry,
  getSentenceContext,
  countWords,
} from './learning.js'
import { api, translate, connection, notify } from './api.js'

export function useLookup(article, reveal) {
  const selected = ref(null),
    lookup = ref(null),
    error = ref(''),
    busy = ref(false)
  const insight = ref(null),
    insightError = ref(''),
    analyzing = ref(false),
    note = ref('')
  const toolbar = ref(null)
  const inFlight = new Map()
  let generation = 0
  const wordCount = computed(() => countWords(selected.value?.text || ''))
  const key = computed(() => (selected.value ? selectionCacheKey(selected.value) : ''))
  const savedWord = computed(
    () =>
      selected.value &&
      state.vocabulary.some((w) => normalize(w.text) === normalize(selected.value.text)),
  )
  function reset() {
    generation++
    selected.value = lookup.value = insight.value = toolbar.value = null
    busy.value = analyzing.value = false
    error.value = insightError.value = note.value = ''
  }
  onBeforeUnmount(reset)
  function select(paragraphIndex, start, end, drag = false) {
    const paragraph = article.paragraphs[paragraphIndex]
    reset()
    const text = paragraph.slice(start, end)
    selected.value = {
      paragraphIndex,
      start,
      end,
      text,
      context: getSentenceContext(paragraph, start, end),
      drag,
    }
    insight.value = article.aiExplanations?.[key.value] || article.sentenceAnalyses?.[key.value] || null
    if (!drag) reveal()
    translateSelection()
  }
  async function translateSelection(retry = false) {
    if (!selected.value) return
    const item = selected.value,
      id = generation,
      cacheKey = key.value
    const cached = article.selectionTranslations?.[cacheKey]
    if (cached && !retry) {
      lookup.value = cached
      return
    }
    busy.value = true
    error.value = ''
    let pending = inFlight.get(cacheKey)
    if (!pending) {
      pending = translate(item.text, item.context)
      inFlight.set(cacheKey, pending)
    }
    try {
      const result = await pending
      article.selectionTranslations ||= {}
      article.selectionTranslations[cacheKey] = { ...result, createdAt: new Date().toISOString() }
      if (id === generation) lookup.value = result
    } catch (e) {
      if (id === generation) error.value = e.message
    } finally {
      if (inFlight.get(cacheKey) === pending) inFlight.delete(cacheKey)
      if (id === generation) busy.value = false
    }
  }
  async function analyze() {
    if (!selected.value || analyzing.value || insight.value || !connection.configured) return
    const id = generation,
      item = selected.value,
      cacheKey = key.value,
      single = wordCount.value === 1
    const payload = {
      context: item.context,
      translation: lookup.value?.translation || '',
      [single ? 'word' : 'sentence']: item.text,
    }
    const store = single ? 'aiExplanations' : 'sentenceAnalyses'
    analyzing.value = true
    insightError.value = ''
    try {
      const data = await api(single ? 'explain-word' : 'analyze-sentence', payload)
      const result = { ...(single ? data.explanation : data.analysis), model: data.model }
      article[store] ||= {}
      article[store][cacheKey] = result
      if (id === generation) insight.value = result
    } catch (e) {
      if (id === generation) insightError.value = e.message
    } finally {
      if (id === generation) analyzing.value = false
    }
  }
  function highlight(color) {
    const s = selected.value
    if (!s) return
    toolbar.value = null
    if (
      article.highlights.some(
        (x) => x.paragraphIndex === s.paragraphIndex && x.start < s.end && s.start < x.end,
      )
    ) {
      notify('这段文字已有高亮')
      return
    }
    article.highlights.push({
      id: crypto.randomUUID(),
      paragraphIndex: s.paragraphIndex,
      start: s.start,
      end: s.end,
      text: s.text,
      color,
      createdAt: new Date().toISOString(),
    })
    window.getSelection()?.removeAllRanges()
  }
  function saveWord() {
    const s = selected.value
    if (!s || savedWord.value) return
    const entry = getDictionaryEntry(s.text)
    state.vocabulary.unshift({
      id: crypto.randomUUID(),
      text: s.text,
      phonetic: entry?.phonetic || '',
      meaning: lookup.value?.translation || entry?.meaning || '待补充释义',
      context: s.context,
      articleId: article.id,
      articleTitle: article.title || '未命名文章',
      createdAt: new Date().toISOString(),
      review: normalizeReviewState(null),
    })
    notify('已加入生词本')
  }
  function saveNote() {
    const s = selected.value
    if (!s || !note.value.trim()) {
      notify('请先写下笔记内容')
      return
    }
    article.notes.unshift({
      id: crypto.randomUUID(),
      quote: s.text,
      content: note.value.trim(),
      paragraphIndex: s.paragraphIndex,
      start: s.start,
      end: s.end,
      createdAt: new Date().toISOString(),
    })
    note.value = ''
    notify('笔记已保存')
  }
  return {
    selected,
    lookup,
    error,
    busy,
    insight,
    insightError,
    analyzing,
    note,
    toolbar,
    wordCount,
    savedWord,
    reset,
    select,
    translateSelection,
    analyze,
    highlight,
    saveWord,
    saveNote,
  }
}
