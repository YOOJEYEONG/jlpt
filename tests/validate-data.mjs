/**
 * 학습 콘텐츠 JSON 무결성 검사.
 * - id 중복 / 누락
 * - 필수 필드 누락
 * - 일본어 필드에 섞여 들어간 키릴 문자·로마자
 * - level 값과 파일 경로 불일치
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src/data");
const problems = [];
const counts = {};

const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN_WORD = /[A-Za-z]{3,}/;
const LATIN_OK = /^(ABC|JLPT|MP3|OK|PR|IT|TV|SOV)$/;

const JP_FIELDS = ["word", "reading", "example", "exampleReading", "title", "connection", "character", "jp", "questionJp", "sampleAnswerJp", "content", "transcript", "script", "passage"];

function checkText(where, field, value) {
  if (typeof value !== "string") return;
  if (CYRILLIC.test(value)) problems.push(`${where} · ${field}: 키릴 문자 포함 → "${value.slice(0, 40)}"`);
  if (JP_FIELDS.includes(field)) {
    const latin = value.match(/[A-Za-z]+/g) ?? [];
    for (const token of latin) {
      if (token.length >= 3 && !LATIN_OK.test(token.toUpperCase())) {
        problems.push(`${where} · ${field}: 로마자 "${token}" 포함 → "${value.slice(0, 40)}"`);
      }
    }
  }
}

function walk(where, node) {
  if (Array.isArray(node)) { node.forEach((item, i) => walk(`${where}[${i}]`, item)); return; }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string") checkText(where, key, value);
      else walk(where, value);
    }
  }
}

const REQUIRED = {
  vocabulary: ["id", "word", "reading", "meaning", "partOfSpeech", "level", "example", "exampleReading", "exampleTranslation", "importance"],
  grammar: ["id", "title", "meaning", "connection", "explanation", "level", "difficulty", "examples", "related", "examPoint"],
  kanji: ["id", "character", "meaning", "onyomi", "kunyomi", "strokes", "level", "words", "example"],
};

const allIds = new Map();

for (const dir of fs.readdirSync(ROOT)) {
  const dirPath = path.join(ROOT, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  for (const file of fs.readdirSync(dirPath)) {
    if (!file.endsWith(".json")) continue;
    const full = path.join(dirPath, file);
    const rel = path.relative(process.cwd(), full);
    let data;
    try { data = JSON.parse(fs.readFileSync(full, "utf8")); }
    catch (error) { problems.push(`${rel}: JSON 파싱 실패 — ${error.message}`); continue; }

    const items = Array.isArray(data) ? data : [data];
    counts[rel] = items.length;

    const expectedLevel = /^(n[1-5]|basic)\.json$/.test(file)
      ? file.replace(".json", "").toUpperCase()
      : null;

    items.forEach((item, index) => {
      const where = `${rel}[${index}]`;
      if (item.id) {
        if (allIds.has(item.id)) problems.push(`${where}: id 중복 "${item.id}" (${allIds.get(item.id)})`);
        else allIds.set(item.id, where);
      }
      const required = REQUIRED[dir];
      if (required) {
        for (const key of required) {
          if (item[key] === undefined || item[key] === "") problems.push(`${where}: 필수 필드 누락 "${key}"`);
        }
      }
      if (expectedLevel && item.level && item.level !== expectedLevel) {
        problems.push(`${where}: level 불일치 (파일 ${expectedLevel} / 값 ${item.level})`);
      }
      walk(where, item);
    });
  }
}

console.log("=== 파일별 항목 수 ===");
for (const [file, count] of Object.entries(counts).sort()) console.log(`${count.toString().padStart(4)}  ${file}`);
console.log(`\n총 ${Object.values(counts).reduce((a, b) => a + b, 0)}개 항목, 고유 id ${allIds.size}개`);
console.log("\n=== 문제 ===");
console.log(problems.length ? problems.join("\n") : "없음");
process.exit(problems.length ? 1 : 0);
