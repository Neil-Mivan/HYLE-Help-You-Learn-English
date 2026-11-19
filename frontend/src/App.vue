<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import {
  state,
  article,
  createArticle,
  parseArticle,
  SAMPLE_ARTICLE,
  SIDEBAR_KEY,
  persist,
} from './learning.js'
import { connection, refreshStatus, disconnectSession, notify, toast } from './api.js'
import LibraryView from './views/LibraryView.vue'
import ReaderView from './views/ReaderView.vue'
import TranslatorView from './views/TranslatorView.vue'
import VocabularyView from './views/VocabularyView.vue'
import ProfileView from './views/ProfileView.vue'
import Dialogs from './Dialogs.vue'

const view = ref('library'),
  reader = ref(null),
  dialogs = ref(null),
  translator = ref(null)
const sidebarHidden = ref(localStorage.getItem(SIDEBAR_KEY) === 'true')
const sidebarLabel = computed(() => (sidebarHidden.value ? '显示侧边栏' : '隐藏侧边栏'))
const resumeId = ref(null)
const resumeArticle = computed(() => state.articles.find((a) => a.id === resumeId.value))
const meta = {
  library: ['YOUR LIBRARY', '文章库'],
  reader: ['FOCUSED READING', '专注阅读'],
  translator: ['AI TRANSLATOR', '独立翻译'],
  vocabulary: ['VOCABULARY', '生词本'],
  profile: ['MY LEARNING', '我的'],
}
function toggleSidebar() {
  sidebarHidden.value = !sidebarHidden.value
  localStorage.setItem(SIDEBAR_KEY, String(sidebarHidden.value))
}
function savePosition() {
  if (view.value === 'reader') reader.value?.savePosition()
}
function navigate(target) {
  if (view.value !== target) savePosition()
  view.value = target
  if (target === 'translator') nextTick(() => translator.value?.focus())
}
async function openArticle(id) {
  savePosition()
  state.currentArticleId = id
  resumeId.value = id
  article.value.lastReadAt = new Date().toISOString()
  view.value = 'reader'
  await nextTick()
  reader.value?.restorePosition()
}
function sample() {
  const old = state.articles.find((a) => a.raw === SAMPLE_ARTICLE)
  openArticle(old?.id || createArticle(SAMPLE_ARTICLE, parseArticle(SAMPLE_ARTICLE)))
}
function removeArticle() {
  const id = article.value.id
  dialogs.value.confirm('删除这篇文章？', '文章及其笔记、高亮和译文将从本机删除。', () => {
    navigate('library')
    state.articles = state.articles.filter((a) => a.id !== id)
    state.currentArticleId = state.articles[0]?.id || null
    resumeId.value = null
  })
}
function clearAll() {
  dialogs.value.confirm(
    '清除全部学习数据？',
    '所有文章、笔记、高亮和生词都会从当前浏览器永久删除。',
    () => {
      navigate('library')
      Object.assign(state, {
        articles: [],
        vocabulary: [],
        currentArticleId: null,
        createdAt: new Date().toISOString(),
      })
      resumeId.value = null
      notify('本地学习数据已清除')
    },
  )
}
function onPageHide() {
  savePosition()
  persist()
}
onMounted(() => {
  refreshStatus()
  window.addEventListener('pagehide', onPageHide)
})
onBeforeUnmount(() => {
  disconnectSession()
  window.removeEventListener('pagehide', onPageHide)
})
</script>

<template>
  <div class="app-shell" :class="{ 'is-sidebar-hidden': sidebarHidden }">
    <aside class="sidebar" aria-label="主导航">
      <button
        class="brand"
        data-view-target="library"
        @click="navigate('library')"
        aria-label="打开文章库"
      >
        <span class="brand-mark" aria-hidden="true">澄</span>
        <span class="brand-copy">
          <strong>澄读</strong>
          <small>IELTS READING</small>
        </span>
      </button>

      <nav class="nav-list">
        <button
          class="nav-item"
          :class="{ 'is-active': view === 'library' }"
          data-view-target="library"
          @click="navigate('library')"
        >
          <span aria-hidden="true">▦</span><span>文章库</span>
        </button>
        <button
          class="nav-item"
          :class="{ 'is-active': view === 'translator' }"
          data-view-target="translator"
          @click="navigate('translator')"
        >
          <span aria-hidden="true">译</span><span>翻译</span>
        </button>
        <button
          class="nav-item"
          :class="{ 'is-active': view === 'vocabulary' }"
          data-view-target="vocabulary"
          @click="navigate('vocabulary')"
        >
          <span aria-hidden="true">Aa</span><span>生词本</span>
        </button>
        <button
          class="nav-item"
          :class="{ 'is-active': view === 'profile' }"
          data-view-target="profile"
          @click="navigate('profile')"
        >
          <span aria-hidden="true">◌</span><span>我的</span>
        </button>
      </nav>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-heading">
          <button
            class="sidebar-toggle"
            id="sidebarToggle"
            type="button"
            :aria-label="sidebarLabel"
            :title="sidebarLabel"
            @click="toggleSidebar"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div>
            <p class="eyebrow" id="viewEyebrow">{{ meta[view][0] }}</p>
            <h1 id="viewTitle">{{ meta[view][1] }}</h1>
          </div>
        </div>
        <div class="topbar-actions">
          <button
            class="continue-reading-button"
            id="continueReadingButton"
            v-show="resumeArticle && view !== 'reader'"
            @click="openArticle(resumeArticle.id)"
            :title="resumeArticle?.title"
            type="button"
          >
            <span class="continue-reading-arrow" aria-hidden="true">←</span>
            <span class="continue-reading-copy">
              <strong>继续阅读</strong>
              <small id="continueReadingTitle">{{ resumeArticle?.title || '未命名文章' }}</small>
            </span>
          </button>
          <span class="translator-status" id="translatorStatus" :class="connection.status">
            <span class="status-dot"></span>
            <span>{{ connection.label }}</span>
          </span>
          <button
            class="button button-quiet api-settings-button"
            id="apiSettingsButton"
            @click="dialogs.openApi()"
            type="button"
          >
            {{
              connection.source === 'personal'
                ? '个人 API'
                : connection.configured
                  ? '本机 API'
                  : '连接 API'
            }}
          </button>
          <button
            class="button button-primary"
            id="newArticleButton"
            v-show="state.articles.length"
            @click="dialogs.openImport()"
          >
            ＋ 导入文章
          </button>
        </div>
      </header>

      <LibraryView
        v-show="view === 'library'"
        @open="openArticle"
        @import="dialogs.openImport()"
        @sample="sample"
      />
      <ReaderView
        v-if="article"
        v-show="view === 'reader'"
        :key="article.id"
        :active="view === 'reader'"
        ref="reader"
        @delete="removeArticle"
      />
      <TranslatorView v-show="view === 'translator'" ref="translator" @connect="dialogs.openApi()" />
      <VocabularyView v-show="view === 'vocabulary'" />
      <ProfileView v-show="view === 'profile'" @clear="clearAll" />
    </main>
  </div>
  <Dialogs ref="dialogs" @imported="openArticle" />
  <div v-show="toast" class="toast" role="status">{{ toast }}</div>
</template>
