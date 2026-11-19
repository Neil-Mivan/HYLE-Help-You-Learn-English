<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  article as currentArticle,
  ARTICLE_FONT_KEY,
  INSPECTOR_KEY,
  countWords,
  getDictionaryEntry,
} from '../learning.js'
import { translate, connection, notify } from '../api.js'
import { useLookup } from '../useLookup.js'
import PassageText from '../PassageText.js'
const props = defineProps({ active: Boolean })
defineEmits(['delete'])
// The parent keys this component by article ID; asynchronous work keeps its original article.
const article = currentArticle.value
const content = ref(),
  inspectorScroll = ref(),
  noteField = ref()
const hidden = ref(localStorage.getItem(INSPECTOR_KEY) === 'true')
const size = ref(Math.max(15, Math.min(23, Number(localStorage.getItem(ARTICLE_FONT_KEY)) || 18)))
const words = computed(() => countWords(article.paragraphs.join(' ')))
const paragraphMarks = computed(() => {
  const groups = article.paragraphs.map(() => [])
  for (const mark of article.highlights) groups[mark.paragraphIndex]?.push(mark)
  return groups
})
const headings = computed(() => {
  const groups = article.paragraphs.map(() => [])
  for (const heading of article.sectionHeadings || [])
    groups[heading.beforeParagraphIndex]?.push(heading.text)
  return groups
})
const {
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
} = useLookup(article, () => (hidden.value = false))
const type = computed(() =>
  wordCount.value === 1 ? 'WORD' : wordCount.value <= 5 ? 'PHRASE' : 'SENTENCE',
)
const source = computed(() =>
  lookup.value?.source === 'qwen'
    ? '千问语境翻译 · ' + lookup.value.model
    : lookup.value?.source === 'dictionary'
      ? '本地词典'
      : '浏览器内翻译',
)
watch(size, (n) => localStorage.setItem(ARTICLE_FONT_KEY, String(n)))
watch(hidden, (value) => localStorage.setItem(INSPECTOR_KEY, String(value)))
watch(selected, () => {
  if (inspectorScroll.value) inspectorScroll.value.scrollTop = 0
})
function closeInspector() {
  hidden.value = true
  reset()
  window.getSelection()?.removeAllRanges()
}
let dragStart = null,
  dragged = false
function down(e) {
  if (e.button !== 0) return
  dragged = false
  dragStart = [e.clientX, e.clientY]
  toolbar.value = null
  if (!e.shiftKey) window.getSelection()?.removeAllRanges()
}
function up(e) {
  if (!dragStart) return
  dragged = Math.hypot(e.clientX - dragStart[0], e.clientY - dragStart[1]) > 5
  dragStart = null
  if (dragged) captureRange()
}
function pick(e) {
  if (dragged || (e.detail > 1 && selected.value)) return
  const token = e.target.closest('.word-token')
  if (!token) return
  window.getSelection()?.removeAllRanges()
  const start = Number(token.dataset.start),
    p = token.closest('[data-paragraph-index]')
  select(Number(p.dataset.paragraphIndex), start, start + token.textContent.length)
}
function paragraphOf(node) {
  return (node.nodeType === 1 ? node : node.parentElement)?.closest('[data-paragraph-index]')
}
function captureRange() {
  const selection = window.getSelection()
  if (!selection?.rangeCount || selection.isCollapsed) return
  const range = selection.getRangeAt(0),
    p = paragraphOf(range.startContainer)
  if (!p || !content.value.contains(p)) return
  if (p !== paragraphOf(range.endContainer)) {
    notify('请在同一段落内选择文本')
    return
  }
  const raw = range.toString()
  if (!raw.trim()) return
  const prefix = document.createRange()
  prefix.selectNodeContents(p)
  prefix.setEnd(range.startContainer, range.startOffset)
  const start = prefix.toString().length + raw.length - raw.trimStart().length
  const rect = range.getBoundingClientRect()
  select(Number(p.dataset.paragraphIndex), start, start + raw.trim().length, true)
  toolbar.value = {
    left: Math.min(innerWidth - 100, Math.max(100, rect.left + rect.width / 2)) + 'px',
    top: Math.max(60, rect.top) + 'px',
  }
}
function toolbarAction(writeNote = false) {
  hidden.value = false
  toolbar.value = null
  window.getSelection()?.removeAllRanges()
  if (writeNote) nextTick(() => noteField.value.focus())
  else if (!lookup.value && !busy.value) translateSelection()
}
function outside(e) {
  if (!content.value?.contains(e.target) && !e.target.closest('.selection-toolbar')) toolbar.value = null
}
function hideToolbar() {
  toolbar.value = null
}
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  window.addEventListener('resize', hideToolbar)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  window.removeEventListener('resize', hideToolbar)
  fullRun++
})
watch(
  () => props.active,
  (active) => {
    if (!active) hideToolbar()
  },
)
function speak() {
  if (!selected.value || !window.speechSynthesis) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(selected.value.text)
  utterance.lang = 'en-US'
  utterance.rate = 0.86
  speechSynthesis.speak(utterance)
}
const full = ref(false),
  translating = ref(-1),
  failures = ref({})
let fullRun = 0
async function toggleFull() {
  full.value = !full.value
  const run = ++fullRun
  translating.value = -1
  if (!full.value) return
  failures.value = {}
  for (const [i, text] of article.paragraphs.entries()) {
    if (run !== fullRun) return
    if (article.translations[i]) continue
    translating.value = i
    try {
      const result = await translate(text)
      article.translations[i] = result.translation
    } catch (e) {
      if (run === fullRun) failures.value[i] = e.message
    }
  }
  if (run === fullRun) translating.value = -1
}
function anchorLine() {
  return (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 102) + 14
}
function savePosition() {
  if (!props.active || !content.value) return
  const ps = [...content.value.querySelectorAll('.article-paragraph')],
    line = anchorLine()
  const anchor = ps.find((p) => p.getBoundingClientRect().bottom >= line) || ps.at(-1)
  if (anchor)
    article.readingPosition = {
      atStart: window.scrollY < 80 || content.value.getBoundingClientRect().top > line + 80,
      paragraphIndex: Number(anchor.dataset.paragraphIndex),
      offset: Math.round(anchor.getBoundingClientRect().top - line),
      savedAt: new Date().toISOString(),
    }
}
function restorePosition() {
  const pos = article.readingPosition
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!props.active || !content.value) return
      if (!pos || pos.atStart) {
        window.scrollTo(0, 0)
        return
      }
      const p = content.value.querySelector(
        '[data-paragraph-index="' + Number(pos.paragraphIndex) + '"]',
      )
      if (p)
        window.scrollTo(0, window.scrollY + p.getBoundingClientRect().top - anchorLine() - pos.offset)
    }),
  )
}
defineExpose({ savePosition, restorePosition })
</script>
<template>
  <section
    class="view is-active"
    id="readerView"
    :style="{
      '--article-size': size + 'px',
      '--article-title-size': Math.round(Math.min(50, Math.max(32, size * 2.2))) + 'px',
    }"
  >
    <div class="reader-workspace" :class="{ 'is-inspector-hidden': hidden }">
      <article class="article-card">
        <div class="article-toolbar">
          <div class="article-meta">
            <span>{{ words }} words</span> · <span>{{ Math.max(1, Math.ceil(words / 180)) }} min</span
            ><span
              v-if="article.structureSource === 'qwen'"
              class="ai-structured-badge"
              :title="article.structureModel"
              >AI 已整理</span
            >
          </div>
          <div class="article-actions">
            <div class="font-controls">
              <span class="font-controls-label">字号</span
              ><button
                class="icon-button"
                aria-label="减小正文字号"
                :disabled="size <= 15"
                @click="size--"
              >
                A−</button
              ><output>{{ size }}</output
              ><button
                class="icon-button"
                aria-label="增大正文字号"
                :disabled="size >= 23"
                @click="size++"
              >
                A＋
              </button>
            </div>
            <button class="text-button" @click="toggleFull">
              {{ full ? '隐藏全文翻译' : '显示全文翻译' }}</button
            ><button
              class="text-button"
              :aria-expanded="!hidden"
              @click="hidden ? (hidden = false) : closeInspector()"
            >
              {{ hidden ? '打开精读栏' : '隐藏精读栏' }}
            </button>
            <button class="icon-button danger-hover" aria-label="删除当前文章" @click="$emit('delete')">
              删除
            </button>
          </div>
        </div>
        <header v-if="article.hasTitle" class="article-header">
          <p class="article-kicker">READING PASSAGE</p>
          <h2 id="articleTitle">{{ article.title }}</h2>
        </header>
        <div
          class="article-content"
          id="articleContent"
          ref="content"
          @pointerdown="down"
          @pointerup="up"
          @click="pick"
          @keyup="captureRange"
        >
          <template v-for="(p, i) in article.paragraphs" :key="i">
            <h3 v-for="(heading, j) in headings[i]" :key="j" class="article-section-heading">
              {{ heading }}
            </h3>
            <section class="paragraph-block">
              <PassageText
                :text="p"
                :data-paragraph-index="i"
                :highlights="paragraphMarks[i]"
                :selected-start="
                  selected && !selected.drag && selected.paragraphIndex === i ? selected.start : -1
                "
              />
              <div v-if="full" class="paragraph-translation">
                {{
                  article.translations[i] ||
                  failures[i] ||
                  (translating === i ? '正在翻译…' : '尚未翻译')
                }}
              </div>
            </section>
          </template>
        </div>
      </article>
      <aside class="inspector" :aria-hidden="hidden">
        <button class="inspector-close" aria-label="关闭精读栏" @click="closeInspector">×</button>
        <div class="inspector-scroll" ref="inspectorScroll">
          <div v-if="!selected" class="inspector-placeholder">
            <span class="selection-icon">Aa</span>
            <h3>选择内容开始精读</h3>
            <p>点击单词或框选句子，即可翻译、高亮或添加笔记。</p>
          </div>
          <div v-else class="lookup-panel">
            <div class="lookup-heading">
              <div>
                <p class="eyebrow">{{ type }}</p>
                <h3
                  id="lookupText"
                  :class="{
                    'is-long': selected.text.length > 55 || wordCount > 7,
                    'is-very-long': selected.text.length > 180 || wordCount > 25,
                  }"
                >
                  {{ selected.text }}
                </h3>
                <p class="phonetic">{{ getDictionaryEntry(selected.text)?.phonetic }}</p>
              </div>
              <button class="icon-button" aria-label="朗读选中内容" @click="speak">▶</button>
            </div>
            <div v-if="selected.context !== selected.text" class="context-chip">
              {{ selected.context }}
            </div>
            <div class="translation-result" id="translationResult" aria-live="polite">
              <p v-if="busy" class="translation-loading">正在翻译…</p>
              <p v-else-if="error" class="muted">{{ error }}</p>
              <template v-else-if="lookup"
                ><strong>本文义 · {{ source }}</strong>
                <p>{{ lookup.translation }}</p></template
              >
            </div>
            <div class="lookup-actions">
              <button class="button button-primary" :disabled="busy" @click="translateSelection(true)">
                重新翻译</button
              ><button class="button button-secondary" :disabled="savedWord" @click="saveWord">
                {{ savedWord ? '已在生词本' : '加入生词本' }}
              </button>
            </div>
            <div v-if="wordCount === 1 || wordCount >= 6" class="ai-study-actions">
              <button
                class="text-button"
                :disabled="!connection.configured || analyzing"
                @click="analyze"
              >
                {{
                  analyzing ? '正在分析…' : wordCount === 1 ? '为什么这样翻译？' : '拆解长难句'
                }}</button
              ><small>仅点击时调用 AI</small>
            </div>
            <p v-if="insightError" class="muted">{{ insightError }}</p>
            <div v-if="insight" class="ai-insight">
              <div class="ai-insight-head">
                <strong>{{ wordCount === 1 ? '语境义解释' : '长难句拆解' }}</strong
                ><span>{{ insight.model }}</span>
              </div>
              <dl v-if="wordCount === 1">
                <template
                  v-for="(label, k) in {
                    meaning: '本句含义',
                    reason: '判断依据',
                    grammarRole: '句中作用',
                    collocation: '相关搭配',
                  }"
                  :key="k"
                  ><dt>{{ label }}</dt>
                  <dd>{{ insight[k] || '—' }}</dd></template
                >
              </dl>
              <template v-else
                ><dl>
                  <dt>句子主干</dt>
                  <dd>{{ insight.mainStructure }}</dd>
                </dl>
                <ol>
                  <li v-for="(c, i) in insight.clauses" :key="i">{{ c.text }}：{{ c.role }}</li>
                </ol>
                <ul>
                  <li v-for="p in insight.grammarPoints" :key="p">{{ p }}</li>
                </ul>
                <p>{{ insight.readingTip }}</p></template
              >
            </div>
            <div class="note-editor">
              <label for="selectionNote">随手记</label
              ><textarea
                id="selectionNote"
                ref="noteField"
                v-model="note"
                rows="4"
                placeholder="记录同义替换、长难句结构或自己的理解…"
              ></textarea
              ><button class="text-button" @click="saveNote">保存笔记</button>
            </div>
          </div>
          <div class="article-notes">
            <div class="section-heading compact">
              <div>
                <p class="eyebrow">NOTES</p>
                <h3>本文笔记</h3>
              </div>
              <span>{{ article.notes.length }}</span>
            </div>
            <div class="note-list">
              <p v-if="!article.notes.length" class="muted small">还没有笔记。</p>
              <article v-for="n in article.notes" :key="n.id" class="note-item">
                <blockquote>“{{ n.quote }}”</blockquote>
                <p>{{ n.content }}</p>
              </article>
            </div>
          </div>
        </div>
      </aside>
    </div>
    <Teleport to="body"
      ><div
        v-if="toolbar && active"
        class="selection-toolbar"
        :style="toolbar"
        role="toolbar"
        aria-label="文本工具"
        @mousedown.prevent
      >
        <button @click="toolbarAction()">译</button><span class="toolbar-divider"></span
        ><button
          v-for="(label, color) in { yellow: '黄色', mint: '绿色', blue: '蓝色' }"
          :key="color"
          class="color-dot"
          :class="color"
          :aria-label="label + '高亮'"
          @click="highlight(color)"
        ></button
        ><button @click="toolbarAction(true)">记</button>
      </div></Teleport
    >
  </section>
</template>
