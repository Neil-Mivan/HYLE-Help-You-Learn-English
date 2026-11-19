<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  state,
  isVocabularyMastered,
  updateVocabularySchedule,
  vocabularyReviewLabel,
  formatDate,
} from '../learning.js'
import { notify } from '../api.js'
const now = ref(Date.now()),
  panel = ref(null),
  queue = ref([]),
  position = ref(0),
  revealed = ref(false)
const current = computed(() => state.vocabulary.find((x) => x.id === queue.value[position.value]))
const mastered = computed(() => state.vocabulary.filter(isVocabularyMastered).length)
const due = computed(() =>
  state.vocabulary
    .filter((x) => Date.parse(x.review.dueAt) <= now.value)
    .sort((a, b) => Date.parse(a.review.dueAt) - Date.parse(b.review.dueAt)),
)
const repeats = new Set()
watch(() => state.vocabulary.length, () => { now.value = Date.now() })
let timer
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 60000)
})
onUnmounted(() => clearInterval(timer))
function start() {
  repeats.clear()
  queue.value = due.value.map((x) => x.id)
  position.value = 0
  revealed.value = false
  nextTick(() => panel.value?.scrollIntoView({ block: 'start' }))
}
function finish() {
  queue.value = []
  revealed.value = false
}
function rate(rating) {
  if (!revealed.value || !current.value) return
  const item = current.value
  updateVocabularySchedule(item, rating)
  if (rating === 'again' && !repeats.has(item.id)) {
    repeats.add(item.id)
    queue.value.push(item.id)
  }
  position.value++
  revealed.value = false
  now.value = Date.now()
  if (!current.value) {
    finish()
    notify('本次复习完成')
  }
}
function remove(item) {
  if (queue.value.includes(item.id)) finish()
  state.vocabulary = state.vocabulary.filter((x) => x.id !== item.id)
}
</script>
<template>
  <section class="view is-active" id="vocabularyView" data-view="vocabulary">
    <div class="section-heading">
      <div>
        <p class="eyebrow">VOCABULARY</p>
        <h2>生词与词组</h2>
      </div>
      <span class="count-pill" id="vocabularyCount">{{ state.vocabulary.length }} 个</span>
    </div>

    <section class="review-overview" id="reviewOverview" v-show="!current" aria-label="生词复习概览">
      <div class="review-overview-copy">
        <p class="eyebrow">DAILY REVIEW</p>
        <h3>今天复习一点，记得更久</h3>
        <p>复习记录只保存在本机，不调用 AI。</p>
      </div>
      <div class="review-metrics">
        <div>
          <strong id="dueVocabularyCount">{{ due.length }}</strong
          ><span>今日待复习</span>
        </div>
        <div>
          <strong id="masteredVocabularyCount">{{ mastered }}</strong
          ><span>已逐渐掌握</span>
        </div>
      </div>
      <button
        class="button button-primary"
        id="startReviewButton"
        @click="start"
        :disabled="!due.length"
        type="button"
      >
        {{ due.length ? '开始复习 ' + due.length + ' 个' : '暂无待复习生词' }}
      </button>
    </section>

    <section class="review-session" id="reviewPanel" v-if="current" ref="panel" aria-live="polite">
      <div class="review-session-head">
        <div>
          <p class="eyebrow">FOCUS CARD</p>
          <span id="reviewProgress">{{ position + 1 }} / {{ queue.length }}</span>
        </div>
        <button
          class="icon-button"
          id="closeReviewButton"
          @click="finish"
          type="button"
          aria-label="结束本次复习"
        >
          结束
        </button>
      </div>
      <article class="review-card" id="reviewCard">
        <div class="review-prompt">
          <p class="eyebrow">WORD</p>
          <h3 id="reviewWord">{{ current.text }}</h3>
          <p id="reviewPhonetic">{{ current.phonetic }}</p>
          <blockquote id="reviewContext">{{ current.context || current.articleTitle }}</blockquote>
        </div>
        <div class="review-answer" id="reviewAnswer" v-show="revealed">
          <span>本句含义</span>
          <p id="reviewMeaning">{{ current.meaning }}</p>
        </div>
        <button
          class="button button-secondary review-reveal"
          id="revealReviewAnswer"
          v-show="!revealed"
          @click="revealed = true"
          type="button"
        >
          显示答案
        </button>
        <div class="review-rating" id="reviewRating" v-show="revealed" aria-label="记忆程度">
          <button type="button" data-review-rating="again" @click="rate('again')">
            <strong>不认识</strong><span>本轮再看</span>
          </button>
          <button type="button" data-review-rating="hard" @click="rate('hard')">
            <strong>模糊</strong><span>较快复习</span>
          </button>
          <button type="button" data-review-rating="good" @click="rate('good')">
            <strong>认识</strong><span>延长间隔</span>
          </button>
        </div>
      </article>
    </section>

    <div class="vocabulary-list" id="vocabularyList">
      <div v-if="!state.vocabulary.length" class="empty-collection">
        点击文章中的单词或词组，将它们加入生词本。
      </div>
      <article v-for="item in state.vocabulary" :key="item.id" class="vocabulary-item">
        <div>
          <h3>{{ item.text }}</h3>
          <small>{{ item.phonetic || formatDate(item.createdAt) }}</small>
        </div>
        <p class="vocabulary-meaning">{{ item.meaning }}</p>
        <p>{{ item.context || item.articleTitle }}</p>
        <div class="vocabulary-actions">
          <span class="review-status" :class="{ 'is-mastered': isVocabularyMastered(item) }">{{
            vocabularyReviewLabel(item)
          }}</span
          ><button class="icon-button danger-hover" @click="remove(item)">移除</button>
        </div>
      </article>
    </div>
  </section>
</template>
