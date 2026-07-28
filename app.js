(() => {
  "use strict";

  const STORAGE_KEY = "clear-reading-state-v1";
  const ARTICLE_FONT_KEY = "clear-reading-font-size";
  const SIDEBAR_KEY = "clear-reading-sidebar-hidden";
  const INSPECTOR_KEY = "clear-reading-inspector-hidden";
  const PERSONAL_API_KEY_LOCAL = "clear-reading-personal-api-key";
  const PERSONAL_API_KEY_SESSION = "clear-reading-session-api-key";

  const SAMPLE_ARTICLE = `The Hidden Intelligence of Urban Trees

For many years, city trees were treated mainly as decorative objects. They were planted to make streets look pleasant, while their practical value received less attention. Recent research, however, suggests that trees form part of a complex urban system. They influence temperature, water movement, air quality and even the behaviour of people who live nearby.

One of their most important functions is cooling. Leaves intercept sunlight and release water vapour, reducing the temperature around them. This effect is especially valuable during heatwaves, when buildings and roads absorb heat during the day and release it slowly at night. A mature tree can therefore provide benefits that cannot be reproduced simply by placing a small plant beside a pavement.

The success of an urban tree depends on what happens below the ground as well as above it. Roots require water, oxygen and enough space to expand. In heavily built areas, soil is often compressed by construction work, while underground pipes limit the room available. A tree may appear healthy for several years before these hidden restrictions begin to affect its growth.

For this reason, some planners now view trees as long-term infrastructure rather than decoration. Selecting a species is only the beginning; cities must also protect the soil, manage rainwater and plan for decades of maintenance. The most effective programmes are those that consider the whole system instead of counting how many young trees have been planted.`;

  const PHRASE_DICTIONARY = {
    "water hyacinth": "水葫芦；凤眼莲",
    "as well as": "以及；除……之外还……",
    "for this reason": "因此；出于这个原因",
    "rather than": "而不是",
    "as a result": "因此；结果是",
    "in contrast": "相比之下",
    "according to": "根据",
    "play a role": "发挥作用",
    "take into account": "将……考虑在内",
    "a wide range of": "广泛的；各种各样的",
    "be likely to": "很可能……",
    "depend on": "取决于；依靠",
    "instead of": "而不是；代替",
    "part of": "……的一部分",
    "even though": "尽管；即使",
    "in terms of": "在……方面",
  };

  const WORD_DICTIONARY = {
    absorb: ["/əbˈzɔːb/", "v. 吸收；理解；使全神贯注"],
    affect: ["/əˈfekt/", "v. 影响；使发生变化"],
    attention: ["/əˈtenʃn/", "n. 注意；关注"],
    available: ["/əˈveɪləbl/", "adj. 可获得的；可利用的"],
    behaviour: ["/bɪˈheɪvjə/", "n. 行为；表现方式"],
    benefit: ["/ˈbenɪfɪt/", "n. 益处；v. 使受益"],
    complex: ["/ˈkɒmpleks/", "adj. 复杂的；n. 综合体"],
    compressed: ["/kəmˈprest/", "adj. 被压缩的；压实的"],
    consider: ["/kənˈsɪdə/", "v. 考虑；认为"],
    construction: ["/kənˈstrʌkʃn/", "n. 建造；建筑工程"],
    decorative: ["/ˈdekərətɪv/", "adj. 装饰性的"],
    depend: ["/dɪˈpend/", "v. 取决于；依靠"],
    effective: ["/ɪˈfektɪv/", "adj. 有效的；实际的"],
    especially: ["/ɪˈspeʃəli/", "adv. 尤其；特别"],
    expand: ["/ɪkˈspænd/", "v. 扩大；扩展"],
    function: ["/ˈfʌŋkʃn/", "n. 功能；v. 运转"],
    heavily: ["/ˈhevɪli/", "adv. 严重地；大量地"],
    hidden: ["/ˈhɪdn/", "adj. 隐藏的；不易察觉的"],
    influence: ["/ˈɪnfluəns/", "v./n. 影响"],
    infrastructure: ["/ˈɪnfrəstrʌktʃə/", "n. 基础设施"],
    intercept: ["/ˌɪntəˈsept/", "v. 拦截；阻止"],
    maintenance: ["/ˈmeɪntənəns/", "n. 维护；保养"],
    mature: ["/məˈtʃʊə/", "adj. 成熟的；充分发展的"],
    movement: ["/ˈmuːvmənt/", "n. 移动；运动；活动"],
    oxygen: ["/ˈɒksɪdʒən/", "n. 氧气"],
    practical: ["/ˈpræktɪkl/", "adj. 实际的；实用的"],
    programme: ["/ˈprəʊɡræm/", "n. 计划；项目；节目"],
    recent: ["/ˈriːsnt/", "adj. 最近的；近来的"],
    reducing: ["/rɪˈdjuːsɪŋ/", "v. 减少；降低（reduce 的现在分词）"],
    release: ["/rɪˈliːs/", "v. 释放；公布；n. 释放"],
    require: ["/rɪˈkwaɪə/", "v. 需要；要求"],
    research: ["/rɪˈsɜːtʃ/", "n./v. 研究；调查"],
    restriction: ["/rɪˈstrɪkʃn/", "n. 限制；约束"],
    select: ["/sɪˈlekt/", "v. 选择；挑选"],
    species: ["/ˈspiːʃiːz/", "n. 物种；种类（单复数同形）"],
    suggest: ["/səˈdʒest/", "v. 表明；建议；暗示"],
    system: ["/ˈsɪstəm/", "n. 系统；体系"],
    temperature: ["/ˈtemprətʃə/", "n. 温度；体温"],
    vapour: ["/ˈveɪpə/", "n. 蒸气"],
    valuable: ["/ˈvæljuəbl/", "adj. 有价值的；宝贵的"],
    water: ["/ˈwɔːtə/", "n. 水；v. 浇水"],
    whole: ["/həʊl/", "adj. 整个的；n. 整体"],
    hyacinth: ["/ˈhaɪəsɪnθ/", "n. 风信子"],
  };

  const VIEW_META = {
    reader: ["FOCUSED READING", "开始阅读"],
    library: ["YOUR LIBRARY", "文章库"],
    translator: ["AI TRANSLATOR", "独立翻译"],
    vocabulary: ["VOCABULARY", "生词本"],
    profile: ["MY LEARNING", "我的"],
  };

  const dom = {};
  const translationRequests = new Map();
  let state = loadState();
  let selected = null;
  let selectionVersion = 0;
  let pointerStart = null;
  let savedRange = null;
  let translator = null;
  let qwenConfigured = false;
  let qwenModel = "";
  let qwenAnalysisModel = "qwen3.5-flash";
  let pageSession = null;
  let lastTranslationSource = "dictionary";
  let translationVisible = false;
  let confirmHandler = null;
  let toastTimer = null;
  let reviewQueue = [];
  let reviewPosition = 0;
  let reviewSessionActive = false;
  let reviewRepeatIds = new Set();
  let personalApiKey = loadPersonalApiKey();
  let apiCredentialSource = "none";
  let currentView = "library";
  let readingSessionArticleId = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    bindEvents();
    applyFontSize(Number(localStorage.getItem(ARTICLE_FONT_KEY)) || 18);
    detectTranslatorSupport();
    renderAll();
    switchView("library");
  }

  function cacheDom() {
    [
      "viewEyebrow", "viewTitle", "translatorStatus", "newArticleButton", "sidebarToggle", "continueReadingButton", "continueReadingTitle",
      "translationFeatureLabel", "emptyState",
      "readerWorkspace", "emptyImportButton", "loadSampleButton", "articleWordCount",
      "articleReadingTime", "articleStructureStatus", "articleHeader", "articleTitle", "articleContent", "inspector", "inspectorScroll", "inspectorPlaceholder",
      "lookupPanel", "lookupType", "lookupText", "lookupPhonetic", "contextChip", "translationResult",
      "translateSelectionButton", "saveWordButton", "selectionNote", "saveNoteButton", "speakButton",
      "explainContextButton", "analyzeSentenceButton", "aiInsightResult",
      "articleNoteList", "noteCount", "toggleTranslationButton", "toggleInspectorButton", "inspectorClose",
      "fontDecrease", "fontIncrease", "fontSizeValue",
      "deleteArticleButton", "libraryGrid", "libraryCount", "vocabularyList", "vocabularyCount", "statGrid",
      "standaloneTranslateForm", "standaloneTranslateInput", "standaloneTranslateButton", "clearStandaloneTranslate", "standaloneTranslationResult",
      "reviewOverview", "dueVocabularyCount", "masteredVocabularyCount", "startReviewButton", "reviewPanel", "reviewProgress",
      "closeReviewButton", "reviewCard", "reviewWord", "reviewPhonetic", "reviewContext", "reviewAnswer", "reviewMeaning",
      "revealReviewAnswer", "reviewRating",
      "apiSettingsButton", "apiDialog", "apiForm", "closeApiButton", "personalApiKeyInput", "rememberApiKey", "apiSettingsStatus", "clearApiKeyButton", "saveApiKeyButton",
      "clearAllDataButton", "selectionToolbar", "importDialog", "importForm", "titleInput",
      "articleInput", "aiStructureToggle", "importPrivacyHint", "createArticleButton", "closeImportButton", "confirmOverlay", "confirmTitle", "confirmMessage", "confirmCancel",
      "confirmAccept", "toast"
    ].forEach((id) => { dom[id] = document.getElementById(id); });
  }

  function bindEvents() {
    document.querySelectorAll("[data-view-target]").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.viewTarget));
    });
    document.querySelectorAll("[data-open-import]").forEach((button) => button.addEventListener("click", openImport));
    dom.newArticleButton.addEventListener("click", openImport);
    dom.continueReadingButton.addEventListener("click", continueReading);
    dom.standaloneTranslateForm.addEventListener("submit", handleStandaloneTranslate);
    dom.clearStandaloneTranslate.addEventListener("click", clearStandaloneTranslation);
    dom.standaloneTranslateInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        dom.standaloneTranslateForm.requestSubmit();
      }
    });
    document.querySelectorAll("[data-translation-example]").forEach((button) => {
      button.addEventListener("click", () => {
        dom.standaloneTranslateInput.value = button.dataset.translationExample || "";
        dom.standaloneTranslateInput.focus();
      });
    });
    dom.apiSettingsButton.addEventListener("click", openApiSettings);
    dom.apiForm.addEventListener("submit", handleApiSettingsSubmit);
    dom.closeApiButton.addEventListener("click", () => dom.apiDialog.close());
    dom.clearApiKeyButton.addEventListener("click", clearPersonalApiKey);
    dom.sidebarToggle.addEventListener("click", toggleSidebar);
    dom.emptyImportButton.addEventListener("click", openImport);
    dom.loadSampleButton.addEventListener("click", loadSample);
    dom.importForm.addEventListener("submit", handleImport);
    dom.closeImportButton.addEventListener("click", () => dom.importDialog.close());
    dom.aiStructureToggle.addEventListener("change", updateImportPrivacyHint);
    dom.articleContent.addEventListener("pointerdown", handleArticlePointerDown);
    dom.articleContent.addEventListener("pointerup", handleArticlePointerUp);
    dom.articleContent.addEventListener("click", handleWordClick);
    dom.articleContent.addEventListener("dblclick", handleWordDoubleClick);
    dom.articleContent.addEventListener("keyup", () => setTimeout(handleTextSelection, 0));
    document.addEventListener("mousedown", hideToolbarWhenOutside);
    dom.selectionToolbar.addEventListener("mousedown", (event) => event.preventDefault());
    dom.selectionToolbar.addEventListener("click", handleToolbarAction);
    dom.translateSelectionButton.addEventListener("click", translateCurrentSelection);
    dom.saveWordButton.addEventListener("click", saveCurrentVocabulary);
    dom.saveNoteButton.addEventListener("click", saveCurrentNote);
    dom.speakButton.addEventListener("click", speakSelection);
    dom.explainContextButton.addEventListener("click", explainCurrentWord);
    dom.analyzeSentenceButton.addEventListener("click", analyzeCurrentSentence);
    dom.toggleTranslationButton.addEventListener("click", toggleFullTranslation);
    dom.toggleInspectorButton.addEventListener("click", toggleInspector);
    dom.inspectorClose.addEventListener("click", closeInspector);
    dom.fontDecrease.addEventListener("click", () => changeFontSize(-1));
    dom.fontIncrease.addEventListener("click", () => changeFontSize(1));
    dom.startReviewButton.addEventListener("click", startVocabularyReview);
    dom.revealReviewAnswer.addEventListener("click", revealReviewAnswer);
    dom.reviewRating.addEventListener("click", handleReviewRating);
    dom.closeReviewButton.addEventListener("click", () => finishVocabularyReview(false));
    dom.deleteArticleButton.addEventListener("click", requestDeleteCurrentArticle);
    dom.clearAllDataButton.addEventListener("click", requestClearAll);
    dom.confirmCancel.addEventListener("click", closeConfirm);
    dom.confirmAccept.addEventListener("click", () => { if (confirmHandler) confirmHandler(); closeConfirm(); });
    window.addEventListener("resize", () => dom.selectionToolbar.classList.add("is-hidden"));
    window.addEventListener("beforeunload", () => { if (currentView === "reader") saveReadingPosition(); });
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && Array.isArray(stored.articles)) {
        stored.vocabulary = Array.isArray(stored.vocabulary)
          ? stored.vocabulary.map((item) => ({ ...item, review: normalizeReviewState(item.review, item.createdAt) }))
          : [];
        return stored;
      }
    } catch (_) {}
    return { articles: [], currentArticleId: null, vocabulary: [], createdAt: new Date().toISOString() };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderAll() {
    ensureCurrentArticle();
    applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "true");
    applyInspectorState(localStorage.getItem(INSPECTOR_KEY) === "true");
    dom.newArticleButton.classList.toggle("is-hidden", state.articles.length === 0);
    dom.emptyImportButton.textContent = state.articles.length ? "导入文章" : "导入第一篇文章";
    renderReader();
    renderLibrary();
    renderVocabulary();
    renderProfile();
  }

  function toggleSidebar() {
    const hidden = !document.querySelector(".app-shell").classList.contains("is-sidebar-hidden");
    localStorage.setItem(SIDEBAR_KEY, String(hidden));
    applySidebarState(hidden);
  }

  function applySidebarState(hidden) {
    document.querySelector(".app-shell").classList.toggle("is-sidebar-hidden", hidden);
    const label = hidden ? "显示侧边栏" : "隐藏侧边栏";
    dom.sidebarToggle.setAttribute("aria-label", label);
    dom.sidebarToggle.title = label;
  }

  function toggleInspector() {
    const hidden = !dom.readerWorkspace.classList.contains("is-inspector-hidden");
    if (hidden) resetInspector();
    setInspectorHidden(hidden);
  }

  function closeInspector() {
    resetInspector();
    window.getSelection()?.removeAllRanges();
    setInspectorHidden(true);
  }

  function setInspectorHidden(hidden) {
    localStorage.setItem(INSPECTOR_KEY, String(hidden));
    applyInspectorState(hidden);
  }

  function applyInspectorState(hidden) {
    dom.readerWorkspace.classList.toggle("is-inspector-hidden", hidden);
    dom.toggleInspectorButton.textContent = hidden ? "打开精读栏" : "隐藏精读栏";
    dom.toggleInspectorButton.setAttribute("aria-expanded", String(!hidden));
    dom.inspector.setAttribute("aria-hidden", String(hidden));
  }

  function currentArticle() {
    return state.articles.find((article) => article.id === state.currentArticleId) || null;
  }

  function ensureCurrentArticle() {
    if (!state.articles.length) {
      if (state.currentArticleId !== null) {
        state.currentArticleId = null;
        saveState();
      }
      return;
    }
    if (state.articles.some((article) => article.id === state.currentArticleId)) return;
    const mostRecent = [...state.articles].sort((a, b) => new Date(b.lastReadAt || b.createdAt || 0) - new Date(a.lastReadAt || a.createdAt || 0))[0];
    state.currentArticleId = mostRecent.id;
    saveState();
  }

  function switchView(viewName) {
    if (viewName === "reader" && !currentArticle()) viewName = "library";
    if (currentView === "reader" && viewName !== "reader") saveReadingPosition();
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === viewName));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.viewTarget === viewName));
    const [eyebrow, title] = VIEW_META[viewName] || VIEW_META.reader;
    dom.viewEyebrow.textContent = eyebrow;
    dom.viewTitle.textContent = viewName === "reader" && currentArticle() ? "专注阅读" : title;
    dom.selectionToolbar.classList.add("is-hidden");
    currentView = viewName;
    if (viewName === "reader") {
      readingSessionArticleId = currentArticle()?.id || null;
      restoreReadingPosition();
    }
    updateContinueReadingButton();
    if (viewName === "library") renderLibrary();
    if (viewName === "translator") setTimeout(() => dom.standaloneTranslateInput.focus(), 80);
    if (viewName === "vocabulary") renderVocabulary();
    if (viewName === "profile") renderProfile();
  }

  function continueReading() {
    const article = state.articles.find((item) => item.id === readingSessionArticleId);
    if (!article) {
      readingSessionArticleId = null;
      updateContinueReadingButton();
      return;
    }
    state.currentArticleId = article.id;
    selected = null;
    saveState();
    renderReader();
    switchView("reader");
  }

  function updateContinueReadingButton() {
    const article = state.articles.find((item) => item.id === readingSessionArticleId);
    const visible = Boolean(article && currentView !== "reader");
    dom.continueReadingButton.classList.toggle("is-hidden", !visible);
    if (!article) {
      dom.continueReadingTitle.textContent = "";
      dom.continueReadingButton.removeAttribute("title");
      return;
    }
    const title = article.title || "未命名文章";
    dom.continueReadingTitle.textContent = title;
    dom.continueReadingButton.title = `继续阅读《${title}》`;
    dom.continueReadingButton.setAttribute("aria-label", `继续阅读《${title}》`);
  }

  function saveReadingPosition() {
    const article = currentArticle();
    if (!article || currentView !== "reader" || dom.readerWorkspace.classList.contains("is-hidden")) return;
    const paragraphs = [...dom.articleContent.querySelectorAll(".article-paragraph[data-paragraph-index]")];
    if (!paragraphs.length) return;
    const topbarBottom = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 102;
    const anchorLine = topbarBottom + 14;
    const contentTop = dom.articleContent.getBoundingClientRect().top;
    if (window.scrollY < 80 || contentTop > anchorLine + 80) {
      article.readingPosition = { atStart: true, paragraphIndex: 0, offset: 0, savedAt: new Date().toISOString() };
      saveState();
      return;
    }
    const anchor = paragraphs.find((paragraph) => paragraph.getBoundingClientRect().bottom >= anchorLine) || paragraphs[paragraphs.length - 1];
    article.readingPosition = {
      atStart: false,
      paragraphIndex: Number(anchor.dataset.paragraphIndex) || 0,
      offset: Math.round(anchor.getBoundingClientRect().top - anchorLine),
      savedAt: new Date().toISOString(),
    };
    saveState();
  }

  function restoreReadingPosition() {
    const article = currentArticle();
    if (!article) return;
    const position = article.readingPosition;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!position || position.atStart) {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      const paragraph = dom.articleContent.querySelector(`[data-paragraph-index="${position.paragraphIndex}"]`);
      if (!paragraph) return;
      const topbarBottom = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 102;
      const currentOffset = paragraph.getBoundingClientRect().top - (topbarBottom + 14);
      window.scrollTo({ top: Math.max(0, window.scrollY + currentOffset - Number(position.offset || 0)), behavior: "auto" });
    }));
  }

  function openImport() {
    dom.titleInput.value = "";
    dom.articleInput.value = "";
    dom.aiStructureToggle.disabled = !qwenConfigured;
    dom.aiStructureToggle.checked = qwenConfigured;
    updateImportPrivacyHint();
    dom.importDialog.showModal();
    setTimeout(() => dom.articleInput.focus(), 50);
  }

  function updateImportPrivacyHint() {
    if (!dom.importPrivacyHint) return;
    dom.importPrivacyHint.textContent = dom.aiStructureToggle.checked && !dom.aiStructureToggle.disabled
      ? "启用 AI 整理时，本篇文章将发送给千问"
      : "本地规则整理，文章不会因导入而发送";
  }

  async function handleImport(event) {
    const submitter = event.submitter;
    if (!submitter || submitter.value === "cancel") return;
    event.preventDefault();
    const raw = dom.articleInput.value.trim();
    if (!raw) { showToast("请先粘贴文章内容"); return; }
    if (currentView === "reader") saveReadingPosition();
    const manualTitle = dom.titleInput.value.trim();
    let parsed;
    let aiStructured = false;
    if (dom.aiStructureToggle.checked && qwenConfigured) {
      dom.createArticleButton.disabled = true;
      dom.createArticleButton.textContent = "AI 正在识别结构…";
      try {
        parsed = await requestArticleStructure(raw, manualTitle);
        aiStructured = true;
      } catch (error) {
        parsed = parseArticle(raw, manualTitle);
        showToast(`${error.message || "AI 整理失败"} 已使用本地排版。`);
      } finally {
        dom.createArticleButton.disabled = false;
        dom.createArticleButton.textContent = "整理并开始阅读";
      }
    } else {
      parsed = parseArticle(raw, manualTitle);
    }
    const article = {
      id: crypto.randomUUID ? crypto.randomUUID() : `article-${Date.now()}`,
      title: parsed.title,
      hasTitle: Boolean(parsed.title),
      paragraphs: parsed.paragraphs,
      sectionHeadings: parsed.sectionHeadings || [],
      structureSource: aiStructured ? "qwen" : "local",
      structureModel: aiStructured ? qwenAnalysisModel : "",
      raw,
      translations: {},
      highlights: [],
      notes: [],
      aiExplanations: {},
      sentenceAnalyses: {},
      createdAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
    };
    state.articles.unshift(article);
    state.currentArticleId = article.id;
    saveState();
    dom.importDialog.close();
    translationVisible = false;
    selected = null;
    renderAll();
    switchView("reader");
    showToast(aiStructured ? "AI 已识别标题与正文结构" : "文章已使用本地规则整理");
  }

  async function requestArticleStructure(text, manualTitle) {
    const response = await apiFetch("/api/analyze-article", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ text, manualTitle }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "AI 结构整理暂时不可用。");
    const paragraphs = [];
    const sectionHeadings = [];
    for (const block of result.blocks || []) {
      if (block.type === "heading") sectionHeadings.push({ text: block.text, beforeParagraphIndex: paragraphs.length });
      else if (block.text) paragraphs.push(block.text);
    }
    if (!paragraphs.length) throw new Error("AI 没有识别出正文。");
    return { title: result.title || manualTitle || "", paragraphs, sectionHeadings };
  }

  function parseArticle(raw, manualTitle = "") {
    const normalizedRaw = raw.replace(/\r\n?/g, "\n").trim();
    const nonEmptyLines = normalizedRaw.split("\n").map((line) => line.trim()).filter(Boolean);
    let title = manualTitle;
    let bodyRaw = normalizedRaw;
    if (!title && nonEmptyLines.length > 1 && looksLikeTitle(nonEmptyLines[0])) {
      title = nonEmptyLines[0];
      const firstLineEnd = normalizedRaw.indexOf("\n");
      bodyRaw = normalizedRaw.slice(firstLineEnd + 1).trim();
    }
    if (!title) title = "";
    const blocks = bodyRaw.split(/\n\s*\n+/).map((part) => part.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    const paragraphs = blocks.length ? blocks : [raw.replace(/\s+/g, " ").trim()];
    return { title, paragraphs };
  }

  function looksLikeTitle(text) {
    const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
    if (!words.length || words.length > 16 || text.length > 120) return false;
    if (/[.!?;:]$/.test(text)) return false;
    const titleCaseCount = words.filter((word) => /^[A-Z]/.test(word)).length;
    return titleCaseCount / words.length >= 0.45 || text === text.toUpperCase();
  }

  function loadSample() {
    if (currentView === "reader") saveReadingPosition();
    const parsed = parseArticle(SAMPLE_ARTICLE);
    const existing = state.articles.find((article) => article.raw === SAMPLE_ARTICLE);
    if (existing) {
      state.currentArticleId = existing.id;
    } else {
      const article = {
        id: crypto.randomUUID ? crypto.randomUUID() : `article-${Date.now()}`,
        title: parsed.title,
        hasTitle: true,
        paragraphs: parsed.paragraphs,
        raw: SAMPLE_ARTICLE,
        translations: {},
        highlights: [],
        notes: [],
        createdAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
      };
      state.articles.unshift(article);
      state.currentArticleId = article.id;
    }
    selected = null;
    saveState();
    renderAll();
    switchView("reader");
    showToast("示例文章已载入，可以点击单词试试");
  }

  function renderReader() {
    const article = currentArticle();
    dom.emptyState.classList.toggle("is-hidden", Boolean(article));
    dom.readerWorkspace.classList.toggle("is-hidden", !article);
    if (!article) {
      resetInspector();
      return;
    }
    if (!selected || selected.articleId !== article.id) resetInspector();
    article.lastReadAt = new Date().toISOString();
    saveState();
    dom.articleHeader.classList.toggle("is-hidden", !article.hasTitle);
    dom.articleTitle.textContent = article.title;
    const wordCount = countWords(article.paragraphs.join(" "));
    dom.articleWordCount.textContent = `${wordCount} words`;
    dom.articleReadingTime.textContent = `${Math.max(1, Math.ceil(wordCount / 180))} min`;
    dom.articleStructureStatus.classList.toggle("is-hidden", article.structureSource !== "qwen");
    dom.articleStructureStatus.title = article.structureSource === "qwen" ? `由 ${article.structureModel || qwenAnalysisModel} 识别结构` : "";
    dom.toggleTranslationButton.textContent = translationVisible ? "隐藏全文翻译" : "显示全文翻译";
    renderParagraphs(article);
    renderArticleNotes(article);
  }

  function renderParagraphs(article) {
    dom.articleContent.replaceChildren();
    article.paragraphs.forEach((paragraph, index) => {
      (article.sectionHeadings || []).filter((heading) => heading.beforeParagraphIndex === index).forEach((heading) => {
        const sectionHeading = document.createElement("h3");
        sectionHeading.className = "article-section-heading";
        sectionHeading.textContent = heading.text;
        dom.articleContent.appendChild(sectionHeading);
      });
      const block = document.createElement("section");
      block.className = "paragraph-block";
      const p = document.createElement("p");
      p.className = "article-paragraph";
      p.dataset.paragraphIndex = String(index);
      appendAnnotatedText(p, paragraph, article.highlights.filter((item) => item.paragraphIndex === index));
      block.appendChild(p);
      if (translationVisible) {
        const translation = document.createElement("div");
        translation.className = "paragraph-translation";
        translation.dataset.translationIndex = String(index);
        translation.textContent = article.translations[index] || "尚未翻译";
        block.appendChild(translation);
      }
      dom.articleContent.appendChild(block);
    });
  }

  function appendAnnotatedText(container, text, highlights) {
    const valid = [...highlights].sort((a, b) => a.start - b.start).filter((item, index, all) => item.start >= 0 && item.end <= text.length && item.end > item.start && (!index || item.start >= all[index - 1].end));
    let cursor = 0;
    valid.forEach((item) => {
      appendTokenized(container, text.slice(cursor, item.start));
      const mark = document.createElement("mark");
      mark.className = `annotation annotation-${item.color}`;
      mark.dataset.highlightId = item.id;
      appendTokenized(mark, text.slice(item.start, item.end));
      container.appendChild(mark);
      cursor = item.end;
    });
    appendTokenized(container, text.slice(cursor));
  }

  function appendTokenized(container, text) {
    const regex = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;
    let lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      if (match.index > lastIndex) container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      const span = document.createElement("span");
      span.className = "word-token";
      span.dataset.word = match[0];
      span.textContent = match[0];
      container.appendChild(span);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) container.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  function handleArticlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    selectionVersion += 1;
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      word: event.target.closest(".word-token"),
    };
    if (!event.shiftKey) window.getSelection()?.removeAllRanges();
    dom.selectionToolbar.classList.add("is-hidden");
  }

  function handleArticlePointerUp(event) {
    const start = pointerStart;
    pointerStart = null;
    if (!start) return;
    const endX = event.clientX;
    const endY = event.clientY;
    const wasDrag = Math.hypot(endX - start.x, endY - start.y) > 8;
    if (wasDrag) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim()) handleTextSelection();
      }, 0);
    }
  }

  function handleWordClick(event) {
    const word = event.target.closest(".word-token");
    if (!word) return;
    const activeSelection = window.getSelection()?.toString().trim() || "";
    if (activeSelection && event.detail === 1 && normalize(activeSelection) !== normalize(word.textContent)) return;
    event.preventDefault();
    activateWord(word);
  }

  function handleWordDoubleClick(event) {
    const word = event.target.closest(".word-token");
    if (!word) return;
    event.preventDefault();
    activateWord(word);
  }

  function activateWord(word) {
    window.getSelection()?.removeAllRanges();
    dom.articleContent.querySelectorAll(".word-token.is-selected").forEach((token) => token.classList.remove("is-selected"));
    word.classList.add("is-selected");
    const paragraph = word.closest(".article-paragraph");
    if (!paragraph) return;
    const paragraphIndex = Number(paragraph.dataset.paragraphIndex);
    const text = word.dataset.word;
    const offsets = elementOffsets(paragraph, word);
    selected = {
      articleId: currentArticle().id,
      text,
      paragraphIndex,
      start: offsets.start,
      end: offsets.end,
      context: getSentenceContext(currentArticle().paragraphs[paragraphIndex], offsets.start, offsets.end),
      kind: "word",
    };
    selectionVersion += 1;
    savedRange = null;
    showLookup();
    dom.selectionToolbar.classList.add("is-hidden");
    translateCurrentSelection({ automatic: true });
  }

  function elementOffsets(paragraph, element) {
    const before = document.createRange();
    before.selectNodeContents(paragraph);
    before.setEndBefore(element);
    const start = before.toString().length;
    return { start, end: start + element.textContent.length };
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const rawSelection = selection?.toString() || "";
    const text = rawSelection.trim();
    if (!selection || selection.isCollapsed || !text) { dom.selectionToolbar.classList.add("is-hidden"); return; }
    const range = selection.getRangeAt(0);
    if (!dom.articleContent.contains(range.commonAncestorContainer)) return;
    const data = selectionOffsets(range);
    if (!data) {
      showToast("当前版本请在同一段落内选择文本");
      dom.selectionToolbar.classList.add("is-hidden");
      return;
    }
    dom.articleContent.querySelectorAll(".word-token.is-selected").forEach((token) => token.classList.remove("is-selected"));
    const leadingSpace = rawSelection.length - rawSelection.trimStart().length;
    const trailingSpace = rawSelection.length - rawSelection.trimEnd().length;
    data.start += leadingSpace;
    data.end -= trailingSpace;
    data.context = getSentenceContext(currentArticle().paragraphs[data.paragraphIndex], data.start, data.end);
    selected = { ...data, articleId: currentArticle().id, text, kind: countWords(text) === 1 ? "word" : "selection" };
    selectionVersion += 1;
    savedRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    dom.selectionToolbar.style.left = `${Math.min(window.innerWidth - 100, Math.max(100, rect.left + rect.width / 2))}px`;
    dom.selectionToolbar.style.top = `${Math.max(60, rect.top)}px`;
    dom.selectionToolbar.classList.remove("is-hidden");
    showLookup({ reveal: false });
    translateCurrentSelection({ automatic: true });
  }

  function selectionOffsets(range) {
    const startParagraph = closestParagraph(range.startContainer);
    const endParagraph = closestParagraph(range.endContainer);
    if (!startParagraph || startParagraph !== endParagraph) return null;
    const prefix = document.createRange();
    prefix.selectNodeContents(startParagraph);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = prefix.toString().length;
    const selectedLength = range.toString().length;
    const paragraphIndex = Number(startParagraph.dataset.paragraphIndex);
    return {
      paragraphIndex,
      start,
      end: start + selectedLength,
      context: getSentenceContext(currentArticle().paragraphs[paragraphIndex], start, start + selectedLength),
    };
  }

  function closestParagraph(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return element?.closest(".article-paragraph") || null;
  }

  function getSentenceContext(paragraph, start, end) {
    const left = Math.max(paragraph.lastIndexOf(".", Math.max(0, start - 2)), paragraph.lastIndexOf("?", Math.max(0, start - 2)), paragraph.lastIndexOf("!", Math.max(0, start - 2)));
    const candidates = [paragraph.indexOf(".", end), paragraph.indexOf("?", end), paragraph.indexOf("!", end)].filter((value) => value >= 0);
    const right = candidates.length ? Math.min(...candidates) + 1 : paragraph.length;
    return paragraph.slice(left + 1, right).trim();
  }

  function showLookup({ reveal = true } = {}) {
    if (!selected) return;
    if (reveal) setInspectorHidden(false);
    dom.inspectorScroll.scrollTop = 0;
    dom.inspectorPlaceholder.classList.add("is-hidden");
    dom.lookupPanel.classList.remove("is-hidden");
    dom.lookupType.textContent = selected.kind === "word" ? "WORD" : countWords(selected.text) <= 5 ? "PHRASE" : "SENTENCE";
    dom.lookupText.textContent = selected.text;
    const selectedWordCount = countWords(selected.text);
    dom.lookupText.classList.toggle("is-long", selected.text.length > 55 || selectedWordCount > 7);
    dom.lookupText.classList.toggle("is-very-long", selected.text.length > 180 || selectedWordCount > 25);
    const dictionaryEntry = getDictionaryEntry(selected.text);
    dom.lookupPhonetic.textContent = dictionaryEntry?.phonetic || "";
    dom.contextChip.textContent = selected.context || "";
    dom.contextChip.classList.toggle("is-hidden", !selected.context || selected.context === selected.text);
    dom.selectionNote.value = "";
    dom.explainContextButton.classList.toggle("is-hidden", selectedWordCount !== 1);
    dom.analyzeSentenceButton.classList.toggle("is-hidden", selectedWordCount < 6);
    dom.explainContextButton.disabled = !qwenConfigured;
    dom.analyzeSentenceButton.disabled = !qwenConfigured;
    dom.translateSelectionButton.disabled = false;
    dom.translateSelectionButton.textContent = qwenConfigured ? "AI 翻译" : "翻译";
    dom.aiInsightResult.classList.add("is-hidden");
    dom.aiInsightResult.replaceChildren();
    const cachedTranslation = currentArticle()?.selectionTranslations?.[selectionCacheKey(selected)];
    if (cachedTranslation) {
      selected.translation = cachedTranslation.translation;
      renderSelectionTranslation(cachedTranslation.translation, cachedTranslation.model || qwenModel, "qwen");
    } else if (qwenConfigured) {
      dom.translationResult.innerHTML = `<p class="translation-loading">正在根据当前语境调用千问翻译…</p>`;
      selected.translation = "";
    } else if (dictionaryEntry) {
      dom.translationResult.innerHTML = `<strong>本地词典</strong><p>${escapeHtml(dictionaryEntry.meaning)}</p>`;
      selected.translation = dictionaryEntry.meaning;
    } else {
      dom.translationResult.innerHTML = `<p class="muted">本地词典暂未收录。点击“翻译”调用浏览器内置英中翻译。</p>`;
      selected.translation = "";
    }
    dom.saveWordButton.textContent = state.vocabulary.some((item) => normalize(item.text) === normalize(selected.text)) ? "已在生词本" : "加入生词本";
    renderCachedAiInsight();
  }

  function resetInspector() {
    selectionVersion += 1;
    selected = null;
    savedRange = null;
    dom.articleContent?.querySelectorAll(".word-token.is-selected").forEach((token) => token.classList.remove("is-selected"));
    dom.selectionToolbar?.classList.add("is-hidden");
    dom.inspectorPlaceholder?.classList.remove("is-hidden");
    dom.lookupPanel?.classList.add("is-hidden");
    dom.aiInsightResult?.classList.add("is-hidden");
    dom.aiInsightResult?.replaceChildren();
    if (dom.selectionNote) dom.selectionNote.value = "";
  }

  function getDictionaryEntry(text) {
    const key = normalize(text);
    if (PHRASE_DICTIONARY[key]) return { meaning: PHRASE_DICTIONARY[key], phonetic: "固定搭配" };
    if (WORD_DICTIONARY[key]) return { phonetic: WORD_DICTIONARY[key][0], meaning: WORD_DICTIONARY[key][1] };
    const lemma = simpleLemma(key);
    if (WORD_DICTIONARY[lemma]) return { phonetic: WORD_DICTIONARY[lemma][0], meaning: WORD_DICTIONARY[lemma][1] };
    return null;
  }

  function simpleLemma(word) {
    if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
    if (word.endsWith("ing") && word.length > 5) {
      const stem = word.slice(0, -3);
      if (WORD_DICTIONARY[stem]) return stem;
      if (WORD_DICTIONARY[`${stem}e`]) return `${stem}e`;
    }
    if (word.endsWith("ed") && word.length > 4) {
      const stem = word.slice(0, -2);
      if (WORD_DICTIONARY[stem]) return stem;
      if (WORD_DICTIONARY[`${stem}e`]) return `${stem}e`;
    }
    if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
    return word;
  }

  function handleToolbarAction(event) {
    const colorButton = event.target.closest("[data-highlight-color]");
    const actionButton = event.target.closest("[data-selection-action]");
    if (colorButton) addHighlight(colorButton.dataset.highlightColor);
    if (actionButton?.dataset.selectionAction === "translate") translateCurrentSelection();
    if (actionButton?.dataset.selectionAction === "note") { showLookup(); dom.selectionNote.focus(); }
    dom.selectionToolbar.classList.add("is-hidden");
    window.getSelection()?.removeAllRanges();
  }

  function addHighlight(color) {
    const article = currentArticle();
    if (!article || !selected) return;
    const overlaps = article.highlights.some((item) => item.paragraphIndex === selected.paragraphIndex && selected.start < item.end && selected.end > item.start);
    if (overlaps) { showToast("这段文字已有高亮，请先选择其他内容"); return; }
    article.highlights.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `highlight-${Date.now()}`,
      paragraphIndex: selected.paragraphIndex,
      start: selected.start,
      end: selected.end,
      text: selected.text,
      color,
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderParagraphs(article);
    showToast("已添加高亮");
  }

  function loadPersonalApiKey() {
    try {
      return normalizePersonalApiKey(sessionStorage.getItem(PERSONAL_API_KEY_SESSION) || localStorage.getItem(PERSONAL_API_KEY_LOCAL) || "");
    } catch (_) {
      return "";
    }
  }

  function normalizePersonalApiKey(value) {
    return String(value || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
  }

  function isLikelyQwenApiKey(value) {
    return value.length >= 12
      && value.length <= 512
      && /^sk-[\x21-\x7E]+$/.test(value)
      && !value.includes("*");
  }

  function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (personalApiKey) headers.set("X-Clear-Reading-API-Key", personalApiKey);
    return fetch(url, { ...options, headers });
  }

  function openApiSettings() {
    dom.personalApiKeyInput.value = personalApiKey;
    dom.rememberApiKey.checked = Boolean(localStorage.getItem(PERSONAL_API_KEY_LOCAL));
    dom.apiSettingsStatus.textContent = personalApiKey
      ? "个人 Key 已在本设备就绪。首次使用 AI 时由千问验证。"
      : apiCredentialSource === "server"
      ? "当前正在使用本机服务配置的 Key。朋友部署时可以连接各自的 Key。"
      : "尚未连接个人 Key。";
    dom.clearApiKeyButton.disabled = !personalApiKey;
    dom.apiDialog.showModal();
    setTimeout(() => dom.personalApiKeyInput.focus(), 50);
  }

  async function handleApiSettingsSubmit(event) {
    const submitter = event.submitter;
    if (!submitter || submitter.value === "cancel") return;
    event.preventDefault();
    const apiKey = normalizePersonalApiKey(dom.personalApiKeyInput.value);
    const isLocalAddress = location.hostname === "127.0.0.1" || location.hostname === "localhost";
    if (!isLocalAddress && location.protocol !== "https:") {
      dom.apiSettingsStatus.textContent = "为避免 Key 在网络中泄露，请先使用 HTTPS 再连接。";
      return;
    }
    if (!isLikelyQwenApiKey(apiKey)) {
      dom.apiSettingsStatus.textContent = "无法识别该 Key。请粘贴以 sk- 开头的完整明文 Key，不要使用包含 **** 的遮罩内容。";
      return;
    }
    try {
      if (dom.rememberApiKey.checked) {
        localStorage.setItem(PERSONAL_API_KEY_LOCAL, apiKey);
        sessionStorage.removeItem(PERSONAL_API_KEY_SESSION);
      } else {
        sessionStorage.setItem(PERSONAL_API_KEY_SESSION, apiKey);
        localStorage.removeItem(PERSONAL_API_KEY_LOCAL);
      }
      personalApiKey = apiKey;
      dom.apiDialog.close();
      await detectTranslatorSupport();
      showToast(dom.rememberApiKey.checked ? "个人 API 已连接并保存在本设备" : "个人 API 已连接，本次关闭网页后清除");
    } catch (_) {
      dom.apiSettingsStatus.textContent = "浏览器无法保存 Key，请检查隐私模式或存储权限。";
    }
  }

  async function clearPersonalApiKey() {
    try {
      localStorage.removeItem(PERSONAL_API_KEY_LOCAL);
      sessionStorage.removeItem(PERSONAL_API_KEY_SESSION);
    } catch (_) {}
    personalApiKey = "";
    dom.personalApiKeyInput.value = "";
    dom.apiDialog.close();
    await detectTranslatorSupport();
    showToast(apiCredentialSource === "server" ? "个人 Key 已移除，已恢复本机 API" : "个人 Key 已从本设备移除");
  }

  async function detectTranslatorSupport() {
    try {
      const response = await apiFetch("/api/status", { headers: { Accept: "application/json" } });
      if (response.ok) {
        const status = await response.json();
        qwenConfigured = Boolean(status.configured);
        apiCredentialSource = status.credentialSource || "none";
        qwenModel = status.model || "qwen-mt-lite";
        qwenAnalysisModel = status.analysisModel || "qwen3.5-flash";
        if (status.autoStop) startPageSession();
        if (qwenConfigured) {
          const personal = apiCredentialSource === "personal";
          setTranslatorStatus(`${personal ? "个人千问" : "千问翻译"}已连接 · ${qwenModel}`, "ready");
          dom.apiSettingsButton.textContent = personal ? "个人 API" : "本机 API";
          dom.translationFeatureLabel.textContent = "千问语境翻译";
          return;
        }
      }
    } catch (_) {}

    qwenConfigured = false;
    apiCredentialSource = "none";
    dom.apiSettingsButton.textContent = "连接 API";
    dom.translationFeatureLabel.textContent = "浏览器内翻译";
    if (!("Translator" in self)) {
      setTranslatorStatus("当前浏览器无本地翻译，词典仍可用", "warning");
      return;
    }
    try {
      const availability = await self.Translator.availability({ sourceLanguage: "en", targetLanguage: "zh" });
      if (availability === "available") setTranslatorStatus("本地翻译已就绪", "ready");
      else if (availability === "downloadable" || availability === "downloading") setTranslatorStatus("英中语言包可下载", "warning");
      else setTranslatorStatus("当前设备不支持英中本地翻译", "warning");
    } catch (_) {
      setTranslatorStatus("本地词典模式", "warning");
    }
  }

  function startPageSession() {
    if (pageSession || !("EventSource" in window)) return;
    pageSession = new EventSource("/api/session");
  }

  function setTranslatorStatus(message, type) {
    dom.translatorStatus.classList.toggle("is-warning", type === "warning");
    dom.translatorStatus.classList.toggle("is-working", type === "working");
    dom.translatorStatus.querySelector("span:last-child").textContent = message;
  }

  async function ensureTranslator() {
    if (translator) return translator;
    if (!("Translator" in self)) throw new Error("UNSUPPORTED");
    setTranslatorStatus("正在准备本地英中语言包…", "working");
    translator = await self.Translator.create({
      sourceLanguage: "en",
      targetLanguage: "zh",
      monitor(monitor) {
        monitor.addEventListener("downloadprogress", (event) => {
          setTranslatorStatus(`正在下载语言包 ${Math.round(event.loaded * 100)}%`, "working");
        });
      },
    });
    setTranslatorStatus("本地翻译已就绪", "ready");
    return translator;
  }

  async function handleStandaloneTranslate(event) {
    event.preventDefault();
    const text = dom.standaloneTranslateInput.value.trim();
    if (!text) {
      showToast("请先输入一个英文单词、词组或句子");
      dom.standaloneTranslateInput.focus();
      return;
    }
    if (!qwenConfigured) {
      renderStandaloneTranslationError("独立翻译需要连接千问 API。请先在右上角连接自己的 Key。");
      openApiSettings();
      return;
    }

    dom.standaloneTranslateButton.disabled = true;
    dom.standaloneTranslateButton.textContent = "AI 正在查询…";
    dom.standaloneTranslationResult.classList.remove("is-empty", "has-error");
    dom.standaloneTranslationResult.innerHTML = `
      <div class="standalone-loading">
        <span class="status-dot"></span>
        <div><strong>正在理解输入内容</strong><p>千问会自动判断这是单词还是句子。</p></div>
      </div>`;

    try {
      const response = await apiFetch("/api/standalone-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "千问翻译暂时不可用，请稍后重试。");
      renderStandaloneTranslation(result);
    } catch (error) {
      renderStandaloneTranslationError(error.message || "翻译失败，请稍后重试。");
    } finally {
      dom.standaloneTranslateButton.disabled = false;
      dom.standaloneTranslateButton.textContent = "AI 翻译";
    }
  }

  function clearStandaloneTranslation() {
    dom.standaloneTranslateInput.value = "";
    dom.standaloneTranslationResult.className = "standalone-result is-empty";
    dom.standaloneTranslationResult.innerHTML = `
      <div class="translator-result-placeholder">
        <span aria-hidden="true">Aa</span>
        <h3>在这里开始一次独立查询</h3>
        <p>单词会按词性整理义项与例句，句子会直接显示完整译文。</p>
      </div>`;
    dom.standaloneTranslateInput.focus();
  }

  function renderStandaloneTranslation(result) {
    dom.standaloneTranslationResult.className = "standalone-result";
    if (result.kind === "word") {
      const entry = result.entry || {};
      const forms = Array.isArray(entry.forms) ? entry.forms.filter(Boolean) : [];
      const meaningGroups = Array.isArray(entry.meanings) ? entry.meanings : [];
      const meaningsHtml = meaningGroups.map((group) => {
        const senses = Array.isArray(group.senses) ? group.senses : [];
        const sensesHtml = senses.map((sense, index) => {
          const label = sense.label ? `<span class="sense-label">${escapeHtml(sense.label)}</span>` : "";
          const example = sense.example
            ? `<div class="dictionary-example"><p>${escapeHtml(sense.example)}</p>${sense.exampleTranslation ? `<span>${escapeHtml(sense.exampleTranslation)}</span>` : ""}</div>`
            : "";
          return `<li><div class="sense-meaning"><span>${index + 1}</span><strong>${escapeHtml(sense.meaning || "")}</strong>${label}</div>${example}</li>`;
        }).join("");
        return `
          <section class="dictionary-pos-group">
            <h4><span>${escapeHtml(group.partOfSpeech || "其他")}</span>${escapeHtml(group.partOfSpeechName || "")}</h4>
            <ol>${sensesHtml || "<li><p class=\"muted\">暂无可展示义项。</p></li>"}</ol>
          </section>`;
      }).join("");
      dom.standaloneTranslationResult.innerHTML = `
        <header class="dictionary-entry-head">
          <div>
            <p class="eyebrow">WORD</p>
            <h3>${escapeHtml(entry.word || result.query || "")}</h3>
            ${entry.phonetic ? `<p class="dictionary-phonetic">${escapeHtml(entry.phonetic)}</p>` : ""}
          </div>
          <span class="model-chip">${escapeHtml(result.model || qwenAnalysisModel)}</span>
        </header>
        ${forms.length ? `<div class="word-forms">${forms.map((form) => `<span>${escapeHtml(form)}</span>`).join("")}</div>` : ""}
        <div class="dictionary-groups">${meaningsHtml || "<p class=\"muted\">千问没有返回有效义项，请换一个词重试。</p>"}</div>`;
      return;
    }

    dom.standaloneTranslationResult.innerHTML = `
      <header class="sentence-result-head">
        <div><p class="eyebrow">SENTENCE / PHRASE</p><h3>完整翻译</h3></div>
        <span class="model-chip">${escapeHtml(result.model || qwenModel)}</span>
      </header>
      <blockquote class="sentence-source">${escapeHtml(result.query || "")}</blockquote>
      <div class="sentence-translation"><span>中文译文</span><p>${escapeHtml(result.translation || "")}</p></div>`;
  }

  function renderStandaloneTranslationError(message) {
    dom.standaloneTranslationResult.className = "standalone-result has-error";
    dom.standaloneTranslationResult.innerHTML = `
      <div class="standalone-error">
        <strong>暂时无法完成翻译</strong>
        <p>${escapeHtml(message)}</p>
      </div>`;
  }

  async function translateText(text, context = "") {
    if (qwenConfigured) {
      const response = await apiFetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.error || "千问翻译暂时不可用，请稍后重试。");
        error.code = "QWEN_ERROR";
        throw error;
      }
      lastTranslationSource = "qwen";
      return result.translation;
    }
    const dictionaryEntry = getDictionaryEntry(text);
    if (dictionaryEntry) {
      lastTranslationSource = "dictionary";
      return dictionaryEntry.meaning;
    }
    const localTranslator = await ensureTranslator();
    lastTranslationSource = "browser";
    return localTranslator.translate(text);
  }

  async function translateCurrentSelection({ automatic = false } = {}) {
    if (!selected) return;
    if (!automatic) setInspectorHidden(false);
    const article = currentArticle();
    const selectionSnapshot = { ...selected };
    const versionSnapshot = selectionVersion;
    const cacheKey = selectionCacheKey(selectionSnapshot);
    const requestKey = `${selectionSnapshot.articleId}|${cacheKey}`;
    const model = contextualTranslationModel(selectionSnapshot);
    const cached = article?.selectionTranslations?.[cacheKey];
    if (cached) {
      if (versionSnapshot === selectionVersion) {
        selected.translation = cached.translation;
        renderSelectionTranslation(cached.translation, cached.model || model, cached.source || "qwen");
      }
      return;
    }

    const button = dom.translateSelectionButton;
    button.disabled = true;
    button.textContent = "翻译中…";
    if (versionSnapshot === selectionVersion) {
      dom.translationResult.innerHTML = qwenConfigured
        ? `<p class="translation-loading">正在请求千问语境翻译…</p>`
        : `<p class="translation-loading">正在浏览器内处理，不会上传文章…</p>`;
    }
    try {
      let request = translationRequests.get(requestKey);
      if (!request) {
        request = translateText(selectionSnapshot.text, selectionSnapshot.context || "");
        translationRequests.set(requestKey, request);
        request.then(() => translationRequests.delete(requestKey), () => translationRequests.delete(requestKey));
      }
      const translation = await request;
      article.selectionTranslations ||= {};
      article.selectionTranslations[cacheKey] = { translation, model, source: lastTranslationSource, createdAt: new Date().toISOString() };
      saveState();
      if (versionSnapshot !== selectionVersion || selectionCacheKey(selected) !== cacheKey) return;
      selected.translation = translation;
      renderSelectionTranslation(translation, model, lastTranslationSource);
    } catch (error) {
      if (versionSnapshot !== selectionVersion) return;
      const message = error?.code === "QWEN_ERROR"
        ? error.message
        : error?.message === "UNSUPPORTED"
        ? "当前浏览器不支持本地翻译。请使用桌面版 Chrome 138 或更高版本。"
        : "翻译暂时不可用，请稍后重试。";
      dom.translationResult.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
      setTranslatorStatus(qwenConfigured ? "千问翻译暂不可用" : "本地翻译暂不可用", "warning");
    } finally {
      if (versionSnapshot === selectionVersion) {
        button.disabled = false;
        button.textContent = "重新翻译";
      }
    }
  }

  function selectionCacheKey(selection) {
    if (!selection) return "";
    return [selection.paragraphIndex, selection.start, selection.end, normalize(selection.text), normalize(selection.context || "")].join("|");
  }

  function contextualTranslationModel(selection) {
    const isShortContextualSelection = selection.context && selection.context !== selection.text && countWords(selection.text) <= 5;
    return qwenConfigured && isShortContextualSelection ? qwenAnalysisModel : qwenModel;
  }

  function renderSelectionTranslation(translation, model, source) {
    const sourceLabel = source === "qwen" ? `千问语境翻译 · ${escapeHtml(model || qwenModel)}` : source === "dictionary" ? "本地词典" : "浏览器内翻译";
    dom.translationResult.innerHTML = `<strong>本文义 · ${sourceLabel}</strong><p>${escapeHtml(translation)}</p>`;
  }

  function aiSelectionKey() {
    if (!selected) return "";
    return [selected.paragraphIndex, selected.start, selected.end, normalize(selected.text), normalize(selected.context || "")].join("|");
  }

  function renderCachedAiInsight() {
    const article = currentArticle();
    if (!article || !selected) return;
    const key = aiSelectionKey();
    const explanation = article.aiExplanations?.[key];
    const analysis = article.sentenceAnalyses?.[key];
    if (explanation) renderWordExplanation(explanation);
    else if (analysis) renderSentenceAnalysis(analysis);
  }

  async function explainCurrentWord() {
    const article = currentArticle();
    if (!article || !selected || countWords(selected.text) !== 1) return;
    const key = aiSelectionKey();
    if (article.aiExplanations?.[key]) { renderWordExplanation(article.aiExplanations[key]); return; }
    const selectionSnapshot = { ...selected };
    setAiButtonLoading(dom.explainContextButton, true, "正在解释…");
    showAiInsightLoading("正在结合句子上下文判断词义…");
    try {
      const response = await apiFetch("/api/explain-word", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ word: selectionSnapshot.text, context: selectionSnapshot.context, translation: selectionSnapshot.translation || "" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "语境解释暂时不可用。");
      article.aiExplanations ||= {};
      article.aiExplanations[key] = { ...result.explanation, model: result.model || qwenAnalysisModel };
      saveState();
      if (aiSelectionKey() === key) renderWordExplanation(article.aiExplanations[key]);
    } catch (error) {
      showAiInsightError(error.message || "语境解释暂时不可用。");
    } finally {
      setAiButtonLoading(dom.explainContextButton, false, "为什么这样翻译？");
    }
  }

  async function analyzeCurrentSentence() {
    const article = currentArticle();
    if (!article || !selected || countWords(selected.text) < 6) return;
    const key = aiSelectionKey();
    if (article.sentenceAnalyses?.[key]) { renderSentenceAnalysis(article.sentenceAnalyses[key]); return; }
    const selectionSnapshot = { ...selected };
    setAiButtonLoading(dom.analyzeSentenceButton, true, "正在拆解…");
    showAiInsightLoading("正在识别主干、从句与关键语法…");
    try {
      const response = await apiFetch("/api/analyze-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sentence: selectionSnapshot.text, context: selectionSnapshot.context, translation: selectionSnapshot.translation || "" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "长难句拆解暂时不可用。");
      article.sentenceAnalyses ||= {};
      article.sentenceAnalyses[key] = { ...result.analysis, model: result.model || qwenAnalysisModel };
      saveState();
      if (aiSelectionKey() === key) renderSentenceAnalysis(article.sentenceAnalyses[key]);
    } catch (error) {
      showAiInsightError(error.message || "长难句拆解暂时不可用。");
    } finally {
      setAiButtonLoading(dom.analyzeSentenceButton, false, "拆解长难句");
    }
  }

  function setAiButtonLoading(button, loading, label) {
    button.disabled = loading || !qwenConfigured;
    button.textContent = label;
  }

  function showAiInsightLoading(message) {
    dom.aiInsightResult.classList.remove("is-hidden");
    dom.aiInsightResult.innerHTML = `<p class="translation-loading">${escapeHtml(message)}</p>`;
  }

  function showAiInsightError(message) {
    dom.aiInsightResult.classList.remove("is-hidden");
    dom.aiInsightResult.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  }

  function renderWordExplanation(explanation) {
    dom.aiInsightResult.classList.remove("is-hidden");
    dom.aiInsightResult.innerHTML = `
      <div class="ai-insight-head"><strong>语境义解释</strong><span>${escapeHtml(explanation.model || qwenAnalysisModel)}</span></div>
      <dl>
        <dt>本句含义</dt><dd>${escapeHtml(explanation.meaning || "—")}</dd>
        <dt>判断依据</dt><dd>${escapeHtml(explanation.reason || "—")}</dd>
        <dt>句中作用</dt><dd>${escapeHtml(explanation.grammarRole || "—")}</dd>
        <dt>相关搭配</dt><dd>${escapeHtml(explanation.collocation || "—")}</dd>
      </dl>`;
  }

  function renderSentenceAnalysis(analysis) {
    const clauses = (analysis.clauses || []).map((clause) => `<li><strong>${escapeHtml(clause.text || "")}</strong>${clause.role ? `：${escapeHtml(clause.role)}` : ""}</li>`).join("");
    const grammarPoints = (analysis.grammarPoints || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    dom.aiInsightResult.classList.remove("is-hidden");
    dom.aiInsightResult.innerHTML = `
      <div class="ai-insight-head"><strong>长难句拆解</strong><span>${escapeHtml(analysis.model || qwenAnalysisModel)}</span></div>
      <dl><dt>句子主干</dt><dd>${escapeHtml(analysis.mainStructure || "—")}</dd></dl>
      ${clauses ? `<strong>从句与成分</strong><ol>${clauses}</ol>` : ""}
      ${grammarPoints ? `<strong>关键语法</strong><ul>${grammarPoints}</ul>` : ""}
      ${analysis.readingTip ? `<p><strong>阅读提示：</strong>${escapeHtml(analysis.readingTip)}</p>` : ""}`;
  }

  function saveCurrentVocabulary() {
    if (!selected) return;
    const key = normalize(selected.text);
    const existing = state.vocabulary.find((item) => normalize(item.text) === key);
    if (existing) { showToast("这个词已经在生词本中"); return; }
    const article = currentArticle();
    const entry = getDictionaryEntry(selected.text);
    state.vocabulary.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `word-${Date.now()}`,
      text: selected.text,
      phonetic: entry?.phonetic || "",
      meaning: selected.translation || entry?.meaning || "待补充释义",
      context: selected.context || "",
      articleId: article?.id || null,
      articleTitle: article?.title || "未命名文章",
      createdAt: new Date().toISOString(),
      review: normalizeReviewState(null),
    });
    saveState();
    dom.saveWordButton.textContent = "已在生词本";
    renderVocabulary();
    showToast("已加入生词本");
  }

  function saveCurrentNote() {
    const content = dom.selectionNote.value.trim();
    const article = currentArticle();
    if (!article || !selected) return;
    if (!content) { showToast("请先写下笔记内容"); return; }
    article.notes.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
      quote: selected.text,
      content,
      paragraphIndex: selected.paragraphIndex,
      start: selected.start,
      end: selected.end,
      createdAt: new Date().toISOString(),
    });
    saveState();
    dom.selectionNote.value = "";
    renderArticleNotes(article);
    showToast("笔记已保存");
  }

  function renderArticleNotes(article) {
    dom.noteCount.textContent = String(article.notes.length);
    dom.articleNoteList.replaceChildren();
    if (!article.notes.length) {
      const empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "还没有笔记。";
      dom.articleNoteList.appendChild(empty);
      return;
    }
    article.notes.forEach((note) => {
      const item = document.createElement("article");
      item.className = "note-item";
      const quote = document.createElement("blockquote");
      quote.textContent = `“${note.quote}”`;
      const content = document.createElement("p");
      content.textContent = note.content;
      item.append(quote, content);
      dom.articleNoteList.appendChild(item);
    });
  }

  async function toggleFullTranslation() {
    const article = currentArticle();
    if (!article) return;
    translationVisible = !translationVisible;
    renderReader();
    if (!translationVisible) return;
    const missing = article.paragraphs.map((_, index) => index).filter((index) => !article.translations[index]);
    if (!missing.length) return;
    dom.toggleTranslationButton.disabled = true;
    for (const index of missing) {
      const target = dom.articleContent.querySelector(`[data-translation-index="${index}"]`);
      if (target) { target.textContent = qwenConfigured ? "正在通过千问翻译…" : "正在本地翻译…"; target.classList.add("translation-loading"); }
      try {
        article.translations[index] = await translateText(article.paragraphs[index]);
      } catch (error) {
        article.translations[index] = error?.code === "QWEN_ERROR"
          ? error.message
          : error?.message === "UNSUPPORTED"
          ? "当前浏览器不支持本地全文翻译，请使用桌面版 Chrome 138 或更高版本。"
          : "本段暂时无法翻译，请稍后重试。";
      }
      saveState();
      if (target) { target.textContent = article.translations[index]; target.classList.remove("translation-loading"); }
    }
    dom.toggleTranslationButton.disabled = false;
  }

  function speakSelection() {
    if (!selected || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.text);
    utterance.lang = "en-US";
    utterance.rate = 0.86;
    speechSynthesis.speak(utterance);
  }

  function changeFontSize(delta) {
    const current = Number(localStorage.getItem(ARTICLE_FONT_KEY)) || 18;
    applyFontSize(Math.min(23, Math.max(15, current + delta)));
  }

  function applyFontSize(size) {
    document.documentElement.style.setProperty("--article-size", `${size}px`);
    document.documentElement.style.setProperty("--article-title-size", `${Math.round(Math.min(50, Math.max(32, size * 2.2)))}px`);
    localStorage.setItem(ARTICLE_FONT_KEY, String(size));
    if (dom.fontSizeValue) dom.fontSizeValue.textContent = String(size);
    if (dom.fontDecrease) dom.fontDecrease.disabled = size <= 15;
    if (dom.fontIncrease) dom.fontIncrease.disabled = size >= 23;
  }

  function renderLibrary() {
    dom.libraryGrid.replaceChildren();
    dom.libraryCount.textContent = `${state.articles.length} 篇`;
    if (!state.articles.length) {
      const empty = document.createElement("div");
      empty.className = "empty-collection library-empty-state";
      empty.innerHTML = `
        <span class="library-empty-icon" aria-hidden="true">▤</span>
        <h3>从第一篇英文文章开始</h3>
        <p>导入文章后，它会保存在当前浏览器的文章库中。之后每次进入澄读，都可以先从这里选择。</p>
        <div>
          <button class="button button-primary" type="button" data-empty-library-action="import">导入第一篇文章</button>
          <button class="button button-quiet" type="button" data-empty-library-action="sample">使用示例文章</button>
        </div>`;
      empty.querySelector('[data-empty-library-action="import"]').addEventListener("click", openImport);
      empty.querySelector('[data-empty-library-action="sample"]').addEventListener("click", loadSample);
      dom.libraryGrid.appendChild(empty);
      return;
    }
    state.articles.forEach((article, index) => {
      const card = document.createElement("article");
      card.className = "library-card";
      card.tabIndex = 0;
      const wordCount = countWords(article.paragraphs.join(" "));
      card.innerHTML = `
        <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(article.title || "Untitled Reading")}</h3>
        <p>${escapeHtml(article.paragraphs[0])}</p>
        <footer><span>${wordCount} words</span><span>${formatDate(article.lastReadAt)}</span></footer>`;
      const open = () => {
        state.currentArticleId = article.id;
        selected = null;
        saveState();
        translationVisible = false;
        renderReader();
        switchView("reader");
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => { if (event.key === "Enter") open(); });
      dom.libraryGrid.appendChild(card);
    });
  }

  function normalizeReviewState(review, createdAt = new Date().toISOString()) {
    const dueAt = review?.dueAt && !Number.isNaN(new Date(review.dueAt).getTime())
      ? review.dueAt
      : createdAt || new Date().toISOString();
    return {
      dueAt,
      intervalDays: Number.isFinite(review?.intervalDays) ? Math.max(0, review.intervalDays) : 0,
      easeFactor: Number.isFinite(review?.easeFactor) ? Math.min(3, Math.max(1.3, review.easeFactor)) : 2.3,
      repetitions: Number.isFinite(review?.repetitions) ? Math.max(0, review.repetitions) : 0,
      lapses: Number.isFinite(review?.lapses) ? Math.max(0, review.lapses) : 0,
      lastReviewedAt: review?.lastReviewedAt || null,
      lastRating: review?.lastRating || null,
    };
  }

  function dueVocabulary() {
    const now = Date.now();
    return state.vocabulary
      .filter((item) => new Date(item.review?.dueAt || item.createdAt || 0).getTime() <= now)
      .sort((a, b) => new Date(a.review?.dueAt || 0) - new Date(b.review?.dueAt || 0));
  }

  function isVocabularyMastered(item) {
    return (item.review?.repetitions || 0) >= 3 && (item.review?.intervalDays || 0) >= 7;
  }

  function renderReviewSummary() {
    const due = dueVocabulary().length;
    const mastered = state.vocabulary.filter(isVocabularyMastered).length;
    dom.dueVocabularyCount.textContent = String(due);
    dom.masteredVocabularyCount.textContent = String(mastered);
    dom.startReviewButton.disabled = due === 0;
    dom.startReviewButton.textContent = due ? `开始复习 ${due} 个` : state.vocabulary.length ? "今日已完成" : "暂无生词";
    dom.reviewOverview.classList.toggle("is-complete", state.vocabulary.length > 0 && due === 0);
  }

  function startVocabularyReview() {
    reviewQueue = dueVocabulary().map((item) => item.id);
    if (!reviewQueue.length) { showToast("今天没有待复习的生词"); return; }
    reviewPosition = 0;
    reviewSessionActive = true;
    reviewRepeatIds = new Set();
    dom.reviewPanel.classList.remove("is-hidden");
    dom.reviewOverview.classList.add("is-hidden");
    renderReviewCard();
    dom.reviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function currentReviewItem() {
    return state.vocabulary.find((item) => item.id === reviewQueue[reviewPosition]) || null;
  }

  function renderReviewCard() {
    if (!reviewSessionActive) return;
    const item = currentReviewItem();
    if (!item) {
      reviewPosition += 1;
      if (reviewPosition >= reviewQueue.length) finishVocabularyReview(true);
      else renderReviewCard();
      return;
    }
    dom.reviewCard.classList.remove("is-answered");
    void dom.reviewCard.offsetWidth;
    dom.reviewCard.classList.add("is-entering");
    dom.reviewProgress.textContent = `${reviewPosition + 1} / ${reviewQueue.length}`;
    dom.reviewWord.textContent = item.text;
    dom.reviewPhonetic.textContent = item.phonetic || "";
    dom.reviewContext.textContent = item.context || `来自：${item.articleTitle || "未命名文章"}`;
    dom.reviewMeaning.textContent = item.meaning || "待补充释义";
    dom.reviewAnswer.classList.add("is-hidden");
    dom.reviewRating.classList.add("is-hidden");
    dom.revealReviewAnswer.classList.remove("is-hidden");
    setTimeout(() => dom.reviewCard.classList.remove("is-entering"), 260);
  }

  function revealReviewAnswer() {
    if (!currentReviewItem()) return;
    dom.reviewAnswer.classList.remove("is-hidden");
    dom.reviewRating.classList.remove("is-hidden");
    dom.revealReviewAnswer.classList.add("is-hidden");
    dom.reviewCard.classList.add("is-answered");
    dom.reviewRating.querySelector("button")?.focus();
  }

  function handleReviewRating(event) {
    const button = event.target.closest("[data-review-rating]");
    const item = currentReviewItem();
    if (!button || !item || dom.reviewAnswer.classList.contains("is-hidden")) return;
    const rating = button.dataset.reviewRating;
    updateVocabularySchedule(item, rating);
    if (rating === "again" && !reviewRepeatIds.has(item.id)) {
      reviewRepeatIds.add(item.id);
      reviewQueue.push(item.id);
    }
    saveState();
    reviewPosition += 1;
    if (reviewPosition >= reviewQueue.length) finishVocabularyReview(true);
    else renderReviewCard();
  }

  function updateVocabularySchedule(item, rating) {
    const review = normalizeReviewState(item.review, item.createdAt);
    const now = new Date();
    let intervalDays = review.intervalDays;
    let easeFactor = review.easeFactor;
    let repetitions = review.repetitions;
    let lapses = review.lapses;
    if (rating === "again") {
      intervalDays = 10 / (24 * 60);
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      repetitions = 0;
      lapses += 1;
    } else if (rating === "hard") {
      intervalDays = repetitions === 0 ? 1 : Math.max(1, Math.round(Math.max(1, intervalDays) * 1.4));
      easeFactor = Math.max(1.3, easeFactor - 0.08);
      repetitions += 1;
    } else {
      intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(4, Math.round(intervalDays * easeFactor));
      easeFactor = Math.min(3, easeFactor + 0.05);
      repetitions += 1;
    }
    item.review = {
      dueAt: new Date(now.getTime() + intervalDays * 86_400_000).toISOString(),
      intervalDays,
      easeFactor,
      repetitions,
      lapses,
      lastReviewedAt: now.toISOString(),
      lastRating: rating,
    };
  }

  function finishVocabularyReview(completed) {
    reviewSessionActive = false;
    reviewQueue = [];
    reviewPosition = 0;
    reviewRepeatIds = new Set();
    dom.reviewPanel.classList.add("is-hidden");
    dom.reviewOverview.classList.remove("is-hidden");
    renderVocabulary();
    renderProfile();
    if (completed) showToast("本次复习完成，记忆进度已保存在本机");
  }

  function vocabularyReviewLabel(item) {
    const review = item.review || normalizeReviewState(null, item.createdAt);
    if (new Date(review.dueAt).getTime() <= Date.now()) return "今日待复习";
    if (isVocabularyMastered(item)) return `已掌握 · ${formatDate(review.dueAt)}再看`;
    return `下次 ${formatDate(review.dueAt)}`;
  }

  function renderVocabulary() {
    renderReviewSummary();
    dom.vocabularyList.replaceChildren();
    dom.vocabularyCount.textContent = `${state.vocabulary.length} 个`;
    if (!state.vocabulary.length) {
      const empty = document.createElement("div");
      empty.className = "empty-collection";
      empty.textContent = "点击文章中的单词或词组，将它们加入生词本。";
      dom.vocabularyList.appendChild(empty);
      return;
    }
    state.vocabulary.forEach((item) => {
      const row = document.createElement("article");
      row.className = "vocabulary-item";
      const head = document.createElement("div");
      head.innerHTML = `<h3>${escapeHtml(item.text)}</h3><small>${escapeHtml(item.phonetic || formatDate(item.createdAt))}</small>`;
      const meaning = document.createElement("p");
      meaning.className = "vocabulary-meaning";
      meaning.textContent = item.meaning;
      const context = document.createElement("p");
      context.textContent = item.context || `来自：${item.articleTitle}`;
      const actions = document.createElement("div");
      actions.className = "vocabulary-actions";
      const reviewStatus = document.createElement("span");
      reviewStatus.className = `review-status${isVocabularyMastered(item) ? " is-mastered" : ""}`;
      reviewStatus.textContent = vocabularyReviewLabel(item);
      const remove = document.createElement("button");
      remove.className = "icon-button danger-hover";
      remove.textContent = "移除";
      remove.addEventListener("click", () => {
        state.vocabulary = state.vocabulary.filter((word) => word.id !== item.id);
        saveState();
        renderVocabulary();
        renderProfile();
      });
      actions.append(reviewStatus, remove);
      row.append(head, meaning, context, actions);
      dom.vocabularyList.appendChild(row);
    });
  }

  function renderProfile() {
    const totalWords = state.articles.reduce((sum, article) => sum + countWords(article.paragraphs.join(" ")), 0);
    const noteCount = state.articles.reduce((sum, article) => sum + article.notes.length, 0);
    const highlights = state.articles.reduce((sum, article) => sum + article.highlights.length, 0);
    const stats = [
      [state.articles.length, "学习文章"],
      [totalWords.toLocaleString(), "阅读词数"],
      [state.vocabulary.length, "生词词组"],
      [noteCount + highlights, "笔记与标注"],
    ];
    dom.statGrid.replaceChildren();
    stats.forEach(([value, label]) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      dom.statGrid.appendChild(card);
    });
  }

  function requestDeleteCurrentArticle() {
    const article = currentArticle();
    if (!article) return;
    openConfirm("删除这篇文章？", `“${article.title || "未命名文章"}”及其高亮、笔记和译文将从本机删除。`, () => {
      saveReadingPosition();
      state.articles = state.articles.filter((item) => item.id !== article.id);
      state.currentArticleId = state.articles[0]?.id || null;
      readingSessionArticleId = null;
      currentView = "library";
      saveState();
      selected = null;
      renderAll();
      switchView("library");
      showToast("文章已从本机删除");
    });
  }

  function requestClearAll() {
    openConfirm("清除全部学习数据？", "所有文章、译文、高亮、笔记和生词都会从当前浏览器永久删除。", () => {
      state = { articles: [], currentArticleId: null, vocabulary: [], createdAt: new Date().toISOString() };
      readingSessionArticleId = null;
      currentView = "library";
      saveState();
      renderAll();
      switchView("library");
      showToast("本地学习数据已清除");
    });
  }

  function openConfirm(title, message, handler) {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;
    confirmHandler = handler;
    dom.confirmOverlay.classList.remove("is-hidden");
  }

  function closeConfirm() {
    confirmHandler = null;
    dom.confirmOverlay.classList.add("is-hidden");
  }

  function hideToolbarWhenOutside(event) {
    if (!dom.selectionToolbar.contains(event.target) && !dom.articleContent.contains(event.target)) dom.selectionToolbar.classList.add("is-hidden");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.remove("is-hidden");
    toastTimer = setTimeout(() => dom.toast.classList.add("is-hidden"), 2300);
  }

  function countWords(text) {
    return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
  }

  function normalize(text) {
    return text.trim().toLowerCase().replace(/[“”".,!?;:()]/g, "").replace(/\s+/g, " ");
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }
})();
