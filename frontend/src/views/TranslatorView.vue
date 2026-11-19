<script setup>
import { ref } from 'vue'
import { api, connection, notify } from '../api.js'
const emit = defineEmits(['connect'])
const query = ref(''),
  input = ref(),
  result = ref(null),
  error = ref(''),
  busy = ref(false)
let sequence = 0
function focus() {
  input.value?.focus()
}
function clear() {
  sequence++
  query.value = ''
  result.value = null
  error.value = ''
  busy.value = false
  focus()
}
function example(event) {
  query.value = event.currentTarget.dataset.translationExample
  focus()
}
async function submit() {
  const text = query.value.trim()
  if (!text) {
    notify('请输入英文单词、词组或句子')
    focus()
    return
  }
  if (busy.value) return
  error.value = ''
  result.value = null
  if (!connection.configured) {
    error.value = '请先连接自己的千问 API。'
    emit('connect')
    return
  }
  const id = ++sequence
  busy.value = true
  try {
    const data = await api('standalone-translate', { text })
    if (id === sequence) result.value = data
  } catch (e) {
    if (id === sequence) error.value = e.message
  } finally {
    if (id === sequence) busy.value = false
  }
}
defineExpose({ focus })
</script>
<template>
  <section class="view is-active" id="translatorView" data-view="translator">
    <div class="standalone-translator">
      <header class="translator-hero">
        <div>
          <p class="eyebrow">AI TRANSLATOR</p>
          <h2>查清一个词，也译好一句话</h2>
          <p>输入一个英文单词，查看不同词性下的常用义项与例句；输入词组或句子，获得完整中文翻译。</p>
        </div>
        <span class="ai-translation-badge">千问 AI</span>
      </header>

      <form class="translator-composer" id="standaloneTranslateForm" @submit.prevent="submit">
        <label for="standaloneTranslateInput">英文单词、词组或句子</label>
        <textarea
          id="standaloneTranslateInput"
          ref="input"
          v-model="query"
          @keydown.ctrl.enter.prevent="submit"
          @keydown.meta.enter.prevent="submit"
          rows="5"
          maxlength="5000"
          spellcheck="true"
          placeholder="例如：approach&#10;或：A different approach may lead to a better result."
        ></textarea>
        <div class="translator-composer-foot">
          <p>仅在点击翻译时发送当前输入，不发送文章、笔记或学习记录。</p>
          <div>
            <button
              class="button button-quiet"
              id="clearStandaloneTranslate"
              @click="clear"
              type="button"
            >
              清空
            </button>
            <button
              class="button button-primary"
              id="standaloneTranslateButton"
              :disabled="busy"
              type="submit"
            >
              {{ busy ? 'AI 正在查询…' : 'AI 翻译' }}
            </button>
          </div>
        </div>
      </form>

      <div class="translator-examples" aria-label="查询示例">
        <span>试一试</span>
        <button type="button" @click="example($event)" data-translation-example="approach">
          approach
        </button>
        <button
          type="button"
          @click="example($event)"
          data-translation-example="Water hyacinth spreads rapidly in warm, nutrient-rich water."
        >
          Water hyacinth…
        </button>
      </div>

      <section
        class="standalone-result"
        id="standaloneTranslationResult"
        aria-live="polite"
        :class="{ 'has-error': error, 'is-empty': !result && !busy && !error }"
      >
        <div v-if="busy" class="standalone-loading"><span class="status-dot"></span>正在查询…</div>
        <div v-else-if="error" class="standalone-error">
          <strong>暂时无法完成翻译</strong>
          <p>{{ error }}</p>
        </div>
        <template v-else-if="result?.kind === 'word'">
          <header class="dictionary-entry-head">
            <div>
              <p class="eyebrow">WORD</p>
              <h3>{{ result.entry.word }}</h3>
              <p class="dictionary-phonetic">{{ result.entry.phonetic }}</p>
            </div>
            <span class="model-chip">{{ result.model }}</span>
          </header>
          <div class="word-forms">
            <span v-for="form in result.entry.forms" :key="form">{{ form }}</span>
          </div>
          <div class="dictionary-groups">
            <section v-for="(group, g) in result.entry.meanings" :key="g" class="dictionary-pos-group">
              <h4>
                <span>{{ group.partOfSpeech }}</span
                >{{ group.partOfSpeechName }}
              </h4>
              <ol>
                <li v-for="(sense, i) in group.senses" :key="i">
                  <div class="sense-meaning">
                    <span>{{ i + 1 }}</span
                    ><strong>{{ sense.meaning }}</strong
                    ><span v-if="sense.label" class="sense-label">{{ sense.label }}</span>
                  </div>
                  <div v-if="sense.example" class="dictionary-example">
                    <p>{{ sense.example }}</p>
                    <span>{{ sense.exampleTranslation }}</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </template>
        <template v-else-if="result"
          ><header class="sentence-result-head">
            <div>
              <p class="eyebrow">SENTENCE / PHRASE</p>
              <h3>完整翻译</h3>
            </div>
            <span class="model-chip">{{ result.model }}</span>
          </header>
          <blockquote class="sentence-source">{{ result.query }}</blockquote>
          <div class="sentence-translation">
            <span>中文译文</span>
            <p>{{ result.translation }}</p>
          </div></template
        >
        <div v-else class="translator-result-placeholder">
          <span>Aa</span>
          <h3>在这里开始一次独立查询</h3>
          <p>单词按词性整理义项与例句，句子显示完整译文。</p>
        </div>
      </section>
    </div>
  </section>
</template>
