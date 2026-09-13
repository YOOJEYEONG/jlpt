import { chromium } from "playwright";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const b = await chromium.launch();
process.on("exit", () => { console.log(log.join("\n")); console.log("이슈:", issues.join(" / ") || "없음"); });
const log = [], issues = [];
const email = `srv${Date.now()}@ex.com`;

// --- 기기 1 ---
const ctx1 = await b.newContext();
const p1 = await ctx1.newPage();
const errs = [];
p1.on("pageerror", (e) => errs.push(e.message));
p1.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });

await p1.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p1.fill("#name", "동기화테스트"); await p1.fill("#email", email); await p1.fill("#password", "1234");
await p1.click('button[type="submit"]');
await p1.waitForURL("**/onboarding", { timeout: 15000 });
log.push("기기1: 가입 → 온보딩");

await p1.getByText("N3 수준입니다").click();
await p1.getByRole("button", { name: /다음/ }).click();
await p1.getByText("JLPT N1 + 일본 취업").click();
await p1.getByRole("button", { name: /학습 시작하기/ }).click();
await p1.waitForURL("**/dashboard", { timeout: 15000 });

await p1.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
for (let i = 0; i < 5; i++) {
  await p1.getByRole("button", { name: "뜻 확인하기" }).click();
  await p1.getByRole("button", { name: /알고 있음/ }).click();
  await p1.waitForTimeout(220);
}
await p1.goto(`${BASE}/grammar`, { waitUntil: "networkidle" });
await p1.locator("button[aria-expanded]").first().click();
await p1.getByRole("button", { name: /이해했어요/ }).click();
await p1.waitForTimeout(2500); // 자동 업로드 대기

await p1.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const t1 = await p1.locator("body").innerText();
const w1 = t1.match(/단어\s*(\d+) \/ (\d+)/)?.[1];
const g1 = t1.match(/문법\s*(\d+) \/ (\d+)/)?.[1];
log.push(`기기1 학습: 단어 ${w1} / 문법 ${g1}`);

// --- 기기 2 (완전히 다른 브라우저 컨텍스트) ---
const ctx2 = await b.newContext();
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p2.fill("#email", email); await p2.fill("#password", "1234");
await p2.click('button[type="submit"]');
try { await p2.waitForURL("**/dashboard", { timeout: 15000 }); }
catch { issues.push("기기2: 로그인 실패 — " + (await p2.locator("body").innerText()).slice(0, 120)); }

if (p2.url().includes("dashboard")) {
  await p2.waitForTimeout(1200);
  const t2 = await p2.locator("body").innerText();
  const w2 = t2.match(/단어\s*(\d+) \/ (\d+)/)?.[1];
  const g2 = t2.match(/문법\s*(\d+) \/ (\d+)/)?.[1];
  const name = t2.match(/안녕하세요, (\S+)님/)?.[1];
  log.push(`기기2 로그인 직후: 단어 ${w2} / 문법 ${g2} / 이름 ${name}`);
  if (w2 !== w1 || g2 !== g1) issues.push(`기기2 진도 불일치: 기대 ${w1}/${g1}, 실제 ${w2}/${g2}`);

  // 기기2에서 추가 학습 → 기기1로 돌아가 반영 확인
  await p2.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(1000);
  log.push("기기2 단어페이지 상태: " + (await p2.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 260));
  for (let i = 0; i < 2; i++) {
    await p2.getByRole("button", { name: "뜻 확인하기" }).click();
    await p2.getByRole("button", { name: /알고 있음/ }).click();
    await p2.waitForTimeout(220);
  }
  await p2.waitForTimeout(2500);

  await p1.reload({ waitUntil: "networkidle" });
  await p1.waitForTimeout(1200);
  const t3 = await p1.locator("body").innerText();
  const w3 = t3.match(/단어\s*(\d+) \/ (\d+)/)?.[1];
  log.push(`기기1 새로고침 후: 단어 ${w3} (기기2에서 2개 추가)`);
  if (Number(w3) !== Number(w1) + 2) issues.push(`양방향 동기화 실패: 기대 ${Number(w1)+2}, 실제 ${w3}`);
}

// --- 로그아웃 후 세션 만료 확인 ---
await p2.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await p2.getByRole("button", { name: /로그아웃/ }).click();
await p2.waitForTimeout(1000);
await p2.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await p2.waitForTimeout(1500);
log.push("로그아웃 후 /dashboard → " + (p2.url().includes("login") ? "로그인으로 이동(정상)" : "여전히 접근 가능(문제)"));
if (!p2.url().includes("login")) issues.push("로그아웃 후에도 대시보드 접근 가능");

// --- 잘못된 비밀번호 ---
await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p2.fill("#email", email); await p2.fill("#password", "wrong");
await p2.click('button[type="submit"]');
await p2.waitForTimeout(1200);
const errText = await p2.locator("body").innerText();
log.push("틀린 비밀번호: " + (/일치하지 않습니다/.test(errText) ? "거부됨(정상)" : "통과됨(문제)"));
if (!/일치하지 않습니다/.test(errText)) issues.push("틀린 비밀번호로 로그인됨");

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
console.log("\n=== 콘솔 에러 ===\n" + (errs.length ? [...new Set(errs)].join("\n") : "없음"));
