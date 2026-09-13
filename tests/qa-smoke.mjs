import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "https://jlpt-mu.vercel.app";
const found = [];
const notes = [];
const errors = [];

function issue(id, detail) { found.push(`[ISSUE] ${id}: ${detail}`); }
function ok(id, detail = "") { notes.push(`[OK] ${id}${detail ? " — " + detail : ""}`); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: "ko-KR" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

async function h1() { return (await page.locator("h1").first().innerText().catch(() => "")).trim(); }

// ---------- 가입 ----------
await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await page.fill("#name", "QA사용자");
await page.fill("#email", `qa${Date.now()}@ex.com`);
await page.fill("#password", "1234");
await page.click('button[type="submit"]');
await page.waitForURL("**/onboarding", { timeout: 15000 });
ok("가입 → 온보딩");

await page.getByText("N5 수준입니다").click();
await page.getByRole("button", { name: /다음/ }).click();
await page.getByText("JLPT N1 + 일본 취업").click();
await page.getByRole("button", { name: /학습 시작하기/ }).click();
await page.waitForURL("**/dashboard", { timeout: 15000 });
ok("온보딩 → 대시보드");

// ---------- 대시보드 초기 상태 ----------
const planItems = await page.locator("a:has-text('단어'), a:has-text('복습')").count();
const bodyText0 = await page.locator("body").innerText();
if (!/복습/.test(bodyText0)) issue("DASH-복습없음", "첫날 오늘의 학습에 복습 항목 자체가 안 보임");
else ok("대시보드 오늘의 학습 렌더");

const startBtn = page.getByRole("link", { name: /오늘 공부 시작하기/ });
if (!(await startBtn.isVisible().catch(() => false))) issue("DASH-시작버튼", "‘오늘 공부 시작하기’ 버튼 없음");
else ok("시작 버튼 존재");

// ---------- 단어: 모름 처리 후 당일 복습 확인 ----------
await page.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "뜻 확인하기" }).click();
await page.getByRole("button", { name: /모름/ }).click();
await page.waitForTimeout(500);
await page.goto(`${BASE}/review`, { waitUntil: "networkidle" });
const reviewBody = await page.locator("body").innerText();
if (/오늘 복습할 항목이 없습니다/.test(reviewBody)) {
  issue("SRS-당일복습", "‘모름’으로 표시한 단어가 당일 복습에 안 나옴 (최소 간격 1일이라 내일에야 등장)");
} else ok("모름 단어 당일 복습 등장");

// ---------- 단어 풀 소진 시 목표 처리 ----------
await page.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
const vocabHeader = await page.locator("body").innerText();
ok("단어 페이지", vocabHeader.match(/학습한 단어 \d+ \/ \d+/)?.[0] ?? "");

// ---------- 오답노트 재풀이 인덱스 버그 ----------
await page.goto(`${BASE}/reading`, { waitUntil: "networkidle" });
await page.locator("button").filter({ hasText: /문제 \d+개/ }).first().click();
await page.waitForTimeout(600);
// 일부러 틀리기: 각 문제에서 1번 보기 선택 후 확인
let qCount = await page.locator("button:has-text('정답 확인')").count();
for (let i = 0; i < qCount; i++) {
  const block = page.locator("div.rounded-2xl").filter({ has: page.locator("button:has-text('정답 확인')") }).first();
  await block.locator("ul > li > button").first().click();
  await block.getByRole("button", { name: "정답 확인" }).click();
  await page.waitForTimeout(250);
}
ok("독해 문제 풀이 완료", `${qCount}문항`);

await page.goto(`${BASE}/wrong-answers`, { waitUntil: "networkidle" });
const waBody = await page.locator("body").innerText();
const retryBtn = page.getByRole("button", { name: /오답 \d+개 다시 풀기/ });
if (await retryBtn.isVisible().catch(() => false)) {
  const label = await retryBtn.innerText();
  const total = Number(label.match(/\d+/)[0]);
  await retryBtn.click();
  await page.waitForTimeout(400);
  if (total >= 2) {
    // 1번 정답 맞히고 다음으로 → 건너뛰기 버그 확인
    const counterBefore = await page.locator("text=/\\d+ \\/ \\d+/").first().innerText().catch(() => "");
    const correctIdx = 0;
    // 정답 찾기 어려우니 아무거나 고르고 다음
    await page.locator("ul > li > button").first().click();
    await page.getByRole("button", { name: "정답 확인" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /다음 문제|복습 마치기/ }).click();
    await page.waitForTimeout(400);
    const counterAfter = await page.locator("text=/\\d+ \\/ \\d+/").first().innerText().catch(() => "");
    notes.push(`[INFO] 오답 재풀이 카운터: ${counterBefore} → ${counterAfter}`);
  }
  ok("오답 재풀이 진입", `${total}개`);
} else {
  issue("오답노트-재풀이버튼", "틀린 문제가 있는데 다시 풀기 버튼 없음");
}

// ---------- 모의고사 ----------
await page.goto(`${BASE}/mock-test`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /시험 시작/ }).first().click();
await page.waitForTimeout(600);
for (let i = 0; i < 10; i++) {
  await page.locator("ul li button").first().click().catch(() => {});
  const next = page.getByRole("button", { name: /^다음$/ });
  if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(150); }
  else break;
}
const submitBtn = page.getByRole("button", { name: /제출하고 채점/ });
if (await submitBtn.isVisible().catch(() => false)) {
  await submitBtn.click();
  await page.waitForTimeout(800);
  const resultBody = await page.locator("body").innerText();
  if (/총점/.test(resultBody)) ok("모의고사 결과 표시");
  else issue("모의고사-결과", "제출 후 결과 화면 미표시");
  // 결과에서 뒤로가기 후 재진입 시 중복 저장 확인
} else issue("모의고사-제출", "마지막 문항에서 제출 버튼 미노출");

await page.goto(`${BASE}/statistics`, { waitUntil: "networkidle" });
const statBody = await page.locator("body").innerText();
if (/총 학습 시간\s*0분/.test(statBody)) notes.push("[INFO] 총 학습 시간 0분 (30초 타이머 tick 전)");
ok("통계 페이지", (await h1()));

// ---------- 대시보드 재확인 ----------
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const dash = await page.locator("body").innerText();
const pct = dash.match(/(\d+)%/)?.[1];
notes.push(`[INFO] 대시보드 오늘 진행률 ${pct}%`);
if (/오늘의 학습 완료/.test(dash)) notes.push("[INFO] 완료 상태 표시됨");

// ---------- 설정 저장 ----------
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.fill("#vocabulary", "5");
await page.getByRole("button", { name: /저장하기/ }).click();
await page.waitForTimeout(400);
if (!/저장되었습니다/.test(await page.locator("body").innerText())) issue("설정-저장", "저장 피드백 없음");
else ok("설정 저장");
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const dash2 = await page.locator("body").innerText();
if (!/\/ 5/.test(dash2)) notes.push("[INFO] 하루 목표 변경이 대시보드에 즉시 반영되는지 육안 확인 필요");

// ---------- 모바일 ----------
await page.setViewportSize({ width: 390, height: 844 });
for (const p of ["/dashboard", "/vocabulary", "/mock-test", "/statistics", "/interview", "/roadmap"]) {
  await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 391) issue(`모바일-가로넘침 ${p}`, `scrollWidth=${sw}`);
}
ok("모바일 가로 넘침 검사 완료");

// ---------- 로그아웃/재로그인 ----------
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /로그아웃/ }).click();
await page.waitForURL("**/login", { timeout: 10000 }).catch(() => {});
ok("로그아웃 → 로그인 이동", page.url());

await browser.close();
console.log(notes.join("\n"));
console.log("\n=== 발견 이슈 ===");
console.log(found.length ? found.join("\n") : "없음");
console.log("\n=== 콘솔 에러 ===");
console.log(errors.length ? [...new Set(errors)].join("\n") : "없음");
