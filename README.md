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
| `/vocabulary` | 단어 | **학습**(뜻·읽기·예문 전부 표시) / **테스트**(뒤집기 카드) / 목록, 즐겨찾기, 발음 |
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
- `tests/qa-sync.mjs` — 기기 간 진도 동기화 · 로그아웃 · 잘못된 비밀번호 거부
- `tests/qa-persistence.mjs` — 저장 전에 새로고침해도 즐겨찾기·오답 기록이 남는지
- `tests/qa-basics.mjs` — 가나 표·연습, 단어 학습 모드에서 뜻·읽기·예문 노출
- `tests/qa-speech.mjs` — 발음 재생이 일본어 음성으로, 한자가 아닌 읽기로 나가는지

콘텐츠 JSON 무결성 검사는 브라우저 없이 바로 돌릴 수 있습니다.

```bash
npm run validate   # id 중복, 필수 필드 누락, 레벨 불일치, 잘못 섞인 문자 검사
```

---

## 발음 재생

브라우저 음성 합성(Web Speech API)을 사용합니다. 두 가지를 지킵니다.

- **일본어 음성을 명시적으로 고릅니다.** `lang`만 지정하면 일본어 음성이 없는 기기에서
  시스템 기본 음성으로 재생돼, 한자를 한국어 한자음으로 읽어 버립니다(私 → "사").
  일본어 음성이 없으면 재생하지 않고 안내를 표시합니다.
- **한자가 아니라 읽기(かな)를 넘깁니다.** 한자를 그대로 넘기면 음성 엔진이 읽기를
  잘못 고를 수 있습니다(私 → "わたくし").

일본어 음성 추가: macOS는 시스템 설정 → 손쉬운 사용 → 읽기 콘텐츠 → 시스템 음성,
Windows는 설정 → 시간 및 언어 → 언어 및 지역에서 일본어를 추가합니다.

---

## 데이터 저장 방식

계정과 학습 기록은 **Postgres(Neon)** 에 저장됩니다. 다른 기기에서 로그인해도 진도가 그대로 이어집니다.

- 인증: 이메일 + 비밀번호. 비밀번호는 scrypt로 해시해 저장하고, 세션은 httpOnly 쿠키(30일)입니다.
- 학습 기록: `UserState.data` (JSON) 한 덩어리. 클라이언트 스토어의 `UserData`와 1:1로 대응합니다.
- 동기화: 화면을 열 때 서버 기록을 불러오고, 학습이 바뀌면 1.5초 모았다가 자동 저장합니다.
  탭을 닫거나 숨기면 남은 변경분을 즉시 올립니다.
- **충돌 처리**: 각 기록에 `updatedAt`(마지막 변경)과 `syncedAt`(마지막 저장 성공)을 두고,
  아직 못 올린 변경이 남아 있으면 브라우저 쪽을 최신으로 봅니다. 즐겨찾기·오답노트·설정처럼
  경험치가 늘지 않는 변경도 이 방식으로 보호됩니다.
- **오프라인/서버 없음**: `DATABASE_URL`이 없거나 연결이 끊기면 브라우저 저장만으로 계속 동작하고,
  다시 연결되면 밀린 변경을 올립니다.

### DB 준비

Vercel 마켓플레이스에서 Neon을 설치하면 `DATABASE_URL`이 자동으로 주입됩니다.

```bash
vercel integration add neon     # 최초 1회 (브라우저에서 약관 동의 필요)
vercel env pull .env.local --yes
npm run db:push                 # 스키마 변경 시 마이그레이션 생성 + 반영
npm run db:migrate              # 기존 마이그레이션만 적용 (배포 환경)
```

스키마는 `prisma/schema.prisma` — `User` / `Session` / `UserState` 세 테이블입니다.
학습 콘텐츠는 DB가 아니라 `src/data`의 JSON 파일로 관리합니다.

---

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS v4
- Zustand (persist) — 학습 상태 (오프라인 캐시)
- Prisma 6 + Neon Postgres — 계정·학습 기록 서버 저장
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
├── app/api/           인증(signup·login·logout·me) · 학습 기록 저장(state)
├── lib/
│   ├── types.ts       콘텐츠 타입
│   ├── db.ts          Prisma 클라이언트 (지연 생성)
│   ├── auth.ts        비밀번호 해시 · 세션 쿠키
│   ├── sync.ts        서버 ↔ 브라우저 동기화
│   ├── content.ts     JSON 로딩 · 조회
│   ├── store.ts       사용자 · 진도 · 오답 · 통계 상태
│   ├── srs.ts         간격 반복 로직
│   ├── plan.ts        오늘의 학습 · 진행률 계산
│   ├── review.ts      복습 문제 생성
│   └── utils.ts       날짜 · 퍼센트 · 음성 합성 등
├── data/              학습 콘텐츠 JSON (kana.json 포함)
└── hooks/
```
