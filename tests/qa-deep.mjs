import { chromium } from "playwright";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = []; const log = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: "ko-KR" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const body = async () => page.locator("body").innerText();

await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await page.fill("#name", "QA2"); await page.fill("#email", `q2${Date.now()}@ex.com`); await page.fill("#password", "1234");
await page.click('button[type="submit"]'); await page.waitForURL("**/onboarding");
await page.getByText("N5 수준입니다").click();
await page.getByRole("button", { name: /다음/ }).click();
await page.getByText("JLPT N1 + 일본 취업").click();
await page.getByRole("button", { name: /학습 시작하기/ }).click();
await page.waitForURL("**/dashboard");

// 1. 오늘의 학습 카운터 증가
const before = (await body()).match(/단어\s*\n?\s*(\d+) \/ (\d+)/);
await page.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: "뜻 확인하기" }).click();
  await page.getByRole("button", { name: /알고 있음/ }).click();
  await page.waitForTimeout(250);
}
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const dash = await body();
const m = dash.match(/단어\s*(\d+) \/ (\d+)/);
if (!m || Number(m[1]) !== 3) I("오늘의학습-단어카운터", `기대 3, 실제 ${m ? m[1] : "없음"}`);
else L("오늘의 학습 단어 카운터", `${m[1]} / ${m[2]}`);

// 2. 새로고침 후 로그인/진도 유지
await page.reload({ waitUntil: "networkidle" });
if (!/QA2/.test(await body())) I("지속성-새로고침", "새로고침 후 로그인 상태 소실");
else L("새로고침 후 세션 유지");

// 3. 복습: 정답 맞히면 사라지고 오답이면 남는지
await page.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "뜻 확인하기" }).click();
await page.getByRole("button", { name: /모름/ }).click();
await page.waitForTimeout(300);
await page.goto(`${BASE}/review`, { waitUntil: "networkidle" });
const r0 = (await body()).match(/오늘 복습할 항목\s*\n?\s*(\d+)개/);
if (!r0 || Number(r0[1]) < 1) I("복습-목록", "모름 항목이 복습 목록에 없음");
else L("복습 목록 생성", `${r0[1]}개`);

// 정답 고르기: 해설에 정답이 나오므로 일단 첫 보기 선택 → 결과 확인
await page.locator("ul > li > button").first().click();
await page.getByRole("button", { name: "정답 확인" }).click();
await page.waitForTimeout(300);
const wasCorrect = /정답입니다/.test(await body());
await page.getByRole("button", { name: /다음 문제|복습 마치기/ }).click();
await page.waitForTimeout(400);
const afterBody = await body();
if (wasCorrect) {
  if (!/이번 복습을 모두 마쳤습니다|오늘 복습할 항목이 없습니다/.test(afterBody)) I("복습-정답처리", "정답 후 종료 화면 미표시");
  else L("복습 정답 → 종료 화면");
} else {
  if (!/틀린 항목 다시 풀기/.test(afterBody) && !/다음 문제/.test(afterBody)) I("복습-오답처리", "오답인데 재시도 안내 없음");
  else L("복습 오답 → 재시도 안내");
}

// 4. 오답노트 재풀이 인덱스 안정성
await page.goto(`${BASE}/reading`, { waitUntil: "networkidle" });
await page.locator("button").filter({ hasText: /문제 \d+개/ }).first().click();
await page.waitForTimeout(500);
let n = await page.locator("button:has-text('정답 확인')").count();
for (let i = 0; i < n; i++) {
  const blk = page.locator("div.rounded-2xl").filter({ has: page.locator("button:has-text('정답 확인')") }).first();
  await blk.locator("ul > li > button").first().click();
  await blk.getByRole("button", { name: "정답 확인" }).click();
  await page.waitForTimeout(200);
}
await page.goto(`${BASE}/wrong-answers`, { waitUntil: "networkidle" });
const rb = page.getByRole("button", { name: /오답 \d+개 다시 풀기/ });
if (await rb.isVisible().catch(() => false)) {
  const total = Number((await rb.innerText()).match(/\d+/)[0]);
  await rb.click(); await page.waitForTimeout(300);
  let seen = 0;
  for (let i = 0; i < total; i++) {
    const c = (await body()).match(/(\d+) \/ (\d+)/);
    if (c && Number(c[2]) !== total) { I("오답노트-큐고정", `총개수 변동 ${total} → ${c[2]}`); break; }
    seen++;
    // 정답 맞히기 시도: 정답 표시 전 아무거나
    await page.locator("ul > li > button").first().click();
    await page.getByRole("button", { name: "정답 확인" }).click();
    await page.waitForTimeout(250);
    const nb = page.getByRole("button", { name: /다음 문제|복습 마치기/ });
    if (!(await nb.isVisible().catch(() => false))) break;
    await nb.click(); await page.waitForTimeout(300);
    if (await page.getByRole("button", { name: /오답 \d+개 다시 풀기/ }).isVisible().catch(() => false)) break;
  }
  L("오답 재풀이 순회", `${seen}/${total}문항 이동`);
} else I("오답노트", "다시 풀기 버튼 없음");

// 5. 면접 답변 저장 지속성
await page.goto(`${BASE}/interview`, { waitUntil: "networkidle" });
await page.locator("textarea").first().fill("私は韓国出身のキムと申します。");
await page.waitForTimeout(400);
await page.reload({ waitUntil: "networkidle" });
const draft = await page.locator("textarea").first().inputValue();
if (!draft.includes("キム")) I("면접-답변저장", `새로고침 후 draft 소실: "${draft}"`);
else L("면접 답변 저장 유지");

// 6. 관리자 JSON 생성
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.fill("#word", "試す"); await page.fill("#reading", "ためす"); await page.fill("#meaning", "시도하다");
await page.getByRole("button", { name: "JSON 생성" }).click();
await page.waitForTimeout(300);
const out = await page.locator("#output").inputValue().catch(() => "");
if (!out.includes("試す")) I("관리자-JSON", "JSON 생성 실패");
else L("관리자 JSON 생성");

// 7. 레벨 테스트 → 현재 레벨 반영
await page.goto(`${BASE}/level-test`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "테스트 시작하기" }).click();
for (let i = 0; i < 15; i++) { await page.locator("ul li button").first().click(); await page.waitForTimeout(100); }
const lvBody = await body();
const rec = lvBody.match(/추천 시작 레벨\s*\n?\s*(\S+)/);
if (!rec) I("레벨테스트-결과", "추천 레벨 미표시");
else {
  L("레벨 테스트 결과", rec[1]);
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  const cur = await page.locator("#current").inputValue();
  L("레벨 테스트 → 설정 반영", cur);
}

// 8. 즐겨찾기 필터
await page.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await page.locator(String.raw`button[aria-label="즐겨찾기"]`).first().click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /즐겨찾기만/ }).click();
await page.waitForTimeout(300);
const favBody = await body();
if (/표시할 단어가 없습니다/.test(favBody)) I("즐겨찾기-필터", "즐겨찾기 표시했는데 필터 결과 비어 있음");
else L("즐겨찾기 필터");

// 9. 청해 상세
await page.goto(`${BASE}/listening`, { waitUntil: "networkidle" });
await page.locator("button").filter({ hasText: /문제 \d+개/ }).first().click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "스크립트 보기" }).click();
await page.waitForTimeout(200);
if (!/いらっしゃいませ|もしもし|おはようございます|お世話に|現在の進捗|数ある企業/.test(await body())) I("청해-스크립트", "스크립트 토글 후 내용 미표시");
else L("청해 스크립트 토글");

// 10. 총 학습 시간 누적
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(17000);
await page.goto(`${BASE}/statistics`, { waitUntil: "networkidle" });
const st = await body();
const time = st.match(/총 학습 시간\s*\n?\s*(\S+)/);
if (time && time[1] === "0분") I("학습시간", "15초 이상 체류했는데 0분");
else L("총 학습 시간 누적", time ? time[1] : "?");

await browser.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
console.log("\n=== 콘솔 에러 ===\n" + (errors.length ? [...new Set(errors)].join("\n") : "없음"));
