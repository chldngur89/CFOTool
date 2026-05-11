# CFO Tool

삼국지 풍 UI로 만든 대표용 재무 전략 시뮬레이터입니다.  
현재는 `로컬 개발 + 배포 fallback + Supabase 저장 연결 준비`까지 진행된 상태입니다.

## 1. 프로젝트 개요

- 대표가 `현금`, `월매출`, `인건비`, `마케팅비`, `사무실비`를 바로 수정할 수 있습니다.
- 수정된 숫자를 기준으로 `런웨이`, `월 손익`, `24개월 시뮬레이션`을 확인할 수 있습니다.
- `방어`, `현상 유지`, `공격` 시나리오를 고르고 전략 슬라이더를 조정할 수 있습니다.
- 로컬 개발에서는 Ollama를 직접 호출해 전략안을 만들 수 있습니다.
- 배포 환경에서는 기본적으로 실제 Ollama를 부르지 않고, fallback 참모 문구만 보여줍니다.

## 2. 현재 구현된 기능

### 대시보드

- 메인 화면에서 `금고`, `인건비`, `마케팅비`, `사무실비`, `월 매출`을 바로 확인할 수 있습니다.
- 비용 카드 클릭 시 수정 팝업이 열립니다.
- 인건비는 `직원 수 x 300만원`으로 자동 계산됩니다.
- 최근 기록이 없을 때는 빈 상태 대신 응원 메시지와 시작 안내가 보입니다.
- 최근 6개월 기록이 있으면 기록 카드와 다음 전략 흐름이 보입니다.

### 시나리오/전략

- `방어적 선택`, `현상 유지`, `공격적 선택` 3개 시나리오가 있습니다.
- 시나리오 화면에서 3개의 안건과 추천 문구를 보여줍니다.
- `전략 세부 조정` 화면에서 다음 값을 슬라이더로 바꿀 수 있습니다.
  - 매출 성장
  - 인원 변동
  - 마케팅 투자
  - 가격 인상
- `전략안 3개 보기`, `상책 바로 반영`, `시뮬레이션 실행`이 연결되어 있습니다.

### 시뮬레이션

- 24개월 타임라인 미리보기가 있습니다.
- 시뮬레이션 결과 화면에서 월별 변화와 결과 요약을 확인할 수 있습니다.
- 큰 금액이 들어와도 차트가 화면을 덮지 않도록 정규화 처리되어 있습니다.

### 저장/계정

- Supabase 연동 코드가 들어가 있습니다.
- 로그인 사용자는 `workspace`, `metric snapshot`, `simulation run`, `AI brief`, `AI action log` 저장 구조를 사용합니다.
- Supabase가 비정상이거나 URL이 틀리면 앱이 죽지 않고 게스트 모드로 전환됩니다.
- 첫 화면은 DB 이슈가 있어도 바로 진입 가능합니다.

### AI/Ollama

- 로컬 개발 환경에서는 실제 Ollama를 직접 호출할 수 있습니다.
- 배포 환경에서는 기본적으로 Ollama 직접 호출을 막고 fallback 문구만 사용합니다.
- 나중에 외부 공개 가능한 Ollama URL을 붙이면 배포 환경에서도 실제 호출이 가능하도록 준비되어 있습니다.

## 3. 현재 중요한 런타임 정책

### AI 동작 정책

- `npm run dev` 로 띄운 로컬 개발 서버:
  - 기본값 `http://localhost:11434` 로 Ollama 직접 호출
- 배포 환경:
  - 기본값은 fallback 참모 문구만 사용
  - `VITE_ENABLE_REMOTE_OLLAMA=true` 와 공개 URL이 있을 때만 실제 Ollama 호출 허용

### Supabase 동작 정책

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 가 있으면 Supabase 연결을 시도합니다.
- 주소가 잘못되었거나 응답이 안 되면:
  - 저장된 auth 토큰 정리
  - 게스트 모드 전환
  - 첫 화면은 계속 사용 가능

## 4. 로컬 실행 방법

### 1. 설치

```bash
cd /Users/wh.choi/Desktop/Code/CFOTool
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

기본 주소:

```bash
http://localhost:5173
```

### 3. 빌드 검증

```bash
npm run build
```

## 5. 환경변수

프로젝트 루트에 `.env.local` 파일을 두고 사용합니다.

### Supabase

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 로컬 Ollama

```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:latest
```

### 배포 환경에서 외부 Ollama 허용

기본값은 꺼져 있습니다.

```bash
VITE_ENABLE_REMOTE_OLLAMA=true
VITE_OLLAMA_BASE_URL=https://YOUR-PUBLIC-OLLAMA-URL
VITE_OLLAMA_MODEL=llama3.1:latest
```

## 6. Supabase 테이블

현재 코드가 사용하도록 맞춘 테이블은 아래입니다.

- `cfo.cfo_profiles`
- `cfo.cfo_workspaces`
- `cfo.cfo_metric_snapshots`
- `cfo.cfo_simulation_runs`
- `cfo.cfo_ai_briefs`
- `cfo.cfo_ai_action_logs`

`cfo` 스키마는 Supabase `Exposed schemas` 에 포함되어 있어야 합니다.

## 7. 현재 확인된 이슈

### 1. Supabase URL 문제

현재 가장 큰 이슈는 Supabase URL입니다.

- 코드상 fallback 처리 자체는 정상
- 하지만 설정된 URL이 DNS 해석되지 않으면 로그인/저장이 동작하지 않음

확인 기준:

```bash
curl -I https://YOUR_PROJECT.supabase.co/auth/v1/health
```

이 요청이 실패하면 앱은 게스트 모드로 떨어집니다.

### 2. 번들 크기 경고

`vite build` 는 성공하지만 JS 번들 크기 경고가 있습니다.

## 8. 배포 체크리스트

### Vercel 환경변수

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OLLAMA_MODEL`
- 선택:
  - `VITE_OLLAMA_BASE_URL`
  - `VITE_ENABLE_REMOTE_OLLAMA`

### 배포 후 확인 순서

1. 첫 화면이 정상 진입되는지 확인
2. 배포 콘솔에 `localhost:11434` 호출이 없는지 확인
3. Supabase 연결이 되면 회원가입/로그인 확인
4. 금고/비용 수정 후 snapshot 저장 확인
5. 시뮬레이션 실행 후 simulation run 저장 확인

## 9. 주요 명령어

| Command | Description |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |

## 10. 인수인계 문서

다음 작업과 새 컴퓨터에서 이어받는 절차는 아래 문서에 정리했습니다.

- `/Users/wh.choi/Desktop/Code/CFOTool/HANDOFF.md`
