<script setup>
import { computed } from 'vue'
import { state, countWords } from '../learning.js'
defineEmits(['clear'])
const stats = computed(() => [
  [state.articles.length, '学习文章'],
  [
    state.articles.reduce((n, a) => n + countWords(a.paragraphs.join(' ')), 0).toLocaleString(),
    '阅读词数',
  ],
  [state.vocabulary.length, '生词词组'],
  [state.articles.reduce((n, a) => n + a.notes.length + a.highlights.length, 0), '笔记与标注'],
])
</script>
<template>
  <section class="view is-active" id="profileView" data-view="profile">
    <div class="profile-hero">
      <div class="profile-avatar">R</div>
      <div>
        <p class="eyebrow">LOCAL LEARNER</p>
        <h2>你的精读记录</h2>
        <p>所有记录仅保存在当前浏览器。</p>
      </div>
    </div>
    <div class="stat-grid" id="statGrid">
      <div v-for="[value, label] in stats" :key="label" class="stat-card">
        <strong>{{ value }}</strong
        ><span>{{ label }}</span>
      </div>
    </div>
    <div class="privacy-card">
      <div>
        <p class="eyebrow">PRIVACY</p>
        <h3>数据控制</h3>
      </div>
      <p>
        文章、高亮、笔记和生词保存在当前浏览器。主动启用 AI
        结构整理时会发送整篇文章；翻译、语境解释和长难句拆解只发送当前所需文本，不发送笔记与学习历史。
      </p>
      <button
        class="button button-secondary danger-hover"
        id="clearAllDataButton"
        @click="$emit('clear')"
      >
        清除全部本地数据
      </button>
    </div>
  </section>
</template>
