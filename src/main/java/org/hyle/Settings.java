package org.hyle;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

final class Settings {
    private final Map<String,String> values;
    final String model, contextModel, baseUrl;
    final List<String> analysisModels, contextModels;
    private static final String DEFAULT_MODELS = "qwen3.7-max,qwen3.7-max-2026-06-08,qwen3.7-max-2026-05-20,qwen3.7-max-2026-05-17,qwen3.7-plus,qwen3.7-plus-2026-05-26,qwen3.5-flash";
    private Settings(Map<String,String> values) {
        this.values = values;
        baseUrl = get("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").replaceAll("/+$", "");
        model = get("DASHSCOPE_MODEL", "qwen-mt-lite");
        contextModel = get("DASHSCOPE_CONTEXT_MODEL", "qwen3.5-flash");
        String models = get("DASHSCOPE_ANALYSIS_MODELS", DEFAULT_MODELS + "," + get("DASHSCOPE_ANALYSIS_MODEL", ""));
        List<String> parsed = Arrays.stream(models.split(",")).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
        analysisModels = parsed.isEmpty() ? List.of(contextModel) : parsed;
        contextModels = Stream.concat(Stream.of(contextModel), analysisModels.stream()).distinct().toList();
    }
    static Settings load() throws IOException {
        Map<String,String> values = new HashMap<>(System.getenv());
        Path file = Path.of(".env.local");
        if (Files.exists(file)) for (String raw : Files.readAllLines(file)) {
            String line = raw.strip().replaceFirst("^\uFEFF", "");
            int pos = line.indexOf('=');
            if (line.startsWith("#") || pos < 1) continue;
            String key = line.substring(0,pos).strip(), value = line.substring(pos+1).strip();
            if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) ||
                (value.startsWith("'") && value.endsWith("'")))) value = value.substring(1,value.length()-1);
            if (values.getOrDefault(key,"").isEmpty()) values.put(key,value);
        }
        return new Settings(values);
    }
    String get(String key, String fallback) {
        String value = values.get(key);
        return value == null || value.isBlank() ? fallback : value.trim();
    }
    boolean enabled(String key) { return "1".equals(get(key, "")); }
}
