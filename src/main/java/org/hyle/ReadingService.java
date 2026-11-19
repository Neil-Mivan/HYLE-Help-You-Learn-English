package org.hyle;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;

@Service
class ReadingService {
    private static final Pattern WORD = Pattern.compile("[A-Za-z]+(?:['’-][A-Za-z]+)*");
    private final QwenClient client;
    private final Settings settings;
    ReadingService(QwenClient client, Settings settings) { this.client = client; this.settings = settings; }

    Map<String,Object> translate(JsonNode body, String key) {
        String text = field(body,"text",20_000,true), context = field(body,"context",6000,false);
        if (!context.isEmpty() && !context.equals(text) && WORD.matcher(text).results().limit(6).count() <= 5) {
            var answer = client.analyze("只翻译所选词或短语在当前句子中的中文含义。返回 JSON {\"translation\":\"译义\"}。\n所选：" +
                text + "\n句子：" + context, 220, settings.contextModels, key);
            String translation = string(answer.data(), "translation");
            if (translation.isEmpty()) throw new ApiFailure(502, "千问没有返回有效译文。");
            return Map.of("translation",translation,"provider","qwen","model",answer.model());
        }
        return Map.of("translation",client.translate(text,key),"provider","qwen","model",settings.model);
    }
    Map<String,Object> standalone(JsonNode body, String key) {
        String text = field(body,"text",5000,true);
        if (!WORD.matcher(text).matches()) return Map.of("kind","sentence","query",text,"translation",client.translate(text,key),"provider","qwen","model",settings.model);
        var answer = client.analyze("""
            你是英汉学习词典。按常见现代词性尽可能完整列出标准义项和雅思常见义项，每义配自然英文例句及中文翻译。
            不要虚构或罗列罕见古义。按 JSON 输出
            {"word":"规范拼写","phonetic":"IPA","forms":["变形提示"],"meanings":[{"partOfSpeech":"n.","partOfSpeechName":"名词","senses":[{"meaning":"中文义项","label":"用法标签","example":"英文例句","exampleTranslation":"例句翻译"}]}]}
            查询：
            """ + text, 3000, settings.contextModels, key);
        JsonNode data = answer.data();
        List<Map<String,Object>> meanings = new ArrayList<>();
        for (var group : items(data,"meanings",14)) {
            var senses = items(group,"senses",14).stream().filter(s -> !string(s,"meaning").isEmpty())
                .map(s -> fields(s,"meaning","label","example","exampleTranslation")).toList();
            if (!senses.isEmpty()) meanings.add(Map.of("partOfSpeech",string(group,"partOfSpeech"),
                "partOfSpeechName",string(group,"partOfSpeechName"),"senses",senses));
        }
        if (meanings.isEmpty()) throw new ApiFailure(502,"千问没有返回有效词典义项。");
        String word = string(data,"word");
        return Map.of("kind","word","query",text,"entry",Map.of("word",word.isEmpty()?text:word,
            "phonetic",string(data,"phonetic"),"forms",strings(data,"forms"),"meanings",meanings),"provider","qwen","model",answer.model());
    }
    Map<String,Object> article(JsonNode body, String key) {
        String text = field(body,"text",100_000,true), manualTitle = field(body,"manualTitle",300,false);
        String titleRule = manualTitle.isEmpty() ? "无标题时 title 必须为空字符串。" : "标题已指定为 " + manualTitle + "，原文全部放入 blocks。";
        var answer = client.analyze("只识别英文文章标题、段落和小标题，保持所有原文字符和顺序，不翻译或改写。返回 JSON " +
            "{\"title\":\"\",\"blocks\":[{\"type\":\"paragraph 或 heading\",\"text\":\"原文\"}]}。\n" + titleRule + "\n原文：\n" + text,
            2500, settings.analysisModels, key);
        String title = string(answer.data(),"title");
        StringBuilder reconstructed = new StringBuilder(manualTitle.isEmpty() ? title : "");
        List<Map<String,String>> blocks = new ArrayList<>();
        for (var block : items(answer.data(),"blocks",500)) {
            String content = string(block,"text");
            if (content.isEmpty()) continue;
            blocks.add(Map.of("type", "heading".equals(string(block,"type")) ? "heading" : "paragraph", "text",content));
            reconstructed.append(content);
        }
        if (blocks.stream().noneMatch(b -> b.get("type").equals("paragraph"))) throw new ApiFailure(502,"AI 没有识别出有效正文。");
        if (!compact(text).equals(compact(reconstructed.toString()))) throw new ApiFailure(422,"AI 整理结果未通过原文完整性校验，请改用本地整理。");
        return Map.of("title",manualTitle.isEmpty()?title:manualTitle,"blocks",blocks,"provider","qwen","model",answer.model());
    }
    Map<String,Object> explain(JsonNode body, String key) {
        String word = field(body,"word",120,true), context = field(body,"context",2000,true), translation = field(body,"translation",500,false);
        var answer = client.analyze("请用简洁中文解释所选词在句中为何如此翻译。返回 JSON {\"meaning\":\"本句含义\",\"reason\":\"判断依据\",\"grammarRole\":\"句中作用\",\"collocation\":\"相关搭配\"}。\n词：" +
            word + "\n上下文：" + context + "\n当前译义：" + translation, 650, settings.analysisModels, key);
        return Map.of("explanation",fields(answer.data(),"meaning","reason","grammarRole","collocation"),"provider","qwen","model",answer.model());
    }
    Map<String,Object> sentence(JsonNode body, String key) {
        String sentence = field(body,"sentence",5000,true), context = field(body,"context",6000,false), translation = field(body,"translation",5000,false);
        var answer = client.analyze("用简洁中文拆解雅思长难句。返回 JSON {\"mainStructure\":\"主干\",\"clauses\":[{\"text\":\"原文片段\",\"role\":\"句法作用\"}],\"grammarPoints\":[\"语法要点\"],\"readingTip\":\"阅读建议\"}。\n句子：" +
            sentence + "\n上下文：" + context + "\n译文：" + translation, 1200, settings.analysisModels, key);
        var data = answer.data();
        var clauses = items(data,"clauses",12).stream().map(n -> fields(n,"text","role"))
            .filter(c -> !c.get("text").isEmpty() || !c.get("role").isEmpty()).toList();
        return Map.of("analysis",Map.of("mainStructure",string(data,"mainStructure"),"clauses",clauses,
            "grammarPoints",strings(data,"grammarPoints"),"readingTip",string(data,"readingTip")),"provider","qwen","model",answer.model());
    }

    private static String compact(String text) { return text.replaceAll("(?U)[\\s\\uFEFF]+",""); }
    private static String string(JsonNode node, String name) {
        var child = node.path(name);
        return child.isTextual() ? child.textValue().strip() : "";
    }
    private static Map<String,String> fields(JsonNode node, String... names) {
        Map<String,String> result = new LinkedHashMap<>();
        for (String name : names) result.put(name,string(node,name));
        return result;
    }
    private static List<JsonNode> items(JsonNode node, String name, int limit) {
        var array = node.path(name);
        return array.isArray() ? StreamSupport.stream(array.spliterator(),false).limit(limit).toList() : List.of();
    }
    private static List<String> strings(JsonNode data, String name) {
        return items(data,name,10).stream().filter(JsonNode::isTextual).map(n -> n.textValue().strip()).filter(s -> !s.isEmpty()).toList();
    }
    private static String field(JsonNode node, String name, int limit, boolean required) {
        String value = string(node,name);
        if (required && value.isEmpty()) throw new ApiFailure(400,"缺少必填内容：" + name);
        if (value.length() > limit) throw new ApiFailure(413,"输入内容过长，请缩短选区。");
        return value;
    }
}
