# 네이버 오늘의 단어 → Google Calendar 자동화 계획서

## 목표

매일 네이버에서 오늘의 영단어/일본어를 스크래핑하고,
Claude API로 예문과 발음을 생성하여 Google Calendar에 종일 이벤트로 업서트한다.

---

## 기술 스택

- **언어**: TypeScript (Node.js)
- **스크래핑**: Playwright (Chromium headless)
- **예문/발음 생성**: Anthropic Claude API
- **캘린더**: Google Calendar API
- **스케줄러**: OpenClaw cron

---

## 프로젝트 구조

```
naver-word-calendar/
├── src/
│   ├── scraper/
│   │   ├── english.ts       # 오늘의 영단어 스크래핑
│   │   └── japanese.ts      # 오늘의 일본어 스크래핑
│   ├── formatter/
│   │   └── index.ts         # Claude API로 예문·발음 생성
│   ├── calendar/
│   │   └── index.ts         # Google Calendar 업서트
│   ├── types.ts             # 공통 타입 정의
│   └── index.ts             # 진입점
├── .env                     # 환경변수 (gitignore)
├── .env.example             # 환경변수 템플릿
├── package.json
└── tsconfig.json
```

---

## 파일별 구현 명세

### `src/types.ts`

```typescript
export interface WordEntry {
  word: string;
  meaning: string;
  pronunciation: string;       // 한국어 발음 (Claude 생성)
  example: string;             // 예문 (Claude 생성)
  examplePronunciation: string;// 예문 한국어 발음 (Claude 생성)
}

export interface DailyWords {
  date: string;                // YYYY-MM-DD
  english: WordEntry[];
  japanese: WordEntry[];
}
```

---

### `src/scraper/english.ts`

- 접속 URL:
  `https://search.naver.com/search.naver?where=nexearch&query=%EC%98%A4%EB%8A%98%EC%9D%98+%EC%98%81%EB%8B%A8%EC%96%B4`
- Playwright로 페이지 로드 (`waitUntil: networkidle`)
- 컨테이너 셀렉터: `.sc_new.cs_dicstudy._fe_language_study`
- 단어 셀렉터: `.word` (복수 가능, 배열 순회)
- 의미 셀렉터: `.mean` (`.word`와 동일 인덱스로 매핑)
- 반환 타입: `{ word: string; meaning: string }[]`

---

### `src/scraper/japanese.ts`

- 접속 URL:
  `https://search.naver.com/search.naver?where=nexearch&query=%EC%98%A4%EB%8A%98%EC%9D%98+%EC%9D%BC%EB%B3%B8%EC%96%B4`
- 셀렉터 구조는 영어와 동일 (`.sc_new.cs_dicstudy._fe_language_study`, `.word`, `.mean`)
- 반환 타입: `{ word: string; meaning: string }[]`

---

### `src/formatter/index.ts`

스크래핑한 단어 배열을 Claude API에 전달하여 발음과 예문을 생성한다.

**프롬프트 명세 (영어)**
```
아래 영어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.
- pronunciation: 단어의 한국어 발음 (예: 어밴던)
- example: 해당 단어를 포함한 자연스러운 영어 예문 1개
- examplePronunciation: 예문의 한국어 발음

입력:
[{ word: "abandon", meaning: "버리다" }, ...]

출력 형식 (JSON만, 마크다운 없이):
[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }, ...]
```

**프롬프트 명세 (일본어)**
```
아래 일본어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.
- pronunciation: 단어의 한국어 발음 (예: 간바루)
- example: 해당 단어를 포함한 자연스러운 일본어 예문 1개
- examplePronunciation: 예문의 한국어 발음

입력:
[{ word: "頑張る", meaning: "열심히 하다" }, ...]

출력 형식 (JSON만, 마크다운 없이):
[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }, ...]
```
- OpenClaw에서 사용되는 Provider를 기준으로 프롬프트를 실행
- 응답에서 JSON 파싱 후 스크래핑 결과와 병합하여 `WordEntry[]` 반환

---

### `src/calendar/index.ts`

**인증**: Service Account (JSON 키 파일 방식)

- `googleapis`의 `google.auth.GoogleAuth`를 사용
- `keyFile` 또는 `credentials`에 서비스 계정 JSON 경로 지정
- scope: `https://www.googleapis.com/auth/calendar`

**업서트 전략**:
1. `eventId = naver-word-{YYYY-MM-DD}` 고정 ID 사용
2. `events.patch`로 시도 → 404면 `events.insert`로 폴백

**이벤트 명세**:
```
summary : 📚 오늘의 단어 (YYYY-MM-DD)
start   : { date: "YYYY-MM-DD" }   // 종일 이벤트
end     : { date: "YYYY-MM-DD" }
attendees: [{ email: process.env.ATTENDEE_EMAIL }]
description: 아래 포맷 참고
```

**description 포맷**:
```
영단어[1]: abandon
의미: 버리다, 포기하다
발음: 어밴던
예문: She decided to abandon the project.
예문 발음: 쉬 디사이디드 투 어밴던 더 프로젝트

영단어[2]: ...

────────────────

일본어단어[1]: 頑張る
의미: 열심히 하다, 노력하다
발음: 간바루
예문: 毎日頑張ることが大切です。
예문 발음: 마이니치 간바루 코토가 타이세츠데스

일본어단어[2]: ...
```

---

### `src/index.ts`

진입점. 아래 순서로 실행:

1. Playwright 브라우저 시작 (headless: true)
2. `scrapeEnglishWords(page)` 호출
3. `scrapeJapaneseWords(page)` 호출
4. 브라우저 종료
5. `generateFormatted(englishRaw, 'en')` → `WordEntry[]`
6. `generateFormatted(japaneseRaw, 'ja')` → `WordEntry[]`
7. `upsertCalendarEvent({ date, english, japanese })` 호출

---

### `.env.example`

```
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
CALENDAR_ID=
ATTENDEE_EMAIL=
ANTHROPIC_API_KEY=
```

---

### `package.json` 주요 의존성

```json
{
  "dependencies": {
    "playwright": "^1.44.0",
    "googleapis": "^140.0.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "ts-node": "^10.9.2",
    "@types/node": "^20.14.0"
  },
  "scripts": {
    "start": "ts-node src/index.ts"
  }
}
```

---

## OpenClaw cron 등록

프로젝트 완성 후 아래 명령어로 cron 등록:

```bash
openclaw cron add \
  --name "네이버 오늘의 단어 캘린더" \
  --cron "0 9 * * *" \
  --tz "Asia/Seoul" \
  --session isolated \
  --message "naver-word-calendar 프로젝트 디렉토리에서 npm start를 실행해줘" \
  --announce
```

---

## 환경 사전 준비 사항

OpenClaw가 코드 작성 전에 아래를 확인/설치해야 한다:

1. Node.js 18 이상 설치 여부 확인 (`node --version`)
2. 프로젝트 루트에 `.env` 파일 생성 및 값 입력
3. `npm install` 실행
4. `npx playwright install chromium` 실행
6. 해당 서비스 계정 이메일을 Google Calendar 공유 설정에서 **편집자**로 추가
