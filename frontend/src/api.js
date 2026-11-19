import { reactive, ref } from 'vue'
import { PERSONAL_API_KEY_LOCAL, PERSONAL_API_KEY_SESSION, getDictionaryEntry } from './learning.js'

export const connection = reactive({
  configured: false,
  source: 'none',
  label: '检测本地翻译…',
  status: '',
  model: '',
})
export const toast = ref('')
let toastTimer, translator, pageSession
let key =
  sessionStorage.getItem(PERSONAL_API_KEY_SESSION) || localStorage.getItem(PERSONAL_API_KEY_LOCAL) || ''
export const currentKey = () => key
export function notify(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2300)
}
export async function api(path, payload, signal) {
  const headers = { Accept: 'application/json' }
  if (key) headers['X-Clear-Reading-Api-Key'] = key
  if (payload) headers['Content-Type'] = 'application/json'
  const response = await fetch('/api/' + path, {
    method: payload ? 'POST' : 'GET',
    headers,
    body: JSON.stringify(payload),
    signal,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '千问服务暂时不可用。')
  return data
}
export async function refreshStatus() {
  let status
  try {
    status = await api('status')
  } catch {
    status = {}
  }
  connection.configured = Boolean(status.configured)
  connection.source = status.credentialSource || 'none'
  connection.model = status.model || ''
  if (status.autoStop && !pageSession) pageSession = new EventSource('/api/session')
  if (connection.configured) {
    connection.status = ''
    connection.label =
      (connection.source === 'personal' ? '个人千问' : '千问翻译') + '已连接 · ' + connection.model
  } else {
    connection.status = 'is-warning'
    connection.label = '本地词典模式'
    if (window.Translator) {
      try {
        const available = await Translator.availability({ sourceLanguage: 'en', targetLanguage: 'zh' })
        if (available === 'available') connection.label = '本地翻译已就绪'
        if (available === 'downloadable') connection.label = '英中语言包可下载'
      } catch {
        /* Dictionary remains available. */
      }
    }
  }
}
export function disconnectSession() {
  pageSession?.close()
  pageSession = null
}
export async function setKey(value, remember) {
  const cleaned = value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
  if (cleaned) {
    if (!['localhost', '127.0.0.1'].includes(location.hostname) && location.protocol !== 'https:')
      throw new Error('请使用 HTTPS 连接个人 Key。')
    if (
      !/^sk-[!-~]+$/.test(cleaned) ||
      cleaned.includes('*') ||
      cleaned.length < 12 ||
      cleaned.length > 512
    )
      throw new Error('请粘贴完整的千问 Key。')
    if (remember) localStorage.setItem(PERSONAL_API_KEY_LOCAL, cleaned)
    else sessionStorage.setItem(PERSONAL_API_KEY_SESSION, cleaned)
  }
  if (!cleaned || !remember) localStorage.removeItem(PERSONAL_API_KEY_LOCAL)
  if (!cleaned || remember) sessionStorage.removeItem(PERSONAL_API_KEY_SESSION)
  key = cleaned
  await refreshStatus()
}
export async function translate(text, context = '') {
  if (connection.configured) {
    const result = await api('translate', { text, context })
    return { translation: result.translation, model: result.model, source: 'qwen' }
  }
  const entry = getDictionaryEntry(text)
  if (entry) return { translation: entry.meaning, source: 'dictionary' }
  if (!window.Translator) throw new Error('当前浏览器不支持本地翻译，请连接千问。')
  translator ||= await Translator.create({ sourceLanguage: 'en', targetLanguage: 'zh' })
  return { translation: await translator.translate(text), source: 'browser' }
}
