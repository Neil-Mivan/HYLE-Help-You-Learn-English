import { writeFileSync } from "node:fs";
import { join } from "node:path";

const key = normalizeKey(await readMasked("Paste your Alibaba Cloud Model Studio API Key: "));
if (!isLikelyApiKey(key)) {
  console.error("The key format does not look valid. Nothing was saved.");
  console.error("Copy the complete key beginning with sk- (not the API address or a masked value containing ****).");
  process.exitCode = 1;
} else {
  const target = join(process.cwd(), ".env.local");
  const content = [
    `DASHSCOPE_API_KEY=${key}`,
    "DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1",
    "DASHSCOPE_MODEL=qwen-mt-lite",
    "DASHSCOPE_CONTEXT_MODEL=qwen3.5-flash",
    "DASHSCOPE_ANALYSIS_MODELS=qwen3.7-max,qwen3.7-max-2026-06-08,qwen3.7-max-2026-05-20,qwen3.7-max-2026-05-17,qwen3.7-plus,qwen3.7-plus-2026-05-26,qwen3.5-flash",
    "",
  ].join("\n");
  writeFileSync(target, content, { encoding: "utf8", mode: 0o600 });
  console.log("API configuration saved locally to .env.local.");
  console.log("Restart start.cmd, then refresh the website.");
}

function readMasked(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      console.error("Run configure-api.cmd in a normal terminal window.");
      process.exit(1);
    }
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      process.stdout.write("\n");
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(value);
    };
    const onData = (chunk) => {
      const characters = chunk.replace(/\u001b\[(?:200|201)~/g, "");
      for (const character of characters) {
        if (character === "\u0003") {
          process.stdout.write("\nCanceled.\n");
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.exit(130);
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " " && character !== "\u007f") {
          value += character;
          process.stdout.write("*");
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

function normalizeKey(value) {
  return value
    .replace(/\u001b\[(?:200|201)~/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function isLikelyApiKey(value) {
  return value.startsWith("sk-") && value.length >= 12 && !/\s/.test(value) && !value.includes("*");
}
