package org.hyle;

import java.io.IOException;
import java.util.*;
import java.util.function.BiFunction;
import com.fasterxml.jackson.databind.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
class ReadingApi {
    private final Settings settings;
    private final ReadingService readings;
    private final ObjectMapper json;
    private final Map<List<Object>,Map<String,Object>> cache = Collections.synchronizedMap(new LinkedHashMap<>() {
        @Override protected boolean removeEldestEntry(Map.Entry<List<Object>,Map<String,Object>> entry) { return size() > 300; }
    });
    ReadingApi(Settings settings, ReadingService readings, ObjectMapper json) {
        this.settings = settings; this.readings = readings; this.json = json;
    }
    @GetMapping("/status")
    Map<String,Object> status(HttpServletRequest request) {
        String personal = personalKey(request);
        String key = resolveKey(personal);
        return Map.of("configured",!key.isEmpty(),"credentialSource",!personal.isEmpty()?"personal":!key.isEmpty()?"server":"none",
            "provider","阿里云百炼","model",settings.model,"contextModel",settings.contextModel,
            "analysisModels",settings.analysisModels,"analysisModel",settings.analysisModels.get(0),"autoStop",settings.enabled("CLEAR_READING_AUTO_STOP"));
    }
    @PostMapping("/translate")
    Map<String,Object> translate(HttpServletRequest r) { return answer(r,100_000,readings::translate); }
    @PostMapping("/standalone-translate")
    Map<String,Object> standalone(HttpServletRequest r) { return answer(r,20_000,readings::standalone); }
    @PostMapping("/explain-word")
    Map<String,Object> explain(HttpServletRequest r) { return answer(r,20_000,readings::explain); }
    @PostMapping("/analyze-sentence")
    Map<String,Object> sentence(HttpServletRequest r) { return answer(r,30_000,readings::sentence); }
    @PostMapping("/analyze-article")
    Map<String,Object> article(HttpServletRequest r) { return answer(r,160_000,readings::article); }

    private Map<String,Object> answer(HttpServletRequest request, int limit, BiFunction<JsonNode,String,Map<String,Object>> operation) {
        String personal = personalKey(request);
        String key = resolveKey(personal);
        if (key.isEmpty()) throw new ApiFailure(503,"千问 API 尚未配置，请在网页右上角连接自己的 API Key。");
        JsonNode input;
        try {
            byte[] bytes = request.getInputStream().readNBytes(limit + 1);
            if (bytes.length > limit) throw new ApiFailure(413,"请求内容过长。");
            input = json.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).readTree(bytes);
        } catch (IOException e) { throw new ApiFailure(400,"请求格式无效。"); }
        if (input == null || !input.isObject()) throw new ApiFailure(400,"请求格式无效。");
        List<Object> cacheKey = List.of(request.getRequestURI(),input);
        var result = personal.isEmpty() ? cache.get(cacheKey) : null;
        boolean cached = result != null;
        if (!cached) {
            result = operation.apply(input,key);
            if (personal.isEmpty()) cache.put(cacheKey,result);
        }
        Map<String,Object> response = new LinkedHashMap<>(result);
        response.put("cached",cached);
        return response;
    }
    private String personalKey(HttpServletRequest r) {
        String header = r.getHeader("X-Clear-Reading-Api-Key");
        String key = header == null ? "" : header.replaceAll("[\\u200B-\\u200D\\uFEFF]","").trim();
        if (!key.isEmpty() && (key.length() < 12 || key.length() > 512 || !key.matches("sk-[!-~]+") || key.contains("*")))
            throw new ApiFailure(400,"个人 API Key 无法识别，请粘贴完整的明文 Key。");
        return key;
    }
    private String resolveKey(String personal) {
        return !personal.isEmpty() || settings.enabled("CLEAR_READING_REQUIRE_PERSONAL_KEY") ? personal : settings.get("DASHSCOPE_API_KEY","");
    }
}
