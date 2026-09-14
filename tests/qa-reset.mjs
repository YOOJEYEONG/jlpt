import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = [];
const log = [];
const errors = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);

const b = await chromium.launch();
const ctx = await b.newContext({ locale: "ko-KR" });
const p = await ctx.newPage();
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const body = () => p.locator("body").innerText();
const email = `rs${Date.now()}@ex.com`;

await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p.fill("#name", "초기화테스트"); await p.fill("#email", email); await p.fill("#password", "1234");
await p.click('button[type="submit"]'); await p.waitForURL("**/onboarding");
await p.getByText("일본어를 처음 시작합니다").click();
await p.getByRole("button", { name: /다음/ }).click();
await p.getByText("JLPT N1 + 일본 취업").click();
await p.getByRole("button", { name: /학습 시작하기/ }).click();
await p.waitForURL("**/dashboard");

// --- 1. 따라쓰기 초기화 버튼 ---
await p.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "따라쓰기" }).click();
await p.waitForTimeout(400);
const box = await p.locator("canvas").boundingBox();
await p.mouse.move(box.x + 50, box.y + 50);
await p.mouse.down();
for (let i = 1; i <= 10; i++) await p.mouse.move(box.x + 50 + i * 18, box.y + 50 + i * 15);
await p.mouse.up();
await p.waitForTimeout(250);

const penPixels = () => p.evaluate(() => {
  const c = document.querySelector("canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 90 && d[i + 1] > 60 && d[i + 1] < 130 && d[i + 2] > 180) n++;
  return n;
});
const drawn = await penPixels();
if (drawn === 0) I("따라쓰기", "선이 그려지지 않음");

await p.getByRole("button", { name: /^초기화$/ }).click();
await p.waitForTimeout(300);
const cleared = await penPixels();
if (cleared > 0) I("따라쓰기 초기화", `획이 남아 있음 (${drawn} → ${cleared})`);
else L("따라쓰기 초기화 버튼", `${drawn} → ${cleared}`);
if (!/쓴 획 0/.test(await body())) I("따라쓰기 초기화", "획 카운트가 0으로 돌아가지 않음");
else L("획 카운트 0으로 복귀");

// --- 2. 가나 진행도 쌓기 ---
await p.getByRole("button", { name: "표 보기" }).click();
await p.waitForTimeout(300);
for (let i = 0; i < 3; i++) {
  await p.locator("button:has(span.jp)").nth(i).click();
  await p.waitForTimeout(150);
  await p.getByRole("button", { name: /이 글자 외웠어요/ }).click();
  await p.waitForTimeout(200);
}
const before = (await body()).match(/외운 글자 (\d+) \/ 104/)?.[1];
L("가나 진행도 쌓기", `${before}자`);
if (before !== "3") I("가나 진행도", `기대 3, 실제 ${before}`);

// 단어도 하나 학습(다른 영역이 남는지 확인용)
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /외웠어요/ }).click();
await p.waitForTimeout(2200); // 서버 저장 대기

// --- 3. 카나 페이지에서 진행도 초기화 ---
await p.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
await p.waitForTimeout(600);
await p.getByRole("button", { name: /가나 진행도 초기화/ }).click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: /정말 지웁니다/ }).click();
await p.waitForTimeout(500);
const after = await body();
if (!/외운 글자 0 \/ 104/.test(after)) I("가나 초기화", `0으로 돌아가지 않음: ${after.match(/외운 글자 \d+ \/ 104/)?.[0]}`);
else L("가나 진행도 초기화", "3 → 0");

// --- 4. 다른 영역은 남아 있는지 ---
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
if (!/학습한 단어 1 \//.test(await body())) I("영역 분리", "가나만 지워야 하는데 단어 기록까지 사라짐");
else L("단어 기록은 유지됨");

// --- 5. 서버에도 반영되는지 (다른 브라우저로 로그인) ---
await p.waitForTimeout(2200);
const ctx2 = await b.newContext({ locale: "ko-KR" });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p2.fill("#email", email); await p2.fill("#password", "1234");
await p2.click('button[type="submit"]');
await p2.waitForURL("**/dashboard", { timeout: 15000 });
await p2.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
await p2.waitForTimeout(1000);
const remote = await p2.locator("body").innerText();
if (!/외운 글자 0 \/ 104/.test(remote)) I("초기화 동기화", `다른 기기에서 ${remote.match(/외운 글자 \d+ \/ 104/)?.[0]}`);
else L("초기화가 서버에도 반영됨");

// --- 6. 설정의 영역별 초기화 ---
await p.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
const settings = await body();
if (!/진행도 초기화/.test(settings)) I("설정", "영역별 초기화 항목이 없음");
else L("설정에 영역별 초기화 표시");

const vocabRow = p.locator("li").filter({ hasText: "단어" }).filter({ hasText: "/ 298" }).first();
await vocabRow.getByRole("button", { name: /초기화/ }).click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: /정말 지웁니다/ }).click();
await p.waitForTimeout(500);
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
if (!/학습한 단어 0 \//.test(await body())) I("설정 영역 초기화", "단어 기록이 지워지지 않음");
else L("설정에서 단어 영역 초기화");

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
console.log("\n=== 콘솔 에러 ===\n" + (errors.length ? [...new Set(errors)].join("\n") : "없음"));
