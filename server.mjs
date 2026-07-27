import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { extname, join, normalize, sep } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
loadLocalEnv(join(root, ".env.local"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const requirePersonalKey = process.env.CLEAR_READING_REQUIRE_PERSONAL_KEY === "1";
const autoStop = process.env.CLEAR_READING_AUTO_STOP === "1";
const autoOpen = process.env.CLEAR_READING_AUTO_OPEN === "1";
const startedAt = Date.now();
const pageSessions = new Set();
let hadPageSession = false;
let lastPageClosedAt = 0;
let shuttingDown = false;

const defaultAnalysisModels = [
  "qwen3.7-max",
  "qwen3.7-max-2026-06-08",
  "qwen3.7-max-2026-05-20",
  "qwen3.7-max-2026-05-17",
  "qwen3.7-plus",
  "qwen3.7-plus-2026-05-26",
  "qwen3.5-flash",
];
const configuredAnalysisModels = process.env.DASHSCOPE_ANALYSIS_MODELS?.trim();
const analysisModels = uniqueModels(configuredAnalysisModels
  ? configuredAnalysisModels.split(",")
  : [...defaultAnalysisModels, process.env.DASHSCOPE_ANALYSIS_MODEL]);

const dashscope = {
  apiKey: process.env.DASHSCOPE_API_KEY?.trim() || "",
  baseUrl: (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, ""),
  model: process.env.DASHSCOPE_MODEL?.trim() || "qwen-mt-lite",
  contextModel: process.env.DASHSCOPE_CONTEXT_MODEL?.trim() || "qwen3.5-flash",
  analysisModels,
  analysisModel: analysisModels[0],
};

const translationCache = new Map();
const aiCache = new Map();
const modelCooldowns = new Map();
const publicFiles = new Set(["index.html", "styles.css", "app.js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);

    if (requestPath === "/api/session" && request.method === "GET") {
      if (!isAllowedOrigin(request)) return sendJson(response, 403, { error: "请求来源不受信任。" });
      if (!autoStop) { response.writeHead(204); response.end(); return; }
      return openPageSession(request, response);
    }

    if (requestPath === "/api/status" && request.method === "GET") {
      if (!isAllowedOrigin(request)) return sendJson(response, 403, { error: "请求来源不受信任。" });
      const credential = resolveCredential(request);
      return sendJson(response, 200, {
        configured: Boolean(credential.apiKey),
        credentialSource: credential.source,
        provider: "阿里云百炼",
        model: dashscope.model,
        contextModel: dashscope.contextModel,
        analysisModel: dashscope.analysisModel,
        analysisModels: dashscope.analysisModels,
        autoStop,
      });
    }

    if (requestPath === "/api/translate" && request.method === "POST") {
      const credential = requireQwen(request);

      const body = await readJsonBody(request, 100_000);
      const text = typeof body.text === "string" ? body.text.trim() : "";
      const context = typeof body.context === "string" ? body.context.trim() : "";
      if (!text) return sendJson(response, 400, { error: "没有需要翻译的文本。" });
      if (text.length > 20_000) return sendJson(response, 413, { error: "单次翻译内容过长，请缩小选区或按段翻译。" });
      if (context.length > 6_000) return sendJson(response, 413, { error: "翻译上下文过长，请缩小选区。" });

      const useContextTranslation = Boolean(context && context !== text && countEnglishWords(text) <= 5);
      const activeModel = useContextTranslation ? dashscope.contextModel : dashscope.model;
      const cacheKey = `${activeModel}\u0000${text}\u0000${useContextTranslation ? context : ""}`;
      if (credential.source === "server" && translationCache.has(cacheKey)) {
        const cached = translationCache.get(cacheKey);
        return sendJson(response, 200, { translation: cached.translation, provider: "qwen", model: cached.model, cached: true });
      }

      const translated = useContextTranslation
        ? await requestQwenContextTranslation(text, context, credential)
        : { translation: await requestQwenTranslation(text, credential.apiKey), model: dashscope.model };
      if (credential.source === "server") {
        translationCache.set(cacheKey, translated);
        if (translationCache.size > 300) translationCache.delete(translationCache.keys().next().value);
      }
      return sendJson(response, 200, { translation: translated.translation, provider: "qwen", model: translated.model, cached: false });
    }

    if (requestPath === "/api/standalone-translate" && request.method === "POST") {
      const credential = requireQwen(request);
      const body = await readJsonBody(request, 20_000);
      const text = cleanString(body.text);
      if (!text) return sendJson(response, 400, { error: "请输入需要查询的英文单词、词组或句子。" });
      if (text.length > 5_000) return sendJson(response, 413, { error: "单次输入过长，请缩短后再翻译。" });

      const kind = isStandaloneWord(text) ? "word" : "sentence";
      const cacheKey = `standalone\u0000${kind}\u0000${dashscope.analysisModels.join(",")}\u0000${text}`;
      const cached = credential.source === "server" ? aiCache.get(cacheKey) : null;
      if (cached) return sendJson(response, 200, { ...cached, cached: true });

      const result = kind === "word"
        ? await lookupStandaloneWord(text, credential)
        : {
            kind: "sentence",
            query: text,
            translation: await requestQwenTranslation(text, credential.apiKey),
            provider: "qwen",
            model: dashscope.model,
          };
      if (credential.source === "server") cacheAiResult(cacheKey, result);
      return sendJson(response, 200, { ...result, cached: false });
    }

    if (requestPath === "/api/analyze-article" && request.method === "POST") {
      const credential = requireQwen(request);
      const body = await readJsonBody(request, 160_000);
      const text = cleanString(body.text);
      const manualTitle = cleanString(body.manualTitle);
      if (!text) return sendJson(response, 400, { error: "没有需要整理的文章。" });
      if (text.length > 100_000) return sendJson(response, 413, { error: "文章过长，请缩短后再使用 AI 整理。" });
      if (manualTitle.length > 300) return sendJson(response, 400, { error: "标题过长。" });

      const cacheKey = `article\u0000${dashscope.analysisModels.join(",")}\u0000${manualTitle}\u0000${text}`;
      const cached = credential.source === "server" ? aiCache.get(cacheKey) : null;
      if (cached) return sendJson(response, 200, { ...cached, cached: true });
      const analyzed = await analyzeArticleStructure(text, manualTitle, credential);
      if (credential.source === "server") cacheAiResult(cacheKey, analyzed);
      return sendJson(response, 200, { ...analyzed, cached: false });
    }

    if (requestPath === "/api/explain-word" && request.method === "POST") {
      const credential = requireQwen(request);
      const body = await readJsonBody(request, 20_000);
      const word = cleanString(body.word);
      const context = cleanString(body.context);
      const translation = cleanString(body.translation);
      if (!word || !context) return sendJson(response, 400, { error: "缺少单词或上下文。" });
      if (word.length > 120 || context.length > 2_000 || translation.length > 500) return sendJson(response, 413, { error: "选中内容过长。" });
      const cacheKey = `word\u0000${dashscope.analysisModels.join(",")}\u0000${word}\u0000${context}\u0000${translation}`;
      const cached = credential.source === "server" ? aiCache.get(cacheKey) : null;
      if (cached) return sendJson(response, 200, { ...cached, cached: true });
      const explanation = await explainWordInContext(word, context, translation, credential);
      if (credential.source === "server") cacheAiResult(cacheKey, explanation);
      return sendJson(response, 200, { ...explanation, cached: false });
    }

    if (requestPath === "/api/analyze-sentence" && request.method === "POST") {
      const credential = requireQwen(request);
      const body = await readJsonBody(request, 30_000);
      const sentence = cleanString(body.sentence);
      const context = cleanString(body.context);
      const translation = cleanString(body.translation);
      if (!sentence) return sendJson(response, 400, { error: "没有需要拆解的句子。" });
      if (sentence.length > 5_000 || context.length > 6_000 || translation.length > 5_000) return sendJson(response, 413, { error: "句子过长，请缩小选区。" });
      const cacheKey = `sentence\u0000${dashscope.analysisModels.join(",")}\u0000${sentence}\u0000${context}\u0000${translation}`;
      const cached = credential.source === "server" ? aiCache.get(cacheKey) : null;
      if (cached) return sendJson(response, 200, { ...cached, cached: true });
      const analysis = await analyzeSentence(sentence, context, translation, credential);
      if (credential.source === "server") cacheAiResult(cacheKey, analysis);
      return sendJson(response, 200, { ...analysis, cached: false });
    }

    if (requestPath.startsWith("/api/")) return sendJson(response, 404, { error: "接口不存在。" });

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    if (!publicFiles.has(relativePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
      response.end("Not found");
      return;
    }
    const filePath = normalize(join(root, relativePath));
    const normalizedRoot = normalize(root);
    if ((filePath !== normalizedRoot && !filePath.startsWith(`${normalizedRoot}${sep}`)) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "Permissions-Policy": "translator=(self), language-detector=(self)",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch (error) {
    const status = Number(error?.statusCode) || 500;
    if (!error?.statusCode) console.error("Request failed:", error instanceof Error ? error.message : String(error));
    const safeMessage = error?.statusCode ? error.message : "AI 服务暂时不可用，请稍后重试。";
    sendJson(response, status, { error: safeMessage });
  }
});

server.listen(port, host, () => {
  console.log(`Clear Reading is running at http://${host}:${port}`);
  console.log(dashscope.apiKey ? `Qwen translation is enabled (${dashscope.model}).` : "Qwen translation is not configured. Run configure-api.cmd to enable it.");
  if (autoOpen) setTimeout(openDefaultBrowser, 250);
});

if (autoStop) {
  const autoStopTimer = setInterval(() => {
    const now = Date.now();
    const launchTimedOut = !hadPageSession && now - startedAt > 45_000;
    const lastPageClosed = hadPageSession && pageSessions.size === 0 && now - lastPageClosedAt > 7_000;
    if (launchTimedOut || lastPageClosed) stopServer();
  }, 1_000);
  autoStopTimer.unref();
}

async function requestQwenTranslation(text, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(`${dashscope.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: dashscope.model,
        messages: [{ role: "user", content: text }],
        translation_options: { source_lang: "English", target_lang: "Chinese" },
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) throw apiError(502, "千问鉴权失败，请检查 API Key、地域和 API Host。" );
      if (upstream.status === 429) throw apiError(429, "千问调用过于频繁或额度不足，请稍后重试并检查控制台余额。" );
      throw apiError(502, `千问服务返回错误（${upstream.status}）。`);
    }

    const result = await upstream.json();
    const translation = result?.choices?.[0]?.message?.content?.trim();
    if (!translation) throw apiError(502, "千问没有返回有效译文。" );
    return translation;
  } catch (error) {
    if (error?.name === "AbortError") throw apiError(504, "千问翻译超时，请稍后重试。" );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestQwenContextTranslation(text, context, credential) {
  const prompt = [
    "你是雅思阅读语境翻译器。请只翻译指定的英文单词或短语在当前句子中的准确中文含义，不要翻译整个句子，不要解释。",
    "请按 JSON 格式输出：{\"translation\":\"简洁准确的中文译义\"}。",
    `需要翻译：${text}`,
    `所在句子：${context}`,
  ].join("\n");
  const { data: result, model } = await requestQwenJson(prompt, 220, {
    models: uniqueModels([dashscope.contextModel, ...dashscope.analysisModels]),
    credential,
  });
  const translation = cleanString(result.translation);
  if (!translation) throw exposedApiError(502, "千问没有返回有效译文。" );
  return { translation, model };
}

async function lookupStandaloneWord(word, credential) {
  const prompt = [
    "你是一部面向中国英语学习者的可靠英汉学习词典。请查询给定英文单词。",
    "按该词实际具有的每一种常见现代词性分组，尽可能完整地列出该词性下的常用标准义项和雅思阅读中可能遇到的义项。",
    "不要为了凑数量虚构含义；不要收录已经废弃的古义、极罕见专业义或专有名词义，除非它对普通学习者很重要。",
    "每个义项必须给出一条自然、简洁、能体现该义项的英文例句，并给出准确中文翻译。",
    "forms 只列有学习价值的变形或派生提示，格式例如“过去式 approached”；没有则返回空数组。",
    "请严格按 JSON 输出：",
    "{\"word\":\"规范拼写\",\"phonetic\":\"常见 IPA 音标\",\"forms\":[\"变形提示\"],\"meanings\":[{\"partOfSpeech\":\"n.\",\"partOfSpeechName\":\"名词\",\"senses\":[{\"meaning\":\"中文释义\",\"label\":\"可选的语域或用法标签\",\"example\":\"英文例句\",\"exampleTranslation\":\"例句中文翻译\"}]}]}",
    `需要查询的单词：${word}`,
  ].join("\n");
  const { data: result, model } = await requestQwenJson(prompt, 3_000, {
    models: uniqueModels([dashscope.contextModel, ...dashscope.analysisModels]),
    credential,
  });
  const meanings = Array.isArray(result.meanings)
    ? result.meanings.slice(0, 14).map((group) => ({
        partOfSpeech: cleanString(group?.partOfSpeech),
        partOfSpeechName: cleanString(group?.partOfSpeechName),
        senses: Array.isArray(group?.senses)
          ? group.senses.slice(0, 14).map((sense) => ({
              meaning: cleanString(sense?.meaning),
              label: cleanString(sense?.label),
              example: cleanString(sense?.example),
              exampleTranslation: cleanString(sense?.exampleTranslation),
            })).filter((sense) => sense.meaning)
          : [],
      })).filter((group) => group.senses.length)
    : [];
  if (!meanings.length) throw exposedApiError(502, "千问没有返回有效词典义项，请稍后重试。" );
  return {
    kind: "word",
    query: word,
    entry: {
      word: cleanString(result.word) || word,
      phonetic: cleanString(result.phonetic),
      forms: Array.isArray(result.forms) ? result.forms.slice(0, 10).map(cleanString).filter(Boolean) : [],
      meanings,
    },
    provider: "qwen",
    model,
  };
}

function openPageSession(request, response) {
  hadPageSession = true;
  pageSessions.add(response);
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  response.write("event: ready\ndata: connected\n\n");
  const keepAlive = setInterval(() => {
    if (!response.destroyed) response.write(": keep-alive\n\n");
  }, 15_000);
  const close = () => {
    clearInterval(keepAlive);
    pageSessions.delete(response);
    if (!pageSessions.size) lastPageClosedAt = Date.now();
  };
  request.once("close", close);
}

function openDefaultBrowser() {
  const child = spawn("cmd.exe", ["/c", "start", "", `http://127.0.0.1:${port}/`], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

function stopServer() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const response of pageSessions) response.end();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2_000).unref();
}

async function analyzeArticleStructure(text, manualTitle, credential) {
  const manualInstruction = manualTitle
    ? `用户已经指定标题为：${JSON.stringify(manualTitle)}。不要从正文中另选标题。`
    : "如果原文开头确实存在标题，将其放入 title；如果没有真正标题，title 必须为空字符串。";
  const prompt = [
    "你是英文文章结构整理器。请只识别标题、段落和小标题，绝对不要翻译、改写、纠错、总结、增删任何原文字符。",
    manualInstruction,
    "请按 JSON 格式输出：{\"title\":\"\",\"blocks\":[{\"type\":\"heading或paragraph\",\"text\":\"原文\"}]}。",
    "title 只用于文章主标题；blocks 必须覆盖正文中的全部内容并保持原顺序。普通正文使用 paragraph，明确的小标题使用 heading。",
    "以下是原文：",
    text,
  ].join("\n\n");
  const { data: result, model } = await requestQwenJson(prompt, 2_500, { credential });
  const title = typeof result.title === "string" ? result.title.trim() : "";
  const blocks = Array.isArray(result.blocks)
    ? result.blocks.slice(0, 500).map((block) => ({
        type: block?.type === "heading" ? "heading" : "paragraph",
        text: typeof block?.text === "string" ? block.text.trim() : "",
      })).filter((block) => block.text)
    : [];
  if (!blocks.some((block) => block.type === "paragraph")) throw exposedApiError(502, "AI 没有识别出有效正文，已停止导入。" );
  const returnedText = manualTitle ? blocks.map((block) => block.text).join(" ") : [title, ...blocks.map((block) => block.text)].filter(Boolean).join(" ");
  if (normalizeArticleText(returnedText) !== normalizeArticleText(text)) {
    throw exposedApiError(422, "AI 整理结果未通过原文完整性校验，请改用本地整理。" );
  }
  return { title: manualTitle || title, blocks, provider: "qwen", model };
}

async function explainWordInContext(word, context, translation, credential) {
  const prompt = [
    "你是雅思阅读老师。请结合句子上下文，用简洁中文解释指定英文单词在这里为何这样翻译。不要扩展无关知识。",
    "请按 JSON 格式输出：{\"meaning\":\"本句中的准确含义\",\"reason\":\"为何取此义\",\"grammarRole\":\"词性与句中作用\",\"collocation\":\"相关搭配，没有则为空\"}。",
    `单词：${word}`,
    `上下文：${context}`,
    translation ? `当前译义：${translation}` : "当前译义：尚无",
  ].join("\n");
  const { data: result, model } = await requestQwenJson(prompt, 650, { credential });
  return {
    explanation: {
      meaning: cleanString(result.meaning),
      reason: cleanString(result.reason),
      grammarRole: cleanString(result.grammarRole),
      collocation: cleanString(result.collocation),
    },
    provider: "qwen",
    model,
  };
}

async function analyzeSentence(sentence, context, translation, credential) {
  const prompt = [
    "你是雅思阅读长难句老师。请用简洁中文拆解句子，重点帮助学习者看懂主干、从句和关键语法，不要生成冗长课程。",
    "请按 JSON 格式输出：{\"mainStructure\":\"主干\",\"clauses\":[{\"text\":\"原文片段\",\"role\":\"句法作用\"}],\"grammarPoints\":[\"关键语法\"],\"readingTip\":\"阅读提示\"}。",
    `需要拆解的句子：${sentence}`,
    context && context !== sentence ? `所在上下文：${context}` : "",
    translation ? `已有中文翻译：${translation}` : "",
  ].filter(Boolean).join("\n");
  const { data: result, model } = await requestQwenJson(prompt, 1_200, { credential });
  return {
    analysis: {
      mainStructure: cleanString(result.mainStructure),
      clauses: Array.isArray(result.clauses) ? result.clauses.slice(0, 12).map((item) => ({ text: cleanString(item?.text), role: cleanString(item?.role) })).filter((item) => item.text || item.role) : [],
      grammarPoints: Array.isArray(result.grammarPoints) ? result.grammarPoints.slice(0, 10).map(cleanString).filter(Boolean) : [],
      readingTip: cleanString(result.readingTip),
    },
    provider: "qwen",
    model,
  };
}

async function requestQwenJson(prompt, maxCompletionTokens, { models = dashscope.analysisModels, credential } = {}) {
  const activeCredential = credential || { apiKey: dashscope.apiKey, id: "server" };
  const candidates = uniqueModels(models).filter((model) => {
    const cooldownKey = `${activeCredential.id}:${model}`;
    const cooldownUntil = modelCooldowns.get(cooldownKey) || 0;
    if (cooldownUntil <= Date.now()) {
      modelCooldowns.delete(cooldownKey);
      return true;
    }
    return false;
  });
  let lastFallbackError = null;
  for (const model of candidates) {
    try {
      return await requestQwenJsonFromModel(prompt, maxCompletionTokens, model, activeCredential.apiKey);
    } catch (error) {
      if (!error?.allowModelFallback) throw error;
      modelCooldowns.set(`${activeCredential.id}:${model}`, error.modelCooldownUntil || Date.now() + 60_000);
      lastFallbackError = error;
      console.warn(`Qwen model ${model} is unavailable; trying the next configured model.`);
    }
  }
  if (lastFallbackError) {
    throw exposedApiError(503, "高质量模型的免费额度均已用尽或暂不可用，请检查百炼模型用量。" );
  }
  throw exposedApiError(503, "当前没有可用的千问分析模型，请重启服务或检查百炼模型额度。" );
}

async function requestQwenJsonFromModel(prompt, maxCompletionTokens, model, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const upstream = await fetch(`${dashscope.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        enable_thinking: false,
        max_completion_tokens: maxCompletionTokens,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!upstream.ok) {
      const failure = await upstream.json().catch(() => ({}));
      throw classifyAnalysisFailure(upstream.status, failure);
    }
    const result = await upstream.json();
    const content = result?.choices?.[0]?.message?.content?.trim();
    if (!content) throw exposedApiError(502, "千问没有返回有效分析结果。" );
    try { return { data: JSON.parse(content), model }; }
    catch { throw exposedApiError(502, "千问返回的分析格式无效，请稍后重试。" ); }
  } catch (error) {
    if (error?.name === "AbortError") throw exposedApiError(504, "千问分析超时，请稍后重试。" );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function classifyAnalysisFailure(status, payload) {
  const code = cleanString(payload?.code || payload?.error?.code || payload?.error?.type);
  const upstreamMessage = cleanString(payload?.message || payload?.error?.message);
  const fingerprint = `${code} ${upstreamMessage}`.toLowerCase();
  const invalidCredential = status === 401 || /invalid.?api.?key|authentication|unauthorized|invalid.?credential/.test(fingerprint);
  if (invalidCredential) return exposedApiError(502, "千问鉴权失败，请检查 API Key、地域和 API Host。" );

  const freeTierExhausted = /allocationquota\.freetieronly|free tier.*exhausted/.test(fingerprint);
  const modelUnavailable = status === 404 || /model.*(not found|does not exist|unavailable)|workspace.*model.*(denied|authorised)|model.*access.*denied/.test(fingerprint);
  const transientFailure = status === 429 || status >= 500;
  if (freeTierExhausted || modelUnavailable || transientFailure) {
    const error = exposedApiError(503, freeTierExhausted ? "当前模型免费额度已用尽。" : "当前模型暂不可用。" );
    error.allowModelFallback = true;
    error.modelCooldownUntil = freeTierExhausted || modelUnavailable ? Number.POSITIVE_INFINITY : Date.now() + 60_000;
    return error;
  }

  if (status === 403) return exposedApiError(502, "千问拒绝了模型访问，请检查模型权限、地域和免费额度设置。" );
  return exposedApiError(502, `千问分析服务返回错误（${status}）。`);
}

function requireQwen(request) {
  if (!isAllowedOrigin(request)) throw apiError(403, "请求来源不受信任。");
  const credential = resolveCredential(request);
  if (!credential.apiKey) throw apiError(503, "千问 API 尚未配置，请在网页右上角连接自己的 API Key。" );
  return credential;
}

function resolveCredential(request) {
  const rawHeader = request.headers["x-clear-reading-api-key"];
  const personalKey = cleanString(Array.isArray(rawHeader) ? rawHeader[0] : rawHeader);
  if (personalKey) {
    if (personalKey.length > 512 || !/^sk-[A-Za-z0-9_-]{16,}$/.test(personalKey)) {
      throw apiError(400, "个人 API Key 格式无效，请重新复制完整 Key。" );
    }
    const fingerprint = createHash("sha256").update(personalKey).digest("hex").slice(0, 16);
    return { apiKey: personalKey, source: "personal", id: `personal-${fingerprint}` };
  }
  if (requirePersonalKey) return { apiKey: "", source: "none", id: "personal-required" };
  return { apiKey: dashscope.apiKey, source: dashscope.apiKey ? "server" : "none", id: "server" };
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isStandaloneWord(value) {
  return /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(cleanString(value));
}

function uniqueModels(models) {
  return [...new Set((models || []).map((model) => cleanString(model)).filter(Boolean))];
}

function normalizeArticleText(value) {
  return value.replace(/\s+/g, "").trim();
}

function countEnglishWords(value) {
  return (value.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
}

function cacheAiResult(key, value) {
  aiCache.set(key, value);
  if (aiCache.size > 300) aiCache.delete(aiCache.keys().next().value);
}

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    return (originUrl.protocol === "http:" || originUrl.protocol === "https:") && originUrl.host === request.headers.host;
  } catch {
    return false;
  }
}

function readJsonBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) {
        reject(apiError(413, "请求内容过长。"));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(apiError(400, "请求格式无效。")); }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  if (response.headersSent) return;
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function apiError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function exposedApiError(statusCode, message) {
  const error = apiError(statusCode, message);
  error.expose = true;
  return error;
}
