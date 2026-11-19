<script setup>
import { state, countWords, formatDate } from '../learning.js'
defineEmits(['open', 'import', 'sample'])
</script>
<template>
  <section class="view is-active" id="libraryView">
    <div class="section-heading">
      <div>
        <p class="eyebrow">YOUR LIBRARY</p>
        <h2>学习过的文章</h2>
      </div>
      <span class="count-pill">{{ state.articles.length }} 篇</span>
    </div>
    <div class="card-grid">
      <div v-if="!state.articles.length" class="empty-collection library-empty-state">
        <span class="library-empty-icon">▤</span>
        <h3>从第一篇英文文章开始</h3>
        <p>文章保存在当前浏览器的文章库中。</p>
        <div>
          <button class="button button-primary" @click="$emit('import')">导入第一篇文章</button>
          <button class="button button-quiet" @click="$emit('sample')">使用示例文章</button>
        </div>
      </div>
      <article
        v-for="(a, i) in state.articles"
        :key="a.id"
        class="library-card"
        tabindex="0"
        role="button"
        @click="$emit('open', a.id)"
        @keydown.enter="$emit('open', a.id)"
      >
        <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
        <h3>{{ a.title || 'Untitled Reading' }}</h3>
        <p>{{ a.paragraphs[0] }}</p>
        <footer>
          <span>{{ countWords(a.paragraphs.join(' ')) }} words</span
          ><span>{{ formatDate(a.lastReadAt) }}</span>
        </footer>
      </article>
    </div>
  </section>
</template>
