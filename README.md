# 니혼고 로드맵 — JLPT N1 + 일본 취업 학습 플랫폼

히라가나부터 JLPT N1, 그리고 일본 기업 면접까지 한 곳에서 준비하는 일본어 **학습 관리(LMS)** 웹앱입니다.
단어를 많이 보여주는 사이트가 아니라, **매일 무엇을 공부할지 정해 주고 · 결과를 기록하고 · 틀린 것을 다시 물어보는** 도구를 목표로 합니다.

---

## 실행 방법

```bash
npm install       # 처음 한 번만
npm run dev       # 개발 서버 → http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build
npm run start
```

---

## 화면 구성

| 경로 | 화면 | 핵심 기능 |
| --- | --- | --- |
| `/` | 메인 | 서비스 소개, 로드맵 요약 |
| `/signup`, `/login` | 회원가입 / 로그인 | 브라우저 로컬 계정 |
| `/onboarding` | 첫 설정 | 현재 실력 · 최종 목표 선택 |
| `/dashboard` | 대시보드 | 오늘의 학습, 진도율, 연속 학습일, 취약 영역, 뱃지 |
| `/roadmap` | 로드맵 | 기초 → N5 → … → N1 → 일본 취업 단계별 진행률 |
| `/level-test` | 레벨 테스트 | 15문항 진단 → 추천 시작 레벨 자동 설정 |
| `/vocabulary` | 단어 | 카드 학습, 알고있음/모름/다시보기, 즐겨찾기, 발음 |
| `/grammar` | 문법 | 의미·접속·예문·유사 문법 차이·출제 포인트 |
| `/kanji` | 한자 | 음독·훈독·대표 단어·예문·획수 |
| `/reading` | 독해 | 유형별 지문 + 문제 + 해설 + 해석 |
| `/listening` | 청해 | 재생 속도 조절, 스크립트, 해석, 주요 표현 |
| `/mock-test` | 모의고사 | N5~N1, 타이머, 영역별 점수, 취약 영역 |
| `/wrong-answers` | 오답노트 | 자동 저장, 모아서 다시 풀기 |
| `/review` | 복습 | 간격 반복(SRS) 일정에 따른 오늘의 복습 |
| `/business-japanese` | 비즈니스 일본어 | 존경어·겸양어·전화·메일·회의·거절 등 11개 분류 |
| `/interview` | 면접 일본어 | 질문 → 모범 답변 → 주요 표현 → 직접 답변 연습 |
| `/japanese-job` | 취업 준비 | 준비 진행률, 서류 체크리스트, 일본 회사 문화 |
| `/statistics` | 통계 | 주간·월간 학습량, 영역별 정답률 그래프 |
| `/settings` | 설정 | 레벨·목표·하루 분량 조정, 기록 초기화 |
| `/admin` | 콘텐츠 관리 | 수록 현황 확인, 새 항목 JSON 생성 |

데스크톱은 좌측 사이드바, 모바일은 하단 네비게이션(홈·학습·복습·통계·마이)을 사용합니다.

---

## 간격 반복 복습(SRS)

학습 결과에 따라 다음 복습 날짜가 자동으로 정해집니다.

```
학습 → 1일 → 3일 → 7일 → 14일 → 30일 → 60일
```

- **정답**이면 한 단계 올라가 간격이 길어집니다.
- **오답**(또는 단어 카드의 `모름` · `다시 보기`)이면 0단계로 떨어져 **같은 날 바로** 복습 목록에 올라옵니다.
- 오늘 복습할 항목은 대시보드와 `/review`에 표시됩니다.

관련 코드: `src/lib/srs.ts`, `src/lib/review.ts`

---

## 콘텐츠 추가 방법

일본어 콘텐츠는 코드에 하드코딩하지 않고 **JSON 파일**로 관리합니다.

```
src/data/
├── vocabulary/  n5.json n4.json n3.json n2.json n1.json
├── grammar/     basic.json n5.json n4.json n3.json n2.json n1.json
├── kanji/       n5.json n4.json n3.json n2.json n1.json
├── reading/     n5.json n4.json n3.json n2.json n1.json
├── listening/   all.json
├── job/         business.json interview.json
└── tests/       roadmap.json level-test.json mock.json
```

1. 해당 JSON 파일을 열어 배열에 항목을 추가합니다.
2. `id`는 파일 안에서 중복되지 않게 정합니다(예: `v-n3-025`).
3. 저장하면 개발 서버에서 바로 반영됩니다.

형식이 헷갈리면 `/admin` 화면에서 값을 입력하고 **JSON 생성**을 누르면 붙여 넣을 코드가 만들어집니다.
타입 정의는 `src/lib/types.ts`에 있습니다.

### 청해 음원 추가

현재는 음원 파일 없이 브라우저 음성 합성으로 재생합니다.
실제 MP3를 넣으려면 `public/audio/` 에 파일을 두고 `src/data/listening/all.json`의
`audioUrl`을 `"/audio/파일명.mp3"` 로 바꾸기만 하면 같은 화면에서 실제 음원이 재생됩니다.

---

## QA 테스트

주요 학습 흐름(가입 → 온보딩 → 단어 → 복습 → 독해 → 오답노트 → 모의고사 → 통계)을
실제 브라우저로 자동 점검하는 스크립트가 `tests/` 에 있습니다.

```bash
npx playwright install chromium   # 처음 한 번만 (브라우저 내려받기)
npm i -D playwright               # 처음 한 번만
npm run dev                       # 다른 터미널에서 실행해 둔 상태로
npm run qa                        # 로컬(localhost:3000) 점검
QA_BASE=https://jlpt-mu.vercel.app npm run qa   # 배포본 점검
```

- `tests/qa-smoke.mjs` — 전체 화면 렌더링 · 모바일 가로 넘침 · 콘솔 에러
- `tests/qa-deep.mjs` — 카운터 정확도 · 새로고침 후 데이터 유지 · 복습/오답 큐 동작

콘텐츠 JSON 무결성 검사는 브라우저 없이 바로 돌릴 수 있습니다.

```bash
npm run validate   # id 중복, 필수 필드 누락, 레벨 불일치, 잘못 섞인 문자 검사
```

---

## 데이터 저장 방식

현재 버전은 **서버 없이 브라우저(localStorage)** 에 계정과 학습 기록을 저장합니다.
설치나 DB 설정 없이 바로 쓸 수 있지만, 브라우저 데이터를 지우면 기록도 사라지고 기기 간 동기화는 되지 않습니다.

서버 DB로 옮길 때 쓸 수 있도록 목표 스키마를 `prisma/schema.prisma`에 PostgreSQL 기준으로 정의해 두었습니다.
스토어의 데이터 구조(`src/lib/store.ts`의 `UserData`)가 이 스키마와 1:1로 대응하므로,
저장소 어댑터만 교체하면 화면 코드를 거의 바꾸지 않고 서버 저장으로 전환할 수 있습니다.

---

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS v4
- Zustand (persist) — 학습 상태
- Recharts — 통계 그래프
- Lucide React — 아이콘

## 폴더 구조

```
src/
├── app/
│   ├── (auth)/        로그인 · 회원가입
│   ├── (app)/         로그인 후 모든 학습 화면 (사이드바 + 하단 네비)
│   ├── page.tsx       랜딩
│   ├── error.tsx      에러 화면
│   └── not-found.tsx  404
├── components/
│   ├── ui/            Button, Card, Badge, Progress, Tabs, 상태 표시
│   ├── layout/        사이드바, 하단 네비, 페이지 헤더, 학습 타이머
│   └── study/         문제 카드, 오디오 플레이어
├── lib/
│   ├── types.ts       콘텐츠 타입
│   ├── content.ts     JSON 로딩 · 조회
│   ├── store.ts       사용자 · 진도 · 오답 · 통계 상태
│   ├── srs.ts         간격 반복 로직
│   ├── plan.ts        오늘의 학습 · 진행률 계산
│   ├── review.ts      복습 문제 생성
│   └── utils.ts       날짜 · 퍼센트 · 음성 합성 등
├── data/              학습 콘텐츠 JSON
└── hooks/
```
