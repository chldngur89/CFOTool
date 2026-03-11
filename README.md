# 대표의 성 방어전 (CFO Tool)

재무 전략 시뮬레이터. 원본 Figma: [Pixel RPG CFO Tool](https://www.figma.com/design/ZoEKtHf8lL4NLYjgHEqKHg/Pixel-RPG-CFO-Tool)

## 현재 주요 동작

- 인건비는 `직원 수 x 300만원`으로 자동 산출됩니다.
- 대시보드에서 `인건비`, `마케팅비`, `사무실비`, `금고`를 클릭해 팝업으로 수정할 수 있습니다.
- 시나리오 선택 화면에서 방어/공격/현상유지별 AI 3안(안건)과 추천 문구가 표시됩니다.
- 방어/공격 카드는 같은 카드를 다시 클릭하면 문구 수정 팝업이 열립니다.
- 대표 캐릭터 하단 라벨은 회사명으로 표시됩니다.

## 서버 띄워서 확인하는 방법

### 1. 의존성 설치 (처음 한 번만)

```bash
cd /Users/wh.choi/Desktop/Code/CFOTool
npm install
```

(pnpm 쓰는 경우: `pnpm install`)

### 2. 개발 서버 실행

```bash
npm run dev
```

실행하면 터미널에 예를 들어 다음처럼 나옵니다:

```
  VITE v6.3.5  ready in 166 ms
  ➜  Local:   http://localhost:5173/
```

**브라우저에서 `http://localhost:5173/` 로 접속**하면 앱을 확인할 수 있습니다.

### 3. (선택) 빌드 검증

배포용 빌드가 정상인지 확인하려면:

```bash
npm run build
```

성공하면 `dist/` 폴더에 결과물이 생성됩니다.

## 스크립트 요약

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (기본: http://localhost:5173/) |
| `npm run build` | 프로덕션 빌드 → `dist/` |

## AI 전략 추천 (Ollama)

전략 화면의 `AI 추천 Top3 생성`/`AI 최적안 자동 적용`은 Ollama 서버를 호출합니다.

선택 환경변수:

```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:latest
```

설정이 없으면 기본값(`http://localhost:11434`, `llama3.1:latest`)을 사용합니다.

## TODO

다음 작업 목록은 `/Users/wh.choi/Desktop/Code/CFOTool/TODO.md`에서 관리합니다.
