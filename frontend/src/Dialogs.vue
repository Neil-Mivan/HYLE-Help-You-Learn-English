<script setup>
import { nextTick, ref } from 'vue'
import { connection, api, setKey, currentKey, notify } from './api.js'
import { createArticle, parseArticle, PERSONAL_API_KEY_LOCAL } from './learning.js'
const emit = defineEmits(['imported'])
const importDialog = ref(),
  apiDialog = ref(),
  articleInput = ref()
const title = ref(''),
  raw = ref(''),
  useAi = ref(false),
  busy = ref(false)
const draftKey = ref(''),
  remember = ref(false),
  keyMessage = ref('')
const confirmation = ref(null)
function openImport() {
  title.value = raw.value = ''
  useAi.value = connection.configured
  importDialog.value.showModal()
  nextTick(() => articleInput.value.focus())
}
async function submitArticle() {
  const text = raw.value.trim(),
    manualTitle = title.value.trim()
  if (!text || busy.value) return
  busy.value = true
  let parsed = parseArticle(text, manualTitle),
    model = ''
  try {
    if (useAi.value && connection.configured) {
      const result = await api('analyze-article', { text, manualTitle })
      const paragraphs = [],
        sectionHeadings = []
      for (const b of result.blocks) {
        if (b.type === 'heading')
          sectionHeadings.push({ text: b.text, beforeParagraphIndex: paragraphs.length })
        else paragraphs.push(b.text)
      }
      if (!paragraphs.length) throw Error('未识别到正文')
      parsed = { title: result.title || manualTitle, paragraphs, sectionHeadings }
      model = result.model
    }
  } catch (e) {
    notify(e.message + ' 已使用本地排版。')
  } finally {
    busy.value = false
  }
  importDialog.value.close()
  emit('imported', createArticle(text, parsed, model))
}
function openApi() {
  draftKey.value = currentKey()
  remember.value = Boolean(localStorage.getItem(PERSONAL_API_KEY_LOCAL))
  keyMessage.value = connection.configured ? '当前 API 已配置。' : '尚未连接个人 Key。'
  apiDialog.value.showModal()
}
async function saveKey() {
  if (!draftKey.value.trim()) {
    keyMessage.value = '请输入完整的千问 Key。'
    return
  }
  try {
    await setKey(draftKey.value, remember.value)
    apiDialog.value.close()
    notify('API 配置已保存')
  } catch (e) {
    keyMessage.value = e.message
  }
}
async function removeKey() {
  await setKey('', false)
  draftKey.value = ''
  apiDialog.value.close()
  notify('个人 Key 已移除')
}
function confirm(title, message, action) {
  confirmation.value = { title, message, action }
}
function accept() {
  confirmation.value.action()
  confirmation.value = null
}
defineExpose({ openImport, openApi, confirm })
</script>
<template>
  <dialog
    class="import-dialog"
    id="importDialog"
    ref="importDialog"
    @cancel="busy && $event.preventDefault()"
  >
    <form method="dialog" id="importForm" @submit.prevent="submitArticle">
      <div class="dialog-heading">
        <div>
          <p class="eyebrow">NEW ARTICLE</p>
          <h2>导入英文文章</h2>
        </div>
        <button
          class="dialog-close"
          id="closeImportButton"
          @click="importDialog.close()"
          :disabled="busy"
          type="button"
          aria-label="关闭导入窗口"
        >
          ×
        </button>
      </div>
      <label class="field">
        <span>标题 <small>可选，留空时自动识别</small></span>
        <input
          id="titleInput"
          v-model="title"
          type="text"
          autocomplete="off"
          placeholder="例如 The Future of Urban Farming"
        />
      </label>
      <label class="field">
        <span>文章内容</span>
        <textarea
          id="articleInput"
          v-model="raw"
          ref="articleInput"
          rows="14"
          placeholder="在这里粘贴完整英文文章…"
          required
        ></textarea>
      </label>
      <label class="ai-import-option">
        <input
          id="aiStructureToggle"
          type="checkbox"
          v-model="useAi"
          :disabled="!connection.configured"
        />
        <span>
          <strong>使用 AI 自动识别标题与正文结构</strong>
          <small>会将本次导入的整篇文章发送给千问一次；关闭后使用本地规则整理。</small>
        </span>
      </label>
      <div class="dialog-foot">
        <p>
          <span class="privacy-dot"></span
          ><span id="importPrivacyHint">{{
            useAi ? '启用 AI 整理时，本篇文章将发送给千问' : '本地规则整理'
          }}</span>
        </p>
        <button
          class="button button-primary button-large"
          id="createArticleButton"
          :disabled="busy"
          value="default"
        >
          {{ busy ? 'AI 正在识别结构…' : '整理并开始阅读' }}
        </button>
      </div>
    </form>
  </dialog>

  <dialog class="import-dialog api-dialog" id="apiDialog" ref="apiDialog">
    <form method="dialog" id="apiForm" @submit.prevent="saveKey">
      <div class="dialog-heading">
        <div>
          <p class="eyebrow">PERSONAL API</p>
          <h2>连接自己的千问</h2>
        </div>
        <button
          class="dialog-close"
          id="closeApiButton"
          @click="apiDialog.close()"
          type="button"
          aria-label="关闭 API 设置"
        >
          ×
        </button>
      </div>
      <div class="api-privacy-note">
        <span class="privacy-dot"></span>
        <p>
          <strong>无账号、自带 Key</strong><br />Key 只保存在这台设备的浏览器中。调用 AI
          时经当前网站后端临时转发，澄读服务代码不会主动保存或记录 Key 和请求内容。
        </p>
      </div>
      <label class="field">
        <span>阿里云百炼 API Key</span>
        <input
          id="personalApiKeyInput"
          v-model="draftKey"
          type="password"
          autocomplete="new-password"
          spellcheck="false"
          placeholder="支持 sk-、sk-ws、sk-sp-…"
        />
      </label>
      <label class="remember-api-key">
        <input id="rememberApiKey" type="checkbox" v-model="remember" />
        <span
          ><strong>在这台设备上记住</strong><small>下次打开自动连接；不要在公共电脑上勾选。</small></span
        >
      </label>
      <p class="api-security-warning">
        公开网站必须使用
        HTTPS。浏览器本地保存适合可信的小范围朋友使用，但不能达到账号保险库级别的安全性。
      </p>
      <p class="api-settings-status" id="apiSettingsStatus" role="status">{{ keyMessage }}</p>
      <div class="api-dialog-actions">
        <button
          class="button button-quiet danger-hover"
          id="clearApiKeyButton"
          @click="removeKey"
          type="button"
        >
          移除本机 Key
        </button>
        <button class="button button-primary" id="saveApiKeyButton" value="default">
          保存并自动连接
        </button>
      </div>
    </form>
  </dialog>
  <div v-if="confirmation" class="confirm-overlay" role="dialog" aria-modal="true">
    <div class="confirm-card">
      <h3>{{ confirmation.title }}</h3>
      <p>{{ confirmation.message }}</p>
      <div>
        <button class="button button-secondary" @click="confirmation = null">取消</button>
        <button class="button button-danger" @click="accept">确认删除</button>
      </div>
    </div>
  </div>
</template>
