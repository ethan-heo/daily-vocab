# 네이버 오늘의 단어 → Google Calendar 자동화 계획서

## 목표

매일 네이버에서 오늘의 영단어/일본어를 스크래핑하고,
Claude API로 예문과 발음을 생성하여 Google Calendar에 종일 이벤트로 업서트한다.

이 프로젝트는 **독립 실행형 Node.js 배치 작업**을 목표로 하며,
cron은 프로젝트 스크립트만 실행하면 된다.

---

## 기술 스택

- **언어**: TypeScript (Node.js)
- **스크래핑**: Playwright (Chromium headless)
- **예문/발음 생성**: Anthropic Claude API
- **캘린더**: Google Calendar API
- **스케줄러**: OpenClaw cron 또는 일반 시스템 cron

---

## 권장 구조

```
daily-vocab/
├── src/
│   ├── scraper/
│   │   ├── english.ts
│   │   └── japanese.ts
│   ├── formatter/
│   │   ├── prompt.ts
│   │   └── index.ts
│   ├── calendar/
│   │   └── index.ts
│   ├── run.ts
│   ├── types.ts
│   └── index.ts           # 단독 실행 엔트리포인트
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 실행 흐름

1. Playwright로 영어/일본어 오늘의 단어 스크래핑
2. Claude API로 각 단어의
   - 한국어 발음
   - 예문 1개
   - 예문 한국어 발음
   생성
3. 결과를 `WordEntry[]`로 병합
4. Google Calendar에 종일 이벤트 업서트

---

## 파일별 역할

### `src/run.ts`
- `collectDailyWords()`
- `saveDailyWords()`
- `buildDailyWordsPayload()`

### `src/formatter/prompt.ts`
- 영어/일본어 생성 프롬프트 반환

### `src/formatter/index.ts`
- Claude API 호출
- JSON 파싱
- `mergeFormattedEntries()`
- `extractJsonArray()`

### `src/index.ts`
- 전체 플로우를 실행하는 엔트리포인트
- `npm start` 시 이 파일이 실행됨

---

## 환경변수

```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
CALENDAR_ID=
ATTENDEE_EMAIL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

---

## 실행 방법

```bash
npm install
npx playwright install chromium
npm start
```

---

## cron 등록 개념

이제 cron은 단순하게 프로젝트 실행만 하면 된다.

예:

```bash
cd /Users/ethanheo/Documents/OpenClaw/cron/daily-vocab && npm start
```

OpenClaw cron을 쓴다면,
- 해당 디렉터리에서 `npm start` 실행
- 실패 시에만 알림
정도로 구성하면 된다.

---

## 환경 사전 준비 사항

1. Node.js 18 이상 설치 여부 확인
2. 프로젝트 루트에 `.env` 파일 생성 및 값 입력
3. `npm install` 실행
4. `npx playwright install chromium` 실행
5. 서비스 계정 이메일을 Google Calendar 공유 설정에서 **편집자**로 추가
6. Claude API 키 준비
