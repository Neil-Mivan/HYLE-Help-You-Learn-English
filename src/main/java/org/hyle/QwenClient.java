package org.hyle;

import com.fasterxml.jackson.databind.*;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
class QwenClient {
    record Answer(JsonNode data, String model) {}
    private final Settings settings;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final Map<List<String>,Long> cooldowns = new ConcurrentHashMap<>();

    QwenClient(Settings settings, ObjectMapper json) { this.settings = settings; this.json = json; }

    String translate(String text, String key) {
        return call(settings.model, text, key, 0);
    }

    Answer analyze(String prompt, int budget, List<String> models, String key) {
        String identity;
        try {
            identity = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
        for (String model : models) {
            List<String> slot = List.of(identity, model);
            if (cooldowns.getOrDefault(slot, 0L) > System.currentTimeMillis()) continue;
            try {
                String content = call(model, prompt, key, budget);
                JsonNode data = json.readTree(content);
                if (data == null || !data.isObject()) throw invalidAnswer();
                return new Answer(data, model);
            } catch (Unavailable e) {
                cooldowns.put(slot, e.until);
            } catch (IOException e) { throw invalidAnswer(); }
        }
        throw new ApiFailure(503, "分析模型当前均不可用，请检查模型额度或稍后重试。");
    }
    private static ApiFailure invalidAnswer() { return new ApiFailure(502, "千问返回的分析格式无效。"); }
    private static class Unavailable extends RuntimeException {
        final long until;
        Unavailable(boolean permanent) { until = permanent ? Long.MAX_VALUE : System.currentTimeMillis()+60_000; }
    }
    private String call(String model, String prompt, String key, int budget) {
        Map<String,Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("stream", false);
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        if (budget == 0) body.put("translation_options", Map.of("source_lang", "English", "target_lang", "Chinese"));
        else {
            body.put("response_format", Map.of("type", "json_object"));
            body.put("enable_thinking", false);
            body.put("max_completion_tokens", budget);
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(settings.baseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(budget == 0 ? 30 : 35))
                .header("Authorization", "Bearer " + key).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofByteArray(json.writeValueAsBytes(body))).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() / 100 != 2) fail(response.statusCode(), response.body(), budget != 0);
            JsonNode result = json.readTree(response.body());
            String content = result == null ? "" : result.at("/choices/0/message/content").asText("").strip();
            if (content.isEmpty()) throw new ApiFailure(502, "千问没有返回有效内容。");
            return content;
        } catch (HttpTimeoutException e) { throw new ApiFailure(504, "千问请求超时，请稍后重试。"); }
        catch (IOException | IllegalArgumentException e) { throw new ApiFailure(502, "无法读取千问响应，请检查网络和接口地址。"); }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiFailure(503, "千问请求被中断。");
        }
    }
    private static void fail(int status, String body, boolean analysis) {
        String detail = body.toLowerCase(Locale.ROOT);
        if (status == 401 || detail.matches("(?s).*(invalid.?api.?key|authentication|unauthorized|invalid.?credential).*"))
            throw new ApiFailure(502, "千问鉴权失败，请检查 API Key、地域和接口地址。");
        if (analysis) {
            if (status == 404 || detail.matches("(?s).*(allocationquota\\.freetieronly|free tier.*exhausted|model.*(not found|does not exist|unavailable)|workspace.*model.*(denied|authorised)|model.*access.*denied).*"))
                throw new Unavailable(true);
            if (status == 429 || status >= 500) throw new Unavailable(false);
        }
        if (status == 429) throw new ApiFailure(429, "千问调用过于频繁或额度不足。");
        throw new ApiFailure(502, "千问服务返回错误（" + status + "），请检查模型权限和配置。");
    }
}
