import { chromium } from "playwright";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const issues = [];
const email = `dirty${Date.now()}@ex.com`;

await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p.fill("#name", "더티테스트"); await p.fill("#email", email); await p.fill("#password", "1234");
await p.click('button[type="submit"]'); await p.waitForURL("**/onboarding");
await p.getByText("N5 수준입니다").click();
await p.getByRole("button", { name: /다음/ }).click();
await p.getByText("JLPT N1 + 일본 취업").click();
await p.getByRole("button", { name: /학습 시작하기/ }).click();
await p.waitForURL("**/dashboard");

// 경험치가 늘지 않는 변경들: 즐겨찾기 → 즉시 전체 새로고침
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.locator(String.raw`button[aria-label="즐겨찾기"]`).first().click();
await p.waitForTimeout(300);                       // 저장(1.5초)되기 전에
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });  // 전체 새로고침
await p.waitForTimeout(1500);
await p.getByRole("button", { name: /즐겨찾기만/ }).click();
await p.waitForTimeout(400);
const favLost = /표시할 단어가 없습니다/.test(await p.locator("body").innerText());
console.log("즐겨찾기 유지:", favLost ? "실패(사라짐)" : "성공");
if (favLost) issues.push("즐겨찾기가 새로고침으로 사라짐");

// 오답노트: 독해 오답 기록 → 저장 전에 새로고침
await p.goto(`${BASE}/reading`, { waitUntil: "networkidle" });
await p.locator("button").filter({ hasText: /문제 \d+개/ }).first().click();
await p.waitForTimeout(500);
const n = await p.locator("button:has-text('정답 확인')").count();
for (let i = 0; i < n; i++) {
  const blk = p.locator("div.rounded-2xl").filter({ has: p.locator("button:has-text('정답 확인')") }).first();
  await blk.locator("ul > li > button").first().click();
  await blk.getByRole("button", { name: "정답 확인" }).click();
  await p.waitForTimeout(150);
}
await p.goto(`${BASE}/wrong-answers`, { waitUntil: "networkidle" });  // 저장 전에 이동
await p.waitForTimeout(1800);
const t = await p.locator("body").innerText();
const kept = /오답 \d+개 다시 풀기|복습 전/.test(t);
console.log("오답노트 유지:", kept ? "성공" : "실패(사라짐)");
if (!kept) issues.push("오답 기록이 새로고침으로 사라짐");

await b.close();
console.log("\n이슈:", issues.length ? issues.join(" / ") : "없음");
