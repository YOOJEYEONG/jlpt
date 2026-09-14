import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const issues = [];
const log = [];
const errors = [];
const I = (id, d) => issues.push(`[ISSUE] ${id}: ${d}`);
const L = (id, d = "") => log.push(`[OK] ${id}${d ? " — " + d : ""}`);

const b = await chromium.launch();
const p = await (await b.newContext({ locale: "ko-KR" })).newPage();
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await p.fill("#name", "쓰기연습"); await p.fill("#email", `tr${Date.now()}@ex.com`); await p.fill("#password", "1234");
await p.click('button[type="submit"]'); await p.waitForURL("**/onboarding");
await p.getByText("일본어를 처음 시작합니다").click();
await p.getByRole("button", { name: /다음/ }).click();
await p.getByText("JLPT N1 + 일본 취업").click();
await p.getByRole("button", { name: /학습 시작하기/ }).click();
await p.waitForURL("**/dashboard");

await p.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
await p.getByRole("tab", { name: "따라쓰기" }).click();
await p.waitForTimeout(500);

const canvas = p.locator("canvas");
if (!(await canvas.isVisible())) { I("따라쓰기", "연습판이 보이지 않음"); }
else L("따라쓰기 연습판 표시");

const box = await canvas.boundingBox();

// 캔버스 픽셀을 읽어 '그리기 전 / 후'를 비교합니다.
const readPixels = () => p.evaluate(() => {
  const c = document.querySelector("canvas");
  const ctx = c.getContext("2d");
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let blue = 0;
  for (let i = 0; i < d.length; i += 4) {
    // 펜 색 #2f5bd8 근처 픽셀 수를 셉니다.
    if (d[i] < 90 && d[i + 1] > 60 && d[i + 1] < 130 && d[i + 2] > 180) blue++;
  }
  return blue;
});

const before = await readPixels();

// 마우스로 선 긋기
await p.mouse.move(box.x + 60, box.y + 60);
await p.mouse.down();
for (let i = 1; i <= 12; i++) await p.mouse.move(box.x + 60 + i * 15, box.y + 60 + i * 12);
await p.mouse.up();
await p.waitForTimeout(300);

const after = await readPixels();
L("그리기 전/후 펜 픽셀", `${before} → ${after}`);
if (after <= before) I("따라쓰기", "마우스로 그렸는데 캔버스에 획이 남지 않음");
else L("마우스로 획이 그려짐");

const strokeLabel = await p.locator("text=/쓴 획 \\d+/").innerText();
if (!/쓴 획 1/.test(strokeLabel)) I("획 카운트", `기대 '쓴 획 1', 실제 '${strokeLabel}'`);
else L("획 수 카운트", strokeLabel);

// 한 획 지우기
await p.getByRole("button", { name: /한 획 지우기/ }).click();
await p.waitForTimeout(300);
const afterUndo = await readPixels();
if (afterUndo > before) I("한 획 지우기", `획이 남아 있음 (${afterUndo})`);
else L("한 획 지우기 동작", `${after} → ${afterUndo}`);

// 안내 없이 모드 → 배경 글자가 사라지는지
const guideOn = await p.evaluate(() => {
  const c = document.querySelector("canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let gray = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i] < 235 && Math.abs(d[i] - d[i + 2]) < 12) gray++;
  return gray;
});
await p.getByRole("tab", { name: "없이" }).click();
await p.waitForTimeout(400);
const guideOff = await p.evaluate(() => {
  const c = document.querySelector("canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let gray = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i] < 235 && Math.abs(d[i] - d[i + 2]) < 12) gray++;
  return gray;
});
L("안내 글자 픽셀", `진하게 ${guideOn} → 없이 ${guideOff}`);
if (guideOff >= guideOn) I("안내 단계", "'없이'로 바꿔도 배경 글자가 그대로임");
else L("안내 진하기 단계 동작");

// 다 썼어요 → 진도 반영
await p.getByRole("button", { name: /다 썼어요/ }).click();
await p.waitForTimeout(500);
if (!/외운 글자 1 \/ 104/.test(await p.locator("body").innerText())) I("따라쓰기 진도", "'다 썼어요'가 진도에 반영되지 않음");
else L("따라쓰기 진도 반영", "1 / 104");

// 다음 글자로 넘어가면 획이 초기화되는지
const nextStroke = await p.locator("text=/쓴 획 \\d+/").innerText();
if (!/쓴 획 0/.test(nextStroke)) I("글자 전환", `다음 글자인데 획이 남음: ${nextStroke}`);
else L("다음 글자 전환 시 초기화");

// 가타카나 전환
await p.getByRole("tab", { name: "가타카나" }).click();
await p.waitForTimeout(400);
if (!(await p.locator("canvas").isVisible())) I("가타카나 따라쓰기", "연습판이 사라짐");
else L("가타카나 따라쓰기 전환");

// 모바일
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(`${BASE}/kana`, { waitUntil: "networkidle" });
await p.getByRole("tab", { name: "따라쓰기" }).click();
await p.waitForTimeout(400);
const sw = await p.evaluate(() => document.documentElement.scrollWidth);
if (sw > 391) I("모바일 가로넘침", `scrollWidth=${sw}`);
else L("모바일 가로 넘침 없음", `${sw}px`);

await b.close();
console.log(log.join("\n"));
console.log("\n=== 이슈 ===\n" + (issues.length ? issues.join("\n") : "없음"));
console.log("\n=== 콘솔 에러 ===\n" + (errors.length ? [...new Set(errors)].join("\n") : "없음"));
