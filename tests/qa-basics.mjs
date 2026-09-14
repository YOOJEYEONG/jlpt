import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = [];
const log = [];
const errors = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);

const b = await chromium.launch();
process.on("exit", () => { console.log(log.join("\n")); console.log("이슈:", issues.join(" / ") || "없음"); });
const p = await (await b.newContext({ locale: "ko-KR" })).newPage();
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const body = () => p.locator("body").innerText();

// 완전 초보(기초)로 가입
await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p.fill("#name", "초보자"); await p.fill("#email", `kana${Date.now()}@ex.com`); await p.fill("#password", "1234");
await p.click('button[type="submit"]'); await p.waitForURL("**/onboarding");
await p.getByText("일본어를 처음 시작합니다").click();
await p.getByRole("button", { name: /다음/ }).click();
await p.getByText("JLPT N1 + 일본 취업").click();
await p.getByRole("button", { name: /학습 시작하기/ }).click();
await p.waitForURL("**/dashboard");
L("기초 선택으로 가입");

// 1. 대시보드 오늘의 학습에 가나가 들어있는지
const dash = await body();
if (!/히라가나/.test(dash)) I("대시보드-가나", "기초 단계인데 오늘의 학습에 가나가 없음");
else L("대시보드 오늘의 학습에 가나 포함");

// 2. 카나 페이지 표
await p.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
const h1 = await p.locator("h1").first().innerText();
if (!h1.includes("히라가나")) I("카나 페이지", `h1=${h1}`);
else L("카나 페이지 렌더", h1);

const cells = await p.locator("button:has(span.jp)").count();
L("표에 표시된 글자 수", String(cells));
if (cells < 40) I("카나 표", `기본 46자여야 하는데 ${cells}개`);

// 글자 클릭 → 상세
await p.locator("button:has(span.jp)").first().click();
await p.waitForTimeout(300);
const detail = await body();
if (!/히라가나\s*\n?\s*가타카나|예시 단어/.test(detail)) I("카나 상세", "글자 클릭 후 상세 정보 미표시");
else L("글자 클릭 → 상세 표시");

// 외웠어요
await p.getByRole("button", { name: /이 글자 외웠어요/ }).click();
await p.waitForTimeout(400);
if (!/외운 글자 1 \/ 104/.test(await body())) I("카나 진도", "외운 글자 수가 반영되지 않음");
else L("카나 진도 반영", "1 / 104");

// 3. 가타카나 전환
await p.getByRole("tab", { name: "가타카나" }).click();
await p.waitForTimeout(300);
const kata = await p.locator("button:has(span.jp)").first().innerText();
if (!/[ア-ン]/.test(kata)) I("가타카나 전환", `첫 글자=${kata}`);
else L("가타카나 전환", kata.replace(/\n/g, " "));

// 4. 연습 모드
await p.getByRole("tab", { name: "연습하기" }).click();
await p.waitForTimeout(400);
const quizBody = await body();
if (!/이 글자의 소리는\?/.test(quizBody)) I("카나 연습", "연습 화면이 뜨지 않음");
else L("카나 연습 모드 진입");
await p.locator("ul.grid > li > button").first().click();
await p.waitForTimeout(300);
if (!(await p.getByRole("button", { name: "다음 글자" }).isVisible().catch(() => false))) I("카나 연습", "정답 확인 후 다음 버튼 없음");
else L("카나 연습 채점 동작");

// 5. 단어 학습 모드 — 뜻이 바로 보이는지
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
const vocab = await body();
const hasMeaning = /먹다|나, 저|학생|선생님|친구|회사/.test(vocab);
const hasReading = /[ぁ-ん]/.test(vocab);
if (!hasMeaning) I("단어 학습모드", "첫 화면에 한국어 뜻이 보이지 않음");
else L("단어 학습 모드: 뜻 노출");
if (!hasReading) I("단어 학습모드", "첫 화면에 읽기(히라가나)가 보이지 않음");
else L("단어 학습 모드: 읽기 노출");
if (!/例文/.test(vocab)) I("단어 학습모드", "예문 미표시");
else L("단어 학습 모드: 예문 노출");

// 외웠어요 → 카운트
await p.getByRole("button", { name: /외웠어요/ }).click();
await p.waitForTimeout(400);
if (!/학습한 단어 1 \//.test(await body())) I("단어 학습모드", "외웠어요가 진도에 반영되지 않음");
else L("단어 학습 모드 진도 반영");

// 6. 테스트 모드는 여전히 뜻이 가려지는지
await p.getByRole("tab", { name: "테스트" }).click();
await p.waitForTimeout(400);
const testMode = await body();
if (!/뜻 확인하기/.test(testMode)) I("단어 테스트모드", "뜻 확인 버튼이 없음");
else L("테스트 모드: 뜻 가려짐 유지");

// 7. 모바일
await p.setViewportSize({ width: 390, height: 844 });
for (const path of ["/kana", "/vocabulary"]) {
  await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 391) I(`모바일 가로넘침 ${path}`, `scrollWidth=${sw}`);
}
L("모바일 가로 넘침 검사");

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
console.log("\n=== 콘솔 에러 ===\n" + (errors.length ? [...new Set(errors)].join("\n") : "없음"));
