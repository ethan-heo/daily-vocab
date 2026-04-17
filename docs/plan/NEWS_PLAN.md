# News Link Scraping Plan

## 목표

뉴스/아티클 링크를 스크래핑하여 Google 캘린더에 자동 업로드하는 cron 작업 구축.

---

## 프로젝트 구조

`daily-vocab`과 동일한 패턴으로 `daily-news` 디렉토리를 신설한다.

```
cron/
├── daily-vocab/          # 기존
└── daily-news/           # 신규
    ├── src/
    │   ├── index.ts           # 진입점
    │   ├── run.ts             # 실행 오케스트레이터
    │   ├── types.ts           # 공통 타입 (NewsItem 등)
    │   ├── scraper/
    │   │   ├── index.ts       # 스크래퍼 레지스트리 (소스 목록 관리)
    │   │   └── yozm.ts        # 요즘IT 스크래퍼
    │   └── calendar/
    │       └── index.ts       # Google Calendar 업로드
    ├── package.json
    └── tsconfig.json
```

---

## 스크래핑 소스

| 소스 | URL | 파일 |
|------|-----|------|
| 요즘IT | https://yozm.wishket.com/magazine/list/new/ | `scraper/yozm.ts` |

> 새로운 소스는 `scraper/` 디렉토리에 파일을 추가하고 `scraper/index.ts`에 등록하는 방식으로 확장한다.

---

## 모듈 설계

### `types.ts`
```ts
export interface NewsItem {
  title: string;
  url: string;
  source: string;      // 스크래핑 소스 이름 (e.g. "요즘IT")
  publishedAt?: string;
}
```

### `scraper/index.ts` — 스크래퍼 레지스트리
```ts
import { scrapeYozm } from './yozm';

export const scrapers = [scrapeYozm];
```
새 소스 추가 시 파일 생성 후 이 배열에만 추가하면 된다.

### 각 스크래퍼 인터페이스
```ts
// () => Promise<NewsItem[]>
export async function scrapeYozm(): Promise<NewsItem[]> { ... }
```
모든 스크래퍼는 동일한 시그니처를 따른다.

### `scraper/yozm.ts` — 스크래핑 상세
- 대상 URL: `https://yozm.wishket.com/magazine/list/new/`
- 아티클 컨테이너 셀렉터: `[data-testid="article-column-item--container"]`
- 각 컨테이너 내부의 `<a>` 태그 href를 수집하여 `NewsItem.url`로 사용
- 링크가 상대 경로인 경우 `https://yozm.wishket.com`을 붙여 절대 URL로 변환

### `calendar/index.ts`
- `daily-vocab`의 Google Calendar 연동 코드를 참고하여 구현
- 각 `NewsItem`을 당일 종일 일정으로 등록 (제목: `[소스] 아티클 제목`, 설명: URL)

---

## 실행 흐름

```
index.ts
  └─ run.ts
       ├─ 모든 스크래퍼 병렬 실행 (Promise.all)
       ├─ 결과 병합 및 중복 제거 (URL 기준)
       └─ Google Calendar에 일괄 업로드 (아이템이 없으면 업로드 생략)
```

---

## GitHub Actions

`daily-vocab`과 동일하게 `.github/workflows/daily-news.yml`을 추가하여 매일 지정 시각에 실행.

---

## 구현 순서

1. `daily-news/` 프로젝트 초기화 (package.json, tsconfig.json)
2. `types.ts` 작성
3. `scraper/yozm.ts` 구현 (Playwright로 링크 스크래핑)
4. `scraper/index.ts` 레지스트리 작성
5. `calendar/index.ts` 구현
6. `run.ts` / `index.ts` 작성
7. 로컬 테스트
8. GitHub Actions 워크플로 추가
