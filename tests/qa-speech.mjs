import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = [];
const log = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);

const b = await chromium.launch();

// 음성 합성을 가로채 "무엇을 어떤 음성으로 읽으려 했는지" 기록합니다.
const SPY = (voices) => `
  window.__spoken = [];
  const voices = ${JSON.stringify(voices)}.map(v => ({ ...v, default: false, localService: true, voiceURI: v.name }));
  const synth = {
    getVoices: () => voices,
    speak: (u) => { window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null }); },
    cancel: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
`;

async function makePage(voices) {
  const ctx = await b.newContext({ locale: "ko-KR" });
  await ctx.addInitScript(SPY(voices));
  const p = await ctx.newPage();
  await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await p.fill("#name", "발음테스트");
  await p.fill("#email", `sp${Date.now()}${Math.floor(Math.random() * 1000)}@ex.com`);
  await p.fill("#password", "1234");
  await p.click('button[type="submit"]');
  await p.waitForURL("**/onboarding");
  await p.getByText("N5 수준입니다").click();
  await p.getByRole("button", { name: /다음/ }).click();
  await p.getByText("JLPT N1 + 일본 취업").click();
  await p.getByRole("button", { name: /학습 시작하기/ }).click();
  await p.waitForURL("**/dashboard");
  return p;
}

// --- 1. 일본어 음성이 있는 기기 ---
const withJa = await makePage([
  { name: "Kyoko", lang: "ja-JP" },
  { name: "Yuna", lang: "ko-KR" },
]);
await withJa.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await withJa.waitForTimeout(500);
await withJa.locator('button[aria-label="발음 듣기"]').first().click();
await withJa.waitForTimeout(300);
const spoken = await withJa.evaluate(() => window.__spoken);
if (spoken.length === 0) I("발음 재생", "아무것도 읽지 않음");
else {
  const first = spoken[0];
  L("단어 발음 요청", `text="${first.text}" voice=${first.voice} lang=${first.lang}`);
  if (first.text !== "わたし") I("발음 텍스트", `한자가 아닌 읽기를 보내야 함. 실제: "${first.text}"`);
  if (first.voice !== "Kyoko") I("발음 음성", `일본어 음성을 골라야 함. 실제: ${first.voice}`);
}

// 예문도 읽기로
await withJa.getByRole("button", { name: /예문 듣기/ }).click();
await withJa.waitForTimeout(300);
const spoken2 = await withJa.evaluate(() => window.__spoken);
const ex = spoken2[spoken2.length - 1];
L("예문 발음 요청", `text="${ex.text}"`);
if (/[一-龯]/.test(ex.text)) I("예문 발음", `한자가 그대로 전달됨: "${ex.text}"`);

// --- 2. 일본어 음성이 없는 기기 ---
const noJa = await makePage([{ name: "Yuna", lang: "ko-KR" }]);
await noJa.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await noJa.waitForTimeout(1200);
const notice = await noJa.locator("body").innerText();
if (!/발음 재생을 사용할 수 없습니다/.test(notice)) I("음성 없음 안내", "안내 문구가 표시되지 않음");
else L("일본어 음성 없을 때 안내 표시");

await noJa.locator('button[aria-label="발음 듣기"]').first().click();
await noJa.waitForTimeout(300);
const spokenNo = await noJa.evaluate(() => window.__spoken);
if (spokenNo.length > 0) I("음성 없음", `한국어 음성으로 읽어버림: ${JSON.stringify(spokenNo[0])}`);
else L("일본어 음성 없으면 재생하지 않음");

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
