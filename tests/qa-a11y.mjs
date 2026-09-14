import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = [];
const log = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);

const PAGES = ["/", "/login", "/signup", "/dashboard", "/kana", "/vocabulary", "/grammar", "/kanji",
  "/reading", "/listening", "/mock-test", "/review", "/wrong-answers", "/roadmap", "/level-test",
  "/business-japanese", "/interview", "/japanese-job", "/statistics", "/settings", "/admin"];

const b = await chromium.launch();
const p = await (await b.newContext({ locale: "ko-KR" })).newPage();

await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p.fill("#name", "접근성"); await p.fill("#email", `ax${Date.now()}@ex.com`); await p.fill("#password", "1234");
await p.click('button[type="submit"]'); await p.waitForURL("**/onboarding");
await p.getByText("일본어를 처음 시작합니다").click();
await p.getByRole("button", { name: /다음/ }).click();
await p.getByText("JLPT N1 + 일본 취업").click();
await p.getByRole("button", { name: /학습 시작하기/ }).click();
await p.waitForURL("**/dashboard");

// 1. axe 자동 검사 (WCAG 2.2 AA)
let totalViolations = 0;
for (const path of PAGES) {
  await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const r = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  if (r.violations.length > 0) {
    totalViolations += r.violations.length;
    for (const v of r.violations) I(`axe ${path}`, `${v.id} (${v.impact}, ${v.nodes.length}건) ${v.help}`);
  }
}
if (totalViolations === 0) L("axe WCAG 2.2 AA", `${PAGES.length}개 페이지 위반 0`);

// 2. 본문 바로가기(skip link)
await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await p.keyboard.press("Tab");
const firstFocus = await p.evaluate(() => {
  const el = document.activeElement;
  return { text: el?.textContent?.trim(), href: el?.getAttribute("href"), visible: el ? getComputedStyle(el).position !== "absolute" || el.getBoundingClientRect().width > 1 : false };
});
if (firstFocus.href !== "#main") I("스킵 링크", `첫 Tab이 본문 바로가기가 아님: ${JSON.stringify(firstFocus)}`);
else if (!firstFocus.visible) I("스킵 링크", "포커스했는데 화면에 보이지 않음");
else L("본문 바로가기", `첫 Tab에서 노출 (${firstFocus.text})`);

// 3. 포커스 표시가 보이는지
await p.keyboard.press("Tab");
const outline = await p.evaluate(() => {
  const el = document.activeElement;
  const s = getComputedStyle(el);
  return { outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, tag: el?.tagName };
});
if (outline.outlineStyle === "none" || outline.outlineWidth === "0px") I("포커스 표시", `보이지 않음: ${JSON.stringify(outline)}`);
else L("키보드 포커스 표시", `${outline.tag} outline ${outline.outlineWidth}`);

// 4. 키보드만으로 학습 가능한지 (단어 '외웠어요'를 Enter로)
await p.goto(`${BASE}/vocabulary`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
const btn = p.getByRole("button", { name: /외웠어요/ });
await btn.focus();
await p.keyboard.press("Enter");
await p.waitForTimeout(500);
if (!/학습한 단어 1 \//.test(await p.locator("body").innerText())) I("키보드 조작", "Enter로 학습 완료가 되지 않음");
else L("키보드만으로 단어 학습");

// 5. 랜드마크와 제목 구조
await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const structure = await p.evaluate(() => ({
  main: document.querySelectorAll("main").length,
  navs: [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label")),
  h1: document.querySelectorAll("h1").length,
  headings: [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1])),
}));
if (structure.main !== 1) I("랜드마크", `main이 ${structure.main}개`);
else L("main 랜드마크 1개");
if (structure.navs.some((n) => !n)) I("랜드마크", `이름 없는 nav: ${JSON.stringify(structure.navs)}`);
else L("nav 랜드마크 이름", structure.navs.filter(Boolean).join(" / "));
if (structure.h1 !== 1) I("제목 구조", `h1이 ${structure.h1}개`);
else L("h1 1개");
const jumps = structure.headings.slice(1).filter((lvl, i) => lvl - structure.headings[i] > 1);
if (jumps.length > 0) I("제목 구조", `단계를 건너뜀: ${structure.headings.join(">")}`);
else L("제목 단계 연속", structure.headings.join(" > "));

// 6. 터치 타깃 24×24 (WCAG 2.2 AA)
const small = await p.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll("button, a[href], input, select")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // 포커스 전까지 숨겨지는 건너뛰기 링크 등은 제외합니다.
    if (r.width <= 2 && r.height <= 2) continue;
    if (r.width < 24 || r.height < 24) bad.push({ tag: el.tagName, label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return bad;
});
if (small.length > 0) I("터치 타깃", `24px 미만 ${small.length}개: ${JSON.stringify(small.slice(0, 3))}`);
else L("터치 타깃 24px 이상");

// 7. 문서 언어
const lang = await p.evaluate(() => document.documentElement.lang);
if (lang !== "ko") I("문서 언어", `lang=${lang}`);
else L("문서 언어 ko");

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
