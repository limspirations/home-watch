# 수도권 집 후보 매매가 트래킹

현재 완성된 사이트의 **2026-11-24 최종 공개 버전(버전 11)**을 독립 정적 웹 프로젝트로 내보낸 파일입니다. 원본 소스 커밋: `50e5eb5f27392e6a10b96dc21e41d90e5dd8461e`.

현재 디자인, 레이아웃, 카드·상세 화면, 실거래가 그래프와 표, 로컬 저장 및 추가 매뉴얼을 유지했습니다. **이 ZIP을 만들면서 GitHub 저장소 생성·업로드·배포 또는 Google/외부 서비스 인증을 수행하지 않았습니다.**

## 가장 먼저: 실행하기

ZIP을 풀고 `Home_Watch_Standalone_Final` 폴더에서 실행합니다.

```sh
npm start
```

브라우저에서 `http://127.0.0.1:4173/`을 엽니다. 기본 기능에는 **Node.js 22 이상** 외에 설치할 패키지가 없습니다. `npm install`이나 빌드도 필요 없습니다. 폴더의 `index.html`을 더블클릭하는 `file://` 실행 대신 HTTP 서버를 사용하세요.

Python 3가 있다면 Node 없이도 실행할 수 있습니다.

```sh
python3 -m http.server 4173 --directory dist
```

다른 포트: macOS/Linux에서는 `PORT=8000 npm start`, PowerShell에서는 `$env:PORT=8000; npm start`를 사용합니다. `.env`의 PORT를 읽으려면 `node --env-file=.env scripts/serve.mjs`로 실행합니다. 기본 `npm start`는 `.env`를 자동으로 읽지 않습니다. 포함된 서버는 로컬 확인용이며 `127.0.0.1`에서만 수신합니다.

## 구현된 기능과 연결이 필요한 기능

| 기능 | ZIP의 현재 상태 |
|---|---|
| 동탄·광교·기흥·수원 × 가격대 비교 보드 | 구현됨. 4억원 이상, 낮은 가격부터 표시 |
| 카드 검색, 상세 화면, 목적·주소·전용면적·매물 정보 | 구현됨. 전용면적은 상세에서 확인 |
| 현재 대표 매물 호가 | 확인 당시 네이버 매물 1건의 가격 포함. 실시간 시세 아님 |
| 최근 10개년 연평균 매매 실거래가 그래프 | 구현됨. 원래 화면으로 복구한 상태를 유지 |
| 면적 구간 선택, 연간 평균가·건수·전년 대비 표 | 구현됨 |
| 최근 개별 거래 내역 | 확보된 자료 범위에서 구현됨 |
| 후보 추가·삭제, 검토 메모 저장 | 브라우저 localStorage로 구현됨 |
| JSON 백업 내보내기·불러오기 | 구현됨 |
| GitHub용 아파트 추가 매뉴얼·프롬프트 복사 | 구현됨. 프롬프트 복사는 HTTPS 또는 localhost에서 사용 |
| 계정 로그인·다른 기기와 동기화 | Supabase 어댑터와 SQL만 준비됨. 기본 설정은 꺼짐이며 연결·실기기 검증 필요 |
| 실시간 네이버/KB 수집·정기 갱신 | 구현되지 않음. 수집 API·서버·스케줄러 없음 |
| 네이버와 KB의 10년 시세를 두 선으로 비교 | 현재 화면에서 사용하지 않음. 사용자 요청에 따라 실거래가 화면으로 복구 |
| Google 로그인·ChatGPT 로그인·ChatGPT 호스팅 | 필요 없음. 로그인 없이 핵심 기능 사용 가능 |

`dist/asking-history.js`와 `dist/provider-history.js`는 이전 시세 비교 작업의 소스·부분 데이터로 보존했습니다. 현재 `index.html`에서는 로드하지 않습니다. 이 파일이 존재한다고 모든 단지의 두 출처 시세 비교가 완성된 것은 아닙니다. 현재 상세 화면은 `long-history.js`와 `price-history.js`를 사용합니다. 별도의 ‘내 호가 기록’ 수동 입력란은 없습니다.

## 저장된 데이터와 이전 범위 — 중요

ZIP에는 다음이 **전부 포함**됩니다.

- 소스에 저장된 기본 후보 10개와 확인 당시의 대표 호가, 주소, 목적, 면적, 동·층, 메모, 링크.
- 기존 연간 실거래 집계와 최근 개별 거래 자료 및 출처·확인일.
- 기존 KB 참고 기록 등 각 기본 항목에 보관된 데이터.
- `data/default-board-backup.json`: 초기화된 기본 목록을 실제 앱에서 내보낸 형식과 같은 `{version:1,data:[...]}`로 저장한 복원용 파일.
- `data/transaction-history.json`: 장기 실거래 자료의 JSON 사본.
- `data/export-info.json`: 내보낸 소스 버전과 포함 범위.

**사용자가 iPhone/다른 브라우저에서 추가·수정한 개인 후보·메모는 이 ZIP에 자동 포함되지 않습니다.** 그 기록은 해당 브라우저에만 있고, 서버 소스에서 읽을 수 없습니다. 별도로 받은 개인 백업 파일도 이 프로젝트에는 제공되지 않았습니다. 기본 데이터와 개인 데이터가 같다고 가정하지 않았습니다.

개인 기록을 그대로 옮기는 순서:

1. 기존 사이트를 **그 기록을 저장했던 기기와 브라우저**에서 엽니다.
2. **백업 내보내기**를 눌러 JSON을 다운로드하고 별도 보관합니다.
3. 새 독립 사이트를 열고 **백업 불러오기**로 해당 JSON을 선택합니다.
4. 교체 확인 후 후보 수와 메모를 확인합니다. 불러오기는 새 사이트의 목록 전체를 백업으로 교체합니다.
5. 다른 기기에도 옮길 때는 같은 백업을 각각 불러오거나, 아래 선택 기능인 Supabase를 별도로 설정합니다.

localStorage는 사이트의 출처(프로토콜·호스트·포트)별로 분리되므로 기존 도메인 → GitHub Pages, 또는 localhost → GitHub Pages로 자동 이동하지 않습니다. 브라우저 기록 삭제·시크릿 모드 종료·저장공간 정리 등에도 대비해 JSON을 보관하세요. 개인 백업은 공개 저장소에 올리지 마세요. `personal-backups/`는 기본 Git 제외 대상입니다.

## GitHub Pages 배포

### 파일 올리기

1. GitHub에서 본인 저장소를 준비합니다. 이름은 자유롭게 정해도 됩니다.
2. 이 폴더의 **내용물**을 저장소 루트에 올립니다. ZIP 파일 하나만 올리거나, `Home_Watch_Standalone_Final/` 폴더를 한 단계 더 중첩하지 마세요.
3. 특히 숨김 폴더 `.github/workflows/pages.yml`을 빠뜨리지 마세요. Git으로 올리면 함께 포함됩니다.

```sh
git init
git add .
git commit -m "Import standalone home tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

위 URL은 예시이므로 실제 본인 저장소 URL로 바꾸세요. 인증은 본인 환경에서 직접 설정합니다. 비밀번호·토큰을 소스나 config.js에 넣지 마세요. 이미 초기화된 원격 저장소라면 먼저 clone해서 그 안에 파일을 복사하며, 강제 push로 기존 내용을 덮어쓰지 마세요.

### Pages 켜기

1. 저장소 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
2. main에 push하거나 **Actions → Publish apartment tracker → Run workflow**로 실행합니다.
3. 워크플로는 소스 검사와 테스트 후 **dist 폴더만** 게시합니다.
4. Actions에서 성공을 확인하고 배포 결과에 실제로 표시된 URL을 엽니다.

별도 빌드, GitHub 토큰 파일, ChatGPT 설정은 필요 없습니다. 포함된 워크플로의 권한은 `contents: read`, `pages: write`, `id-token: write`입니다. Pages가 비활성화됐거나 저장소·계정 정책 때문에 워크플로가 거부되면 해당 설정을 확인해야 합니다. 비공개 저장소의 Pages 사용 가능 여부는 본인 GitHub 플랜과 정책을 확인하세요.

사용자 지정 도메인은 GitHub Pages 설정과 DNS를 따로 연결하면 됩니다. 현재 파일에는 특정 사용자·저장소의 URL, CNAME 또는 배포 완료 주소를 고정하지 않았습니다. GitHub Pages의 `/저장소명/` 하위 경로에서도 상대 경로로 JS를 불러옵니다.

공식 배포 문서: <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>

### 다른 정적 호스팅

`dist/` 내용 전체를 정적 웹 루트에 게시하면 됩니다. 별도 서버 API는 없습니다. HTTPS를 사용하면 프롬프트 복사가 정상 지원됩니다. CDN 등에서 `.mjs`를 JavaScript MIME 타입으로 제공해야 선택 동기화 모듈을 사용할 수 있습니다.

## 의존성 및 환경변수

### 기본 기능

- 런타임 npm 의존성 **0개**. 프레임워크·번들러·차트 라이브러리 없음.
- 그래프는 SVG, 저장은 localStorage, UI는 HTML/CSS/JavaScript 및 `<dialog>` 사용.
- 본문 표시·그래프·검색·메모·백업에는 외부 API 키나 환경변수 불필요.
- 기본 `dist/config.js`: 빈 Supabase 설정, `enableCloudSync: false`.
- 모든 화면 필수 파일과 데이터는 `dist/` 안에 있으며 ChatGPT SDK·세션·호스팅 메타데이터를 사용하지 않습니다.
- 네이버·KB 등 링크는 외부 원문을 여는 참고 링크입니다. 앱을 켤 때 해당 사이트에서 가격을 자동으로 받아오지 않습니다.

### 선택: Supabase 동기화

이 연결을 하지 않아도 사이트는 바로 작동합니다. ZIP 생성 중 서비스 생성이나 인증은 하지 않았습니다.

1. 본인 Supabase 프로젝트를 준비하고 SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. Email OTP/매직 링크 인증과 발신 설정을 준비합니다. Google 로그인은 필요하지 않습니다.
3. Authentication의 Site URL과 Redirect URL에 **실제 사이트의 전체 경로와 마지막 `/`**를 등록합니다. GitHub Pages 프로젝트 하위 경로를 빠뜨리지 마세요. 로컬에서 시험한다면 로컬 주소도 따로 허용합니다.
4. 아래 두 가지 설정 방법 중 하나를 사용합니다.

직접 설정: `dist/config.example.js`를 참고해 `dist/config.js`를 수정합니다.

```js
window.HOME_WATCH_CONFIG = {
  enableCloudSync: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY'
};
```

환경변수로 생성: `.env.example`을 `.env`로 복사하고 값을 넣은 후 실행합니다.

```sh
npm run configure
```

| 변수 | 기본값 | 사용처 |
|---|---|---|
| ENABLE_CLOUD_SYNC | false | configure 실행 시 동기화 사용 여부 |
| SUPABASE_URL | 빈 값 | 공개 프로젝트 URL |
| SUPABASE_PUBLISHABLE_KEY | 빈 값 | 공개 publishable 또는 legacy anon key |
| PORT | 4173 | 로컬 서버의 프로세스 환경변수. .env 로드는 앞의 실행 안내 참고 |

`npm run configure`는 `.env`의 설정을 **브라우저에 공개되는 dist/config.js로 작성**합니다. `service_role`, `sb_secret_` 키, DB 비밀번호, GitHub 토큰은 사용하지 마세요. GitHub Pages는 서버 환경변수를 런타임에 읽지 않습니다. `.env`를 저장소에 올릴 필요도 없습니다. 공개 URL·키를 설정한 config.js만 배포합니다.

5. 설정 후 다시 배포하면 기존의 숨겨진 동기화 영역이 표시됩니다. 이는 연결을 선택했을 때만 생기는 차이이며 기본 화면은 원본과 같습니다.
6. 이메일 링크를 같은 기기에서 열고 최초 목록을 동기화한 뒤 다른 기기에서 확인합니다. 현재 SQL과 어댑터는 준비된 상태이며 실제 이메일 발송·다중 기기 연결은 아직 검증하지 않았습니다.

선택 동기화가 활성화되면 `https://esm.sh/@supabase/supabase-js@2.49.8`에서 SDK를 불러옵니다. 이 선택 기능에는 esm.sh와 Supabase 네트워크 연결이 필요합니다. SDK 코드를 ZIP에 번들링한 것은 아닙니다. 기본 설정에서는 SDK 요청 자체를 하지 않습니다.

DB 테이블은 `home_watch_boards`이며 `user_id`, `items`(배열 JSON), `revision`, `updated_at`을 저장합니다. RLS는 로그인한 사용자 본인의 행만 허용합니다. revision 비교로 오래된 기기가 새 기록을 덮어쓰는 것을 막고, 충돌을 자동 병합하지는 않습니다.

공식 문서: <https://supabase.com/docs/guides/database/postgres/row-level-security> · <https://supabase.com/docs/guides/auth/auth-email-passwordless>

## 파일과 데이터 구조

```text
Home_Watch_Standalone_Final/
  README.md
  package.json
  .env.example
  .gitignore
  .github/workflows/pages.yml
  dist/
    index.html                 화면·스타일·모달
    app.js                     후보·현재 가격·검색·저장·백업
    price-history.js           장기 실거래 집계와 출처
    long-history.js            현재 사용하는 그래프·표
    addition-guide.js          GitHub 추가 매뉴얼·프롬프트
    config.js                  기본 로컬 전용 설정
    config.example.js          선택 동기화 설정 예시
    cloud.js                   선택 Supabase 이메일 인증·동기화
    cloud-store.mjs            revision 기반 DB 접근
    asking-history.js          비활성 이전 비교 UI 소스
    provider-history.js        비활성 부분 비교 데이터
  data/
    default-board-backup.json  기본 후보 10개의 복원용 JSON
    transaction-history.json   장기 자료 JSON 사본
    export-info.json           버전·포함 범위
  scripts/
    serve.mjs                  의존성 없는 로컬 정적 서버
    configure.mjs              선택 설정 생성
    check-project.mjs          필수 파일·구문 검사
  tests/
    cloud-store.test.mjs       동시 저장·충돌 처리 테스트
    standalone.test.mjs        10개 상세·백업·추가 매뉴얼 테스트
  supabase/schema.sql          선택 DB·접근 정책
```

### 후보와 백업

백업 루트는 `{ "version": 1, "data": [...] }`입니다. 가격 단위는 **억원**입니다.

| 후보 필드 | 의미 |
|---|---|
| id | 후보 고유 ID. `price-history.js`의 키와 일치해야 상세 장기 그래프 연결 |
| name / region / purpose / address | 단지명·보드 지역·목적 키워드·주소 |
| area / areaApprox | 전용㎡와 요약 표기 여부. null은 미확인 |
| kind / url | 카드 가격 기준과 원문 링크 |
| listing | 대표 매물의 동·층·설명 |
| history | `{date:'YYYY-MM-DD', price:억원, source?, url?}` 배열. 최신 값이 카드 가격 |
| referenceHistory | 기존 KB 참고값 보존. 현재 별도 시세 그래프로 표시하지 않음 |
| trade | 상세 화면의 최근 실거래 참고값 `{price,date,floor}` 또는 null |
| memo | 사용자 검토 메모 |

신규 기본 항목은 `app.js`의 seed와 기준 전환 로직을 함께 확인해 추가합니다. 앱 시작 시 초기 KB 기본값은 `naverBaselines`의 확인 매물 기준으로 전환됩니다. JSON 사본은 **이 전환을 적용한 후의 실제 기본 목록**입니다. 저장 목록을 사용하는 기존 방문자에게 추가할 때는 중복 검사와 마이그레이션을 함께 구현해야 합니다. 기본 호가 이력은 기존 소스와 데이터를 보존하기 위한 구조이며, 화면에 새 수동 가격 입력 폼을 추가한 것은 아닙니다.

브라우저 저장 키는 호환성을 위해 `hyokyung-home-watch-v1`을 유지합니다. 선택 동기화 시 계정별 키는 `hyokyung-home-watch-user-<id>`이며 동기화 상태도 별도로 저장합니다. 기존 사이트의 로컬 데이터에는 접근하지 않고, 새 출처의 localStorage에 저장합니다.

### 장기 실거래 자료

`window.PRICE_HISTORY[후보id]`의 구조:

- `areaBands`: 전용면적을 5㎡ 단위 올림으로 묶은 구간.
- `annual`: `{year, areaBand, price, count}`. 미확보 가격은 null이며 0원으로 그리지 않습니다.
- `transactions`: `{date, area, floor, price}` 개별 거래.
- `source`, `annualSource`, `sourceLabel`, `checkedAt`, `sourceUpdated`, `groupingNote`: 출처·확인일·집계 설명.

현재 그래프 연도는 원본과 같은 **2017–2026 고정 범위**입니다. 해가 바뀌어도 자동으로 새 연도 자료가 생기지 않습니다. 기본 면적은 9개 단지에서 2017–2026, 기흥역센트럴푸르지오는 2019–2026만 확보했습니다. 2026년은 확인일 기준 집계 중입니다. 다른 면적 구간은 일부 연도가 비어 있습니다. 신규 후보는 자료를 별도로 넣기 전까지 미확보 안내를 표시합니다.

자료는 DAPT 공개 연평균 집계, 삼성래미안의 실까 전용84㎡형 집계, 모아미래도의 오늘집값 공개 거래 표시값 등을 사용한 기존 데이터를 그대로 유지했습니다. 모아미래도는 취소 표기·동일 조건 중복 제외 후 연평균을 계산했으며 3건 미만을 비워둔 자료입니다. 개별 거래의 반올림·제외 기준 등은 각 항목의 출처와 설명을 확인하세요. 이 내보내기 작업은 가격을 새로 수집하거나 기존 수치를 재검증한 작업이 아닙니다.

## 검증 및 운영

```sh
npm run check
npm test
```

검사 대상은 로컬 스크립트 경로·구문, 후보 10개의 상세 그래프·표 생성, 초기 스냅샷 일치, 메모 포함 백업 왕복, 프롬프트 생성·복사, 선택 DB 충돌 처리입니다. DB 테스트는 모의 클라이언트이며 실제 Supabase 서비스에 로그인하지 않습니다. 브라우저의 실제 화면 픽셀 비교나 GitHub Pages 실배포 확인은 이번 ZIP 생성 범위에 포함하지 않았습니다.

원본과 달라진 부분은 독립 실행용 문서·서버·검사·배포 파일 추가, ChatGPT 전용 `.openai`·Git 내부 메타데이터 제외, 선택 동기화의 명시적 활성화 설정뿐입니다. 핵심 앱·실거래 데이터·디자인은 원본을 유지했습니다.

가격을 갱신하거나 후보를 추가할 때는 원문·확인일·면적을 함께 기록하고, 배포 전 JSON 백업과 검증을 실행하세요. 저장소 수정 후 main에 push하면 설정된 Pages 워크플로가 배포합니다.
