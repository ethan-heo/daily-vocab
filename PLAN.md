# 네이버 오늘의 단어 → Google Calendar 자동화 계획서

## 목표

매일 네이버에서 오늘의 영단어/일본어를 스크래핑하고,
**OpenClaw가 사용하는 활성 provider**로 예문과 발음을 생성한 뒤 Google Calendar에 종일 이벤트로 업서트한다.

즉, 이 프로젝트는 **스크래핑 + 캘린더 반영 로직을 TypeScript 프로젝트로 제공**하고,
**생성 단계는 OpenClaw agent turn이 담당**하는 구조를 전제로 한다.

---

## 기술 스택

- **언어**: TypeScript (Node.js)
- **스크래핑**: Playwright (Chromium headless)
- **예문/발음 생성**: OpenClaw agent/provider
- **캘린더**: Google Calendar API
- **스케줄러**: OpenClaw cron

---

## 권장 구조

```
daily-vocab/
├── src/
│   ├── scraper/
│   │   ├── english.ts
│   │   └── japanese.ts
│   ├── formatter/
│   │   ├── prompt.ts      # OpenClaw에 넘길 프롬프트 생성
│   │   └── index.ts       # OpenClaw 출력 JSON 병합 유틸
│   ├── calendar/
│   │   └── index.ts
│   ├── run.ts             # 수집/저장 함수 분리
│   ├── types.ts
│   └── index.ts           # OpenClaw에서 import하기 쉬운 export 묶음
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 실행 아키텍처

### 1) Node 프로젝트가 담당하는 것
- 네이버 오늘의 영단어/일본어 스크래핑
- Google Calendar 이벤트 업서트
- OpenClaw가 쓸 프롬프트 문자열 생성
- OpenClaw 응답(JSON)을 실제 `WordEntry[]`로 병합

### 2) OpenClaw가 담당하는 것
- 활성 provider를 이용한 발음/예문 생성
- cron에서 전체 플로우 오케스트레이션

즉, `npm start` 같은 단독 배치보다,
**OpenClaw agent turn이 이 프로젝트 코드를 불러와 작업하는 방식**을 권장한다.

---

## OpenClaw 실행 플로우

1. OpenClaw가 `collectDailyWords()` 실행
2. 영어/일본어 raw 단어 수집
3. `buildFormattingPrompt(raw, language)`로 프롬프트 생성
4. OpenClaw가 자신의 활성 provider로 JSON 생성
5. `extractJsonArray()` + `mergeFormattedEntries()`로 `WordEntry[]` 구성
6. `buildDailyWordsPayload()` 생성
7. `saveDailyWords()`로 Google Calendar 업서트

---

## 파일별 역할

### `src/run.ts`
- `collectDailyWords()`
- `saveDailyWords()`
- `buildDailyWordsPayload()`

### `src/formatter/prompt.ts`
- 영어/일본어용 생성 프롬프트 반환

### `src/formatter/index.ts`
- OpenClaw 생성 결과(JSON 문자열) 후처리 유틸
- `mergeFormattedEntries()`
- `extractJsonArray()`
- `generateFormatted()`는 의도적으로 standalone Node에서 막아둠

### `src/index.ts`
- OpenClaw agent turn에서 import하기 좋은 export 집합

---

## 환경변수

`.env.example`

```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
CALENDAR_ID=
ATTENDEE_EMAIL=
```

---

## OpenClaw cron 권장 방식

이 프로젝트는 아래처럼 **에이전트 턴**으로 실행하는 것이 맞다.

예시 개념:

```text
매일 09:00 Asia/Seoul
→ OpenClaw agent turn 실행
→ daily-vocab 프로젝트의 collectDailyWords()로 raw 단어 수집
→ OpenClaw 활성 provider로 영어/일본어 예문/발음 JSON 생성
→ saveDailyWords()로 캘린더 업서트
→ 실패 시에만 알림
```

즉, 예전처럼 외부 API 키를 직접 박아 넣는 구조보다,
**OpenClaw가 생성 책임을 지고 프로젝트는 로컬 작업 모듈로 동작**하는 형태가 핵심이다.

---

## 환경 사전 준비 사항

1. Node.js 18 이상 설치 여부 확인
2. 프로젝트 루트에 `.env` 파일 생성 및 값 입력
3. `npm install` 실행
4. `npx playwright install chromium` 실행
5. 서비스 계정 이메일을 Google Calendar 공유 설정에서 **편집자**로 추가
6. OpenClaw cron은 `npm start` 직접 실행보다 **agentTurn 기반 orchestration**으로 등록
