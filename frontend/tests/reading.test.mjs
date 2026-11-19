import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'

test(
  'Vue on Spring Boot: import, lookup race, drag, notes, review and resume',
  { timeout: 80000 },
  async (t) => {
    const cwd = await mkdtemp(join(tmpdir(), 'hyle-vue-'))
    const jar = fileURLToPath(new URL('../../target/hyle.jar', import.meta.url))
    const processJava = spawn(
      process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java',
      ['-jar', jar],
      {
        cwd,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: '0',
          HOST: '127.0.0.1',
          CLEAR_READING_AUTO_OPEN: '0',
          CLEAR_READING_AUTO_STOP: '0',
          DASHSCOPE_API_KEY: '',
          DASHSCOPE_BASE_URL: 'http://127.0.0.1:1',
          CLEAR_READING_REQUIRE_PERSONAL_KEY: '1',
        },
      },
    )
    const exit = once(processJava, 'exit')
    t.after(async () => {
      processJava.kill()
      await exit
      await rmdir(cwd)
    })
    let output = ''
    processJava.stdout.on('data', (chunk) => (output += chunk))
    for (let i = 0; i < 200 && !output.includes('Tomcat started on port'); i++) await delay(100)
    const port = output.match(/Tomcat started on port (\d+)/)?.[1]
    assert.ok(port)
    const browser = await chromium.launch(
      process.env.HYLE_BROWSER ? { executablePath: process.env.HYLE_BROWSER } : { channel: 'chrome' },
    )
    t.after(() => browser.close())
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } })
    page.setDefaultTimeout(5000)
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route('**/api/translate', async (route) => {
      const { text } = route.request().postDataJSON()
      if (text === 'Play') await delay(350)
      await route.fulfill({ json: { translation: '译：' + text, model: 'test', provider: 'qwen' } })
    })
    await page.route('**/api/standalone-translate', (route) =>
      route.fulfill({
        json: {
          kind: 'word',
          entry: {
            word: 'world',
            meanings: [
              { partOfSpeech: 'n.', senses: [{ meaning: '世界', example: 'Around the world.' }] },
            ],
          },
          model: 'test',
        },
      }),
    )
    await page.goto('http://127.0.0.1:' + port)
    await page.getByRole('button', { name: '连接 API' }).click()
    await page.locator('#personalApiKeyInput').fill('sk-test-fixture-key')
    await page.locator('#saveApiKeyButton').click()
    await page.getByRole('button', { name: '个人 API', exact: true }).waitFor()
    await page.getByRole('button', { name: '导入第一篇文章' }).click()
    await page.locator('#titleInput').fill('River notes')
    await page
      .locator('#articleInput')
      .fill(
        'Play beside the river. Water hyacinth floats.\n\n' +
          Array.from({ length: 30 }, (_, i) => 'The river turns at bend ' + i + '.').join('\n\n'),
      )
    await page.locator('#aiStructureToggle').uncheck()
    await page.locator('#createArticleButton').click()
    const first = page.locator('.article-paragraph').first()
    await first.getByText('Play', { exact: true }).click()
    await first.getByText('Water', { exact: true }).dblclick()
    await page.getByText('译：Water', { exact: true }).waitFor()
    await delay(400)
    assert.equal(await page.locator('#lookupText').textContent(), 'Water')
    assert.match(await page.locator('#translationResult').textContent(), /译：Water/)
    await page.getByRole('button', { name: '加入生词本' }).click()
    await page.locator('#selectionNote').fill('River plant')
    await page.getByRole('button', { name: '保存笔记' }).click()
    await page.getByRole('button', { name: '关闭精读栏' }).click()
    const river = first.getByText('river', { exact: true })
    await river.click()
    await page.getByText('译：river', { exact: true }).waitFor()
    const left = await first.getByText('Water', { exact: true }).boundingBox()
    const right = await first.getByText('hyacinth', { exact: true }).boundingBox()
    await page.mouse.move(left.x + 1, left.y + left.height / 2)
    await page.mouse.down()
    await page.mouse.move(right.x + right.width - 1, right.y + right.height / 2, { steps: 16 })
    await page.mouse.up()
    await page.getByRole('button', { name: '黄色高亮' }).click()
    assert.equal(await first.locator('mark').textContent(), 'Water hyacinth')
    await page
      .locator('.article-paragraph')
      .nth(12)
      .evaluate((p) => p.scrollIntoView())
    const before = await page.evaluate(() => scrollY)
    await page.locator('[data-view-target="translator"]').click()
    await page.locator('#standaloneTranslateInput').fill('world')
    await page.locator('#standaloneTranslateButton').click()
    await page.getByText('Around the world.').waitFor()
    await page.locator('#continueReadingButton').click()
    await page.waitForFunction((pos) => Math.abs(scrollY - pos) < 8, before)
    await page.locator('[data-view-target="vocabulary"]').click()
    await page.locator('#startReviewButton').click()
    await page.locator('#revealReviewAnswer').click()
    await page.locator('[data-review-rating="good"]').click()
    await page.locator('[data-view-target="profile"]').click()
    assert.equal(await page.locator('.stat-card').count(), 4)
    await page.reload()
    await page.getByRole('heading', { name: 'River notes' }).click()
    assert.equal(await first.locator('mark').textContent(), 'Water hyacinth')
    await page.getByText('River plant', { exact: true }).waitFor()
    // A v0.1.0 article can lack newer optional AI fields. Keep its original offsets and note text.
    await page.evaluate(() => {
      const key = 'clear-reading-state-v1'
      const state = JSON.parse(localStorage.getItem(key))
      state.articles.push({
        id:'legacy-id', title:'Legacy passage', hasTitle:true, raw:'A river flows.',
        paragraphs:['A river flows.'], translations:{0:'一条河流淌着。'},
        highlights:[{id:'legacy-mark',paragraphIndex:0,start:2,end:7,text:'river',color:'mint'}],
        notes:[{id:'legacy-note',quote:'river',content:'旧版笔记'}],
        createdAt:'2026-07-28T00:00:00Z', lastReadAt:'2026-07-28T00:00:00Z',
      })
      // Seed the next document after the previous page has finished persisting its own state.
      sessionStorage.setItem('test-legacy-fixture',JSON.stringify(state))
    })
    await page.addInitScript(() => {
      const fixture = sessionStorage.getItem('test-legacy-fixture')
      if (fixture) localStorage.setItem('clear-reading-state-v1', fixture)
      sessionStorage.removeItem('test-legacy-fixture')
    })
    await page.reload()
    await page.getByRole('heading',{name:'Legacy passage'}).click()
    assert.equal(await first.locator('mark').textContent(),'river')
    await page.getByText('旧版笔记',{exact:true}).waitFor()
    await page.getByRole('button',{name:'显示全文翻译'}).click()
    await page.getByText('一条河流淌着。',{exact:true}).waitFor()
    assert.deepEqual(errors, [])
  },
)
